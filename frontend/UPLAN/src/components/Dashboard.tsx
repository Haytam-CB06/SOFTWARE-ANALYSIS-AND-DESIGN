import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import {
  AlertCircle,
  ArrowRight,
  BarChart2,
  BookOpen,
  CheckCircle2,
  Clock,
  Lightbulb,
  Play,
  Plus,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { getUserWeekKey } from '../utils/userStorage';
import { apiJsonAuthed, ApiError, API_BASE_URL as DEFAULT_API_BASE_URL } from '../lib/api';
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
} from 'recharts';
import { useTranslation } from 'react-i18next';
import { useInlineText } from '../i18n/inlineText';
import ConfirmDeleteDialog from './ConfirmDeleteDialog';

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

type DashboardBffResponse = {
  dashboard?: {
    assessments?: BackendAssessment[];
    assigned_tasks?: Array<Partial<Task> & { due_at?: string; dueDate?: string }>;
    today_schedule?: any[];
    notifications?: any[];
    recent_chat?: any[];
    week_summary?: SessionsSummary | null;
    week_goals?: { goals?: BackendGoal[] } | BackendGoal[];
  };
  cache?: {
    hit?: boolean;
    ttl_seconds?: number;
  };
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

function KpiCard({
  icon: Icon,
  label,
  value,
  sublabel,
}: {
  icon: React.ComponentType<any>;
  label: string;
  value: string;
  sublabel?: string;
}) {
  const tt = useInlineText();

  return (
    <div className="rounded-[18px] border border-white/10 bg-white/5 p-3 backdrop-blur">
      <div className="flex items-center gap-2 text-white/60">
        <Icon className="h-3.5 w-3.5" />
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em]">{tt(label)}</p>
      </div>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
      {sublabel ? <p className="mt-0.5 text-[11px] text-white/45">{tt(sublabel)}</p> : null}
    </div>
  );
}

