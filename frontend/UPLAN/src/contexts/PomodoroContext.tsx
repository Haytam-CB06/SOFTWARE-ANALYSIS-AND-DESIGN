import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { toast } from 'sonner';
import { apiJsonAuthed, ApiError } from '../lib/api';
import { getUserItem, setUserItem } from '../utils/userStorage';

export type PomodoroMode = 'focus' | 'break' | 'longBreak';
export type ThemeMode = 'light' | 'dark' | 'muted' | 'focus';

interface PomodoroSession {
  id: string;
  mode: PomodoroMode;
  duration: number;
  completedAt: string;
  linkedTaskId?: string;
  linkedTaskName?: string;
}

interface PomodoroStats {
  totalFocusSessions: number;
  totalFocusTime: number;
  totalBreakTime: number;
  todaySessions: number;
  weekSessions: number;
  streak: number;
}

interface PomodoroSettings {
  focusDuration: number; // in minutes
  breakDuration: number;
  longBreakDuration: number;
  longBreakInterval: number; // every N sessions
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
  notifications: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  theme: ThemeMode;
}

interface PomodoroContextType {
  // Timer state
  isActive: boolean;
  time: number;
  totalTime: number;
  mode: PomodoroMode;
  sessionCount: number;
  
  // UI state
  isFocusMode: boolean;
  isFloating: boolean;
  isPinned: boolean;
  theme: ThemeMode;
  
  // Linked task
  linkedTaskId: string | null;
  linkedTaskName: string | null;
  
  // Actions
  start: () => void;
  pause: () => void;
  reset: () => void;
  skip: () => void;
  setTimer: (seconds: number, options?: { mode?: PomodoroMode; autostart?: boolean }) => void;
  setMode: (mode: PomodoroMode) => void;
  setTheme: (theme: ThemeMode) => void;
  toggleFocusMode: () => void;
  toggleFloating: () => void;
  togglePinned: () => void;
  linkTask: (taskId: string, taskName: string) => void;
  unlinkTask: () => void;
  
  // Settings
  settings: PomodoroSettings;
  updateSettings: (settings: Partial<PomodoroSettings>) => void;
  
  // Stats
  stats: PomodoroStats;
  history: PomodoroSession[];
}

const defaultSettings: PomodoroSettings = {
  focusDuration: 25,
  breakDuration: 5,
  longBreakDuration: 15,
  longBreakInterval: 4,
  autoStartBreaks: false,
  autoStartPomodoros: false,
  notifications: true,
  soundEnabled: true,
  vibrationEnabled: true,
  theme: 'light',
};

const defaultStats: PomodoroStats = {
  totalFocusSessions: 0,
  totalFocusTime: 0,
  totalBreakTime: 0,
  todaySessions: 0,
  weekSessions: 0,
  streak: 0,
};

const PomodoroContext = createContext<PomodoroContextType | undefined>(undefined);

