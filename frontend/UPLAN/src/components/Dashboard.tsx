import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Calendar, CheckCircle2, Circle, Clock, Zap, Coffee, Sparkles, Plus, Trash2, CalendarDays, AlertCircle, Play, Pause, Timer, SkipForward, Settings, TrendingUp, ListTodo, BarChart3, ChevronDown, ChevronRight, Minimize2, Maximize2, Menu, X, Home, BarChart2, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';
import { getUserWeekKey } from '../utils/userStorage';
import { apiJson, apiJsonAuthed, ApiError } from '../lib/api';
import { usePomodoro } from '../contexts/PomodoroContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';

// Dashboard component with user-specific data isolation
interface DashboardProps {
  userName: string;
  onNavigate: (page: string, settingsTab?: 'profile' | 'webapp') => void;
  timetables: any[];
  onShowPomodoroWidget?: () => void;

  // Deep-link support: /?page=dashboard&startSession=<calendarSessionId>
  autoStartSessionId?: string;
  onAutoStartConsumed?: () => void;
}

interface Task {
  id: string;
  title: string;
  type: 'assignment' | 'exam' | 'quiz' | 'project';
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
  completedAt?: string;
  subject: string;
}

type BackendAssessment = {
  id: string;
  title: string;
  type: Task['type'];
  dueDate: string;
  priority: Task['priority'];
  subject: string;
  completed: boolean;
  completedAt?: string | null;
};

type SessionsSummary = {
  period_start: string;
  period_end: string;
  total_completed_hours: number;
  by_day: Record<string, number>; // YYYY-MM-DD -> hours
};

type BackendGoal = {
  id: string;
  user_id: string;
  subject_id?: string | null;
  subject_title?: string | null;
  period_start: string;
  period_end: string;
  target_hours: number;
  weight?: number | null;
};