function MiniMetric({ title, value }: { title: string; value: string }) {
  const tt = useInlineText();

  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/50">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{tt(title)}</p>
      <p className="mt-2 text-xl font-bold text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}

function InsightMetric({
  tone,
  label,
  value,
}: {
  tone: 'blue' | 'green' | 'amber';
  label: string;
  value: string;
}) {
  const tt = useInlineText();

  const toneMap = {
    blue: 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-300',
    green: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-300',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-300',
  };

  return (
    <div className={`rounded-3xl p-4 ${toneMap[tone]}`}>
      <p className="mb-1 text-xs font-medium">{tt(label)}</p>
      <p className="text-2xl font-semibold">{value}</p>
    </div>
  );
}

function SectionCard({
  title,
  right,
  children,
  dataTour,
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  dataTour?: string;
}) {
  const tt = useInlineText();

  return (
    <Card data-tour={dataTour} className="h-full rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0b0f17]">
      <CardHeader className="pb-3 pt-5">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-[15px] font-semibold text-slate-900 dark:text-white">
            {tt(title)}
          </CardTitle>
          {right}
        </div>
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
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
  const tt = useInlineText();

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#111]">
      <div className="mb-4">
        <p className="text-sm font-semibold text-slate-900 dark:text-white">{tt('Consistency Grid')}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {tt('Weekly completion against your planned workload')}
        </p>
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
  const { t } = useTranslation();
  const tt = useInlineText();

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
    start: startPomodoro,
    pause: pausePomodoro,
    reset: resetPomodoro,
    linkTask,
    setTimer,
  } = usePomodoro();

  const [minimalMode, setMinimalMode] = useState(false);
  const [progressTab, setProgressTab] = useState<'week' | 'month'>('week');
  const [showInsights, setShowInsights] = useState(false);
  const [isRenameTimetableDialogOpen, setIsRenameTimetableDialogOpen] = useState(false);
  const [renameTimetableId, setRenameTimetableId] = useState<string | null>(null);
  const [renameTimetableName, setRenameTimetableName] = useState('');
  const [deleteTaskTarget, setDeleteTaskTarget] = useState<Task | null>(null);

  const API_BASE_URL = DEFAULT_API_BASE_URL;
  const autoStartHandledRef = useRef(false);

  const savedTimetables = Array.isArray(timetables) ? timetables : [];
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

  const getCurrentUserId = (): string | null => localStorage.getItem('currentUserId');

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
    if (!userId || !API_BASE_URL) return [];

    const url = `${API_BASE_URL}/assessments?user_id=${encodeURIComponent(
      userId
    )}&include_completed=true&include_past=true`;

    const res = await fetch(url, { headers: { 'X-User-Id': userId } });
    if (!res.ok) {
      console.error('Failed to load assessments', await res.text());
      return [];
    }

    const data = await res.json();
    return (data?.assessments || []) as BackendAssessment[];
  };

  const mapAssessmentToTask = (a: BackendAssessment): Task => ({
    id: String(a.id),
    title: String(a.title || a.subject || t('dashboard.task')),
    type: (a.type || 'assignment') as Task['type'],
    dueDate: String(a.dueDate || new Date().toISOString()),
    priority: (a.priority || 'medium') as Task['priority'],
    subject: String(a.subject || t('dashboard.study')),
    completed: !!a.completed,
    completedAt: a.completedAt || undefined,
  });

  const mapBoardTaskToTask = (item: Partial<Task> & { due_at?: string; dueDate?: string }): Task | null => {
    const id = item?.id ? String(item.id) : '';
    const title = item?.title ? String(item.title) : '';
    if (!id || !title) return null;

    return {
      id,
      title,
      type: (item.type || 'assignment') as Task['type'],
      dueDate: String(item.dueDate || item.due_at || new Date().toISOString()),
      priority: (item.priority || 'medium') as Task['priority'],
      subject: String(item.subject || t('dashboard.study')),
      completed: !!item.completed,
      completedAt: item.completedAt,
    };
  };

  const loadDashboardSnapshot = async () => {
    const userId = getCurrentUserId();
    if (!userId) {
      setTasks([]);
      setWeekSummary(null);
      setWeekGoals([]);
      return;
    }

    try {
      const snapshot = await apiJsonAuthed<DashboardBffResponse>(
        `/bff/dashboard?user_id=${encodeURIComponent(userId)}`,
        'GET'
      );
      const dashboard = snapshot?.dashboard || {};
      const assessmentTasks = Array.isArray(dashboard.assessments)
        ? dashboard.assessments.map(mapAssessmentToTask)
        : [];
      const boardTasks = Array.isArray(dashboard.assigned_tasks)
        ? dashboard.assigned_tasks.map(mapBoardTaskToTask).filter(Boolean) as Task[]
        : [];

      setTasks([...boardTasks, ...assessmentTasks]);

      if (dashboard.week_summary) {
        setWeekSummary(dashboard.week_summary);
      }

      const goals = dashboard.week_goals;
      if (Array.isArray(goals)) {
        setWeekGoals(goals);
      } else if (Array.isArray(goals?.goals)) {
        setWeekGoals(goals.goals);
      }
    } catch (e) {
      console.warn('BFF dashboard snapshot failed; falling back to direct dashboard reads', e);
      const items = await fetchAssessments();
      setTasks(items.map(mapAssessmentToTask));
      await loadWeekProgress();
    }
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
      const sum = await apiJsonAuthed<SessionsSummary>(
        `/sessions/summary?user_id=${encodeURIComponent(userId)}`,
        'GET'
      );
      setWeekSummary(sum);

      const goalsRes = await apiJsonAuthed<{ goals: BackendGoal[]; period_start: string; period_end: string }>(
        `/goals?user_id=${encodeURIComponent(userId)}&period_start=${encodeURIComponent(
          sum.period_start
        )}&period_end=${encodeURIComponent(sum.period_end)}`,
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
    const handleUserChanged = () => {
      setWeekSummary(null);
      setWeekGoals([]);
    };

    window.addEventListener('userChanged', handleUserChanged);

    return () => {
      window.removeEventListener('userChanged', handleUserChanged);
    };
  }, []);

  const getWeekIdentifier = (date: Date): string => {
    const year = date.getFullYear();
    const firstDayOfYear = new Date(year, 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    return `${year}-W${String(weekNumber).padStart(2, '0')}`;
  };

  useEffect(() => {
    const loadCalendarSessions = () => {
      const today = new Date();
      const weekId = getWeekIdentifier(today);
      const loadedSessions = localStorage.getItem(getUserWeekKey(weekId));

      if (loadedSessions) {
        setCalendarSessions(JSON.parse(loadedSessions));
        return;
      }

      const active = timetables?.find((tt) => tt.isActive);

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
    };

    loadCalendarSessions();
    loadDashboardSnapshot();

    const handleUserChanged = () => {
      setCalendarSessions([]);
      setTasks([]);
      loadCalendarSessions();
      loadDashboardSnapshot();
    };

    window.addEventListener('userChanged', handleUserChanged);

    const calendarIntervalId = setInterval(loadCalendarSessions, 5000);
    const dashboardIntervalId = setInterval(loadDashboardSnapshot, 30000);

    return () => {
      clearInterval(calendarIntervalId);
      clearInterval(dashboardIntervalId);
      window.removeEventListener('userChanged', handleUserChanged);
    };
  }, [timetables, t]);

  const today = new Date();
  const todayDayIndex = (today.getDay() + 6) % 7;
  const currentTime = `${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}`;

  const todaySessions = useMemo(
    () =>
      calendarSessions
        .filter((s) => s.day === todayDayIndex)
        .sort((a, b) => String(a.startTime).localeCompare(String(b.startTime))),
    [calendarSessions, todayDayIndex]
  );

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
  }, [todaySessions]);

  const calculateSessionDuration = (startTime: string, endTime: string): number => {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    const durationMinutes = endHour * 60 + endMin - (startHour * 60 + startMin);
    return durationMinutes / 60;
  };

  const timeToMinutes = (timeValue: string): number => {
    const [h, m] = timeValue.split(':').map(Number);
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

  const handleStartStudySession = (clickedSession: any) => {
    if (!clickedSession) return;

    if (clickedSession.type === 'break') {
      toast.info(t('dashboard.thisIsBreak'));
      return;
    }

    const nowMin = timeToMinutes(currentTime);
    const clickedStartMin = timeToMinutes(clickedSession.startTime);
    const clickedEndMin = timeToMinutes(clickedSession.endTime);
    const isClickedActive = clickedStartMin <= nowMin && clickedEndMin > nowMin;

    const seconds = isClickedActive
      ? computeRemainingSeconds(clickedSession.endTime)
      : computePlannedSeconds(clickedSession.startTime, clickedSession.endTime);

    (async () => {
      try {
        const backendSessionId = await ensureBackendStudySession(clickedSession);
        if (!backendSessionId) throw new Error(t('dashboard.errors.failedStartSession'));
        linkTask(backendSessionId, clickedSession.subject);
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

    if (status === 'missed') {
      toast.info(t('dashboard.sessionAlreadyMissed'));
      onAutoStartConsumed?.();
      return;
    }

    handleStartStudySession(session);
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
    const plannedHours = daySessions.reduce(
      (sum, session) => sum + calculateSessionDuration(session.startTime, session.endTime),
      0
    );

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

  const todayTasks = tasks.filter((task) => new Date(task.dueDate).toDateString() === today.toDateString());

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
    .slice(0, 6);

  const completedTodayTasks = tasks.filter(
    (task) => new Date(task.dueDate).toDateString() === today.toDateString() && task.completed
  ).length;

  const totalTodayTasks = todayTasks.length;
  const todayStudyPercent = clampPercent(todayStudyHours > 0 ? (todayCompletedHours / todayStudyHours) * 100 : 0);
  const completedSessionCount = completedSessions.filter((s) => s.type !== 'break').length;
  const completedSessionsPercent = clampPercent(
    todaySessions.filter((s) => s.type !== 'break').length > 0
      ? (completedSessionCount / todaySessions.filter((s) => s.type !== 'break').length) * 100
      : 0
  );

  const getDueDateMeta = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return { key: 'today', text: t('dashboard.todayShort'), color: 'text-orange-600 dark:text-orange-400' };
    }
    if (diffDays === 1) {
      return { key: 'tomorrow', text: t('dashboard.tomorrow'), color: 'text-emerald-600 dark:text-emerald-400' };
    }
    if (diffDays < 0) {
      return { key: 'overdue', text: t('dashboard.overdue'), color: 'text-red-600 dark:text-red-400' };
    }

    return {
      key: 'future',
      text: t('dashboard.daysCount', { count: diffDays }),
      color: 'text-emerald-600 dark:text-emerald-400',
    };
  };

  const handleAddTask = async (taskData: { subject: string; type: Task['type']; dueDate: string; title?: string }) => {
    const userId = getCurrentUserId();
    if (!userId || !API_BASE_URL) {
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
    if (!userId || !API_BASE_URL) {
      toast.error(t('dashboard.errors.pleaseLogin'));
      return;
    }

    const target = tasks.find((task) => task.id === taskId);
    if (!target) return;

    const nextCompleted = !target.completed;

    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? {
              ...task,
              completed: nextCompleted,
              completedAt: nextCompleted ? new Date().toISOString() : undefined,
            }
          : task
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
      return;
    }

    const userId = getCurrentUserId();
    if (!userId || !API_BASE_URL) {
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
  };

  const requestDeleteTask = (task: Task) => {
    if ((task as any).isFromCalendar) {
      void deleteTask(task.id);
      return;
    }
    setDeleteTaskTarget(task);
  };

  const confirmDeleteTask = async () => {
    if (!deleteTaskTarget) return;
    await deleteTask(deleteTaskTarget.id);
    setDeleteTaskTarget(null);
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

  const getSessionStatusBadge = (status: 'planned' | 'completed' | 'missed' | 'skipped', isActiveNow: boolean) => {
    if (isActiveNow) {
      return <Badge className="bg-emerald-600 text-white">{t('Live')}</Badge>;
    }

    if (status === 'completed') {
      return (
        <Badge className="border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300">
          {t('Completed')}
        </Badge>
      );
    }

    if (status === 'missed') {
      return (
        <Badge className="border border-red-200 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
          {t('Missed')}
        </Badge>
      );
    }

    if (status === 'skipped') {
      return (
        <Badge className="border border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
          {t('Skipped')}
        </Badge>
      );
    }

    return (
      <Badge className="border border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/40 dark:bg-blue-950/20 dark:text-blue-300">
        {t('Planned')}
      </Badge>
    );
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const insightTodayCount = upcomingDeadlines.filter((d) => getDueDateMeta(d.dueDate).key === 'today').length;
  const insightTomorrowCount = upcomingDeadlines.filter((d) => getDueDateMeta(d.dueDate).key === 'tomorrow').length;
  const insightOverdueCount = upcomingDeadlines.filter((d) => getDueDateMeta(d.dueDate).key === 'overdue').length;

  const smartSuggestions = [
    {
      icon: Zap,
      title: 'Next priority',
      text:
        upcomingSessions.length > 0
          ? `Start ${upcomingSessions[0].subject} at ${upcomingSessions[0].startTime}.`
          : 'No more planned study blocks for today.',
      tone: 'amber' as const,
    },
    {
      icon: Target,
      title: 'Deadline risk',
      text:
        upcomingDeadlines.length > 0
          ? `${upcomingDeadlines[0].subject} is your nearest deadline.`
          : 'You are caught up on deadlines.',
      tone: 'blue' as const,
    },
    {
      icon: TrendingUp,
      title: 'Execution insight',
      text:
        completedSessionCount > 0
          ? `You have completed ${completedSessionCount} study block${completedSessionCount > 1 ? 's' : ''} today.`
          : 'Your first completed block will improve momentum today.',
      tone: 'green' as const,
    },
  ];

  const bestSubject = upcomingDeadlines[0]?.subject || currentSession?.subject || 'General';
  const currentFocusLabel = currentSession?.subject || upcomingSessions[0]?.subject || 'No active focus block';

  return (
<div className="max-w-8xl mx-auto space-y-6 p-4 sm:p-6 lg:p-8">
          {showInsights && (
        <>
          <button
            aria-label="Close insights"
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
            onClick={() => setShowInsights(false)}
          />
          <aside className="fixed right-4 top-4 z-50 w-[min(460px,calc(100vw-2rem))] rounded-[24px] border border-slate-200 bg-white/95 p-5 shadow-[0_28px_80px_rgba(15,23,42,0.18)] backdrop-blur dark:border-white/10 dark:bg-[#0b0f17]/95">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-400">
                  <Sparkles className="h-3.5 w-3.5" />
                  {t('Smart Insights')}
                </div>
                <h3 className="mt-3 text-2xl font-semibold text-slate-900 dark:text-white">{t('Focus Snapshot')}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {t('Recommendations and risk monitoring for your study system')}
                </p>
              </div>
              <Button variant="outline" onClick={() => setShowInsights(false)} className="rounded-xl">
                {t('Close')}
              </Button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <InsightMetric tone="blue" label="Current focus" value={currentFocusLabel} />
                <InsightMetric tone="green" label="Weekly goal" value={weeklyTargetHours > 0 ? `${weeklyTargetHours}h` : '—'} />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <InsightMetric tone="amber" label="Today" value={`${insightTodayCount}`} />
                <InsightMetric tone="green" label="Tomorrow" value={`${insightTomorrowCount}`} />
                <InsightMetric tone="blue" label="Overdue" value={`${insightOverdueCount}`} />
              </div>

              <div className="rounded-3xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-4 dark:border-slate-800 dark:bg-slate-900/50">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{t('Execution Rate')}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {t('Daily completion against your planned schedule')}
                    </p>
                  </div>
                  <span className={`text-xl font-bold ${getProgressTone(todayStudyPercent).text}`}>
                    {todayStudyPercent}%
                  </span>
                </div>
                <ProgressBarWithTone value={todayStudyPercent} />
              </div>

              <div className="space-y-3">
                {smartSuggestions.map((item, index) => {
                  const Icon = item.icon;
                  const toneMap = {
                    amber: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-300',
                    blue: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/20 dark:text-blue-300',
                    green: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-300',
                  } as const;

                  return (
                    <div key={index} className={`rounded-2xl border p-4 ${toneMap[item.tone]}`}>
                      <div className="flex items-start gap-3">
                        <div className="rounded-xl bg-white/80 p-2 shadow-sm dark:bg-black/20">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{item.title}</p>
                          <p className="mt-1 text-sm opacity-90">{item.text}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/40">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{t('Suggested subject')}</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {t('The strongest candidate for your next high-value block')}
                </p>
                <div className="mt-3 flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900 dark:text-white">{bestSubject}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{t('Based on urgency and workload')}</p>
                  </div>
                  <Sparkles className="h-4 w-4 text-blue-600" />
                </div>
              </div>
            </div>
          </aside>
        </>
      )}

      <Dialog open={isRenameTimetableDialogOpen} onOpenChange={setIsRenameTimetableDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('Rename workspace')}</DialogTitle>
            <DialogDescription>{t('Give this timetable a more specific workspace name.')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rename-timetable-name">{t('Workspace name')}</Label>
              <Input
                id="rename-timetable-name"
                value={renameTimetableName}
                onChange={(e) => setRenameTimetableName(e.target.value)}
                placeholder="Enter workspace name"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsRenameTimetableDialogOpen(false);
                  setRenameTimetableName('');
                }}
                className="rounded-2xl"
              >
                {t('Cancel')}
              </Button>

              <Button
                className="rounded-2xl bg-blue-700 text-white hover:bg-blue-800"
                onClick={async () => {
                  if (!renameTimetableId || !renameTimetableName.trim()) return;

                  try {
                    if (onRenameTimetable) {
                      await Promise.resolve(onRenameTimetable(renameTimetableId, renameTimetableName.trim()));
                    }
                    toast.success('Workspace renamed');
                    setIsRenameTimetableDialogOpen(false);
                    setRenameTimetableName('');
                  } catch (e: any) {
                    toast.error(e?.message || 'Failed to rename workspace');
                  }
                }}
              >
                {t('Save')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {minimalMode ? (
        <div className="mx-auto max-w-3xl space-y-4">
          <Card className="rounded-[28px] border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0b0b0b]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                <Clock className="h-5 w-5 text-blue-700" />
                {currentSession ? 'Live Focus Block' : 'Next Focus Block'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentSession ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-2xl font-semibold text-slate-900 dark:text-white">{currentSession.subject}</h3>
                    <Badge className="bg-emerald-600 text-white">{t('Live')}</Badge>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {currentSession.startTime} - {currentSession.endTime}
                  </p>
                </div>
              ) : upcomingSessions.length > 0 ? (
                <div>
                  <h3 className="mb-2 text-2xl font-semibold text-slate-900 dark:text-white">
                    {upcomingSessions[0].subject}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Starts at {upcomingSessions[0].startTime}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">{t('No more study blocks planned for today.')}</p>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-[28px] border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0b0b0b]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                <Target className="h-5 w-5 text-emerald-600" />
                {t('Focus Console')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/50">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{t('Execution Rate')}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{t('Completed hours vs planned hours')}</p>
                  </div>
                  <span className={`text-xl font-bold ${getProgressTone(todayStudyPercent).text}`}>
                    {todayStudyPercent}%
                  </span>
                </div>

                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <ReBarChart data={[{ name: 'Execution', value: todayStudyPercent }]}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tickLine={false} axisLine={false} />
                      <YAxis domain={[0, 100]} tickLine={false} axisLine={false} />
                      <Tooltip formatter={(value: number) => [`${value}%`, 'Execution']} />
                      <Bar dataKey="value" radius={[10, 10, 0, 0]} fill="#2563eb" />
                    </ReBarChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-300">{t('Deep work')}</span>
                    <span className={`font-semibold ${getProgressTone(todayStudyPercent).text}`}>
                      {Math.round(todayCompletedHours * 10) / 10}h / {Math.round(todayStudyHours * 10) / 10}h
                    </span>
                  </div>
                  <ProgressBarWithTone value={todayStudyPercent} />
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/50">
                <div className="text-center">
                  <p className="text-3xl font-bold tracking-[-0.04em] text-slate-900 dark:text-white">
                    {formatTime(pomodoroTime)}
                  </p>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    {pomodoroIsActive ? 'Timer running' : 'Timer ready'}
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
                    className="rounded-xl bg-blue-700 text-white hover:bg-blue-800"
                  >
                    {pomodoroIsActive ? 'Pause' : 'Start'}
                  </Button>
                  <Button variant="outline" onClick={resetPomodoro} className="rounded-xl">
                    {t('Reset')}
                  </Button>
                  <Button variant="outline" onClick={onShowPomodoroWidget} className="rounded-xl">
                    {t('Open')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
              <div className="mx-auto w-full rounded-[26px] border border-slate-200/80 bg-[#eef3fb] p-3 shadow-[0_18px_60px_rgba(15,23,42,0.07)] dark:border-white/10 dark:bg-[#05070b]">            <div className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#07111f]">
              <div className="border-b border-white/10 bg-[#0b1b33] px-5 py-4 text-white">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-10">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
                        <BookOpen className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-base font-bold tracking-[-0.03em]">UPLAN</p>
                        <p className="text-[11px] text-white/50">{t('Study Planner Workspace')}</p>
                      </div>
                    </div>

                    <div className="hidden items-center gap-6 lg:flex">
                      <button className="border-b-2 border-white pb-1 text-sm font-medium text-white">{t('Overview')}</button>
                      <button
                        onClick={() => onNavigate('my-timetable')}
                        className="text-sm text-white/70 transition hover:text-white"
                      >
                        {t('Planner')}
                      </button>
                      <button
                        onClick={() => onNavigate('auto-generate')}
                        className="text-sm text-white/70 transition hover:text-white"
                      >
                        {t('Create')}
                      </button>
                      <button
                        onClick={() => onNavigate('workspace')}
                        className="text-sm text-white/70 transition hover:text-white"
                      >
                        {t('Workspaces')}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      variant="ghost"
                      onClick={() => setShowInsights(true)}
                      className="rounded-2xl text-white hover:bg-white/10 hover:text-white"
                    >
                      <Lightbulb className="mr-2 h-4 w-4" />
                      {t('Smart Insights')}
                    </Button>
                    <Button
                      onClick={() => setIsAddTaskDialogOpen(true)}
                      className="rounded-2xl bg-white text-slate-900 hover:bg-white/90"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      {t('Create Deadline')}
                    </Button>
                  </div>
                </div>
                </div>

                <section className="bg-gradient-to-br from-[#0b1b33] via-[#10233f] to-[#0a1628] px-5 pb-5 pt-5 text-white">
                <div className="grid grid-cols-12 gap-5">
                <div className="col-span-12 xl:col-span-8 rounded-2xl border border-white/10 bg-[#0b1b33] p-5 text-white">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div>
                      <p className="text-xl font-semibold tracking-[-0.04em]">Welcome back, {userName}</p>
                      <p className="mt-1 text-sm text-white/60">
                        {t('Manage study sessions, deadlines, and performance from one workspace.')}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:min-w-[460px]">
                      <KpiCard icon={Clock} label="Deep Work" value={`${Math.round(todayCompletedHours * 10) / 10}h`} />
                      <KpiCard icon={CheckCircle2} label="Execution" value={`${completedSessionsPercent}%`} />
                      <KpiCard icon={AlertCircle} label="Open Tasks" value={`${tasks.filter((t) => !t.completed).length}`} />
                      <KpiCard icon={TrendingUp} label="Upcoming" value={`${upcomingSessions.length}`} />
                    </div>
                  </div>
                </div>

                <div className="col-span-12 xl:col-span-4 rounded-2xl border border-white/10 bg-[#0b1b33] p-5 text-white">
                  <p className="text-sm font-medium text-white/75">{t('Focus Snapshot')}</p>
                  <p className="mt-2 text-xl font-semibold">{currentFocusLabel}</p>
                  <div className="mt-4 space-y-3">
                    <div>
                      <div className="mb-1 flex items-center justify-between text-xs text-white/60">
                        <span>{t('Execution rate')}</span>
                        <span>{todayStudyPercent}%</span>
                      </div>
                      <ProgressBarWithTone value={todayStudyPercent} className="h-2.5" />
                    </div>
                    <div>
                      <div className="mb-1 flex items-center justify-between text-xs text-white/60">
                        <span>{t('Weekly goal')}</span>
                        <span>{weeklyGoalProgressPct}%</span>
                      </div>
                      <ProgressBarWithTone value={weeklyGoalProgressPct} className="h-2.5" />
                    </div>
                  </div>
                </div>
              </div>
                  </section>

  <section className="bg-[#f8fafc] p-5 dark:bg-[#0a0f18] sm:p-6">
  <div className="space-y-6">
    <div className="grid grid-cols-12 gap-5">
      <div className="col-span-12 xl:col-span-6">
        <SectionCard
          dataTour="dashboard-today-panel"
          title="Today’s Queue"
          right={
            <Badge variant="outline" className="rounded-full border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
              {todaySessions.length} {t('dashboard.sessions')}
            </Badge>
          }
        >
          <div className="relative">
            <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-4 rounded-t-2xl bg-gradient-to-b from-white to-transparent dark:from-[#0b0f17]" />
            <div
              className="max-h-[520px] space-y-3 overflow-y-auto overscroll-contain rounded-2xl border border-slate-100 bg-slate-50/40 p-3 pr-2 shadow-inner [scrollbar-width:thin] dark:border-slate-800 dark:bg-slate-950/30"
              aria-label={t('Today’s Queue')}
            >
            {todaySessions.length > 0 ? (
              todaySessions.map((session, index) => {
                const calendarId = session?.id ? String(session.id) : String(index);
                const status = (calendarId && todayStatusByCalendarId[calendarId]) || 'planned';
                const isActiveNow =
                  status === 'planned' &&
                  session.startTime <= currentTime &&
                  session.endTime > currentTime;

                return (
                  <div
                    key={session?.id || index}
                    className={`rounded-xl border p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                      isActiveNow
                        ? 'border-emerald-300 bg-emerald-50/70 dark:border-emerald-700 dark:bg-emerald-950/10'
                        : 'border-slate-200 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-slate-900 dark:text-white">{session.subject}</p>
                          {getSessionStatusBadge(status, isActiveNow)}
                        </div>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          {session.startTime} - {session.endTime}
                        </p>
                      </div>

                      <Button
                        size="sm"
                        onClick={() => handleStartStudySession(session)}
                        className="rounded-xl bg-blue-700 text-white hover:bg-blue-800"
                        disabled={status === 'completed' || status === 'missed' || status === 'skipped'}
                      >
                        <Play className="mr-1 h-3.5 w-3.5" />
                        {t('Start')}
                      </Button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center dark:border-slate-700 dark:bg-slate-900/40">
                <p className="text-sm text-slate-500 dark:text-slate-400">{t('No scheduled study blocks today.')}</p>
              </div>
            )}
            </div>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-5 rounded-b-2xl bg-gradient-to-t from-slate-50 to-transparent dark:from-[#0b0f17]" />
          </div>
        </SectionCard>
      </div>

      <div className="col-span-12 xl:col-span-6">
        <SectionCard
          title="Deadline Pipeline"
          right={
            <Button size="sm" variant="outline" onClick={() => setIsAddTaskDialogOpen(true)} className="rounded-xl">
              <Plus className="mr-1 h-3.5 w-3.5" />
              {t('New')}
            </Button>
          }
        >
          <div className="space-y-3">
            {upcomingDeadlines.length > 0 ? (
              upcomingDeadlines.map((task) => {
                const dueDateInfo = getDueDateMeta(task.dueDate);
                const canToggle = !(task as any).isFromCalendar;

                return (
                  <div
                    key={task.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/40"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-slate-900 dark:text-white">{task.title}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <span>{task.subject}</span>
                          <span>•</span>
                          <span className={dueDateInfo.color}>{dueDateInfo.text}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge className={`${getPriorityColor(task.priority)} rounded-full`}>
                          {task.priority}
                        </Badge>

                        {canToggle && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleTaskCompletion(task.id)}
                            className="rounded-xl"
                          >
                            {task.completed ? 'Undo' : 'Complete'}
                          </Button>
                        )}

                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => requestDeleteTask(task)}
                          className="rounded-xl"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center dark:border-slate-700 dark:bg-slate-900/40">
                <p className="text-sm text-slate-500 dark:text-slate-400">{t('No active deadlines in your pipeline.')}</p>
              </div>
            )}
          </div>
        </SectionCard>
      </div>

      <div className="col-span-12">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <SectionCard title="Focus Console">
            <div className="space-y-4">
              <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4 text-center dark:border-slate-800 dark:bg-slate-900/50">
                <p className="text-3xl font-bold tracking-[-0.04em] text-slate-900 dark:text-white">
                  {formatTime(pomodoroTime)}
                </p>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  {pomodoroIsActive ? 'Focus timer running' : 'Ready to begin a focus session'}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <Button
                  onClick={() => {
                    if (pomodoroIsActive) pausePomodoro();
                    else {
                      startPomodoro();
                      onShowPomodoroWidget?.();
                    }
                  }}
                  className="rounded-xl bg-blue-700 text-white hover:bg-blue-800"
                >
                  {pomodoroIsActive ? 'Pause' : 'Start'}
                </Button>

                <Button variant="outline" onClick={resetPomodoro} className="rounded-xl">
                  {t('Reset')}
                </Button>

                <Button variant="outline" onClick={onShowPomodoroWidget} className="rounded-xl">
                  {t('Open')}
                </Button>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/40">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{t('Current focus')}</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{currentFocusLabel}</p>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Saved Timetables"
            right={
              <Button size="sm" variant="outline" onClick={() => onNavigate('view-timetables')} className="rounded-xl">
                {t('View all')}
              </Button>
            }
          >
            <div className="max-h-[360px] space-y-3 overflow-y-auto pr-1">
              {recentTimetables.length > 0 ? (
                recentTimetables.map((tt) => {
                  const isActive = !!tt?.isActive;
                  const sessionCount = Array.isArray(tt?.calendarSessions)
                    ? tt.calendarSessions.length
                    : Array.isArray(tt?.schedule)
                    ? tt.schedule.length
                    : 0;

                  return (
                    <div
                      key={tt.id}
                      className={`rounded-2xl border p-4 ${
                        isActive
                          ? 'border-blue-200 bg-blue-50/70 dark:border-blue-900/30 dark:bg-blue-950/10'
                          : 'border-slate-200 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-slate-900 dark:text-white">
                            {tt?.name || 'Untitled timetable'}
                          </p>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {sessionCount} scheduled blocks
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          {onRenameTimetable && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openRenameTimetableDialog(tt)}
                              className="rounded-xl"
                            >
                              {t('Rename')}
                            </Button>
                          )}

                          <Button
                            size="sm"
                            onClick={() => handleActivateTimetableFromDashboard(tt.id)}
                            disabled={isActive}
                            className={
                              isActive
                                ? 'rounded-xl bg-slate-200 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                                : 'rounded-xl bg-blue-700 text-white hover:bg-blue-800'
                            }
                          >
                            {isActive ? 'Active' : 'Activate'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center dark:border-slate-700 dark:bg-slate-900/40">
                  <p className="text-sm text-slate-500 dark:text-slate-400">{t('No saved timetables yet.')}</p>
                </div>
              )}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>

    <div className="grid grid-cols-12 gap-5">
      <div className="col-span-12">
        <SectionCard
          title="Performance Analytics"
          right={
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={progressTab === 'week' ? 'default' : 'outline'}
                onClick={() => setProgressTab('week')}
                className={progressTab === 'week' ? 'rounded-xl bg-blue-700 text-white hover:bg-blue-800' : 'rounded-xl'}
              >
                {t('Week')}
              </Button>
              <Button
                size="sm"
                variant={progressTab === 'month' ? 'default' : 'outline'}
                onClick={() => setProgressTab('month')}
                className={progressTab === 'month' ? 'rounded-xl bg-blue-700 text-white hover:bg-blue-800' : 'rounded-xl'}
              >
                {t('Month')}
              </Button>
            </div>
          }
        >
          {progressTab === 'week' ? (
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.95fr)] lg:items-stretch">
              <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/50">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {t('Completed hours')}
                    </p>
                    <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
                      {weekProgressLoading ? '…' : `${weeklyCompletedHours.toFixed(1)}h`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {t('Weekly goal')}
                    </p>
                    <p className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">
                      {weeklyTargetHours > 0 ? `${weeklyTargetHours}h` : '—'}
                    </p>
                  </div>
                </div>

                <ProgressBarWithTone value={weeklyGoalProgressPct} />
                <div className="mt-6 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <ReLineChart data={weeklyData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="day" tickLine={false} axisLine={false} />
                      <YAxis tickLine={false} axisLine={false} />
                      <Tooltip />
                      <Line type="monotone" dataKey="hours" stroke="#94a3b8" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="completed" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} />
                    </ReLineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <StudyProgressCalendar data={weeklyData} todayLabel="Today" />
            </div>
          ) : (
            <MonthlyOverview calendarSessions={calendarSessions} />
          )}
        </SectionCard>
      </div>
    </div>
  </div>
</section>
            </div>
          </div>
        </div>
      )}

      <AddTaskDialog
        open={isAddTaskDialogOpen}
        onOpenChange={setIsAddTaskDialogOpen}
        onAdd={handleAddTask}
      />
      <ConfirmDeleteDialog
        open={!!deleteTaskTarget}
        onOpenChange={(open) => !open && setDeleteTaskTarget(null)}
        title="Delete deadline"
        description={`This permanently deletes "${deleteTaskTarget?.title || deleteTaskTarget?.subject || 'this deadline'}".`}
        confirmLabel={t('common.delete', 'Delete')}
        onConfirm={confirmDeleteTask}
      />
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
  const tt = useInlineText();
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
    if (!userId || !API_BASE_URL) return;

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
      <DialogContent className="max-h-[88vh] w-[94vw] overflow-y-auto rounded-2xl border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#0b0b0b] sm:max-w-[520px]">
        <DialogHeader className="space-y-2">
          <DialogTitle>{t('Create Deadline')}</DialogTitle>
          <DialogDescription>
            {tt('Add the essentials now. You can refine details later.')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="title">{t('Deadline title')}</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Math Midterm Review"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {tt('Suggested')}: {formData.subject || tt('Subject')} {capitalize(formData.type)}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">{t('Subject')}</Label>
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
                <SelectValue placeholder={subjectOptions.length ? 'Select course' : 'Fill class schedule first'} />
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
                {t('Locked priority:')} <span className="font-medium">{capitalize(priorityBySubject[formData.subject] || 'medium')}</span>
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="type">{t('Type')}</Label>
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
                  <SelectItem value="assignment">{t('Assignment')}</SelectItem>
                  <SelectItem value="exam">{t('Exam')}</SelectItem>
                  <SelectItem value="quiz">{t('Quiz')}</SelectItem>
                  <SelectItem value="project">{t('Project')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">{t('Due date')}</Label>
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
              {t('Cancel')}
            </Button>
            <Button type="submit" className="rounded-2xl bg-blue-700 text-white hover:bg-blue-800">
              <Plus className="mr-2 h-4 w-4" />
              {t('Create Deadline')}
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
  const tt = useInlineText();
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
      week: `Week ${weekIndex + 1}`,
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
        <MiniMetric title="Monthly hours" value={`${totalMonthHours.toFixed(1)}h`} />
        <MiniMetric title="Active days" value={`${activeDays}`} />
        <MiniMetric title="Daily average" value={`${averageDailyHours.toFixed(1)}h`} />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-semibold text-slate-900 dark:text-white">{tt('Monthly performance')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400">{tt('Best day')}: {bestDayHours.toFixed(1)}h</p>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant={chartType === 'line' ? 'default' : 'outline'}
            onClick={() => setChartType('line')}
            className={chartType === 'line' ? 'rounded-2xl bg-blue-700 text-white hover:bg-blue-800' : 'rounded-2xl'}
          >
            {tt('Line')}
          </Button>
          <Button
            size="sm"
            variant={chartType === 'bar' ? 'default' : 'outline'}
            onClick={() => setChartType('bar')}
            className={chartType === 'bar' ? 'rounded-2xl bg-blue-700 text-white hover:bg-blue-800' : 'rounded-2xl'}
          >
            {tt('Bar')}
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
