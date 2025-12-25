import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { toast } from 'sonner';
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
  const [mode, setModeState] = useState<PomodoroMode>('focus');
  const [sessionCount, setSessionCount] = useState(0);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isFloating, setIsFloating] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [theme, setThemeState] = useState<ThemeMode>('light');
  const [linkedTaskId, setLinkedTaskId] = useState<string | null>(null);
  const [linkedTaskName, setLinkedTaskName] = useState<string | null>(null);
  const [settings, setSettings] = useState<PomodoroSettings>(defaultSettings);
  const [stats, setStats] = useState<PomodoroStats>(defaultStats);
  const [history, setHistory] = useState<PomodoroSession[]>([]);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previousTimeRef = useRef(time);

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
        setTime(state.time || settings.focusDuration * 60);
        setModeState(state.mode || 'focus');
        setSessionCount(state.sessionCount || 0);
        setLinkedTaskId(state.linkedTaskId || null);
        setLinkedTaskName(state.linkedTaskName || null);
        setIsPinned(state.isPinned || false);
      } catch (e) {
        console.error('Error loading state:', e);
      }
    }
  }, []);

  // Save state
  useEffect(() => {
    const state = {
      time,
      mode,
      sessionCount,
      linkedTaskId,
      linkedTaskName,
      isPinned,
    };
    setUserItem('pomodoroState', JSON.stringify(state));
  }, [time, mode, sessionCount, linkedTaskId, linkedTaskName, isPinned]);

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

  // Timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isActive && time > 0) {
      interval = setInterval(() => {
        setTime((prev) => {
          const newTime = prev - 1;
          previousTimeRef.current = newTime;
          return newTime;
        });
      }, 1000);
    } else if (time === 0 && isActive) {
      handleTimerComplete();
    }
    
    return () => clearInterval(interval);
  }, [isActive, time]);

  const handleTimerComplete = () => {
    setIsActive(false);
    
    // Save completed session
    const session: PomodoroSession = {
      id: Date.now().toString(),
      mode,
      duration: mode === 'focus' ? settings.focusDuration : mode === 'break' ? settings.breakDuration : settings.longBreakDuration,
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
        totalFocusTime: prev.totalFocusTime + settings.focusDuration,
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
    
    // Auto-switch mode
    if (mode === 'focus') {
      const nextMode = sessionCount > 0 && (sessionCount + 1) % settings.longBreakInterval === 0 
        ? 'longBreak' 
        : 'break';
      
      toast.success('🎉 Focus session complete! Time for a break.');
      setModeState(nextMode);
      setTime(nextMode === 'break' ? settings.breakDuration * 60 : settings.longBreakDuration * 60);
      
      if (settings.autoStartBreaks) {
        setIsActive(true);
      }
    } else {
      toast.success('☕ Break over! Ready for another focus session?');
      setModeState('focus');
      setTime(settings.focusDuration * 60);
      
      if (settings.autoStartPomodoros) {
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
    setIsActive(true);
    
    // Request notification permission
    if (settings.notifications && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  const pause = () => {
    setIsActive(false);
  };

  const reset = () => {
    setIsActive(false);
    const duration = mode === 'focus' ? settings.focusDuration : mode === 'break' ? settings.breakDuration : settings.longBreakDuration;
    setTime(duration * 60);
  };

  const skip = () => {
    setIsActive(false);
    
    if (mode === 'focus') {
      const nextMode = sessionCount > 0 && (sessionCount + 1) % settings.longBreakInterval === 0 
        ? 'longBreak' 
        : 'break';
      setModeState(nextMode);
      setTime(nextMode === 'break' ? settings.breakDuration * 60 : settings.longBreakDuration * 60);
    } else {
      setModeState('focus');
      setTime(settings.focusDuration * 60);
    }
  };

  const setMode = (newMode: PomodoroMode) => {
    setModeState(newMode);
    setIsActive(false);
    const duration = newMode === 'focus' ? settings.focusDuration : newMode === 'break' ? settings.breakDuration : settings.longBreakDuration;
    setTime(duration * 60);
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