export default function Dashboard({ userName, onNavigate, timetables, onShowPomodoroWidget, autoStartSessionId, onAutoStartConsumed }: DashboardProps) {
  const [calendarSessions, setCalendarSessions] = useState<any[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState(false);

  // Weekly progress source of truth: backend completed sessions + weekly goals.
  const [weekSummary, setWeekSummary] = useState<SessionsSummary | null>(null);
  const [weekGoals, setWeekGoals] = useState<BackendGoal[]>([]);
  const [weekProgressLoading, setWeekProgressLoading] = useState(false);

  // Status source of truth for Today's Schedule (backend)
  const [todayStatusByCalendarId, setTodayStatusByCalendarId] = useState<Record<string, 'planned' | 'completed' | 'missed' | 'skipped'>>({});

  // Pomodoro is centralized in PomodoroContext (no local dashboard timer state)
  const {
    isActive: pomodoroIsActive,
    time: pomodoroTime,
    totalTime: pomodoroTotalTime,
    mode: pomodoroMode,
    start: startPomodoro,
    pause: pausePomodoro,
    reset: resetPomodoro,
    linkTask,
    setTimer,
  } = usePomodoro();
  
  // Collapsible sections state
  const [todayExpanded, setTodayExpanded] = useState(true);
  const [progressExpanded, setProgressExpanded] = useState(true);
  const [deadlinesExpanded, setDeadlinesExpanded] = useState(true);
  
  // UI state
  const [minimalMode, setMinimalMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'today'>('today');
  const [progressTab, setProgressTab] = useState<'week' | 'month'>('week');
  const [showInsights, setShowInsights] = useState(false);
  
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const getCurrentUserId = (): string | null => {
    return localStorage.getItem('currentUserId');
  };

  // Map calendar-session IDs to backend StudySession IDs (user-scoped) so Pomodoro completion can update backend status.
  const getStudySessionLinkKey = (calendarSessionId: string) => {
    const uid = getCurrentUserId() || 'anonymous';
    return `studySessionLink:${uid}:${calendarSessionId}`;
  };
  const autoStartHandledRef = useRef(false);

  const toIsoForToday = (hhmm: string) => {
    const [h, m] = (hhmm || '00:00').split(':').map(Number);
    const d = new Date();
    d.setHours(h || 0, m || 0, 0, 0);
    return d.toISOString();
  };

  const ensureBackendStudySession = async (calendarSession: any) => {
    const userId = getCurrentUserId();
    if (!userId) throw new ApiError('Missing user_id. Please log in again.', 401, null);

    const calendarId = String(calendarSession?.id || '');
    if (!calendarId) throw new ApiError('Session is missing an id', 400, null);

    const cached = localStorage.getItem(getStudySessionLinkKey(calendarId));
    if (cached) return cached;

    const startIso = toIsoForToday(calendarSession.startTime);
    const endIso = toIsoForToday(calendarSession.endTime);
    const dayUtc = String(startIso || '').slice(0, 10);

    // If sessions were already created (e.g. Apply timetable), reuse the existing row instead of duplicating.
    try {
      const rows = await apiJsonAuthed<any[]>(
        `/sessions/by-day?user_id=${encodeURIComponent(userId)}&day=${encodeURIComponent(dayUtc)}`,
        'GET'
      );
      const targetStart = new Date(startIso).getTime();
      const targetEnd = new Date(endIso).getTime();
      const match = (rows || []).find((r: any) => {
        if (String(r?.source || '') === 'free-study') return false;
        const rs = new Date(r?.start_at).getTime();
        const re = new Date(r?.end_at).getTime();
        return Math.abs(rs - targetStart) <= 5 * 60 * 1000 && Math.abs(re - targetEnd) <= 5 * 60 * 1000;
      });
      const existingId = String(match?.id || '');
      if (existingId) {
        localStorage.setItem(getStudySessionLinkKey(calendarId), existingId);
        return existingId;
      }
    } catch (e) {
      // Best-effort; fall back to create.
      console.warn('Failed to lookup existing study sessions', e);
    }

    // Create a planned StudySession row so completion can PATCH it later.
    const created = await apiJsonAuthed<any>('/sessions/', 'POST', {
      user_id: userId,
      subject_id: null,
      start_at: startIso,
      end_at: endIso,
      source: 'timetable',
      notes: null,
    });

    const backendId = String(created?.id || '');
    if (backendId) {
      localStorage.setItem(getStudySessionLinkKey(calendarId), backendId);
    }
    return backendId;
  };

  const fetchAssessments = async (): Promise<BackendAssessment[]> => {
    const userId = getCurrentUserId();
    if (!userId) return [];

    const url = `${API_BASE_URL}/assessments?user_id=${encodeURIComponent(userId)}&include_completed=true&include_past=true`;
    const res = await fetch(url, { headers: { 'X-User-Id': userId } });
    if (!res.ok) {
      // Don't spam the UI on transient errors
      console.error('Failed to load assessments', await res.text());
      return [];
    }
    const data = await res.json();
    return (data?.assessments || []) as BackendAssessment[];
  };

  const loadWeekProgress = async () => {
    const userId = getCurrentUserId();
    if (!userId) {
      setWeekSummary(null);
      setWeekGoals([]);
      return;
    }

    setWeekProgressLoading(true);
    try {
      const sum = await apiJsonAuthed<SessionsSummary>(`/sessions/summary?user_id=${encodeURIComponent(userId)}`, 'GET');
      setWeekSummary(sum);

      // Goals are stored by period; keep them aligned to the same week window as summary.
      const goalsRes = await apiJsonAuthed<{ goals: BackendGoal[]; period_start: string; period_end: string }>(
        `/goals?user_id=${encodeURIComponent(userId)}&period_start=${encodeURIComponent(sum.period_start)}&period_end=${encodeURIComponent(sum.period_end)}`,
        'GET'
      );
      setWeekGoals(Array.isArray(goalsRes?.goals) ? goalsRes.goals : []);
    } catch (e) {
      console.error('Failed to load week progress', e);
      // Keep UI usable even if progress endpoints fail.
      setWeekSummary(null);
      setWeekGoals([]);
    } finally {
      setWeekProgressLoading(false);
    }
  };

  // Weekly progress polling (backend source of truth)
  useEffect(() => {
    loadWeekProgress();

    const handleUserChanged = () => {
      setWeekSummary(null);
      setWeekGoals([]);
      loadWeekProgress();
    };

    window.addEventListener('userChanged', handleUserChanged);
    const id = setInterval(loadWeekProgress, 60000);
    return () => {
      clearInterval(id);
      window.removeEventListener('userChanged', handleUserChanged);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load data
  useEffect(() => {
    const loadCalendarSessions = () => {
      const today = new Date();
      const weekId = getWeekIdentifier(today);
      const loadedSessions = localStorage.getItem(getUserWeekKey(weekId));
      if (loadedSessions) {
        setCalendarSessions(JSON.parse(loadedSessions));
      } else {
        // Hot-fix: Dashboard should not be empty just because the user never opened
        // "My Timetable" (which hydrates localStorage). Fall back to the active
        // timetable in memory, and if needed, derive today's sessions from the
        // timetable's schedule.
        const active = timetables?.find((t) => t.isActive);

        if (active?.calendarSessions && Array.isArray(active.calendarSessions) && active.calendarSessions.length > 0) {
          setCalendarSessions(active.calendarSessions as any[]);
          return;
        }

        if (active?.schedule && Array.isArray(active.schedule) && active.schedule.length > 0) {
          const dayIndex = (today.getDay() + 6) % 7; // Mon=0 ... Sun=6
          const daySchedule = active.schedule[dayIndex];
          const derived = (daySchedule?.sessions || [])
            .filter((s: any) => s && (s.startTime || s.endTime))
            .map((s: any, i: number) => ({
              id: `${active.id}-d${dayIndex}-s${i}`,
              subject: s.subject || s.title || 'Study',
              startTime: s.startTime,
              endTime: s.endTime,
              day: dayIndex,
              type: 'reading',
              color: s.color || '#4f46e5',
            }));
          setCalendarSessions(derived);
          return;
        }

        setCalendarSessions([]);
      }
    };

    const loadTasks = async () => {
      try {
        const items = await fetchAssessments();
        const mapped: Task[] = items.map((a) => ({
          id: a.id,
          title: a.title,
          type: a.type,
          dueDate: a.dueDate,
          priority: a.priority,
          subject: a.subject,
          completed: !!a.completed,
          completedAt: a.completedAt || undefined,
        }));
        setTasks(mapped);
      } catch (e) {
        console.error(e);
        setTasks([]);
      }
    };

    loadCalendarSessions();
    loadTasks();

    const handleUserChanged = () => {
      setCalendarSessions([]);
      setTasks([]);
      
      loadCalendarSessions();
      loadTasks();
    };

    window.addEventListener('userChanged', handleUserChanged);
    
    // Keep intervals conservative to avoid spamming the API
    const calendarIntervalId = setInterval(loadCalendarSessions, 5000);
    // Backend polling (lightweight)
    const tasksIntervalId = setInterval(loadTasks, 30000);
    
    return () => {
      clearInterval(calendarIntervalId);
      clearInterval(tasksIntervalId);
      window.removeEventListener('userChanged', handleUserChanged);
    };
  }, [timetables]);

  const getWeekIdentifier = (date: Date): string => {
    const year = date.getFullYear();
    const firstDayOfYear = new Date(year, 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    // Keep week IDs consistent with CalendarView (pad to 2 digits): e.g. "2026-W01".
    return `${year}-W${String(weekNumber).padStart(2, '0')}`;
  };

  // Calculate today's schedule
  const today = new Date();
  const todayDayIndex = (today.getDay() + 6) % 7;
  const currentTime = `${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}`;
  
  // Get active timetable and its availability settings
  const activeTimetable = timetables.find(t => t.isActive);
  const availabilitySettings = activeTimetable?.availabilitySettings;
  
  const todaySessions = calendarSessions
    .filter(s => s.day === todayDayIndex)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const upcomingSessions = todaySessions.filter(s => s.startTime > currentTime);
  const completedSessions = todaySessions.filter(s => s.endTime <= currentTime);
  const currentSession = todaySessions.find(s => s.startTime <= currentTime && s.endTime > currentTime);


const toLocalDateKey = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// Load today's session statuses from backend (no auto-missing; show what backend says)
useEffect(() => {
  const loadTodayStatuses = async () => {
    const userId = getCurrentUserId();
    if (!userId) {
      setTodayStatusByCalendarId({});
      return;
    }
    if (!API_BASE_URL) return;

    const dayKey = toLocalDateKey(new Date());
    try {
      const rows = await apiJsonAuthed<any[]>(
        `/sessions/by-day?user_id=${encodeURIComponent(userId)}&day=${encodeURIComponent(dayKey)}`,
        'GET'
      );
      const normalize = (v: any) => String(v || 'planned').toLowerCase();

      // Build a quick lookup by HH:MM-HH:MM from backend
      const byTimeKey: Record<string, any> = {};
      for (const r of (rows || [])) {
        const st = new Date(r?.start_at);
        const en = new Date(r?.end_at);
        const startHH = `${String(st.getHours()).padStart(2, '0')}:${String(st.getMinutes()).padStart(2, '0')}`;
        const endHH = `${String(en.getHours()).padStart(2, '0')}:${String(en.getMinutes()).padStart(2, '0')}`;
        const k = `${startHH}-${endHH}`;
        // Prefer a non-planned status if duplicates exist
        const nextStatus = normalize(r?.status);
        const prevStatus = normalize(byTimeKey[k]?.status);
        if (!byTimeKey[k] || (prevStatus === 'planned' && nextStatus !== 'planned')) {
          byTimeKey[k] = r;
        }
      }

      const nextMap: Record<string, 'planned' | 'completed' | 'missed' | 'skipped'> = {};
      for (const s of todaySessions) {
        const calendarId = String(s?.id || '');
        if (!calendarId) continue;
        const k = `${String(s.startTime)}-${String(s.endTime)}`;
        const st = normalize(byTimeKey[k]?.status);
        if (st === 'completed' || st === 'missed' || st === 'skipped') nextMap[calendarId] = st;
        else nextMap[calendarId] = 'planned';
      }
      setTodayStatusByCalendarId(nextMap);
    } catch (e) {
      // Fail silently; keep UI usable
      setTodayStatusByCalendarId({});
    }
  };

  loadTodayStatuses();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [calendarSessions]);

  // Calculate study hours
  const calculateSessionDuration = (startTime: string, endTime: string): number => {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    const durationMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
    return durationMinutes / 60;
  };

  const timeToMinutes = (t: string): number => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };

  const computePlannedSeconds = (startTime: string, endTime: string): number => {
    const start = timeToMinutes(startTime);
    const end = timeToMinutes(endTime);
    return Math.max(0, (end - start) * 60);
  };

  const computeRemainingSeconds = (endTime: string): number => {
    const nowMin = timeToMinutes(currentTime);
    const endMin = timeToMinutes(endTime);
    return Math.max(0, (endMin - nowMin) * 60);
  };

  const handleStartStudySession = (
    clickedSession: any,
    opts?: { skipEarlyConfirm?: boolean }
  ) => {
    if (!clickedSession) return;

    // Do not start breaks
    if (clickedSession.type === 'break') {
      toast.info('This is a break session.');
      return;
    }

    const nowMin = timeToMinutes(currentTime);
    const clickedStartMin = timeToMinutes(clickedSession.startTime);
    const clickedEndMin = timeToMinutes(clickedSession.endTime);

    const isClickedActive = clickedStartMin <= nowMin && clickedEndMin > nowMin;
    const isStartingEarly = nowMin < clickedStartMin;

    // Default attribution: the clicked session
    let attributedSession = clickedSession;

    // Starting early: offer to count against the most recent session in the timetable
    if (isStartingEarly && !opts?.skipEarlyConfirm) {
      const mostRecent = [...todaySessions]
        .filter(s => s.type !== 'break')
        .filter(s => timeToMinutes(s.startTime) <= nowMin)
        .sort((a, b) => a.startTime.localeCompare(b.startTime))
        .slice(-1)[0];

      if (mostRecent && mostRecent !== clickedSession) {
        const ok = window.confirm(
          `You're starting "${clickedSession.subject}" early.\n\n` +
          `Count this time toward your most recent session "${mostRecent.subject}" instead?\n\n` +
          `OK = count toward "${mostRecent.subject}"\nCancel = start "${clickedSession.subject}" early`
        );
        if (ok) attributedSession = mostRecent;
      }
    }

    // Duration rules:
    // - If the clicked session is active now -> use remaining time of that session
    // - Otherwise -> use the planned duration of the clicked session
    const seconds = isClickedActive
      ? computeRemainingSeconds(clickedSession.endTime)
      : computePlannedSeconds(clickedSession.startTime, clickedSession.endTime);

    // Ensure a backend StudySession exists and link Pomodoro to that backend ID.
    (async () => {
      try {
        const backendSessionId = await ensureBackendStudySession(attributedSession);
        if (!backendSessionId) throw new Error('Failed to create backend session');
        linkTask(backendSessionId, attributedSession.subject);
      } catch (e: any) {
        console.error(e);
        toast.error(e?.message || 'Failed to start session');
        return;
      }

      // We allow pause. Pausing simply stops the countdown; completion won't happen until it reaches 0.
      setTimer(seconds, { mode: 'focus' });
      startPomodoro();

      onShowPomodoroWidget?.();
    })();

    return;
  };

  // Deep-link auto-start: if opened with /?page=dashboard&startSession=<calendarSessionId>
  // we locate that session and start it once (without the early-start attribution confirm).
  useEffect(() => {
    if (!autoStartSessionId) return;
    if (autoStartHandledRef.current) return;

    const id = String(autoStartSessionId);

    const session =
      todaySessions.find((s) => String(s?.id || '') === id) ||
      calendarSessions.find((s) => String(s?.id || '') === id);

    if (!session) return;

    autoStartHandledRef.current = true;

    const calendarId = String(session?.id || '');
    const status = (calendarId && todayStatusByCalendarId[calendarId]) || 'planned';
    const isMissed = status === 'missed';
    if (isMissed) {
      toast.info('This session was already marked missed.');
      onAutoStartConsumed?.();
      return;
    }

    handleStartStudySession(session, { skipEarlyConfirm: true });
    onAutoStartConsumed?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStartSessionId, todaySessions, calendarSessions]);

  const todayStudyHours = todaySessions
    .filter(s => s.type !== 'break')
    .reduce((total, session) => total + calculateSessionDuration(session.startTime, session.endTime), 0);

  const todayCompletedHours = completedSessions
    .filter(s => s.type !== 'break')
    .reduce((total, session) => total + calculateSessionDuration(session.startTime, session.endTime), 0);

  // Weekly overview
  // Planned hours come from the timetable; completed hours come from backend sessions (source of truth).
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const weekStartUtc = weekSummary?.period_start ? new Date(`${weekSummary.period_start}T00:00:00Z`) : null;
  const weekDateKeys = daysOfWeek.map((_, i) => {
    if (!weekStartUtc) return null;
    const d = new Date(weekStartUtc.getTime() + i * 24 * 60 * 60 * 1000);
    return d.toISOString().slice(0, 10);
  });

  const weeklyData = daysOfWeek.map((day, index) => {
    const daySessions = calendarSessions.filter((s) => s.day === index && s.type !== 'break');
    const plannedHours = daySessions.reduce((sum, session) => sum + calculateSessionDuration(session.startTime, session.endTime), 0);

    const dateKey = weekDateKeys[index];
    const completedHours = dateKey ? weekSummary?.by_day?.[dateKey] ?? 0 : 0;

    return {
      day,
      dateKey,
      hours: Math.round(plannedHours * 10) / 10,
      completed: Math.round(completedHours * 10) / 10,
      isToday: index === todayDayIndex,
    };
  });

  const weeklyCompletedHours = weekSummary?.total_completed_hours ?? 0;
  const overallWeekGoal = weekGoals.find((g) => !g.subject_id) || null;
  const weeklyTargetHours = overallWeekGoal
    ? Number(overallWeekGoal.target_hours) || 0
    : weekGoals.reduce((sum, g) => sum + (Number(g.target_hours) || 0), 0);
  const weeklyGoalProgressPct = weeklyTargetHours > 0 ? Math.min(100, Math.round((weeklyCompletedHours / weeklyTargetHours) * 100)) : 0;

  // Tasks
  const todayTasks = tasks.filter(t => {
    const dueDate = new Date(t.dueDate);
    return dueDate.toDateString() === today.toDateString();
  });

  const sessionsWithDeadlines = calendarSessions
    .filter(s => s.deadline && (s.type === 'assignment' || s.type === 'test' || s.type === 'exam'))
    .map(s => ({
      id: s.id,
      title: s.subject,
      type: s.type,
      dueDate: s.deadline,
      priority: 'medium' as const,
      completed: false,
      subject: s.subject,
      isFromCalendar: true,
    }));

  const upcomingDeadlines = [...tasks, ...sessionsWithDeadlines]
    .filter(t => !t.completed)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5);

  const completedTodayTasks = tasks.filter(t => {
    const dueDate = new Date(t.dueDate);
    return dueDate.toDateString() === today.toDateString() && t.completed;
  }).length;

  const totalTodayTasks = todayTasks.length;
  const todayProgress = totalTodayTasks > 0 ? (completedTodayTasks / totalTodayTasks) * 100 : 0;

  // Smart suggestions
  const smartSuggestions = [
    {
      icon: Zap,
      text: upcomingSessions.length > 0 
        ? `Next session: ${upcomingSessions[0].subject} at ${upcomingSessions[0].startTime}`
        : 'No more sessions today - great work!',
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
    },
    {
      icon: Coffee,
      text: completedSessions.length > 2 
        ? 'You\'ve been studying hard! Consider taking a break.'
        : 'Morning is a great time for focused studying!',
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
    {
      icon: AlertCircle,
      text: upcomingDeadlines.length > 0 
        ? `Focus on ${upcomingDeadlines[0].subject} - deadline approaching`
        : 'All caught up! Time to get ahead.',
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
  ];

  const handleAddTask = async (taskData: { subject: string; type: Task['type']; dueDate: string; title?: string }) => {
    const userId = getCurrentUserId();
    if (!userId) {
      toast.error('Please log in to add deadlines');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/assessments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId,
        },
        body: JSON.stringify({
          user_id: userId,
          subject: taskData.subject,
          type: taskData.type,
          dueDate: taskData.dueDate,
          title: (taskData.title || '').trim() || undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data?.detail || 'Failed to add task');
        return;
      }

      const a = data?.assessment as BackendAssessment;
      const newTask: Task = {
        id: a.id,
        title: a.title,
        type: a.type,
        dueDate: a.dueDate,
        priority: a.priority,
        subject: a.subject,
        completed: !!a.completed,
        completedAt: a.completedAt || undefined,
      };
      setTasks((prev) => [newTask, ...prev]);
      toast.success('Task added successfully!');
      setIsAddTaskDialogOpen(false);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || 'Failed to add task');
    }
  };

  const toggleTaskCompletion = async (taskId: string) => {
    const userId = getCurrentUserId();
    if (!userId) {
      toast.error('Please log in');
      return;
    }

    const target = tasks.find((t) => t.id === taskId);
    if (!target) return;

    const nextCompleted = !target.completed;
    // Optimistic update
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, completed: nextCompleted, completedAt: nextCompleted ? new Date().toISOString() : undefined } : t)));

    try {
      const res = await fetch(`${API_BASE_URL}/assessments/${encodeURIComponent(taskId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
        body: JSON.stringify({ user_id: userId, completed: nextCompleted }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data?.detail || 'Failed to update task');
        // Revert
        setTasks((prev) => prev.map((t) => (t.id === taskId ? target : t)));
        return;
      }
      const a = data?.assessment as BackendAssessment;
      setTasks((prev) => prev.map((t) => (t.id === taskId ? {
        ...t,
        completed: !!a.completed,
        completedAt: a.completedAt || undefined,
      } : t)));
      toast.success('Task updated!');
    } catch (e: any) {
      console.error(e);
      setTasks((prev) => prev.map((t) => (t.id === taskId ? target : t)));
      toast.error(e?.message || 'Failed to update task');
    }
  };

  const deleteTask = async (taskId: string) => {
    const taskToDelete = upcomingDeadlines.find(t => t.id === taskId);
    
    if (taskToDelete && (taskToDelete as any).isFromCalendar) {
      const weekId = getWeekIdentifier(today);
      const updatedSessions = calendarSessions.map(s => {
        if (s.id === taskId) {
          const { deadline, ...sessionWithoutDeadline } = s;
          return sessionWithoutDeadline;
        }
        return s;
      });
      setCalendarSessions(updatedSessions);
      localStorage.setItem(getUserWeekKey(weekId), JSON.stringify(updatedSessions));
      toast.success('Deadline removed from calendar session!');
    } else {
      const userId = getCurrentUserId();
      if (!userId) {
        toast.error('Please log in');
        return;
      }

      // Optimistic
      const before = tasks;
      setTasks((prev) => prev.filter((t) => t.id !== taskId));

      try {
        const res = await fetch(`${API_BASE_URL}/assessments/${encodeURIComponent(taskId)}?user_id=${encodeURIComponent(userId)}`, {
          method: 'DELETE',
          headers: { 'X-User-Id': userId },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          toast.error(data?.detail || 'Failed to delete task');
          setTasks(before);
          return;
        }
        toast.success('Task deleted!');
      } catch (e: any) {
        console.error(e);
        setTasks(before);
        toast.error(e?.message || 'Failed to delete task');
      }
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const formatDueDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return { text: 'Today', color: 'text-orange-600' };
    if (diffDays === 1) return { text: 'Tomorrow', color: 'text-green-600' };
    if (diffDays < 0) return { text: 'OVERDUE', color: 'text-red-600' };
    return { text: `${diffDays} days`, color: 'text-green-600' };
  };

  return (
    <div className="max-w-[1600px] mx-auto min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      {/* Header - No longer sticky, scrolls with content */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-gray-900 mb-1 font-bold">Welcome back, {userName}!</h1>
              <p className="text-gray-600 text-sm">
                {today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>

              {/* Pomodoro quick controls (uses PomodoroContext) */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 text-sm">
                  <Timer className="h-4 w-4 text-orange-600" />
                  <span className="font-semibold text-gray-900">{formatTime(pomodoroTime)}</span>
                  <Badge
                    className={
                      pomodoroMode === 'focus'
                        ? 'bg-blue-100 text-blue-700'
                        : pomodoroMode === 'break'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-purple-100 text-purple-700'
                    }
                  >
                    {pomodoroMode === 'focus' ? 'Focus' : pomodoroMode === 'break' ? 'Break' : 'Long Break'}
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    data-tour="dashboard-start-session"
                    onClick={() => {
                      if (pomodoroIsActive) {
                        pausePomodoro();
                      } else {
                        startPomodoro();
                        onShowPomodoroWidget?.();
                      }
                    }}
                    className={pomodoroIsActive ? 'bg-orange-600 hover:bg-orange-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}
                  >
                    {pomodoroIsActive ? (
                      <>
                        <Pause className="h-4 w-4 mr-2" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Start
                      </>
                    )}
                  </Button>

                  <Button size="sm" variant="outline" onClick={resetPomodoro}>
                    <SkipForward className="h-4 w-4 mr-2" />
                    Reset
                  </Button>

                  {onShowPomodoroWidget && (
                    <Button size="sm" variant="outline" onClick={onShowPomodoroWidget}>
                      Open
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          {!minimalMode && (
            <div className="flex gap-2 overflow-x-auto">
              <Button
                onClick={() => setActiveTab('today')}
                variant={activeTab === 'today' ? 'default' : 'outline'}
                size="sm"
                className={activeTab === 'today' ? 'bg-blue-600 text-white hover:bg-blue-800 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-900' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}
              >
                <Home className="h-4 w-4 mr-2" />
                Today
              </Button>
              <Button
                onClick={() => onNavigate('my-timetable')}
                variant="outline"
                size="sm"
                className="hover:bg-gray-100 dark:hover:bg-gray-800 dark:border-gray-600 dark:text-gray-300"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Calendar
              </Button>
              <div className="ml-auto flex gap-2">
                <Button
                  onClick={() => setShowInsights(!showInsights)}
                  variant="outline"
                  size="sm"
                  className={showInsights ? 'bg-purple-50 border-purple-500 text-purple-700 dark:bg-purple-900/30 dark:border-purple-600 dark:text-purple-400' : 'hover:bg-gray-100 dark:hover:bg-gray-800 dark:border-gray-600 dark:text-gray-300'}
                >
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Insights
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex">
        {/* Main Area */}
        <div 
          className={`flex-1 p-4 sm:p-6 transition-all duration-300 ${showInsights ? 'mr-0 lg:mr-96' : ''}`}
        >
          {/* Minimal Mode View */}
          {minimalMode && (
            <div className="max-w-2xl mx-auto space-y-4">
              {/* Current/Next Session */}
              <Card className="border-0 shadow-lg bg-blue-600 text-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    {currentSession ? 'Current Session' : 'Next Session'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {currentSession ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-2xl font-bold">{currentSession.subject}</h3>
                        <Badge className="bg-green-500 text-white">
                          <Play className="h-3 w-3 mr-1" />
                          Live
                        </Badge>
                      </div>
                      <p className="text-white/80">
                        {currentSession.startTime} - {currentSession.endTime}
                      </p>
                    </div>
                  ) : upcomingSessions.length > 0 ? (
                    <div>
                      <h3 className="text-2xl font-bold mb-2">{upcomingSessions[0].subject}</h3>
                      <p className="text-white/80">
                        Starts at {upcomingSessions[0].startTime}
                      </p>
                    </div>
                  ) : (
                    <p className="text-white/80">No more sessions today!</p>
                  )}
                </CardContent>
              </Card>

              {/* Today's Progress */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <BarChart2 className="h-5 w-5 text-green-600" />
                    Today's Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Study Hours</span>
                      <span className="text-2xl font-bold text-blue-600">
                        {Math.round(todayCompletedHours * 10) / 10}h / {Math.round(todayStudyHours * 10) / 10}h
                      </span>
                    </div>
                    <Progress 
                      value={todayStudyHours > 0 ? (todayCompletedHours / todayStudyHours) * 100 : 0} 
                      className="h-3" 
                    />
                    
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-sm text-gray-700">Tasks</span>
                      <span className="text-2xl font-bold text-green-600">
                        {completedTodayTasks} / {totalTodayTasks}
                      </span>
                    </div>
                    <Progress 
                      value={todayProgress} 
                      className="h-3"
                      indicatorColor={totalTodayTasks === 0 ? 'bg-gray-400' : todayProgress === 100 ? 'bg-green-500' : 'bg-blue-500'}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Full View - Tab Content */}
          {!minimalMode && (
            <>
              {/* TODAY TAB */}
              {activeTab === 'today' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column - Today's Schedule & Progress */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Combined Today Panel */}
                    <Card data-tour="dashboard-today-panel" className="border-0 shadow-lg bg-blue-600 text-white">
                      <CardHeader className="cursor-pointer" onClick={() => setTodayExpanded(!todayExpanded)}>
                        <CardTitle className="flex items-center justify-between">
                          <span className="flex items-center gap-3">
                            <Clock className="h-5 w-5" />
                            Today's Schedule & Progress
                          </span>
                          <div className="flex items-center gap-3">
                            <Badge className="bg-white/20 text-white border-white/30">
                              {todaySessions.length} sessions
                            </Badge>
                            {todayExpanded ? <ChevronDown className="h-7 w-7" /> : <ChevronRight className="h-9 w-9" />}
                          </div>
                        </CardTitle>
                      </CardHeader>
                      {todayExpanded && (
                        <CardContent>
                          {/* Progress Summary */}
                          <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-white/10 rounded-lg backdrop-blur">
                            <div>
                              <p className="text-white/80 text-sm">Total Hours</p>
                              <p className="text-2xl font-bold">{Math.round(todayStudyHours * 10) / 10}h</p>
                            </div>
                            <div>
                              <p className="text-white/80 text-sm">Completed</p>
                              <p className="text-2xl font-bold">{Math.round(todayCompletedHours * 10) / 10}h</p>
                            </div>
                            <div>
                              <p className="text-white/80 text-sm">Tasks</p>
                              <p className="text-2xl font-bold">{completedTodayTasks}/{totalTodayTasks}</p>
                            </div>
                          </div>

                          {/* Sessions List */}
                          <div className="space-y-3 max-h-96 overflow-y-auto">
                            {todaySessions.length > 0 ? (
                              todaySessions.map((session, index) => {
                                const calendarId = session?.id ? String(session.id) : String(index);
                                const status = (calendarId && todayStatusByCalendarId[calendarId]) || 'planned';
                                const isMissed = status === 'missed';
                                const isSkipped = status === 'skipped';
                                const isCompleted = status === 'completed';

                                const isTimePassed = session.endTime <= currentTime;
                                const isActive = status === 'planned' && session.startTime <= currentTime && session.endTime > currentTime;
                                const shouldShowStatusBadge = (isMissed || isSkipped || isCompleted) && session.type !== 'break';
                                
                                return (
                                  <div
                                    key={index}
                                    className={`relative p-4 rounded-lg transition-all bg-white text-gray-900 ${
                                      isActive ? 'ring-2 ring-green-500 shadow-lg' : 
                                      (isCompleted || isMissed || isSkipped) ? 'opacity-60' : 'shadow-md'
                                    }`}
                                  >
                                    <div className="flex items-start justify-between mb-2">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                          <h4 className="font-medium text-gray-900">
                                            {session.subject}
                                          </h4>
                                          {isActive && (
                                            <Badge className="bg-green-500 text-white text-xs">
                                              <Play className="h-3 w-3 mr-1" />
                                              Live
                                            </Badge>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                          <Clock className="h-3 w-3" />
                                          <span>{session.startTime} - {session.endTime}</span>
                                          <span className="text-xs">
                                            ({Math.round(calculateSessionDuration(session.startTime, session.endTime) * 60)} min)
                                          </span>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                      <Badge className="bg-purple-100 text-purple-700 text-xs">
                                        {session.type}
                                      </Badge>
                                      {!isTimePassed && !isMissed && session.type !== 'break' && (
                                        <Button
                                          size="sm"
                                          className="bg-green-600 text-white hover:bg-green-700"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleStartStudySession(session);
                                          }}
                                        >
                                          <Play className="h-3 w-3 mr-1" />
                                          Start
                                        </Button>
                                      )}
                                    </div>
                                    </div>

                                    {shouldShowStatusBadge && (
                                      <div className="absolute bottom-2 right-2 pointer-events-none">
                                        {isMissed ? (
                                          <Badge className="bg-red-100 text-red-700 text-xs">
                                            ⚠️ Missed
                                          </Badge>
                                        ) : isSkipped ? (
                                          <Badge className="bg-gray-100 text-gray-700 text-xs">
                                            ⏭️ Skipped
                                          </Badge>
                                        ) : (
                                          <Badge className="bg-green-100 text-green-700 text-xs">
                                            ✅ Completed
                                          </Badge>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })
                            ) : (
                              <div className="text-center py-12">
                                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                <p className="text-white/80">No sessions scheduled for today</p>
                                <Button 
                                  onClick={() => onNavigate('my-timetable')}
                                  variant="outline"
                                  className="mt-4 bg-white/20 border-white/30 text-white hover:bg-white/30"
                                >
                                  Add Sessions
                                </Button>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      )}
                    </Card>

                    {/* Study Progress Overview */}
                    <Card className="border-0 shadow-lg">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2 text-gray-900">
                            <BarChart3 className="h-5 w-5 text-blue-600" />
                            Study Progress Overview
                          </CardTitle>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant={progressTab === 'week' ? 'default' : 'outline'}
                              onClick={() => setProgressTab('week')}
                              className={progressTab === 'week' ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}
                            >
                              Week
                            </Button>
                            <Button
                              size="sm"
                              variant={progressTab === 'month' ? 'default' : 'outline'}
                              onClick={() => setProgressTab('month')}
                              className={progressTab === 'month' ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}
                            >
                              Month
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {progressTab === 'week' ? (
                          <div className="space-y-3">
                            <div className="p-4 rounded-lg border bg-blue-50">
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <div className="text-xs text-gray-600">Completed </div>
                                  <div className="text-xl font-bold text-blue-700">{weekProgressLoading ? '…' : `${weeklyCompletedHours.toFixed(1)}h`}</div>
                                </div>
                                <div className="text-right">
                                  <div className="text-xs text-gray-600">Weekly goal</div>
                                  <div className="text-lg font-semibold text-gray-900">
                                    {weeklyTargetHours > 0 ? `${weeklyTargetHours}h` : '—'}
                                  </div>
                                </div>
                              </div>
                              <div className="mt-3">
                                <Progress value={weeklyGoalProgressPct} />
                                <div className="mt-2 flex items-center justify-between text-xs text-blue-600">
                                  <span>{weeklyTargetHours > 0 ? `${weeklyGoalProgressPct}%` : 'Set a weekly goal in Goals & Achievements'}</span>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => loadWeekProgress()}
                                    className="h-7"
                                  >
                                    Refresh
                                  </Button>
                                </div>
                              </div>
                            </div>

                            {!weekSummary && !weekProgressLoading ? (
                              <div className="text-sm text-muted-foreground">
                                No study data for this week. Start scheduling sessions to track your progress!
                              </div>
                            ) : null}

                            {weeklyData.map((day, index) => {
                              const isToday = day.isToday;
                              const progressPercent = day.hours > 0 ? Math.min(100, Math.max(0, (day.completed / day.hours) * 100)) : 0;
                              const hasProgress = day.completed > 0;
                              
                              return (
                                <div
                                  key={index}
                                  className={`p-4 rounded-lg border-2 ${
                                    hasProgress 
                                      ? 'border-blue-500 bg-white dark:bg-gray-800' 
                                      : 'border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-800'
                                  }`}
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <span className={`font-medium ${
                                        hasProgress 
                                          ? 'text-blue-600 dark:text-blue-400' 
                                          : 'text-gray-900 dark:text-gray-300'
                                      }`}>
                                        {day.day}
                                      </span>
                                      {isToday && (
                                        <Badge className="bg-blue-600 text-white text-xs">Today</Badge>
                                      )}
                                    </div>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                      {day.completed}h / {day.hours}h
                                    </span>
                                  </div>
                                  <div className={`relative h-2 w-full overflow-hidden rounded-full ${
                                    hasProgress 
                                      ? 'bg-gray-200 dark:bg-gray-700' 
                                      : 'bg-gray-300 dark:bg-gray-700'
                                  }`}>
                                    <div
                                      className="h-full transition-all bg-blue-600 dark:bg-blue-500"
                                      style={{ width: `${progressPercent}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <MonthlyOverview calendarSessions={calendarSessions} />
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Right Column - Deadlines */}
                  <div className="space-y-6">
                    <Card className="border-0 shadow-lg">
                      <CardHeader className="cursor-pointer" onClick={() => setDeadlinesExpanded(!deadlinesExpanded)}>
                        <CardTitle className="flex items-center justify-between">
                          <span className="flex items-center gap-1 text-gray-900">
                            <AlertCircle className="h-5 w-5 text-red-600" />
                            Deadlines
                          </span>
                          <div className="flex items-center gap-2">
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsAddTaskDialogOpen(true);
                              }}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                            {deadlinesExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                          </div>
                        </CardTitle>
                      </CardHeader>
                      {deadlinesExpanded && (
                        <CardContent>
                          <div className="space-y-3 max-h-[600px] overflow-y-auto">
                            {upcomingDeadlines.length > 0 ? (
                              upcomingDeadlines.map((task) => {
                                const dueDateInfo = formatDueDate(task.dueDate);
                                const isOverdue = dueDateInfo.text === 'OVERDUE';
                                const isTomorrow = dueDateInfo.text === 'Tomorrow';
                                const isToday = dueDateInfo.text === 'Today';
                                
                                return (
                                  <div
                                    key={task.id}
                                    className={`p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                                      isOverdue 
                                        ? 'bg-red-50/50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 shadow-md' 
                                        : isToday
                                        ? 'bg-orange-50/50 dark:bg-orange-900/20 border-2 border-orange-200 dark:border-orange-800 shadow-md'
                                        : isTomorrow
                                        ? 'bg-green-50/50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 shadow-md'
                                        : 'bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700'
                                    }`}
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex-1">
                                        <h4 className={`text-sm font-medium text-gray-900 dark:text-gray-100 ${task.completed ? 'line-through opacity-50' : ''}`}>
                                          {task.title}
                                        </h4>
                                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                                          <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
                                            {task.priority}
                                          </Badge>
                                          <Badge variant="outline" className="text-xs">
                                            {task.type}
                                          </Badge>
                                          {(task as any).isFromCalendar && (
                                            <Badge className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-200 border-purple-200 dark:border-purple-700">
                                              Calendar
                                            </Badge>
                                          )}
                                          {isOverdue && (
                                            <div className="px-3 py-1 bg-red-700 dark:bg-red-600 text-white rounded-md shadow-sm">
                                              <span className="text-xs font-bold uppercase tracking-wide">
                                                {dueDateInfo.text}
                                              </span>
                                            </div>
                                          )}
                                          {isToday && (
                                            <div className="px-3 py-1 bg-orange-600 dark:bg-orange-500 text-white rounded-md shadow-sm">
                                              <span className="text-xs font-bold uppercase tracking-wide">
                                                {dueDateInfo.text}
                                              </span>
                                            </div>
                                          )}
                                          {isTomorrow && (
                                            <div className="px-3 py-1 bg-green-600 dark:bg-green-500 text-white rounded-md shadow-sm">
                                              <span className="text-xs font-bold uppercase tracking-wide">
                                                {dueDateInfo.text}
                                              </span>
                                            </div>
                                          )}
                                          {!isOverdue && !isTomorrow && !isToday && (
                                            <span className={`text-xs font-bold ${dueDateInfo.color}`}>
                                              {dueDateInfo.text}
                                            </span>
                                          )}
                                        </div>
                                        
                                        {!(task as any).isFromCalendar && !task.completed && (
                                          <Button
                                            onClick={() => toggleTaskCompletion(task.id)}
                                            size="sm"
                                            className="mt-2 bg-green-500 hover:bg-green-600 text-white h-7 text-xs"
                                          >
                                            <CheckCircle2 className="h-3 w-3 mr-1" />
                                            Mark as Done
                                          </Button>
                                        )}
                                        
                                        {task.completed && (
                                          <Badge className="mt-2 bg-green-100 text-green-700 border-green-200 text-xs">
                                            <CheckCircle2 className="h-3 w-3 mr-1" />
                                            Completed
                                          </Badge>
                                        )}
                                      </div>
                                      <button
                                        onClick={() => deleteTask(task.id)}
                                        className="text-gray-400 hover:text-red-600 transition-colors"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              <div className="text-center py-8">
                                <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                <p className="text-gray-400 text-sm">No upcoming deadlines</p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      )}
                    </Card>

                    {/* Insights - Only show when button clicked */}
                    {showInsights && (
                      <Card className="border-0 shadow-lg">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-gray-900">
                            <Lightbulb className="h-5 w-5 text-purple-600" />
                            Smart Insights
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {smartSuggestions.map((suggestion, index) => (
                              <div key={index} className={`p-4 rounded-lg ${suggestion.bg}`}>
                                <div className="flex items-start gap-3">
                                  <suggestion.icon className={`h-5 w-5 ${suggestion.color} flex-shrink-0 mt-0.5`} />
                                  <p className={`text-sm ${suggestion.color}`}>
                                    {suggestion.text}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Insights Side Panel - Slides from right */}
        <div
          className={`fixed top-0 right-0 h-full w-96 bg-white shadow-2xl border-l border-gray-200 z-50 transform transition-transform duration-300 overflow-y-auto ${
            showInsights ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <Lightbulb className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">Smart Insights</h2>
                  <p className="text-xs text-gray-500">AI-powered recommendations</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowInsights(false)}
                className="hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Insights Content */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700">Today's Recommendations</h3>
              {smartSuggestions.map((suggestion, index) => (
                <div key={index} className={`p-4 rounded-lg ${suggestion.bg} border-2 border-transparent hover:border-purple-300 transition-all`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${suggestion.bg}`}>
                      <suggestion.icon className={`h-4 w-4 ${suggestion.color}`} />
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm ${suggestion.color} font-medium`}>
                        {suggestion.text}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Stats */}
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-700">Quick Stats</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-xs text-blue-600 mb-1">Today's Hours</p>
                  <p className="text-2xl font-bold text-blue-700">
                    {Math.round(todayCompletedHours * 10) / 10}h
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-xs text-green-600 mb-1">Tasks Done</p>
                  <p className="text-2xl font-bold text-green-700">
                    {completedTodayTasks}/{totalTodayTasks}
                  </p>
                </div>
              </div>
            </div>

            {/* Study Streak */}
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-700">Study Streak</h3>
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-orange-200 rounded-full flex items-center justify-center">
                    <Sparkles className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-orange-700">
                      {completedSessions.length > 0 ? completedSessions.length : 0} sessions
                    </p>
                    <p className="text-xs text-orange-600">completed today</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Upcoming Focus */}
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-700">Next Focus Session</h3>
              {upcomingSessions.length > 0 ? (
                <div className="bg-purple-50 p-4 rounded-lg border-2 border-purple-200">
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-purple-600 mt-1" />
                    <div>
                      <p className="font-medium text-purple-900">{upcomingSessions[0].subject}</p>
                      <p className="text-sm text-purple-600 mt-1">
                        {upcomingSessions[0].startTime} - {upcomingSessions[0].endTime}
                      </p>
                      <Badge className="mt-2 bg-purple-200 text-purple-800 text-xs">
                        {upcomingSessions[0].type}
                      </Badge>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <CheckCircle2 className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                  <p className="text-sm text-gray-500">All done for today!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Task Dialog */}
      <AddTaskDialog
        open={isAddTaskDialogOpen}
        onOpenChange={setIsAddTaskDialogOpen}
        onAdd={handleAddTask}
      />
    </div>
  );
}

// Add Task Dialog Component
interface AddTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (task: { subject: string; type: Task['type']; dueDate: string; title?: string }) => void;
}

function AddTaskDialog({ open, onOpenChange, onAdd }: AddTaskDialogProps) {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const getCurrentUserId = (): string | null => localStorage.getItem('currentUserId');

  const [subjectOptions, setSubjectOptions] = useState<Array<{ title: string; priority: Task['priority'] }>>([]);
  const [priorityBySubject, setPriorityBySubject] = useState<Record<string, Task['priority']>>({});

  const [formData, setFormData] = useState({
    title: '',
    type: 'assignment' as Task['type'],
    dueDate: new Date().toISOString().split('T')[0],
    subject: '',
  });

  const capitalize = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
  const autoTitle = (subject: string, type: string) => (subject ? `${subject} ${capitalize(type)}` : '');

  useEffect(() => {
    if (!open) return;
    const userId = getCurrentUserId();
    if (!userId) return;

    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/auto-generate/class-schedule?user_id=${encodeURIComponent(userId)}`, {
          headers: { 'X-User-Id': userId },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) return;
        const courses = (data?.courses || []) as Array<{ title: string; priority: Task['priority'] }>;
        const map: Record<string, Task['priority']> = {};
        for (const c of courses) {
          if (c?.title && !map[c.title]) map[c.title] = c.priority;
        }
        const opts = Object.keys(map)
          .sort((a, b) => a.localeCompare(b))
          .map((title) => ({ title, priority: map[title] }));
        setPriorityBySubject(map);
        setSubjectOptions(opts);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }
    onAdd({
      subject: formData.subject,
      type: formData.type,
      dueDate: new Date(formData.dueDate).toISOString(),
      title: (formData.title || '').trim() || undefined,
    });
    setFormData({
      title: '',
      type: 'assignment',
      dueDate: new Date().toISOString().split('T')[0],
      subject: '',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Task</DialogTitle>
          <DialogDescription>
            Create a new assignment, exam, quiz, or project deadline
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="title">Task Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Math Assignment Chapter 5"
            />
            <p className="text-xs text-gray-500">Optional — leave blank to auto-name (e.g., "{formData.subject || 'Subject'} {capitalize(formData.type)}").</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Select
              value={formData.subject}
              onValueChange={(value: string) => {
                const prevAuto = autoTitle(formData.subject, formData.type);
                const nextAuto = autoTitle(value, formData.type);
                setFormData((prev) => ({
                  ...prev,
                  subject: value,
                  title: !prev.title || prev.title === prevAuto ? nextAuto : prev.title,
                }));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder={subjectOptions.length ? 'Select a course' : 'Fill your class schedule first'} />
              </SelectTrigger>
              <SelectContent>
                {subjectOptions.map((s) => (
                  <SelectItem key={s.title} value={s.title}>
                    {s.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!!formData.subject && (
              <p className="text-xs text-gray-500">
                Priority is locked from your class schedule: <span className="font-medium">{capitalize(priorityBySubject[formData.subject] || 'medium')}</span>
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value: Task['type']) => {
                  const prevAuto = autoTitle(formData.subject, formData.type);
                  const nextAuto = autoTitle(formData.subject, value);
                  setFormData((prev) => ({
                    ...prev,
                    type: value,
                    title: !prev.title || prev.title === prevAuto ? nextAuto : prev.title,
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="assignment">Assignment</SelectItem>
                  <SelectItem value="exam">Exam</SelectItem>
                  <SelectItem value="quiz">Quiz</SelectItem>
                  <SelectItem value="project">Project</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Monthly Overview Component
interface MonthlyOverviewProps {
  calendarSessions: any[];
}

function MonthlyOverview({ calendarSessions }: MonthlyOverviewProps) {
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const currentDay = today.getDate();
  const currentTime = `${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}`;
  const todayDayIndex = (today.getDay() + 6) % 7;
  
  const calculateSessionDuration = (startTime: string, endTime: string): number => {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    const durationMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
    return durationMinutes / 60;
  };
  
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  
  const dailyCompletedHours = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const date = new Date(currentYear, currentMonth, day);
    const dayOfWeek = date.getDay();
    const dayIndex = (dayOfWeek + 6) % 7;
    
    const isPastDay = day < currentDay;
    const isToday = day === currentDay;
    
    if (!isPastDay && !isToday) {
      return 0;
    }
    
    const daySessions = calendarSessions.filter(s => s.day === dayIndex && s.type !== 'break');
    
    if (isPastDay) {
      return daySessions.reduce((sum, session) => {
        return sum + calculateSessionDuration(session.startTime, session.endTime);
      }, 0);
    } else {
      return daySessions
        .filter(session => session.endTime <= currentTime)
        .reduce((sum, session) => {
          return sum + calculateSessionDuration(session.startTime, session.endTime);
        }, 0);
    }
  });
  
  const weeksInMonth = Math.ceil(daysInMonth / 7);
  const weeklyData = Array.from({ length: weeksInMonth }, (_, weekIndex) => {
    const startDay = weekIndex * 7;
    const endDay = Math.min(startDay + 7, daysInMonth);
    
    const weekCompletedHours = dailyCompletedHours.slice(startDay, endDay).reduce((sum, h) => sum + h, 0);
    
    return {
      week: `Week ${weekIndex + 1}`,
      weekNum: weekIndex + 1,
      hours: Math.round(weekCompletedHours * 10) / 10,
      days: endDay - startDay
    };
  });

  return (
    <div className="space-y-4">
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'line' ? (
            <LineChart
              data={weeklyData}
              margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
              <XAxis 
                dataKey="week" 
                className="text-gray-600"
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                className="text-gray-600"
                tick={{ fontSize: 12 }}
                label={{ value: 'Hours', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => [`${value}h`, 'Study Hours']}
              />
              <Line 
                type="monotone" 
                dataKey="hours" 
                stroke="#2563eb" 
                strokeWidth={2}
                dot={{ fill: '#2563eb', r: 4 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          ) : (
            <BarChart
              data={weeklyData}
              margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
              <XAxis 
                dataKey="week" 
                className="text-gray-600"
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                className="text-gray-600"
                tick={{ fontSize: 12 }}
                label={{ value: 'Hours', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => [`${value}h`, 'Study Hours']}
              />
              <Bar dataKey="hours" fill="#2563eb" radius={[8, 8, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
      
      <div className="flex justify-center">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          <Button
            size="sm"
            variant={chartType === 'line' ? 'default' : 'ghost'}
            onClick={() => setChartType('line')}
            className={chartType === 'line' ? 'bg-blue-600 text-white hover:bg-blue-700' : 'hover:bg-gray-200 text-gray-600'}
          >
            Line
          </Button>
          <Button
            size="sm"
            variant={chartType === 'bar' ? 'default' : 'ghost'}
            onClick={() => setChartType('bar')}
            className={chartType === 'bar' ? 'bg-blue-600 text-white hover:bg-blue-700' : 'hover:bg-gray-200 text-gray-600'}
          >
            Bar
          </Button>
        </div>
      </div>
    </div>
  );
}