export function PomodoroProvider({ children }: { children: ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [time, setTime] = useState(25 * 60);
  const [totalTime, setTotalTime] = useState(25 * 60);
  const [mode, setModeState] = useState<PomodoroMode>('focus');
  const [sessionCount, setSessionCount] = useState(0);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isFloating, setIsFloating] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [theme, setThemeState] = useState<ThemeMode>('light');
  const [linkedTaskId, setLinkedTaskId] = useState<string | null>(null);
  const [linkedTaskName, setLinkedTaskName] = useState<string | null>(null);
  const [activeStartedAtMs, setActiveStartedAtMs] = useState<number | null>(null);
  const [activeTimeAtStart, setActiveTimeAtStart] = useState<number | null>(null);
  const [settings, setSettings] = useState<PomodoroSettings>(defaultSettings);
  const [stats, setStats] = useState<PomodoroStats>(defaultStats);
  const [history, setHistory] = useState<PomodoroSession[]>([]);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previousTimeRef = useRef(time);
  // If a caller sets the timer and immediately calls start(), React state may not have
  // flushed yet. Keep a ref so the timer starts from the intended seconds.
  const pendingStartSecondsRef = useRef<number | null>(null);

  const getCurrentUserId = (): string | null => (
    localStorage.getItem('currentUserId') ||
    localStorage.getItem('userId') ||
    localStorage.getItem('user_id') ||
    null
  );

  const updateLinkedBackendSessionStatus = async (nextStatus: 'completed' | 'skipped') => {
    if (!linkedTaskId) return;
    const userId = getCurrentUserId();
    if (!userId) throw new ApiError('Missing user_id. Please log in again.', 401, null);

    await apiJsonAuthed(`/sessions/${linkedTaskId}`, 'PATCH', {
      user_id: userId,
      status: nextStatus,
    });
  };

  const logFreeStudyToBackend = async (elapsedSeconds: number) => {
    const userId = getCurrentUserId();
    if (!userId) return;
    const end = new Date();
    const start = new Date(end.getTime() - Math.max(0, elapsedSeconds) * 1000);
    try {
      await apiJsonAuthed(`/sessions/completed`, 'POST', {
        user_id: userId,
        subject_id: null,
        start_at: start.toISOString(),
        end_at: end.toISOString(),
        source: 'free-study',
        actual_duration_seconds: Math.max(0, Math.floor(elapsedSeconds)),
      });
    } catch (e) {
      console.error(e);
      // Don't block the timer UX; just notify.
      const msg = e instanceof ApiError ? e.message : (e as any)?.message;
      toast.error(msg || 'Failed to record free-study time');
    }
  };

  // Load saved data
  useEffect(() => {
    const savedSettings = getUserItem('pomodoroSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsed });
        setThemeState(parsed.theme || 'light');
      } catch (e) {
        console.error('Error loading settings:', e);
      }
    }

    const savedStats = getUserItem('pomodoroStats');
    if (savedStats) {
      try {
        setStats(JSON.parse(savedStats));
      } catch (e) {
        console.error('Error loading stats:', e);
      }
    }

    const savedHistory = getUserItem('pomodoroHistory');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Error loading history:', e);
      }
    }

    const savedState = getUserItem('pomodoroState');
    if (savedState) {
      try {
        const state = JSON.parse(savedState);

        const nextMode: PomodoroMode = state.mode || 'focus';
        const nextTotalTime = Number.isFinite(state.totalTime) ? Number(state.totalTime) : (state.time || settings.focusDuration * 60);
        const nextSessionCount = Number.isFinite(state.sessionCount) ? Number(state.sessionCount) : 0;

        setModeState(nextMode);
        setSessionCount(nextSessionCount);
        setLinkedTaskId(state.linkedTaskId || null);
        setLinkedTaskName(state.linkedTaskName || null);
        setIsPinned(state.isPinned || false);

        const savedIsActive = !!state.isActive;
        const savedStartedAt = Number.isFinite(state.activeStartedAtMs) ? Number(state.activeStartedAtMs) : null;
        const savedTimeAtStart = Number.isFinite(state.activeTimeAtStart) ? Number(state.activeTimeAtStart) : null;

        // If the timer was active, recover remaining time based on timestamps so refresh doesn't pause it.
        if (savedIsActive && savedStartedAt && savedTimeAtStart !== null) {
          const elapsedSeconds = Math.floor((Date.now() - savedStartedAt) / 1000);
          const remaining = Math.max(0, savedTimeAtStart - elapsedSeconds);
          setActiveStartedAtMs(savedStartedAt);
          setActiveTimeAtStart(savedTimeAtStart);
          setTime(remaining);
          setTotalTime(nextTotalTime || savedTimeAtStart);
          setIsActive(true);
        } else {
          // Not active: just restore raw time values.
          setTime(state.time || settings.focusDuration * 60);
          setTotalTime(nextTotalTime);
          setIsActive(false);
          setActiveStartedAtMs(null);
          setActiveTimeAtStart(null);
        }
      } catch (e) {
        console.error('Error loading state:', e);
      }
    }
  }, []);

  // Save state
  useEffect(() => {
    const state = {
      time,
      totalTime,
      mode,
      sessionCount,
      linkedTaskId,
      linkedTaskName,
      isPinned,
      isActive,
      activeStartedAtMs,
      activeTimeAtStart,
    };
    setUserItem('pomodoroState', JSON.stringify(state));
  }, [time, totalTime, mode, sessionCount, linkedTaskId, linkedTaskName, isPinned, isActive, activeStartedAtMs, activeTimeAtStart]);

  // Save settings
  useEffect(() => {
    setUserItem('pomodoroSettings', JSON.stringify(settings));
  }, [settings]);

  // Save stats
  useEffect(() => {
    setUserItem('pomodoroStats', JSON.stringify(stats));
  }, [stats]);

  // Save history
  useEffect(() => {
    setUserItem('pomodoroHistory', JSON.stringify(history));
  }, [history]);

  // Apply theme
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    
    // Apply theme classes
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Update tab title with timer
  useEffect(() => {
    if (isActive) {
      const mins = Math.floor(time / 60);
      const secs = time % 60;
      const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      const modeStr = mode === 'focus' ? 'Focus' : mode === 'break' ? 'Break' : 'Long Break';
      document.title = `(${timeStr}) ${modeStr} - U PLAN`;
    } else {
      document.title = 'U PLAN';
    }
    
    return () => {
      document.title = 'U PLAN';
    };
  }, [isActive, time, mode]);

  // Timer countdown (timestamp-based so refresh/tab sleep doesn't pause the session)
  useEffect(() => {
    let interval: any;

    if (isActive) {
      // If we became active without metadata (e.g. setTimer autostart), initialize it.
      if (activeStartedAtMs === null || activeTimeAtStart === null) {
        setActiveStartedAtMs(Date.now());
        setActiveTimeAtStart(time);
      }

      interval = setInterval(() => {
        setTime((prev) => {
          if (activeStartedAtMs !== null && activeTimeAtStart !== null) {
            const elapsed = Math.floor((Date.now() - activeStartedAtMs) / 1000);
            const remaining = Math.max(0, activeTimeAtStart - elapsed);
            previousTimeRef.current = remaining;
            return remaining;
          }
          const next = Math.max(0, prev - 1);
          previousTimeRef.current = next;
          return next;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, activeStartedAtMs, activeTimeAtStart]);

  // Complete when time hits 0 while active
  useEffect(() => {
    if (isActive && time === 0) {
      handleTimerComplete();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, time]);

  const handleTimerComplete = () => {
    setIsActive(false);
    setActiveStartedAtMs(null);
    setActiveTimeAtStart(null);
    setActiveStartedAtMs(null);
    setActiveTimeAtStart(null);
    
    

// Auto-close the widget when the timer finishes (user can still manually reopen).
try {
  setUserItem('pomodoroWidgetOpen', 'false');
} catch {
  // ignore
}
try {
  window.dispatchEvent(new CustomEvent('pomodoro:close'));
} catch {
  // ignore
}
// Save completed session
    const session: PomodoroSession = {
      id: Date.now().toString(),
      mode,
      duration: Math.round(totalTime / 60),
      completedAt: new Date().toISOString(),
      linkedTaskId: linkedTaskId || undefined,
      linkedTaskName: linkedTaskName || undefined,
    };
    
    setHistory(prev => [session, ...prev].slice(0, 100)); // Keep last 100 sessions
    
    // Update stats
    if (mode === 'focus') {
      setStats(prev => ({
        ...prev,
        totalFocusSessions: prev.totalFocusSessions + 1,
        totalFocusTime: prev.totalFocusTime + Math.round(totalTime / 60),
        todaySessions: prev.todaySessions + 1,
        weekSessions: prev.weekSessions + 1,
      }));
      setSessionCount(prev => prev + 1);
    } else {
      setStats(prev => ({
        ...prev,
        totalBreakTime: prev.totalBreakTime + (mode === 'break' ? settings.breakDuration : settings.longBreakDuration),
      }));
    }
    
    // Show notification
    if (settings.notifications) {
      showNotification();
    }
    
    // Vibrate on mobile
    if (settings.vibrationEnabled && 'vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]);
    }
    
    // Play sound
    if (settings.soundEnabled) {
      playSound();
    }
    
    // If this focus timer was linked to a backend StudySession, mark it completed.
    if (mode === 'focus' && linkedTaskId) {
      (async () => {
        try {
          await updateLinkedBackendSessionStatus('completed');
          toast.success('Session marked completed');
        } catch (e: any) {
          console.error(e);
          const msg = e instanceof ApiError ? e.message : (e?.message || 'Failed to update session');
          toast.error(msg);
        }
      })();

      // Unlink the backend ID to prevent accidental double-updates,
      // but keep the task name so the UI can still display what the
      // current/break countdown is associated with.
      setLinkedTaskId(null);
    } else if (mode === 'focus' && !linkedTaskId) {
      // Manual Pomodoro (random/free study) counts toward totals but must not create/clone a timetable slot.
      // We store it as a distinct completed session with source='free-study'.
      logFreeStudyToBackend(totalTime);
    }

    // Auto-switch mode
    if (mode === 'focus') {
      const nextMode = sessionCount > 0 && (sessionCount + 1) % settings.longBreakInterval === 0 
        ? 'longBreak' 
        : 'break';
      
      toast.success('🎉 Focus session complete! Time for a break.');
      setModeState(nextMode);
      const nextSeconds = nextMode === 'break' ? settings.breakDuration * 60 : settings.longBreakDuration * 60;
      setTime(nextSeconds);
      setTotalTime(nextSeconds);
      
      if (settings.autoStartBreaks) {
        setActiveStartedAtMs(Date.now());
        setActiveTimeAtStart(nextSeconds);
        setIsActive(true);
      }
    } else {
      toast.success('☕ Break over! Ready for another focus session?');
      setModeState('focus');
      setTime(settings.focusDuration * 60);
      setTotalTime(settings.focusDuration * 60);
      
      if (settings.autoStartPomodoros) {
        setActiveStartedAtMs(Date.now());
        setActiveTimeAtStart(settings.focusDuration * 60);
        setIsActive(true);
      }
    }
  };

  const showNotification = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const title = mode === 'focus' ? '🎉 Focus Session Complete!' : '☕ Break Over!';
      const body = mode === 'focus' 
        ? 'Great work! Time for a well-deserved break.' 
        : 'Break time is over. Ready to focus again?';
      
      new Notification(title, {
        body,
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        tag: 'pomodoro-timer',
        requireInteraction: false,
      });
    } else if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  const playSound = () => {
    // Simple beep sound using Web Audio API
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {
      console.error('Error playing sound:', e);
    }
  };

  const start = () => {
    // Start (or resume) with stable timestamps so refresh doesn't pause the countdown.
    // Use pendingStartSecondsRef so callers can do: setTimer(x); start(); without racing state.
    const startSeconds = pendingStartSecondsRef.current ?? time;
    pendingStartSecondsRef.current = null;

    setTime(startSeconds);
    setTotalTime((prev) => (prev && prev > 0 ? prev : startSeconds));
    setActiveStartedAtMs(Date.now());
    setActiveTimeAtStart(startSeconds);
    setIsActive(true);

    // Keep the widget visible across refresh while a timer is running.
    try {
      setUserItem('pomodoroWidgetOpen', 'true');
    } catch {
      // ignore
    }
    try {
      window.dispatchEvent(new CustomEvent('pomodoro:started'));
    } catch {
      // ignore
    }

    // Request notification permission
    if (settings.notifications && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  const pause = () => {
    setIsActive(false);
    setActiveStartedAtMs(null);
    setActiveTimeAtStart(null);
  };

  const reset = () => {
    setIsActive(false);
    setActiveStartedAtMs(null);
    setActiveTimeAtStart(null);
    const duration = mode === 'focus'
      ? settings.focusDuration
      : mode === 'break'
      ? settings.breakDuration
      : settings.longBreakDuration;
    setTime(duration * 60);
    setTotalTime(duration * 60);
  };


  const setTimer = (seconds: number, options?: { mode?: PomodoroMode; autostart?: boolean }) => {
    const nextMode = options?.mode ?? 'focus';
    const nextSeconds = Math.max(0, Math.floor(seconds));

    // Keep a ref so an immediate start() uses these seconds even if state hasn't flushed yet.
    pendingStartSecondsRef.current = nextSeconds;

    setModeState(nextMode);
    setIsActive(false);
    setActiveStartedAtMs(null);
    setActiveTimeAtStart(null);
    setTime(nextSeconds);
    setTotalTime(nextSeconds);

    if (options?.autostart) {
      setActiveStartedAtMs(Date.now());
      setActiveTimeAtStart(nextSeconds);
      setIsActive(true);
      pendingStartSecondsRef.current = null;
    }
  };

  const skip = () => {
    setIsActive(false);
    setActiveStartedAtMs(null);
    setActiveTimeAtStart(null);

    // If skipping a focus session that is linked to a backend StudySession, mark it as skipped.
    if (mode === 'focus' && linkedTaskId) {
      (async () => {
        try {
          await updateLinkedBackendSessionStatus('skipped');
          toast.success('Session marked skipped');
        } catch (e: any) {
          console.error(e);
          const msg = e instanceof ApiError ? e.message : (e?.message || 'Failed to update session');
          toast.error(msg);
        }
      })();

      setLinkedTaskId(null);
      setLinkedTaskName(null);
    }

    if (mode === 'focus') {
      const nextMode = sessionCount > 0 && (sessionCount + 1) % settings.longBreakInterval === 0
        ? 'longBreak'
        : 'break';
      const nextSeconds = nextMode === 'break' ? settings.breakDuration * 60 : settings.longBreakDuration * 60;
      setModeState(nextMode);
      setTime(nextSeconds);
      setTotalTime(nextSeconds);
    } else {
      setModeState('focus');
      setTime(settings.focusDuration * 60);
      setTotalTime(settings.focusDuration * 60);
    }
  };

  const setMode = (newMode: PomodoroMode) => {
    setModeState(newMode);
    setIsActive(false);
    setActiveStartedAtMs(null);
    setActiveTimeAtStart(null);
    const duration = newMode === 'focus' ? settings.focusDuration : newMode === 'break' ? settings.breakDuration : settings.longBreakDuration;
    setTime(duration * 60);
    setTotalTime(duration * 60);
  };

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    setSettings(prev => ({ ...prev, theme: newTheme }));
  };

  const toggleFocusMode = () => {
    setIsFocusMode(prev => !prev);
  };

  const toggleFloating = () => {
    setIsFloating(prev => !prev);
  };

  const togglePinned = () => {
    setIsPinned(prev => !prev);
  };

  const linkTask = (taskId: string, taskName: string) => {
    setLinkedTaskId(taskId);
    setLinkedTaskName(taskName);
    toast.success(`Timer linked to: ${taskName}`);
  };

  const unlinkTask = () => {
    setLinkedTaskId(null);
    setLinkedTaskName(null);
    toast.success('Task unlinked');
  };

  const updateSettings = (newSettings: Partial<PomodoroSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      
      // If durations changed and timer is not active, update time
      if (!isActive) {
        if (mode === 'focus' && newSettings.focusDuration) {
          setTime(newSettings.focusDuration * 60);
        } else if (mode === 'break' && newSettings.breakDuration) {
          setTime(newSettings.breakDuration * 60);
        } else if (mode === 'longBreak' && newSettings.longBreakDuration) {
          setTime(newSettings.longBreakDuration * 60);
        }
      }
      
      return updated;
    });
  };

  const value: PomodoroContextType = {
    isActive,
    time,
    totalTime,
    mode,
    sessionCount,
    isFocusMode,
    isFloating,
    isPinned,
    theme,
    linkedTaskId,
    linkedTaskName,
    start,
    pause,
    reset,
    skip,
    setTimer,
    setMode,
    setTheme,
    toggleFocusMode,
    toggleFloating,
    togglePinned,
    linkTask,
    unlinkTask,
    settings,
    updateSettings,
    stats,
    history,
  };

  return <PomodoroContext.Provider value={value}>{children}</PomodoroContext.Provider>;
}

export function usePomodoro() {
  const context = useContext(PomodoroContext);
  if (context === undefined) {
    throw new Error('usePomodoro must be used within a PomodoroProvider');
  }
  return context;
}