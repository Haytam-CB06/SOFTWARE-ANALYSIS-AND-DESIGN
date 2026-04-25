import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Award,
  Calendar,
  Flag,
  Activity,
  TrendingUp,
  Flame,
  Plus,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import ProgressTracking from './ProgressTracking';
import { getUserWeekKey } from '../utils/userStorage';

interface GoalsAchievementsProps {
  onNavigate?: (page: string) => void;
  onBack?: () => void;
}

interface BackendAssessment {
  id: string;
  subject: string;
  dueDate: string;
  title: string;
  completed?: boolean;
  type?: string;
}

interface BackendGoal {
  id: string;
  user_id: string;
  subject_id?: string | null;
  subject_title?: string | null;
  period_start: string;
  period_end: string;
  target_hours: number;
  weight?: number | null;
}

interface GoalsSummary {
  period_start: string;
  period_end: string;
  total_target_hours: number;
  total_completed_hours: number;
  streak_days: number;
  completed_tasks: number;
  goals: BackendGoal[];
  subjects: Array<{ subject_id: string; subject_title?: string | null; target_hours: number; completed_hours: number }>;
  upcoming_deadlines: Array<{ id: string; title: string; type: string; dueDate: string; subject: string }>;
  achievements: Array<{ key: string; title: string; detail: string }>;
}

type SubjectOption = { id: string; title: string };

const ACHIEVEMENT_ICON: Record<string, any> = {
  weekly_goal: Flag,
  streak_3: Flame,
  streak_7: Flame,
  tasks_3: Calendar,
  hours_10_week: Clock,
};

