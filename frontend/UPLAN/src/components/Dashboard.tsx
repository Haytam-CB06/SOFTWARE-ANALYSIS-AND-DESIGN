import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import {
  Calendar,
  BookMarked,
  Check,
  LayoutGrid,
  CheckCircle2,
  Clock,
  Zap,
  Coffee,
  Sparkles,
  Plus,
  Trash2,
  AlertCircle,
  Play,
  Pause,
  Timer,
  SkipForward,
  BarChart3,
  ChevronDown,
  ChevronRight,
  Home,
  BarChart2,
  Lightbulb,
  Flame,
  X,
  BookOpen,
  Target,
  ArrowUpRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { getUserWeekKey } from '../utils/userStorage';
import { apiJsonAuthed, ApiError } from '../lib/api';
import { usePomodoro } from '../contexts/PomodoroContext';
import {
  LineChart as ReLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart as ReBarChart,
  Bar,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from 'recharts';
import { useTranslation } from 'react-i18next';

interface DashboardProps {
  userName: string;
  onNavigate: (page: string, settingsTab?: 'profile' | 'webapp') => void;
  timetables: any[];
  onShowPomodoroWidget?: () => void;
  autoStartSessionId?: string;
  onAutoStartConsumed?: () => void;
  onSetActiveTimetable?: (id: string) => void | Promise<void>;
  onRenameTimetable?: (id: string, name: string) => void | Promise<void>;
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
  by_day: Record<string, number>;
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


const clampPercent = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

const getProgressTone = (percent: number) => {
  if (percent >= 80) {
    return {
      bar: 'bg-emerald-500',
      track: 'bg-emerald-100 dark:bg-emerald-950/30',
      text: 'text-emerald-600 dark:text-emerald-400',
      soft: 'bg-emerald-50 dark:bg-emerald-950/20',
      border: 'border-emerald-200 dark:border-emerald-900/40',
    };
  }

  if (percent >= 50) {
    return {
      bar: 'bg-amber-500',
      track: 'bg-amber-100 dark:bg-amber-950/30',
      text: 'text-amber-600 dark:text-amber-400',
      soft: 'bg-amber-50 dark:bg-amber-950/20',
      border: 'border-amber-200 dark:border-amber-900/40',
    };
  }

  return {
    bar: 'bg-rose-500',
    track: 'bg-rose-100 dark:bg-rose-950/30',
    text: 'text-rose-600 dark:text-rose-400',
    soft: 'bg-rose-50 dark:bg-rose-950/20',
    border: 'border-rose-200 dark:border-rose-900/40',
  };
};

function ProgressBarWithTone({
  value,
  className = '',
}: {
  value: number;
  className?: string;
}) {
  const safeValue = clampPercent(value);
  const tone = getProgressTone(safeValue);

  return (
    <div className={`h-3 w-full overflow-hidden rounded-full ${tone.track} ${className}`}>
      <div
        className={`h-full rounded-full transition-all duration-500 ${tone.bar}`}
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
}

function StudyProgressCalendar({
  data,
  todayLabel,
}: {
  data: Array<{
    day: string;
    dateKey: string | null;
    hours: number;
    completed: number;
    isToday: boolean;
  }>;
  todayLabel: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#111]">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">Daily Progress Calendar</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">A compact weekly snapshot of daily study completion</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {data.map((item, index) => {
          const percent = item.hours > 0 ? clampPercent((item.completed / item.hours) * 100) : 0;
          const tone = getProgressTone(percent);

          return (
            <div
              key={index}
              className={`rounded-2xl border p-3 text-center transition-all ${tone.soft} ${tone.border} ${
                item.isToday ? 'ring-2 ring-blue-500/30' : ''
              }`}
            >
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {item.day}
              </p>

              <div
                className={`mx-auto my-2 flex h-12 w-12 items-center justify-center rounded-2xl text-sm font-bold text-white ${tone.bar}`}
              >
                {percent}%
              </div>

              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                {item.completed}h / {item.hours}h
              </p>

              {item.isToday && (
                <span className="mt-2 inline-block rounded-full bg-blue-700 px-2 py-0.5 text-[10px] font-semibold text-white">
                  {todayLabel}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Dashboard({
  userName,
  onNavigate,
  timetables,
  onShowPomodoroWidget,
  autoStartSessionId,
  onAutoStartConsumed,
  onSetActiveTimetable,
  onRenameTimetable,
}: DashboardProps) {
  const { t, i18n } = useTranslation();

  const [calendarSessions, setCalendarSessions] = useState<any[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState(false);

  const [weekSummary, setWeekSummary] = useState<SessionsSummary | null>(null);
  const [weekGoals, setWeekGoals] = useState<BackendGoal[]>([]);
  const [weekProgressLoading, setWeekProgressLoading] = useState(false);

  const [todayStatusByCalendarId, setTodayStatusByCalendarId] = useState<
    Record<string, 'planned' | 'completed' | 'missed' | 'skipped'>
  >({});

  const {
    isActive: pomodoroIsActive,
    time: pomodoroTime,
    mode: pomodoroMode,
    start: startPomodoro,
    pause: pausePomodoro,
    reset: resetPomodoro,
    linkTask,
    setTimer,
  } = usePomodoro();

  const [todayExpanded, setTodayExpanded] = useState(true);
  const [deadlinesExpanded, setDeadlinesExpanded] = useState(true);

  const [minimalMode, setMinimalMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'today'>('today');
  const [progressTab, setProgressTab] = useState<'week' | 'month'>('week');
  const [showInsights, setShowInsights] = useState(false);
  const [isRenameTimetableDialogOpen, setIsRenameTimetableDialogOpen] = useState(false);
  const [renameTimetableId, setRenameTimetableId] = useState<string | null>(null);
  const [renameTimetableName, setRenameTimetableName] = useState('');

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const autoStartHandledRef = useRef(false);
  const savedTimetables = Array.isArray(timetables) ? timetables : [];
  const activeTimetable = savedTimetables.find((tt) => tt?.isActive);
  const recentTimetables = [...savedTimetables].sort((a, b) => {
    const aTime = new Date(a?.createdAt || 0).getTime();
    const bTime = new Date(b?.createdAt || 0).getTime();
    return bTime - aTime;
  });

  const handleActivateTimetableFromDashboard = async (id: string) => {
    if (!onSetActiveTimetable) {
      toast.error(t('dashboard.errors.activateUnavailable'));
      return;
    }

    try {
      await Promise.resolve(onSetActiveTimetable(id));
      toast.success(t('dashboard.success.timetableActivated'));
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || t('dashboard.errors.failedActivateTimetable'));
    }
  };


  const openRenameTimetableDialog = (tt: any) => {
    setRenameTimetableId(String(tt?.id || ''));
    setRenameTimetableName(String(tt?.name || ''));
    setIsRenameTimetableDialogOpen(true);
  };

  

  const getCurrentUserId = (): string | null => {
    return localStorage.getItem('currentUserId');
  };

  const getStudySessionLinkKey = (calendarSessionId: string) => {
    const uid = getCurrentUserId() || 'anonymous';
    return `studySessionLink:${uid}:${calendarSessionId}`;
  };

  const toIsoForToday = (hhmm: string) => {
    const [h, m] = (hhmm || '00:00').split(':').map(Number);
    const d = new Date();
    d.setHours(h || 0, m || 0, 0, 0);
    return d.toISOString();
  };

  const ensureBackendStudySession = async (calendarSession: any) => {
    const userId = getCurrentUserId();
    if (!userId) throw new ApiError(t('dashboard.errors.missingUser'), 401, null);

    const calendarId = String(calendarSession?.id || '');
    if (!calendarId) throw new ApiError(t('dashboard.errors.missingSessionId'), 400, null);

    const cached = localStorage.getItem(getStudySessionLinkKey(calendarId));
    if (cached) return cached;

    const startIso = toIsoForToday(calendarSession.startTime);
    const endIso = toIsoForToday(calendarSession.endTime);
    const dayUtc = String(startIso || '').slice(0, 10);

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
      console.warn('Failed to lookup existing study sessions', e);
    }

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

      const goalsRes = await apiJsonAuthed<{ goals: BackendGoal[]; period_start: string; period_end: string }>(
        `/goals?user_id=${encodeURIComponent(userId)}&period_start=${encodeURIComponent(sum.period_start)}&period_end=${encodeURIComponent(sum.period_end)}`,
        'GET'
      );
      setWeekGoals(Array.isArray(goalsRes?.goals) ? goalsRes.goals : []);
    } catch (e) {
      console.error('Failed to load week progress', e);
      setWeekSummary(null);
      setWeekGoals([]);
    } finally {
      setWeekProgressLoading(false);
    }
  };

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
  }, []);

  useEffect(() => {
    const loadCalendarSessions = () => {
      const today = new Date();
      const weekId = getWeekIdentifier(today);
      const loadedSessions = localStorage.getItem(getUserWeekKey(weekId));

      if (loadedSessions) {
        setCalendarSessions(JSON.parse(loadedSessions));
      } else {
        const active = timetables?.find((t) => t.isActive);

        if (active?.calendarSessions && Array.isArray(active.calendarSessions) && active.calendarSessions.length > 0) {
          setCalendarSessions(active.calendarSessions as any[]);
          return;
        }

        if (active?.schedule && Array.isArray(active.schedule) && active.schedule.length > 0) {
          const dayIndex = (today.getDay() + 6) % 7;
          const daySchedule = active.schedule[dayIndex];
          const derived = (daySchedule?.sessions || [])
            .filter((s: any) => s && (s.startTime || s.endTime))
            .map((s: any, i: number) => ({
              id: `${active.id}-d${dayIndex}-s${i}`,
              subject: s.subject || s.title || t('dashboard.study'),
              startTime: s.startTime,
              endTime: s.endTime,
              day: dayIndex,
              type: 'reading',
              color: s.color || '#2563eb',
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

    const calendarIntervalId = setInterval(loadCalendarSessions, 5000);
    const tasksIntervalId = setInterval(loadTasks, 30000);

    return () => {
      clearInterval(calendarIntervalId);
      clearInterval(tasksIntervalId);
      window.removeEventListener('userChanged', handleUserChanged);
    };
  }, [timetables, t]);

  const getWeekIdentifier = (date: Date): string => {
    const year = date.getFullYear();
    const firstDayOfYear = new Date(year, 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    return `${year}-W${String(weekNumber).padStart(2, '0')}`;
  };

  const today = new Date();
  const todayDayIndex = (today.getDay() + 6) % 7;
  const currentTime = `${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}`;

  const todaySessions = calendarSessions
    .filter((s) => s.day === todayDayIndex)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const upcomingSessions = todaySessions.filter((s) => s.startTime > currentTime);
  const completedSessions = todaySessions.filter((s) => s.endTime <= currentTime);
  const currentSession = todaySessions.find((s) => s.startTime <= currentTime && s.endTime > currentTime);

  const toLocalDateKey = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

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

        const byTimeKey: Record<string, any> = {};
        for (const r of rows || []) {
          const st = new Date(r?.start_at);
          const en = new Date(r?.end_at);
          const startHH = `${String(st.getHours()).padStart(2, '0')}:${String(st.getMinutes()).padStart(2, '0')}`;
          const endHH = `${String(en.getHours()).padStart(2, '0')}:${String(en.getMinutes()).padStart(2, '0')}`;
          const k = `${startHH}-${endHH}`;
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
      } catch {
        setTodayStatusByCalendarId({});
      }
    };

    loadTodayStatuses();
  }, [calendarSessions, API_BASE_URL, todaySessions]);

  const calculateSessionDuration = (startTime: string, endTime: string): number => {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    const durationMinutes = endHour * 60 + endMin - (startHour * 60 + startMin);
    return durationMinutes / 60;
  };

  const timeToMinutes = (tme: string): number => {
    const [h, m] = tme.split(':').map(Number);
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

  const handleStartStudySession = (clickedSession: any, opts?: { skipEarlyConfirm?: boolean }) => {
    if (!clickedSession) return;

    if (clickedSession.type === 'break') {
      toast.info(t('dashboard.thisIsBreak'));
      return;
    }

    const nowMin = timeToMinutes(currentTime);
    const clickedStartMin = timeToMinutes(clickedSession.startTime);
    const clickedEndMin = timeToMinutes(clickedSession.endTime);

    const isClickedActive = clickedStartMin <= nowMin && clickedEndMin > nowMin;
    const isStartingEarly = nowMin < clickedStartMin;

    let attributedSession = clickedSession;

    if (isStartingEarly && !opts?.skipEarlyConfirm) {
      const mostRecent = [...todaySessions]
        .filter((s) => s.type !== 'break')
        .filter((s) => timeToMinutes(s.startTime) <= nowMin)
        .sort((a, b) => a.startTime.localeCompare(b.startTime))
        .slice(-1)[0];

      if (mostRecent && mostRecent !== clickedSession) {
        const ok = window.confirm(
          `${t('dashboard.startingEarly', { subject: clickedSession.subject })}\n\n` +
            `${t('dashboard.countTowardRecent', { recent: mostRecent.subject })}\n\n` +
            `${t('dashboard.okCountsToward', { recent: mostRecent.subject })}\n` +
            `${t('dashboard.cancelStartsEarly', { subject: clickedSession.subject })}`
        );
        if (ok) attributedSession = mostRecent;
      }
    }

    const seconds = isClickedActive
      ? computeRemainingSeconds(clickedSession.endTime)
      : computePlannedSeconds(clickedSession.startTime, clickedSession.endTime);

    (async () => {
      try {
        const backendSessionId = await ensureBackendStudySession(attributedSession);
        if (!backendSessionId) throw new Error(t('dashboard.errors.failedStartSession'));
        linkTask(backendSessionId, attributedSession.subject);
      } catch (e: any) {
        console.error(e);
        toast.error(e?.message || t('dashboard.errors.failedStartSession'));
        return;
      }

      setTimer(seconds, { mode: 'focus' });
      startPomodoro();
      onShowPomodoroWidget?.();
    })();
  };

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
      toast.info(t('dashboard.sessionAlreadyMissed'));
      onAutoStartConsumed?.();
      return;
    }

    handleStartStudySession(session, { skipEarlyConfirm: true });
    onAutoStartConsumed?.();
  }, [autoStartSessionId, todaySessions, calendarSessions, todayStatusByCalendarId, t, onAutoStartConsumed]);

  const todayStudyHours = todaySessions
    .filter((s) => s.type !== 'break')
    .reduce((total, session) => total + calculateSessionDuration(session.startTime, session.endTime), 0);

  const todayCompletedHours = completedSessions
    .filter((s) => s.type !== 'break')
    .reduce((total, session) => total + calculateSessionDuration(session.startTime, session.endTime), 0);

  const daysOfWeek = [
    t('dashboard.shortDays.mon'),
    t('dashboard.shortDays.tue'),
    t('dashboard.shortDays.wed'),
    t('dashboard.shortDays.thu'),
    t('dashboard.shortDays.fri'),
    t('dashboard.shortDays.sat'),
    t('dashboard.shortDays.sun'),
  ];

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
  const weeklyGoalProgressPct =
    weeklyTargetHours > 0 ? Math.min(100, Math.round((weeklyCompletedHours / weeklyTargetHours) * 100)) : 0;

  const todayTasks = tasks.filter((task) => {
    const dueDate = new Date(task.dueDate);
    return dueDate.toDateString() === today.toDateString();
  });

  const sessionsWithDeadlines = calendarSessions
    .filter((s) => s.deadline && (s.type === 'assignment' || s.type === 'test' || s.type === 'exam'))
    .map((s) => ({
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
    .filter((task) => !task.completed)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5);

  const completedTodayTasks = tasks.filter((task) => {
    const dueDate = new Date(task.dueDate);
    return dueDate.toDateString() === today.toDateString() && task.completed;
  }).length;

  const totalTodayTasks = todayTasks.length;
  const todayProgress = totalTodayTasks > 0 ? (completedTodayTasks / totalTodayTasks) * 100 : 0;

  const smartSuggestions = [
    {
      icon: Zap,
      text:
        upcomingSessions.length > 0
          ? t('dashboard.nextSessionAt', { subject: upcomingSessions[0].subject, time: upcomingSessions[0].startTime })
          : t('dashboard.noMoreSessionsToday'),
      color: 'text-amber-700 dark:text-amber-300',
      bg: 'bg-amber-50 dark:bg-amber-950/20',
    },
    {
      icon: Coffee,
      text:
        completedSessions.length > 2
          ? t('dashboard.considerBreak')
          : t('dashboard.morningGreat'),
      color: 'text-orange-700 dark:text-orange-300',
      bg: 'bg-orange-50 dark:bg-orange-950/20',
    },
    {
      icon: AlertCircle,
      text:
        upcomingDeadlines.length > 0
          ? t('dashboard.focusDeadline', { subject: upcomingDeadlines[0].subject })
          : t('dashboard.allCaughtUp'),
      color: 'text-violet-700 dark:text-violet-300',
      bg: 'bg-violet-50 dark:bg-violet-950/20',
    },
  ];

  const handleAddTask = async (taskData: { subject: string; type: Task['type']; dueDate: string; title?: string }) => {
    const userId = getCurrentUserId();
    if (!userId) {
      toast.error(t('dashboard.errors.loginToAddDeadline'));
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
        toast.error(data?.detail || t('dashboard.errors.failedAddTask'));
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
      toast.success(t('dashboard.success.taskAdded'));
      setIsAddTaskDialogOpen(false);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || t('dashboard.errors.failedAddTask'));
    }
  };

  const toggleTaskCompletion = async (taskId: string) => {
    const userId = getCurrentUserId();
    if (!userId) {
      toast.error(t('dashboard.errors.pleaseLogin'));
      return;
    }

    const target = tasks.find((task) => task.id === taskId);
    if (!target) return;

    const nextCompleted = !target.completed;
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, completed: nextCompleted, completedAt: nextCompleted ? new Date().toISOString() : undefined } : task
      )
    );

    try {
      const res = await fetch(`${API_BASE_URL}/assessments/${encodeURIComponent(taskId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
        body: JSON.stringify({ user_id: userId, completed: nextCompleted }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data?.detail || t('dashboard.errors.failedUpdateTask'));
        setTasks((prev) => prev.map((task) => (task.id === taskId ? target : task)));
        return;
      }
      const a = data?.assessment as BackendAssessment;
      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId ? { ...task, completed: !!a.completed, completedAt: a.completedAt || undefined } : task
        )
      );
      toast.success(t('dashboard.success.taskUpdated'));
    } catch (e: any) {
      console.error(e);
      setTasks((prev) => prev.map((task) => (task.id === taskId ? target : task)));
      toast.error(e?.message || t('dashboard.errors.failedUpdateTask'));
    }
  };

  const deleteTask = async (taskId: string) => {
    const taskToDelete = upcomingDeadlines.find((task) => task.id === taskId);

    if (taskToDelete && (taskToDelete as any).isFromCalendar) {
      const weekId = getWeekIdentifier(today);
      const updatedSessions = calendarSessions.map((session) => {
        if (session.id === taskId) {
          const { deadline, ...sessionWithoutDeadline } = session;
          return sessionWithoutDeadline;
        }
        return session;
      });
      setCalendarSessions(updatedSessions);
      localStorage.setItem(getUserWeekKey(weekId), JSON.stringify(updatedSessions));
      toast.success(t('dashboard.success.deadlineRemoved'));
    } else {
      const userId = getCurrentUserId();
      if (!userId) {
        toast.error(t('dashboard.errors.pleaseLogin'));
        return;
      }

      const before = tasks;
      setTasks((prev) => prev.filter((task) => task.id !== taskId));

      try {
        const res = await fetch(
          `${API_BASE_URL}/assessments/${encodeURIComponent(taskId)}?user_id=${encodeURIComponent(userId)}`,
          {
            method: 'DELETE',
            headers: { 'X-User-Id': userId },
          }
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          toast.error(data?.detail || t('dashboard.errors.failedDeleteTask'));
          setTasks(before);
          return;
        }
        toast.success(t('dashboard.success.taskDeleted'));
      } catch (e: any) {
        console.error(e);
        setTasks(before);
        toast.error(e?.message || t('dashboard.errors.failedDeleteTask'));
      }
    }
  };
    

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-300 dark:border-red-900/40';
      case 'medium':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-300 dark:border-amber-900/40';
      case 'low':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-300 dark:border-emerald-900/40';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700';
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

    if (diffDays === 0) return { text: t('dashboard.todayShort'), color: 'text-orange-600 dark:text-orange-400' };
    if (diffDays === 1) return { text: t('dashboard.tomorrow'), color: 'text-emerald-600 dark:text-emerald-400' };
    if (diffDays < 0) return { text: t('dashboard.overdue'), color: 'text-red-600 dark:text-red-400' };
    return { text: t('dashboard.daysCount', { count: diffDays }), color: 'text-emerald-600 dark:text-emerald-400' };
  };

  const todayProgressPercent = todayStudyHours > 0 ? (todayCompletedHours / todayStudyHours) * 100 : 0;
  const upcomingSessionCount = upcomingSessions.length;
  const completedSessionCount = completedSessions.filter((s) => s.type !== 'break').length;
  const todayStudyPercent = clampPercent(todayProgressPercent);
  const todayTaskPercent = clampPercent(todayProgress);
  const completedSessionsPercent = clampPercent(
    todaySessions.filter((s) => s.type !== 'break').length > 0
      ? (completedSessionCount / todaySessions.filter((s) => s.type !== 'break').length) * 100
      : 0
  );

  return (
    <div className="mx-auto min-h-screen w-full max-w-6xl bg-slate-50 px-3 pb-24 pt-4 dark:bg-black sm:px-4 lg:px-6">
      <div className="space-y-5">
        <Card className="overflow-hidden rounded-[28px] border border-blue-100 bg-blue-700 from-blue-600 via-blue-700 to-blue-800 text-white shadow-[0_18px_60px_rgba(37,99,235,0.28)] dark:border-blue-900/30">
          <CardContent className="p-5 sm:p-6">
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-blue-50 backdrop-blur">
                    <Sparkles className="h-3.5 w-3.5" />
                    {t('dashboard.dailyOverview')}
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold tracking-[-0.03em] sm:text-3xl">
                      {t('dashboard.welcomeBack', { name: userName })}
                    </h1>
                    <p className="mt-1 text-sm text-blue-100/90">
                      {today.toLocaleDateString(i18n.language, {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <SummaryPill
                    icon={Clock}
                    label={t('dashboard.studyHours')}
                    value={`${Math.round(todayCompletedHours * 10) / 10}h`}
                  />
                  <SummaryPill
                    icon={Target}
                    label={t('dashboard.tasks')}
                    value={`${completedTodayTasks}/${totalTodayTasks}`}
                  />
                  <SummaryPill
                    icon={Calendar}
                    label={t('dashboard.sessions')}
                    value={`${todaySessions.length}`}
                  />
                  <SummaryPill
                    icon={Flame}
                    label={t('dashboard.upcoming')}
                    value={`${upcomingSessionCount}`}
                  />
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.95fr)] lg:items-stretch">
  <div className="space-y-4">
    <div className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur-md">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Timer className="h-4 w-4 text-blue-100" />
          <span className="text-sm font-semibold text-white">{t('dashboard.focusTimer')}</span>
        </div>
        <Badge className="border-white/15 bg-white/15 text-white">
          {pomodoroMode === 'focus'
            ? t('dashboard.focus')
            : pomodoroMode === 'break'
            ? t('dashboard.break')
            : t('dashboard.longBreak')}
        </Badge>
      </div>

      <div className="text-center">
        <div className="text-4xl font-bold tracking-[-0.04em] sm:text-5xl">
          {formatTime(pomodoroTime)}
        </div>
        <p className="mt-2 text-sm text-blue-100/80">
          {pomodoroIsActive ? t('dashboard.timerRunning') : t('dashboard.timerReady')}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <Button
          onClick={() => {
            if (pomodoroIsActive) pausePomodoro();
            else {
              startPomodoro();
              onShowPomodoroWidget?.();
            }
          }}
          className="rounded-2xl bg-white text-blue-700 hover:bg-slate-100"
        >
          {pomodoroIsActive ? (
            <>
              <Pause className="mr-2 h-4 w-4" />
              {t('dashboard.pause')}
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              {t('dashboard.start')}
            </>
          )}
        </Button>

        <Button
          variant="outline"
          onClick={resetPomodoro}
          className="rounded-2xl border-white/20 bg-white/10 text-white hover:bg-white/15"
        >
          <SkipForward className="mr-2 h-4 w-4" />
          {t('dashboard.reset')}
        </Button>

        <Button
          variant="outline"
          onClick={onShowPomodoroWidget}
          className="rounded-2xl border-white/20 bg-white/10 text-white hover:bg-white/15"
        >
          {t('dashboard.open')}
        </Button>
      </div>
    </div>

    <div className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur-md">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookMarked className="h-4 w-4 text-blue-100" />
          <span className="text-sm font-semibold text-white">{t('dashboard.savedTimetables')}</span>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => onNavigate('view-timetables')}
          className="rounded-2xl border-white/20 bg-white/10 text-white hover:bg-white/15"
        >
          <ArrowUpRight className="mr-1 h-3.5 w-3.5" />
          {t('dashboard.viewAll')}
        </Button>
      </div>

      {recentTimetables.length > 0 ? (
        <div className="max-h-72 space-y-2 overflow-y-auto overflow-x-hidden pr-1 [scrollbar-width:thin]">
          {recentTimetables.map((tt) => {
            const isActive = !!tt?.isActive;
            const sessionCount = Array.isArray(tt?.calendarSessions)
              ? tt.calendarSessions.length
              : Array.isArray(tt?.schedule)
              ? tt.schedule.length
              : 0;

            return (
              <div
                key={tt.id}
                className={`flex items-center justify-between gap-3 rounded-2xl border px-3 py-3 transition-all ${
                  isActive
                    ? 'border-white/20 bg-white/15'
                    : 'border-white/10 bg-white/5 hover:bg-white/10'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <LayoutGrid className="h-4 w-4 shrink-0 text-blue-100" />
                    <p className="truncate text-sm font-semibold text-white">
                      {tt?.name || t('dashboard.untitledTimetable')}
                    </p>
                    {isActive && (
                      <Badge className="border-0 bg-emerald-500 text-white">
                        {t('dashboard.active')}
                      </Badge>
                    )}
                  </div>

                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-blue-100/75">
                    <span>
                      {t('dashboard.sessionsCount', { count: sessionCount })}
                    </span>
                    {tt?.createdAt && (
                      <span>
                        • {new Date(tt.createdAt).toLocaleDateString(i18n.language, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  

                  <Button
                    size="sm"
                    onClick={() => handleActivateTimetableFromDashboard(tt.id)}
                    disabled={isActive}
                    className={
                      isActive
                        ? 'rounded-2xl bg-white/20 text-white hover:bg-white/20'
                        : 'rounded-2xl bg-white text-blue-700 hover:bg-slate-100'
                    }
                  >
                    {isActive ? (
                      <>
                        <Check className="mr-1 h-3.5 w-3.5" />
                        {t('dashboard.active')}
                      </>
                    ) : (
                      t('dashboard.activate')
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 px-4 py-8 text-center">
          <BookMarked className="mx-auto mb-3 h-10 w-10 text-blue-100/50" />
          <p className="text-sm font-medium text-white">{t('dashboard.noSavedTimetables')}</p>
          <p className="mt-1 text-xs text-blue-100/70">
            {t('dashboard.createFirstTimetableHint')}
          </p>
          <Button
            onClick={() => onNavigate('create-timetable')}
            className="mt-4 rounded-2xl bg-white text-blue-700 hover:bg-slate-100"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t('dashboard.createTimetable')}
          </Button>
        </div>
      )}
    </div>
  </div>

  <div className="grid auto-rows-fr gap-3 sm:grid-cols-2">
    <MetricCard
      title={t('dashboard.todayProgress')}
      value={`${todayStudyPercent}%`}
      subtitle={`${Math.round(todayCompletedHours * 10) / 10}h / ${Math.round(todayStudyHours * 10) / 10}h`}
      progressValue={todayStudyPercent}
    />
    <MetricCard
      title={t('dashboard.completedSessions')}
      value={`${completedSessionCount}`}
      subtitle={`${completedSessionCount} / ${todaySessions.filter((s) => s.type !== 'break').length} ${t('dashboard.sessions')}`}
      progressValue={completedSessionsPercent}
    />
    <MetricCard
      title={t('dashboard.weekGoal')}
      value={weeklyTargetHours > 0 ? `${weeklyGoalProgressPct}%` : '—'}
      subtitle={
        weeklyTargetHours > 0
          ? `${weeklyCompletedHours.toFixed(1)}h / ${weeklyTargetHours}h`
          : t('dashboard.notSet')
      }
      progressValue={weeklyGoalProgressPct}
    />
    <MetricCard
      title={t('dashboard.currentSession')}
      value={currentSession ? currentSession.subject : t('dashboard.none')}
      subtitle={currentSession ? `${currentSession.startTime} - ${currentSession.endTime}` : t('dashboard.noActiveSession')}
      compactText
    />
  </div>
</div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Button
            onClick={() => setActiveTab('today')}
            className={`min-w-[132px] rounded-2xl ${
              activeTab === 'today'
                ? 'bg-blue-700 text-white hover:bg-blue-800'
                : 'bg-white text-slate-700 hover:bg-slate-100 dark:bg-[#111] dark:text-slate-200 dark:hover:bg-[#191919]'
            }`}
          >
            <Home className="mr-2 h-4 w-4" />
            {t('dashboard.today')}
          </Button>

          <Button
            onClick={() => onNavigate('my-timetable')}
            className="min-w-[132px] rounded-2xl bg-white text-slate-700 hover:bg-slate-100 dark:bg-[#111] dark:text-slate-200 dark:hover:bg-[#191919]"
          >
            <Calendar className="mr-2 h-4 w-4" />
            {t('dashboard.calendar')}
          </Button>

          <Button
            onClick={() => setShowInsights(!showInsights)}
            className={`min-w-[132px] rounded-2xl ${
              showInsights
                ? 'bg-violet-600 text-white hover:bg-violet-700'
                : 'bg-white text-slate-700 hover:bg-slate-100 dark:bg-[#111] dark:text-slate-200 dark:hover:bg-[#191919]'
            }`}
          >
            <Lightbulb className="mr-2 h-4 w-4" />
            {t('dashboard.insights')}
          </Button>

          <Button
            onClick={() => setMinimalMode((v) => !v)}
            className="min-w-[132px] rounded-2xl bg-white text-slate-700 hover:bg-slate-100 dark:bg-[#111] dark:text-slate-200 dark:hover:bg-[#191919]"
          >
            {minimalMode ? t('dashboard.fullView') : t('dashboard.focusView')}
          </Button>
        </div>

        <Dialog open={isRenameTimetableDialogOpen} onOpenChange={setIsRenameTimetableDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t('dashboard.renameTimetable', { defaultValue: 'Rename timetable' })}</DialogTitle>
              <DialogDescription>
                {t('dashboard.renameTimetableHint', { defaultValue: 'Enter a specific name for this timetable.' })}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="rename-timetable-name">{t('dashboard.timetableName', { defaultValue: 'Timetable name' })}</Label>
                <Input
                  id="rename-timetable-name"
                  value={renameTimetableName}
                  onChange={(e) => setRenameTimetableName(e.target.value)}
                  placeholder={t('dashboard.enterTimetableName', { defaultValue: 'Enter timetable name' })}
                />
              </div>

              
            </div>
          </DialogContent>
        </Dialog>

        {minimalMode ? (
          <div className="mx-auto max-w-2xl space-y-4">
            <Card className="rounded-[24px] border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0b0b0b]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                  <Clock className="h-5 w-5 text-blue-700" />
                  {currentSession ? t('dashboard.currentSession') : t('dashboard.nextSession')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {currentSession ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{currentSession.subject}</h3>
                      <Badge className="bg-emerald-600 text-white">
                        <Play className="mr-1 h-3 w-3" />
                        {t('dashboard.live')}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {currentSession.startTime} - {currentSession.endTime}
                    </p>
                  </div>
                ) : upcomingSessions.length > 0 ? (
                  <div>
                    <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">
                      {upcomingSessions[0].subject}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {t('dashboard.startsAt', { time: upcomingSessions[0].startTime })}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400">{t('dashboard.noMoreSessionsToday')}</p>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-[24px] border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0b0b0b]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                  <BarChart2 className="h-5 w-5 text-emerald-600" />
                  {t('dashboard.todayProgress')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/50">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{t('dashboard.todayProgress')}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{t('dashboard.studyHours')}</p>
                    </div>
                    <span className={`text-xl font-bold ${getProgressTone(todayStudyPercent).text}`}>{todayStudyPercent}%</span>
                  </div>
                  <div className="h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <ReBarChart data={[{ name: t('dashboard.todayProgress'), value: todayStudyPercent }]}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" tickLine={false} axisLine={false} />
                        <YAxis domain={[0, 100]} tickLine={false} axisLine={false} />
                        <Tooltip formatter={(value: number) => [`${value}%`, t('dashboard.todayProgress')]} />
                        <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                          
                        </Bar>
                      </ReBarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4">
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-300">{t('dashboard.studyHours')}</span>
                      <span className={`font-semibold ${getProgressTone(todayStudyPercent).text}`}>
                        {Math.round(todayCompletedHours * 10) / 10}h / {Math.round(todayStudyHours * 10) / 10}h
                      </span>
                    </div>
                    <ProgressBarWithTone value={todayStudyPercent} />
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/50">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{t('dashboard.completedSessions')}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{t('dashboard.todayLabel')}</p>
                    </div>
                    <span className={`text-xl font-bold ${getProgressTone(completedSessionsPercent).text}`}>{completedSessionsPercent}%</span>
                  </div>
                  <div className="h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <ReBarChart data={[{ name: t('dashboard.completedSessions'), value: completedSessionsPercent }]}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" tickLine={false} axisLine={false} />
                        <YAxis domain={[0, 100]} tickLine={false} axisLine={false} />
                        <Tooltip formatter={(value: number) => [`${value}%`, t('dashboard.completedSessions')]} />
                        <Bar dataKey="value" radius={[10, 10, 0, 0]} fill="#10b981" />
                      </ReBarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4">
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-300">{t('dashboard.sessions')}</span>
                      <span className={`font-semibold ${getProgressTone(completedSessionsPercent).text}`}>
                        {completedSessionCount} / {todaySessions.filter((s) => s.type !== 'break').length}
                      </span>
                    </div>
                    <ProgressBarWithTone value={completedSessionsPercent} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <>
            {activeTab === 'today' && (
              <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.15fr_0.85fr]">
                <div className="space-y-5">
                  <Card className="rounded-[24px] border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0b0b0b]">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-3 text-slate-900 dark:text-white">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-700 text-white">
                          <LayoutGrid className="h-5 w-5" />
                        </div>
                        {t('dashboard.dailyOverview')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-900/60">
                          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{t('dashboard.studyHours')}</p>
                          <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">{Math.round(todayCompletedHours * 10) / 10}h</p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-900/60">
                          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{t('dashboard.completedSessions')}</p>
                          <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">{completedSessionCount}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-900/60">
                          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{t('dashboard.tasks')}</p>
                          <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">{completedTodayTasks}/{totalTodayTasks}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-900/60">
                          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{t('dashboard.upcoming')}</p>
                          <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">{upcomingSessionCount}</p>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-900/60">
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">{currentSession ? t('dashboard.currentSession') : t('dashboard.nextSession')}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {currentSession
                                ? `${currentSession.startTime} - ${currentSession.endTime}`
                                : upcomingSessions[0]
                                ? `${upcomingSessions[0].startTime} - ${upcomingSessions[0].endTime}`
                                : t('dashboard.noMoreSessionsToday')}
                            </p>
                          </div>
                          <span className="rounded-full bg-blue-700 px-2.5 py-1 text-[11px] font-semibold text-white">
                            {currentSession ? t('dashboard.live') : t('dashboard.today')}
                          </span>
                        </div>
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                          {currentSession ? currentSession.subject : upcomingSessions[0]?.subject || t('dashboard.none')}
                        </p>
                        <div className="mt-3">
                          <div className="mb-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                            <span>{t('dashboard.todayProgress')}</span>
                            <span className="font-semibold text-slate-900 dark:text-white">{todayStudyPercent}%</span>
                          </div>
                          <ProgressBarWithTone value={todayStudyPercent} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-[24px] border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0b0b0b]">
                    <CardHeader
                      className="cursor-pointer"
                      onClick={() => setTodayExpanded(!todayExpanded)}
                    >
                      <CardTitle className="flex items-center justify-between gap-3 text-slate-900 dark:text-white">
                        <span className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-700 text-white">
                            <Clock className="h-5 w-5" />
                          </div>
                          {t('dashboard.todaysScheduleProgress')}
                        </span>
                        <div className="flex items-center gap-2">
                          <Badge className="rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                            {todaySessions.length} {t('dashboard.sessions')}
                          </Badge>
                          {todayExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                        </div>
                      </CardTitle>
                    </CardHeader>

                    {todayExpanded && (
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                          <MiniStat title={t('dashboard.totalHours')} value={`${Math.round(todayStudyHours * 10) / 10}h`} />
                          <MiniStat title={t('dashboard.completed')} value={`${Math.round(todayCompletedHours * 10) / 10}h`} />
                          <MiniStat title={t('dashboard.tasks')} value={`${completedTodayTasks}/${totalTodayTasks}`} />
                        </div>

                        <div className="space-y-3">
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
                                  className={`rounded-3xl border p-4 transition-all ${
                                    isActive
                                      ? 'border-emerald-300 bg-emerald-50/70 ring-1 ring-emerald-200 dark:border-emerald-700 dark:bg-emerald-950/10 dark:ring-emerald-900/40'
                                      : isCompleted
                                      ? 'border-slate-200 bg-slate-50/70 opacity-70 dark:border-slate-800 dark:bg-slate-900/60'
                                      : 'border-slate-200 bg-white dark:border-white/10 dark:bg-[#111]'
                                  }`}
                                >
                                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="flex-1">
                                      <div className="mb-1 flex flex-wrap items-center gap-2">
                                        <h4 className="font-semibold text-slate-900 dark:text-white">{session.subject}</h4>
                                        {isActive && (
                                          <Badge className="bg-emerald-600 text-white">
                                            <Play className="mr-1 h-3 w-3" />
                                            {t('dashboard.live')}
                                          </Badge>
                                        )}
                                      </div>

                                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                        <Clock className="h-3.5 w-3.5" />
                                        <span>{session.startTime} - {session.endTime}</span>
                                        <span>
                                          ({Math.round(calculateSessionDuration(session.startTime, session.endTime) * 60)} {t('dashboard.minutesShort')})
                                        </span>
                                      </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                      <Badge className="rounded-full bg-violet-50 text-violet-700 dark:bg-violet-950/20 dark:text-violet-300">
                                        {session.type}
                                      </Badge>

                                      {!isTimePassed && !isMissed && session.type !== 'break' && (
                                        <Button
                                          size="sm"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleStartStudySession(session);
                                          }}
                                          className="rounded-2xl bg-blue-700 text-white hover:bg-blue-800"
                                        >
                                          <Play className="mr-1 h-3.5 w-3.5" />
                                          {t('dashboard.start')}
                                        </Button>
                                      )}
                                    </div>
                                  </div>

                                  {shouldShowStatusBadge && (
                                    <div className="mt-3">
                                      {isMissed ? (
                                        <Badge className="bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-300">
                                          {t('dashboard.missed')}
                                        </Badge>
                                      ) : isSkipped ? (
                                        <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                          {t('dashboard.skipped')}
                                        </Badge>
                                      ) : (
                                        <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-300">
                                          {t('dashboard.completed')}
                                        </Badge>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          ) : (
                            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/60 px-6 py-12 text-center dark:border-slate-700 dark:bg-slate-900/40">
                              <Calendar className="mx-auto mb-3 h-12 w-12 text-slate-300 dark:text-slate-600" />
                              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                {t('dashboard.noSessionsToday')}
                              </p>
                              <Button
                                onClick={() => onNavigate('my-timetable')}
                                variant="outline"
                                className="mt-4 rounded-2xl"
                              >
                                {t('dashboard.addSessions')}
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    )}
                  </Card>

                  <Card className="rounded-[24px] border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0b0b0b]">
                    <CardHeader>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <CardTitle className="flex items-center gap-3 text-slate-900 dark:text-white">
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-700 text-white">
                            <BarChart3 className="h-5 w-5" />
                          </div>
                          {t('dashboard.studyProgressOverview')}
                        </CardTitle>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant={progressTab === 'week' ? 'default' : 'outline'}
                            onClick={() => setProgressTab('week')}
                            className={progressTab === 'week' ? 'rounded-2xl bg-blue-700 text-white hover:bg-blue-800' : 'rounded-2xl'}
                          >
                            {t('dashboard.week')}
                          </Button>
                          <Button
                            size="sm"
                            variant={progressTab === 'month' ? 'default' : 'outline'}
                            onClick={() => setProgressTab('month')}
                            className={progressTab === 'month' ? 'rounded-2xl bg-blue-700 text-white hover:bg-blue-800' : 'rounded-2xl'}
                          >
                            {t('dashboard.month')}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent>
                      {progressTab === 'week' ? (
                        <div className="space-y-4">
                          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.95fr)] lg:items-stretch">
                            <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/50">
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <div className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                    {t('dashboard.completedHours')}
                                  </div>
                                  <div className="text-2xl font-bold text-slate-900 dark:text-white">
                                    {weekProgressLoading ? '…' : `${weeklyCompletedHours.toFixed(1)}h`}
                                  </div>
                                </div>

                                <div className="text-right">
                                  <div className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                    {t('dashboard.weeklyGoal')}
                                  </div>
                                  <div className="text-xl font-semibold text-slate-900 dark:text-white">
                                    {weeklyTargetHours > 0 ? `${weeklyTargetHours}h` : '—'}
                                  </div>
                                </div>
                              </div>

                              <div className="mt-4">
                                <div className="mb-2 flex items-center justify-between">
                                  <span className="text-sm text-slate-600 dark:text-slate-300">{t('dashboard.weeklyGoal')}</span>
                                  <span className={`text-sm font-semibold ${getProgressTone(weeklyGoalProgressPct).text}`}>
                                    {weeklyTargetHours > 0 ? `${weeklyGoalProgressPct}%` : t('dashboard.setWeeklyGoalHint')}
                                  </span>
                                </div>
                                <ProgressBarWithTone value={weeklyGoalProgressPct} />
                                <div className="mt-2 flex items-center justify-end text-xs text-slate-500 dark:text-slate-400">
                                  <Button size="sm" variant="outline" onClick={() => loadWeekProgress()} className="h-7 rounded-xl">
                                    {t('dashboard.refresh')}
                                  </Button>
                                </div>
                              </div>

                              {!weekSummary && !weekProgressLoading ? (
                                <div className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                                  {t('dashboard.noStudyDataWeek')}
                                </div>
                              ) : (
                                <div className="mt-6 h-64">
                                  <ResponsiveContainer width="100%" height="100%">
                                    <ReLineChart data={weeklyData}>
                                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                      <XAxis dataKey="day" tickLine={false} axisLine={false} />
                                      <YAxis tickLine={false} axisLine={false} />
                                      <Tooltip
                                        formatter={(value: number, name: string) => [
                                          `${value}h`,
                                          name === 'completed' ? t('dashboard.completedHours') : t('dashboard.totalHours'),
                                        ]}
                                      />
                                      <Line type="monotone" dataKey="hours" stroke="#94a3b8" strokeWidth={2} dot={{ r: 3 }} name="hours" />
                                      <Line type="monotone" dataKey="completed" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} name="completed" />
                                    </ReLineChart>
                                  </ResponsiveContainer>
                                </div>
                              )}
                            </div>

                            <StudyProgressCalendar data={weeklyData} todayLabel={t('dashboard.today')} />
                          </div>

                        </div>
                      ) : (
                        <MonthlyOverview calendarSessions={calendarSessions} />
                      )}
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-5">
                  <Card className="rounded-[24px] border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0b0b0b]">
                    <CardHeader
                      className="cursor-pointer"
                      onClick={() => setDeadlinesExpanded(!deadlinesExpanded)}
                    >
                      <CardTitle className="flex items-center justify-between gap-3 text-slate-900 dark:text-white">
                        <span className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400">
                            <AlertCircle className="h-5 w-5" />
                          </div>
                          {t('dashboard.deadlines')}
                        </span>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsAddTaskDialogOpen(true);
                            }}
                            className="rounded-xl"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          {deadlinesExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                        </div>
                      </CardTitle>
                    </CardHeader>

                    {deadlinesExpanded && (
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-3 gap-3">
                          <MiniStat title={t('dashboard.todayShort')} value={`${upcomingDeadlines.filter((task) => formatDueDate(task.dueDate).text === t('dashboard.todayShort')).length}`} />
                          <MiniStat title={t('dashboard.tomorrow')} value={`${upcomingDeadlines.filter((task) => formatDueDate(task.dueDate).text === t('dashboard.tomorrow')).length}`} />
                          <MiniStat title={t('dashboard.overdue')} value={`${upcomingDeadlines.filter((task) => formatDueDate(task.dueDate).text === t('dashboard.overdue')).length}`} />
                        </div>

                        <div className="space-y-3">
                          {upcomingDeadlines.length > 0 ? (
                            upcomingDeadlines.map((task) => {
                              const dueDateInfo = formatDueDate(task.dueDate);
                              const isOverdue = dueDateInfo.text === t('dashboard.overdue');
                              const isTomorrow = dueDateInfo.text === t('dashboard.tomorrow');
                              const isToday = dueDateInfo.text === t('dashboard.todayShort');

                              return (
                                <div
                                  key={task.id}
                                  className={`rounded-3xl border p-4 transition-all ${
                                    isOverdue
                                      ? 'border-red-200 bg-red-50/70 dark:border-red-900/40 dark:bg-red-950/10'
                                      : isToday
                                      ? 'border-amber-200 bg-amber-50/70 dark:border-amber-900/40 dark:bg-amber-950/10'
                                      : 'border-slate-200 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/50'
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <h4 className={`truncate text-sm font-semibold text-slate-900 dark:text-slate-100 ${task.completed ? 'line-through opacity-60' : ''}`}>
                                          {task.title}
                                        </h4>
                                        {(task as any).isFromCalendar && (
                                          <Badge className="rounded-full bg-violet-50 text-violet-700 dark:bg-violet-950/20 dark:text-violet-300">
                                            {t('dashboard.calendarTag')}
                                          </Badge>
                                        )}
                                      </div>

                                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                                        <Badge className={`${getPriorityColor(task.priority)} rounded-full`}>
                                          {t(`dashboard.priority.${task.priority}`)}
                                        </Badge>
                                        <Badge variant="outline" className="rounded-full capitalize">
                                          {t(`dashboard.taskTypes.${task.type}`)}
                                        </Badge>
                                        <span className="text-slate-500 dark:text-slate-400">{task.subject}</span>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <Badge
                                        className={`rounded-full ${
                                          isOverdue
                                            ? 'bg-red-600 text-white'
                                            : isToday
                                            ? 'bg-amber-500 text-white'
                                            : isTomorrow
                                            ? 'bg-emerald-600 text-white'
                                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
                                        }`}
                                      >
                                        {dueDateInfo.text}
                                      </Badge>
                                      <button
                                        onClick={() => deleteTask(task.id)}
                                        className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    </div>
                                  </div>

                                  <div className="mt-3 flex flex-wrap items-center gap-2">
                                    {!(task as any).isFromCalendar && !task.completed && (
                                      <Button
                                        onClick={() => toggleTaskCompletion(task.id)}
                                        size="sm"
                                        variant="outline"
                                        className="rounded-2xl border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/40 dark:bg-emerald-950/10 dark:text-emerald-300 dark:hover:bg-emerald-950/20"
                                      >
                                        <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                                        {t('dashboard.markDone')}
                                      </Button>
                                    )}

                                    {task.completed && (
                                      <Badge className="rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-300">
                                        <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                                        {t('dashboard.completed')}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/60 px-6 py-12 text-center dark:border-slate-700 dark:bg-slate-900/40">
                              <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-slate-300 dark:text-slate-600" />
                              <p className="text-sm text-slate-500 dark:text-slate-400">{t('dashboard.noUpcomingDeadlines')}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-full transform overflow-y-auto border-l border-slate-200 bg-white shadow-2xl transition-transform duration-300 dark:border-slate-800 dark:bg-black sm:max-w-md ${
          showInsights ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="space-y-6 p-4 sm:p-6">
          <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-4 dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 dark:bg-violet-950/20 dark:text-violet-300">
                <Lightbulb className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-900 dark:text-white">{t('dashboard.smartInsights')}</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">{t('dashboard.aiRecommendations')}</p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowInsights(false)}
              className="rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {t('dashboard.todaysRecommendations')}
            </h3>

            {smartSuggestions.map((suggestion, index) => (
              <div key={index} className={`rounded-3xl border border-transparent p-4 transition-all hover:border-violet-200 dark:hover:border-violet-900/30 ${suggestion.bg}`}>
                <div className="flex items-start gap-3">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-2xl ${suggestion.bg}`}>
                    <suggestion.icon className={`h-4 w-4 ${suggestion.color}`} />
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${suggestion.color}`}>{suggestion.text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-4 border-t border-slate-200 pt-4 dark:border-slate-800">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t('dashboard.quickStats')}</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <InsightStat
                color="blue"
                label={t('dashboard.todaysHours')}
                value={`${Math.round(todayCompletedHours * 10) / 10}h`}
              />
              <InsightStat
                color="green"
                label={t('dashboard.tasksDone')}
                value={`${completedTodayTasks}/${totalTodayTasks}`}
              />
            </div>
          </div>

          <div className="space-y-4 border-t border-slate-200 pt-4 dark:border-slate-800">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t('dashboard.studyStreak')}</h3>
            <div className="rounded-3xl bg-orange-50 p-4 dark:bg-orange-950/20">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-200 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-orange-700 dark:text-orange-300">
                    {completedSessions.length > 0 ? completedSessions.length : 0} {t('dashboard.sessions')}
                  </p>
                  <p className="text-xs text-orange-600 dark:text-orange-400">{t('dashboard.completedToday')}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 border-t border-slate-200 pt-4 dark:border-slate-800">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t('dashboard.nextFocusSession')}</h3>
            {upcomingSessions.length > 0 ? (
              <div className="rounded-3xl border border-violet-200 bg-violet-50 p-4 dark:border-violet-900/30 dark:bg-violet-950/20">
                <div className="flex items-start gap-3">
                  <Clock className="mt-1 h-5 w-5 text-violet-600 dark:text-violet-300" />
                  <div>
                    <p className="font-semibold text-violet-900 dark:text-violet-200">{upcomingSessions[0].subject}</p>
                    <p className="mt-1 text-sm text-violet-600 dark:text-violet-300">
                      {upcomingSessions[0].startTime} - {upcomingSessions[0].endTime}
                    </p>
                    <Badge className="mt-2 rounded-full bg-violet-200 text-violet-800 dark:bg-violet-900/30 dark:text-violet-200">
                      {upcomingSessions[0].type}
                    </Badge>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-3xl bg-slate-50 p-4 text-center dark:bg-slate-900/40">
                <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-slate-300 dark:text-slate-600" />
                <p className="text-sm text-slate-500 dark:text-slate-400">{t('dashboard.allDoneToday')}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <AddTaskDialog
        open={isAddTaskDialogOpen}
        onOpenChange={setIsAddTaskDialogOpen}
        onAdd={handleAddTask}
      />
    </div>
  );
}

function SummaryPill({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<any>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-white/10 p-3.5 backdrop-blur">
      <div className="flex items-center gap-2 text-blue-100/90">
        <Icon className="h-4 w-4" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em]">{label}</span>
      </div>
      <div className="mt-3 text-2xl font-semibold leading-none text-white">{value}</div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  compactText = false,
  progressValue,
}: {
  title: string;
  value: string;
  subtitle: string;
  compactText?: boolean;
  progressValue?: number;
}) {
  const tone = typeof progressValue === 'number' ? getProgressTone(progressValue) : null;

  return (
    <div className="flex h-full flex-col justify-between rounded-[24px] border border-white/10 bg-white/10 p-3.5 backdrop-blur-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-blue-100/75">{title}</p>
          <p className={`mt-2 truncate font-semibold text-white ${compactText ? 'text-base' : 'text-3xl leading-none'}`}>{value}</p>
          <p className="mt-2 line-clamp-2 text-xs text-blue-100/75">{subtitle}</p>
        </div>
        {typeof progressValue === 'number' && (
          <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${tone?.soft} ${tone?.text}`}>
            {clampPercent(progressValue)}%
          </span>
        )}
      </div>

      {typeof progressValue === 'number' && (
        <div className="mt-4">
          <ProgressBarWithTone value={progressValue} className="h-2.5" />
        </div>
      )}
    </div>
  );
}

function MiniStat({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/50">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{title}</p>
      <p className="mt-2 text-xl font-bold text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}

function InsightStat({
  color,
  label,
  value,
}: {
  color: 'blue' | 'green';
  label: string;
  value: string;
}) {
  const map = {
    blue: 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-300',
    green: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-300',
  };

  return (
    <div className={`rounded-3xl p-4 ${map[color]}`}>
      <p className="mb-1 text-xs font-medium">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}

interface AddTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (task: { subject: string; type: Task['type']; dueDate: string; title?: string }) => void;
}

function AddTaskDialog({ open, onOpenChange, onAdd }: AddTaskDialogProps) {
  const { t } = useTranslation();
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
  }, [open, API_BASE_URL]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject.trim()) {
      toast.error(t('dashboard.errors.fillRequired'));
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
      <DialogContent className="w-[95vw] max-h-[90vh] overflow-y-auto rounded-[28px] border-slate-200 bg-white dark:border-slate-800 dark:bg-[#0b0b0b] sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{t('dashboard.addNewTask')}</DialogTitle>
          <DialogDescription>{t('dashboard.addTaskDescription')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">{t('dashboard.taskTitle')}</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder={t('dashboard.taskTitlePlaceholder')}
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('dashboard.taskTitleHint', {
                example: `${formData.subject || t('dashboard.subject')} ${capitalize(formData.type)}`,
              })}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">{t('dashboard.subject')}</Label>
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
              <SelectTrigger className="rounded-2xl">
                <SelectValue
                  placeholder={
                    subjectOptions.length
                      ? t('dashboard.selectCourse')
                      : t('dashboard.fillClassScheduleFirst')
                  }
                />
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
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('dashboard.priorityLocked')}:{' '}
                <span className="font-medium">{capitalize(priorityBySubject[formData.subject] || 'medium')}</span>
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="type">{t('dashboard.type')}</Label>
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
                <SelectTrigger className="rounded-2xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="assignment">{t('dashboard.taskTypes.assignment')}</SelectItem>
                  <SelectItem value="exam">{t('dashboard.taskTypes.exam')}</SelectItem>
                  <SelectItem value="quiz">{t('dashboard.taskTypes.quiz')}</SelectItem>
                  <SelectItem value="project">{t('dashboard.taskTypes.project')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">{t('dashboard.dueDate')}</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                required
                className="rounded-2xl"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-2xl">
              {t('dashboard.cancel')}
            </Button>
            <Button type="submit" className="rounded-2xl bg-blue-700 text-white hover:bg-blue-800">
              <Plus className="mr-2 h-4 w-4" />
              {t('dashboard.addTask')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface MonthlyOverviewProps {
  calendarSessions: any[];
}

function MonthlyOverview({ calendarSessions }: MonthlyOverviewProps) {
  const { t } = useTranslation();
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');

  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const currentDay = today.getDate();
  const currentTime = `${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}`;

  const calculateSessionDuration = (startTime: string, endTime: string): number => {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    const durationMinutes = endHour * 60 + endMin - (startHour * 60 + startMin);
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

    if (!isPastDay && !isToday) return 0;

    const daySessions = calendarSessions.filter((s) => s.day === dayIndex && s.type !== 'break');

    if (isPastDay) {
      return daySessions.reduce((sum, session) => sum + calculateSessionDuration(session.startTime, session.endTime), 0);
    }

    return daySessions
      .filter((session) => session.endTime <= currentTime)
      .reduce((sum, session) => sum + calculateSessionDuration(session.startTime, session.endTime), 0);
  });

  const weeksInMonth = Math.ceil(daysInMonth / 7);

  const weeklyData = Array.from({ length: weeksInMonth }, (_, weekIndex) => {
    const startDay = weekIndex * 7;
    const endDay = Math.min(startDay + 7, daysInMonth);
    const weekCompletedHours = dailyCompletedHours.slice(startDay, endDay).reduce((sum, h) => sum + h, 0);

    return {
      week: `${t('dashboard.week')} ${weekIndex + 1}`,
      hours: Number(weekCompletedHours.toFixed(1)),
    };
  });

  const dailyChartData = Array.from({ length: daysInMonth }, (_, i) => ({
    day: `${i + 1}`,
    hours: Number((dailyCompletedHours[i] || 0).toFixed(1)),
  }));

  const totalMonthHours = dailyCompletedHours.reduce((sum, h) => sum + h, 0);
  const activeDays = dailyCompletedHours.filter((h) => h > 0).length;
  const averageDailyHours = activeDays > 0 ? totalMonthHours / activeDays : 0;
  const bestDayHours = Math.max(...dailyCompletedHours, 0);

  const chartData = chartType === 'line' ? dailyChartData : weeklyData;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <MiniStat title={t('dashboard.monthlyHours')} value={`${totalMonthHours.toFixed(1)}h`} />
        <MiniStat title={t('dashboard.activeDays')} value={`${activeDays}`} />
        <MiniStat title={t('dashboard.dailyAverage')} value={`${averageDailyHours.toFixed(1)}h`} />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-semibold text-slate-900 dark:text-white">{t('dashboard.monthlyOverview')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t('dashboard.bestDay')}: {bestDayHours.toFixed(1)}h
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant={chartType === 'line' ? 'default' : 'outline'}
            onClick={() => setChartType('line')}
            className={chartType === 'line' ? 'rounded-2xl bg-blue-700 text-white hover:bg-blue-800' : 'rounded-2xl'}
          >
            {t('dashboard.line')}
          </Button>
          <Button
            size="sm"
            variant={chartType === 'bar' ? 'default' : 'outline'}
            onClick={() => setChartType('bar')}
            className={chartType === 'bar' ? 'rounded-2xl bg-blue-700 text-white hover:bg-blue-800' : 'rounded-2xl'}
          >
            {t('dashboard.bar')}
          </Button>
        </div>
      </div>

      <div className="h-[280px] rounded-3xl border border-slate-200 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-900/50">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'line' ? (
            <ReLineChart data={chartData} margin={{ top: 12, right: 12, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.25} />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="hours" stroke="#2563eb" strokeWidth={3} dot={{ r: 3 }} />
            </ReLineChart>
          ) : (
            <ReBarChart data={chartData} margin={{ top: 12, right: 12, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.25} />
              <XAxis dataKey="week" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="hours" fill="#2563eb" radius={[8, 8, 0, 0]} />
            </ReBarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}