export default function GoalsAchievements({ onNavigate, onBack }: GoalsAchievementsProps) {
  const { t } = useTranslation();

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const userId = localStorage.getItem('currentUserId') || '';

  const [assessments, setAssessments] = useState<BackendAssessment[]>([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<GoalsSummary | null>(null);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);

  const [weekStudySessions, setWeekStudySessions] = useState<any[]>([]);
  const [weekSessionsLoading, setWeekSessionsLoading] = useState(false);
  const [timetableByDay, setTimetableByDay] = useState<Record<number, any[]>>({});

  const [weeklyTargetHours, setWeeklyTargetHours] = useState<string>('');
  const [subjectTargetHours, setSubjectTargetHours] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);

  const [logDialogOpen, setLogDialogOpen] = useState(false);
  const [logDate, setLogDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [daySessions, setDaySessions] = useState<any[]>([]);
  const [selectedDaySessionId, setSelectedDaySessionId] = useState<string>('');

  const [todayExpanded, setTodayExpanded] = useState(false);
  const [timetableHint, setTimetableHint] = useState<string>('');

  const getWeekIdentifier = (date: Date): string => {
    const year = date.getFullYear();
    const firstDayOfYear = new Date(year, 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    return `${year}-W${String(weekNumber).padStart(2, '0')}`;
  };

  const localIsoForDate = (yyyyMmDd: string, hhmm: string) => {
    const [y, mo, d] = (yyyyMmDd || '').split('-').map(Number);
    const [h, m] = (hhmm || '00:00').split(':').map(Number);
    const dt = new Date(y, (mo || 1) - 1, d || 1, h || 0, m || 0, 0, 0);
    return dt.toISOString();
  };

  const upcomingDeadlines = useMemo(() => {
    const now = Date.now();
    return assessments
      .filter((a) => !a.completed && a.dueDate && new Date(a.dueDate).getTime() >= now)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 5);
  }, [assessments]);

  const subjectTitleById = useMemo(() => {
    const m = new Map<string, string>();
    for (const s of subjects) m.set(s.id, s.title);
    return m;
  }, [subjects]);

  const todayUtc = new Date().toISOString().slice(0, 10);

  const computeDisplayStatus = (s: any) => {
    const st = String(s?.status || '').toLowerCase();
    if (st === 'planned') {
      try {
        const endMs = new Date(s?.end_at || s?.endAt).getTime();
        const startDay = new Date(s?.start_at || s?.startAt).toISOString().slice(0, 10);
        if (startDay === todayUtc && endMs < Date.now()) return 'missed';
      } catch {}
    }
    return st || 'planned';
  };

  const totalWeekSessions = useMemo(() => weekStudySessions.length, [weekStudySessions]);

  const totalWeekHours = useMemo(() => {
    let mins = 0;
    for (const s of weekStudySessions) {
      try {
        const start = new Date(s?.start_at || s?.startAt).getTime();
        const end = new Date(s?.end_at || s?.endAt).getTime();
        if (Number.isFinite(start) && Number.isFinite(end) && end > start) {
          mins += Math.round((end - start) / 60000);
        }
      } catch {}
    }
    return Math.round((mins / 60) * 10) / 10;
  }, [weekStudySessions]);

  const weekCounts = useMemo(() => {
    const c = { planned: 0, completed: 0, skipped: 0, missed: 0 };
    for (const s of weekStudySessions) {
      const ds = computeDisplayStatus(s) as keyof typeof c;
      if (ds in c) c[ds] += 1;
      else c.planned += 1;
    }
    return c;
  }, [weekStudySessions]);

  const todaySessions = useMemo(() => {
    return weekStudySessions
      .filter((s) => {
        try {
          return new Date(s?.start_at || s?.startAt).toISOString().slice(0, 10) === todayUtc;
        } catch {
          return false;
        }
      })
      .sort(
        (a, b) =>
          new Date(a?.start_at || a?.startAt).getTime() -
          new Date(b?.start_at || b?.startAt).getTime()
      );
  }, [weekStudySessions, todayUtc]);

  useEffect(() => {
    if (!userId) return;
    const unlocked = (summary?.achievements || []).map((a) => a.key).filter(Boolean);
    if (!unlocked.length) return;

    const storageKey = `lastSeenAchievements:${userId}`;
    let seen: string[] = [];
    try {
      seen = JSON.parse(localStorage.getItem(storageKey) || '[]');
      if (!Array.isArray(seen)) seen = [];
    } catch {
      seen = [];
    }

    const newOnes = unlocked.filter((k) => !seen.includes(k));
    if (newOnes.length) {
      for (const k of newOnes) {
        const a = summary?.achievements?.find((x) => x.key === k);
        if (a) {
          toast.success(t('goals.success.achievementUnlocked', { title: a.title }), {
            description: a.detail,
          });
        }
      }
      const merged = Array.from(new Set([...seen, ...unlocked]));
      localStorage.setItem(storageKey, JSON.stringify(merged));
    }
  }, [summary?.achievements, userId, t]);

  useEffect(() => {
    if (!API_BASE_URL || !userId) return;

    (async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${API_BASE_URL}/assessments?user_id=${encodeURIComponent(userId)}&include_completed=true&include_past=false`,
          { headers: { 'X-User-Id': userId } }
        );
        if (res.ok) {
          const data = await res.json();
          const rows = Array.isArray(data?.assessments) ? data.assessments : [];
          setAssessments(rows);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [API_BASE_URL, userId]);

  useEffect(() => {
    if (!API_BASE_URL || !userId) return;

    const load = async () => {
      try {
        const [sumRes, ttRes] = await Promise.all([
          fetch(`${API_BASE_URL}/goals/summary?user_id=${encodeURIComponent(userId)}`, {
            headers: { 'X-User-Id': userId },
          }),
          fetch(`${API_BASE_URL}/timetable/user/${encodeURIComponent(userId)}`, {
            headers: { 'X-User-Id': userId },
          }),
        ]);

        if (sumRes.ok) {
          const data = await sumRes.json();
          setSummary(data as GoalsSummary);
        }

        if (ttRes.ok) {
          const data = await ttRes.json();
          const timetable = data?.timetable || {};
          setTimetableByDay(timetable as any);
          const map = new Map<string, string>();
          Object.keys(timetable).forEach((k) => {
            const arr = Array.isArray(timetable[k]) ? timetable[k] : [];
            arr.forEach((m: any) => {
              const sid = String(m?.subject_id || '');
              const title = String(m?.subject_name || '').trim();
              if (sid && title) map.set(sid, title);
            });
          });
          const opts = Array.from(map.entries()).map(([id, title]) => ({ id, title }));
          setSubjects(opts);
          if (!selectedSubjectId && opts.length > 0) setSelectedSubjectId(opts[0].id);
        }
      } catch (e) {
        console.error(e);
      }
    };

    load();
  }, [API_BASE_URL, userId, selectedSubjectId]);

  const refreshSummary = async () => {
    if (!API_BASE_URL || !userId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/goals/summary?user_id=${encodeURIComponent(userId)}`, {
        headers: { 'X-User-Id': userId },
      });
      if (res.ok) {
        setSummary((await res.json()) as GoalsSummary);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadWeekStudySessions = async (periodStart?: string | null, periodEnd?: string | null) => {
    if (!API_BASE_URL || !userId || !periodStart || !periodEnd) {
      setWeekStudySessions([]);
      return;
    }
    setWeekSessionsLoading(true);
    try {
      const start = new Date(`${periodStart}T00:00:00Z`);
      const end = new Date(`${periodEnd}T00:00:00Z`);
      const days: string[] = [];
      for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
        days.push(d.toISOString().slice(0, 10));
      }

      const results = await Promise.all(
        days.map(async (day) => {
          const res = await fetch(
            `${API_BASE_URL}/sessions/by-day?user_id=${encodeURIComponent(userId)}&day=${encodeURIComponent(day)}`,
            { headers: { 'X-User-Id': userId } }
          );
          const rows = res.ok ? ((await res.json()) as any[]) : [];

          const getSlotsForDay = () => {
            try {
              const d = new Date(day.slice(0, 10));
              const weekId = getWeekIdentifier(d);
              const weekKey = getUserWeekKey(weekId);
              const raw = localStorage.getItem(weekKey);
              const parsed = raw ? JSON.parse(raw) : null;
              if (!Array.isArray(parsed)) return [];
              const localDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
              const dayIdx = (localDay.getDay() + 6) % 7;
              return parsed.filter((s: any) => {
                if (Number(s?.day) !== dayIdx) return false;
                const tt = String(s?.type || '').toLowerCase();
                if (tt === 'break' || tt === 'lecture') return false;
                return true;
              });
            } catch {
              return [];
            }
          };

          const slots = getSlotsForDay();
          if (!slots.length) {
            return (rows || []).filter((r) => String(r?.source || '') === 'timetable');
          }

          const slotWindows = slots.map((s: any) => {
            const startIso = localIsoForDate(day, String(s?.startTime || '00:00'));
            const endIso = localIsoForDate(day, String(s?.endTime || '00:00'));
            return {
              startMs: new Date(startIso).getTime(),
              endMs: new Date(endIso).getTime(),
              subject: String(s?.subject || '').trim(),
            };
          });

          const within = (a: number, b: number, tolMs: number) => Math.abs(a - b) <= tolMs;
          const TOL = 5 * 60 * 1000;

          let existing = (rows || []).filter((r) => String(r?.source || '') === 'timetable');
          existing = existing.filter((r) => {
            const rs = new Date(r?.start_at).getTime();
            const re = new Date(r?.end_at).getTime();
            return slotWindows.some((w) => within(rs, w.startMs, TOL) && within(re, w.endMs, TOL));
          });

          for (const w of slotWindows) {
            const hit = existing.some((r) => {
              const rs = new Date(r?.start_at).getTime();
              const re = new Date(r?.end_at).getTime();
              return within(rs, w.startMs, TOL) && within(re, w.endMs, TOL);
            });
            if (hit) continue;

            try {
              const createRes = await fetch(`${API_BASE_URL}/sessions/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
                body: JSON.stringify({
                  user_id: userId,
                  subject_id: null,
                  start_at: new Date(w.startMs).toISOString(),
                  end_at: new Date(w.endMs).toISOString(),
                  source: 'timetable',
                  notes: w.subject || 'Study',
                }),
              });
              if (createRes.ok) {
                const created = await createRes.json();
                existing.push(created);
              }
            } catch {}
          }

          for (const r of existing) {
            if (String(r?.notes || '').trim()) continue;
            const rs = new Date(r?.start_at).getTime();
            const re = new Date(r?.end_at).getTime();
            const w = slotWindows.find((w) => within(rs, w.startMs, TOL) && within(re, w.endMs, TOL));
            if (!w || !String(w.subject || '').trim()) continue;
            try {
              await fetch(`${API_BASE_URL}/sessions/${String(r?.id)}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
                body: JSON.stringify({ user_id: userId, notes: String(w.subject).trim() }),
              });
              r.notes = String(w.subject).trim();
            } catch {}
          }

          return existing;
        })
      );

      setWeekStudySessions(results.flat());
    } catch (e) {
      console.error(e);
      setWeekStudySessions([]);
    } finally {
      setWeekSessionsLoading(false);
    }
  };

  const patchSessionStatus = async (sessionId: string, nextStatus: 'completed' | 'skipped') => {
    if (!API_BASE_URL || !userId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
        body: JSON.stringify({ user_id: userId, status: nextStatus }),
      });
      if (!res.ok) {
        toast.error(t('goals.errors.updateSession'));
        return;
      }
      toast.success(
        nextStatus === 'completed'
          ? t('goals.success.sessionLogged')
          : t('goals.success.sessionSkipped')
      );
      await refreshSummary();
      await loadWeekStudySessions(summary?.period_start, summary?.period_end);
    } catch (e) {
      console.error(e);
      toast.error(t('goals.errors.updateSession'));
    }
  };

  useEffect(() => {
    if (!summary?.period_start || !summary?.period_end) return;
    loadWeekStudySessions(summary.period_start, summary.period_end);
  }, [summary?.period_start, summary?.period_end, userId]);

  const refreshDaySessions = async () => {
    if (!API_BASE_URL || !userId) return;
    setTimetableHint('');
    try {
      const [yy, mm, dd] = String(logDate || '').split('-').map(Number);
      const localDay = new Date(yy, (mm || 1) - 1, dd || 1, 0, 0, 0, 0);
      const weekId = getWeekIdentifier(localDay);
      const weekKey = getUserWeekKey(weekId);

      let timetableSlots: any[] = [];
      try {
        const raw = localStorage.getItem(weekKey);
        const parsed = raw ? JSON.parse(raw) : null;
        if (Array.isArray(parsed)) {
          const dayIdx = (localDay.getDay() + 6) % 7;
          timetableSlots = parsed.filter((s: any) => {
            if (Number(s?.day) !== dayIdx) return false;
            const tt = String(s?.type || '').toLowerCase();
            if (tt === 'break' || tt === 'lecture') return false;
            return true;
          });
        }
      } catch {
        timetableSlots = [];
      }

      if (timetableSlots.length === 0) {
        setTimetableHint(t('goals.hints.openTimetableFirst'));
      }

      const res = await fetch(
        `${API_BASE_URL}/sessions/by-day?user_id=${encodeURIComponent(userId)}&day=${encodeURIComponent(logDate)}`,
        { headers: { 'X-User-Id': userId } }
      );
      if (!res.ok) {
        setDaySessions([]);
        return;
      }
      const rows = (await res.json()) as any[];

      const backendSlots = (rows || []).filter((r) => String(r?.source || '') === 'timetable');

      const slotWindows = (timetableSlots || []).map((s: any) => {
        const startIso = localIsoForDate(logDate, String(s?.startTime || '00:00'));
        const endIso = localIsoForDate(logDate, String(s?.endTime || '00:00'));
        return {
          startMs: new Date(startIso).getTime(),
          endMs: new Date(endIso).getTime(),
          subject: String(s?.subject || '').trim(),
        };
      });

      const within = (a: number, b: number, tolMs: number) => Math.abs(a - b) <= tolMs;
      const TOL = 5 * 60 * 1000;

      const matched: any[] = [];
      for (const r of backendSlots) {
        const rs = new Date(r?.start_at).getTime();
        const re = new Date(r?.end_at).getTime();
        const w = slotWindows.find((w) => within(rs, w.startMs, TOL) && within(re, w.endMs, TOL));
        if (!w) continue;

        if (!String(r?.notes || '').trim() && String(w.subject || '').trim()) {
          try {
            await fetch(`${API_BASE_URL}/sessions/${String(r?.id)}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
              body: JSON.stringify({ user_id: userId, notes: String(w.subject).trim() }),
            });
            r.notes = String(w.subject).trim();
          } catch {}
        }

        matched.push(r);
      }

      const missing = slotWindows.filter((w) => {
        return !matched.some((r) => {
          const rs = new Date(r?.start_at).getTime();
          const re = new Date(r?.end_at).getTime();
          return within(rs, w.startMs, TOL) && within(re, w.endMs, TOL);
        });
      });

      const createdRows: any[] = [];
      for (const w of missing) {
        try {
          const createRes = await fetch(`${API_BASE_URL}/sessions/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
            body: JSON.stringify({
              user_id: userId,
              subject_id: null,
              start_at: new Date(w.startMs).toISOString(),
              end_at: new Date(w.endMs).toISOString(),
              source: 'timetable',
              notes: w.subject || 'Study',
            }),
          });
          if (createRes.ok) {
            const created = await createRes.json();
            createdRows.push(created);
          }
        } catch {}
      }

      const finalRows = [...matched, ...createdRows].sort(
        (a, b) => new Date(a?.start_at).getTime() - new Date(b?.start_at).getTime()
      );
      setDaySessions(finalRows);
    } catch (e) {
      console.error(e);
      setDaySessions([]);
    }
  };

  useEffect(() => {
    if (!logDialogOpen) return;
    refreshDaySessions();
  }, [logDialogOpen, logDate, API_BASE_URL, userId]);

  const saveGoal = async (subjectId: string | null, targetHoursStr: string) => {
    if (!API_BASE_URL || !userId) return;
    const th = parseFloat(String(targetHoursStr || '').trim());
    if (!Number.isFinite(th) || th <= 0) {
      toast.error(t('goals.errors.validTarget'));
      return;
    }
    if (!summary) {
      toast.error(t('goals.errors.summaryNotLoaded'));
      return;
    }

    try {
      const body = {
        user_id: userId,
        subject_id: subjectId,
        period_start: summary.period_start,
        period_end: summary.period_end,
        target_hours: th,
        weight: 3,
      };

      const weeklyAvailabilityHours = totalWeekHours;
      if (weeklyAvailabilityHours > 0 && th > weeklyAvailabilityHours + 1e-9) {
        toast.error(t('goals.errors.exceedsAvailability'), {
          description: t('goals.errors.exceedsAvailabilityDesc', {
            hours: weeklyAvailabilityHours,
          }),
        });
        return;
      }

      const currentGoals = summary?.goals || [];
      const overall = currentGoals.find((g) => !g.subject_id) || null;
      const subjectGoals = currentGoals.filter((g) => !!g.subject_id);

      if (subjectId) {
        if (overall && Number(overall.target_hours) > 0) {
          const overallHours = Number(overall.target_hours);
          const otherSubjectsTotal = subjectGoals
            .filter((g) => String(g.subject_id) !== String(subjectId))
            .reduce((acc, g) => acc + Number(g.target_hours || 0), 0);

          if (th > overallHours + 1e-9) {
            toast.error(t('goals.errors.subjectExceedsWeekly'), {
              description: t('goals.errors.subjectExceedsWeeklyDesc', {
                hours: overallHours,
              }),
            });
            return;
          }

          if (otherSubjectsTotal + th > overallHours + 1e-9) {
            toast.error(t('goals.errors.subjectGoalsExceedWeekly'), {
              description: t('goals.errors.subjectGoalsExceedWeeklyDesc', {
                otherHours: otherSubjectsTotal.toFixed(1),
                weeklyHours: overallHours,
              }),
            });
            return;
          }
        }
      } else {
        const subjectsTotal = subjectGoals.reduce((acc, g) => acc + Number(g.target_hours || 0), 0);
        if (subjectsTotal > 0 && subjectsTotal > th + 1e-9) {
          toast.error(t('goals.errors.weeklyTooLow'), {
            description: t('goals.errors.weeklyTooLowDesc', {
              hours: subjectsTotal.toFixed(1),
            }),
          });
          return;
        }
      }

      const res = await fetch(`${API_BASE_URL}/goals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        toast.error(t('goals.errors.saveGoal'));
        return;
      }

      toast.success(t('goals.success.goalSaved'));
      await refreshSummary();
    } catch (e) {
      console.error(e);
      toast.error(t('goals.errors.saveGoal'));
    }
  };

  const logCompletedSession = async () => {
    if (!API_BASE_URL || !userId) return;
    if (!selectedDaySessionId) {
      toast.error(t('goals.errors.selectSession'));
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    if (String(logDate) !== String(today)) {
      toast.error(t('goals.errors.todayOnly'));
      return;
    }

    const chosen = (daySessions || []).find((s) => String(s?.id || '') === String(selectedDaySessionId));
    if (!chosen) {
      toast.error(t('goals.errors.sessionNotFound'));
      return;
    }

    const displayStatus = computeDisplayStatus(chosen);
    if (displayStatus !== 'missed') {
      toast.error(t('goals.errors.onlyMissed'));
      return;
    }

    if (String(chosen?.status || '').toLowerCase() === 'skipped') {
      toast.error(t('goals.errors.skippedCannotComplete'));
      return;
    }

    await patchSessionStatus(String(selectedDaySessionId), 'completed');
    setLogDialogOpen(false);
    setSelectedDaySessionId('');
  };

  const completedHours = summary?.total_completed_hours ?? 0;
  const targetHours = summary?.total_target_hours ?? 0;
  const progressPct = targetHours > 0 ? Math.min(100, Math.round((completedHours / targetHours) * 100)) : 0;
  const weeklyGoal = summary?.goals?.find((g) => !g.subject_id) || null;

  return (
    <div className="max-w-8xl mx-auto space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-950 sm:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900">
                <Award className="h-5 w-5 text-neutral-700 dark:text-neutral-200" />
              </div>

              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-3xl">
                  {t('goals.title')}
                </h1>
                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                  {t('goals.subtitle')}
                </p>
              </div>
            </div>

            <Button
              variant="ghost"
              className="w-full rounded-2xl border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300 dark:hover:bg-neutral-900 dark:hover:text-neutral-100 md:w-auto"
              onClick={() => {
                if (onBack) onBack();
                else onNavigate?.('dashboard');
              }}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('goals.actions.back')}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card data-tour="goals-this-week" className="rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
                <Calendar className="h-5 w-5 text-blue-700" />
                {t('goals.thisWeek.title')}
              </CardTitle>
              <CardDescription>{t('goals.thisWeek.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 p-4 md:p-6">
              <div className="text-2xl font-bold text-white-700">{totalWeekSessions}</div>
              <div className="text-sm text-muted-foreground">{t('goals.thisWeek.sessions')}</div>
              <div className="pt-2">
                <Badge className="bg-white-100 text-white-700 border-white-200">
                  {t('goals.thisWeek.hours', { hours: totalWeekHours })}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {t('goals.thisWeek.tipPrefix')}{' '}
                <span className="font-medium">{t('goals.thisWeek.tipHighlight')}</span>{' '}
                {t('goals.thisWeek.tipSuffix')}
              </p>
            </CardContent>
          </Card>

          <Card data-tour="goals-upcoming-deadlines" className="rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
                <TrendingUp className="h-5 w-5 text-blue-700" />
                {t('goals.deadlines.title')}
              </CardTitle>
              <CardDescription className="text-neutral-500 dark:text-neutral-400">
                {t('goals.deadlines.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 p-4 md:p-6">
              {loading ? (
                <div className="rounded-2xl border border-dashed px-4 py-3 text-sm text-muted-foreground">
                  {t('common.loading')}
                </div>
              ) : upcomingDeadlines.length === 0 ? (
                <div className="rounded-2xl border border-dashed px-4 py-3 text-sm text-muted-foreground">
                  {t('goals.deadlines.empty')}
                </div>
              ) : (
                <div className="space-y-2">
                  {upcomingDeadlines.map((d) => (
                    <div key={d.id} className="rounded-2xl border bg-white p-3 shadow-sm">
                      <div className="font-medium break-words [overflow-wrap:anywhere]">{d.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {d.subject} • {t('goals.deadlines.due', { date: new Date(d.dueDate).toLocaleString() })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <Button
                variant="outline"
                onClick={() => onNavigate?.('assessments-deadlines')}
                className="w-full"
              >
                {t('goals.deadlines.manage')}
              </Button>
            </CardContent>
          </Card>

          <Card data-tour="goals-progress-streak" className="rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
                <Activity className="h-5 w-5 text-blue-700" />
                {t('goals.progress.title')}
              </CardTitle>
              <CardDescription className="text-neutral-500 dark:text-neutral-400">
                {t('goals.progress.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-4 md:p-6">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <div className="text-2xl font-bold text-white-700">{completedHours.toFixed(1)}h</div>
                  <div className="text-xs text-muted-foreground">{t('goals.progress.completed')}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">{t('goals.progress.target')}</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {targetHours > 0 ? `${targetHours}h` : '—'}
                  </div>
                </div>
              </div>

              <Progress
                value={progressPct}
                className="bg-neutral-200 dark:bg-neutral-800"
                indicatorColor="bg-neutral-900 dark:bg-neutral-100"
              />

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-1 text-sm text-neutral-700 dark:text-neutral-300">
                  <Flame className="h-4 w-4 text-black dark:text-white" />
                  {t('goals.progress.streak', { count: summary?.streak_days ?? 0 })}
                </div>
                <Badge
                  variant="outline"
                  className="border-neutral-200 bg-neutral-50 text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"
                >
                  {progressPct}%
                </Badge>
              </div>

              {summary?.achievements?.length ? (
                <div className="space-y-2">
                  {summary.achievements.slice(0, 2).map((a) => (
                    <div key={a.key} className="rounded-2xl border bg-white p-3">
                      <div className="flex items-center gap-2">
                        {(() => {
                          const Icon = ACHIEVEMENT_ICON[a.key] || CheckCircle2;
                          return <Icon className="h-4 w-4 text-neutral-700 dark:text-neutral-300" />;
                        })()}
                        <div className="font-medium text-sm">{a.title}</div>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">{a.detail}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed px-4 py-3 text-xs text-muted-foreground">
                  {t('goals.progress.tip')}
                </div>
              )}

              <div data-tour="goals-weekly-goals" className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Button variant="outline" onClick={() => setGoalDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" /> {t('goals.actions.setGoals')}
                </Button>
                <Button variant="outline" onClick={() => setLogDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" /> {t('goals.actions.logSession')}
                </Button>
              </div>

              <Dialog open={goalDialogOpen} onOpenChange={setGoalDialogOpen}>
                <DialogContent className="max-h-[90vh] w-[calc(100vw-1rem)] max-w-lg overflow-y-auto rounded-xl sm:w-full">
                  <DialogHeader>
                    <DialogTitle>{t('goals.goalDialog.title')}</DialogTitle>
                    <DialogDescription>{t('goals.goalDialog.description')}</DialogDescription>
                  </DialogHeader>

                  <div className="space-y-5">
                    <div className="space-y-2">
                      <Label>{t('goals.goalDialog.weeklyTarget')}</Label>
                      <Input
                        type="number"
                        min={0}
                        step={0.5}
                        placeholder={weeklyGoal ? String(weeklyGoal.target_hours) : t('goals.goalDialog.weeklyPlaceholder')}
                        value={weeklyTargetHours}
                        onChange={(e) => setWeeklyTargetHours(e.target.value)}
                        className="border-neutral-200 bg-white text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-neutral-300 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:placeholder:text-neutral-500"
                      />
                      <Button className="w-full" onClick={() => saveGoal(null, weeklyTargetHours)}>
                        {t('goals.goalDialog.saveWeekly')}
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label>{t('goals.goalDialog.subjectGoal')}</Label>
                      <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
                        <SelectTrigger className="border-neutral-200 bg-white text-neutral-900 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100">
                          <SelectValue placeholder={t('goals.goalDialog.selectSubject')} />
                        </SelectTrigger>
                        <SelectContent>
                          {subjects.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        min={0}
                        step={0.5}
                        placeholder={t('goals.goalDialog.subjectPlaceholder')}
                        value={subjectTargetHours}
                        onChange={(e) => setSubjectTargetHours(e.target.value)}
                        className="border-neutral-200 bg-white text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-neutral-300 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:placeholder:text-neutral-500"
                      />
                      <Button
                        variant="secondary"
                        className="w-full"
                        onClick={() => saveGoal(selectedSubjectId || null, subjectTargetHours)}
                        disabled={!selectedSubjectId}
                      >
                        {t('goals.goalDialog.saveSubject')}
                      </Button>
                    </div>

                    {summary?.goals?.length ? (
                      <div className="space-y-2">
                        <div className="text-sm font-medium">{t('goals.goalDialog.currentGoals')}</div>
                        <div className="space-y-2">
                          {summary.goals.map((g) => (
                            <div key={g.id} className="rounded-2xl border bg-white p-3 shadow-sm">
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <div className="font-medium text-sm">
                                  {g.subject_title || t('goals.goalDialog.overall')}
                                </div>
                                <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                                  {g.target_hours}h
                                </Badge>
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {g.period_start} → {g.period_end}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={logDialogOpen} onOpenChange={setLogDialogOpen}>
                <DialogContent className="max-h-[90vh] w-[calc(100vw-1rem)] max-w-lg overflow-y-auto rounded-xl sm:w-full">
                  <DialogHeader>
                    <DialogTitle>{t('goals.logDialog.title')}</DialogTitle>
                    <DialogDescription>{t('goals.logDialog.description')}</DialogDescription>
                  </DialogHeader>

                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>{t('goals.logDialog.date')}</Label>
                      <Input
                        type="date"
                        value={logDate}
                        onChange={(e) => {
                          setLogDate(e.target.value);
                          setSelectedDaySessionId('');
                        }}
                        className="border-neutral-200 bg-white text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-neutral-300 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:placeholder:text-neutral-500"
                      />
                      <p className="text-xs text-muted-foreground">
                        {t('goals.logDialog.hint')}
                      </p>
                      {timetableHint ? (
                        <p className="rounded-2xl border border-blue-200 bg-blue-50 p-2 text-xs text-blue-700">
                          {timetableHint}
                        </p>
                      ) : null}
                    </div>

                    <div className="space-y-2">
                      <Label>{t('goals.logDialog.sessions')}</Label>
                      <Select value={selectedDaySessionId} onValueChange={setSelectedDaySessionId}>
                        <SelectTrigger className="border-neutral-200 bg-white text-neutral-900 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100">
                          <SelectValue
                            placeholder={
                              daySessions.some((s) => computeDisplayStatus(s) === 'missed')
                                ? t('goals.logDialog.selectMissed')
                                : t('goals.logDialog.noMissed')
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {(daySessions || [])
                            .filter((s) => computeDisplayStatus(s) === 'missed')
                            .map((s) => {
                              const st = new Date(String(s.start_at)).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              });
                              const en = new Date(String(s.end_at)).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              });
                              const subj = s.subject_id
                                ? subjectTitleById.get(String(s.subject_id)) || t('goals.common.subject')
                                : String(s?.notes || '').trim() || t('goals.common.study');
                              const label = `${st}–${en} • ${subj} • ${t('goals.common.missed')}`;
                              return (
                                <SelectItem key={String(s.id)} value={String(s.id)}>
                                  {label}
                                </SelectItem>
                              );
                            })}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        {t('goals.logDialog.onlyMissedHint')}
                      </p>
                    </div>

                    <Button className="w-full" onClick={logCompletedSession} disabled={!selectedDaySessionId}>
                      {t('goals.logDialog.logSelected')}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>

        <Card data-tour="goals-today-session" className="rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900">
                  <Calendar className="h-4 w-4 text-neutral-700 dark:text-neutral-300" />
                </div>
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTodayExpanded((v) => !v)}
                className="text-gray-700"
              >
                {todayExpanded ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-1" /> {t('goals.actions.collapse')}
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-1" /> {t('goals.actions.expand')}
                  </>
                )}
              </Button>
            </div>
            <CardDescription className="text-neutral-500 dark:text-neutral-400">
              {t('goals.todayPanel.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-4 md:p-6">
            <div className="text-xs text-muted-foreground">
              {t('goals.todayPanel.weekTotals', {
                completed: weekCounts.completed,
                skipped: weekCounts.skipped,
                missed: weekCounts.missed,
                planned: weekCounts.planned,
              })}
            </div>

            {!todayExpanded ? (
              <div className="rounded-2xl border border-dashed px-4 py-3 text-sm text-muted-foreground">
                {t('goals.todayPanel.hidden')}
              </div>
            ) : weekSessionsLoading ? (
              <div className="rounded-2xl border border-dashed px-4 py-3 text-sm text-muted-foreground">
                {t('common.loading')}
              </div>
            ) : todaySessions.length === 0 ? (
              <div className="rounded-2xl border border-dashed px-4 py-3 text-sm text-muted-foreground">
                {t('goals.todayPanel.empty')}
              </div>
            ) : (
              <div className="space-y-2">
                {todaySessions.map((s) => {
                  const status = computeDisplayStatus(s);
                  const st = new Date(String(s.start_at)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const en = new Date(String(s.end_at)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const subj = s.subject_id
                    ? subjectTitleById.get(String(s.subject_id)) || t('goals.common.subject')
                    : String(s?.notes || '').trim() || t('goals.common.study');

                  const cur = String(s?.status || '').toLowerCase();
                  const canSkip = cur === 'planned' && status !== 'missed';
                  const canComplete = status === 'missed' && (cur === 'planned' || cur === 'missed');

                  return (
                    <div className="rounded-xl border border-neutral-200 bg-white p-3 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
                      <div className="flex flex-col gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
                            {st}–{en} • {subj}
                          </div>
                          <div className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                            {t('goals.todayPanel.status')}: {status}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            variant="outline"
                            className="border-neutral-200 bg-neutral-50 text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"
                          >
                            {status}
                          </Badge>

                          {canComplete ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-2xl border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300 dark:hover:bg-neutral-900"
                              onClick={() => patchSessionStatus(String(s.id), 'completed')}
                            >
                              {t('goals.actions.markCompleted')}
                            </Button>
                          ) : null}

                          {canSkip ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-2xl border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300 dark:hover:bg-neutral-900"
                              onClick={() => patchSessionStatus(String(s.id), 'skipped')}
                            >
                              {t('goals.actions.skip')}
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <ProgressTracking />
      </div>
    </div>
  );
}
