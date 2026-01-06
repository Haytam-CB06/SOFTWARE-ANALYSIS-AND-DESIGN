import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ArrowLeft, Award, Calendar, Flag, Activity, TrendingUp, Flame, Plus, CheckCircle2, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import ProgressTracking from './ProgressTracking';
import { getUserWeekKey } from '../utils/userStorage';

interface GoalsAchievementsProps {
  onNavigate?: (page: string) => void;
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


export default function GoalsAchievements({ onNavigate }: GoalsAchievementsProps) {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const userId = localStorage.getItem('currentUserId') || '';
  const tzOffsetMinutes = new Date().getTimezoneOffset();


  const [assessments, setAssessments] = useState<BackendAssessment[]>([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<GoalsSummary | null>(null);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);

  // Study sessions from backend (source of truth for scheduled/completed/skipped/missed)
  const [weekStudySessions, setWeekStudySessions] = useState<any[]>([]);
  const [weekSessionsLoading, setWeekSessionsLoading] = useState(false);
  const [timetableByDay, setTimetableByDay] = useState<Record<number, any[]>>({});


  // Goal creation inputs
  const [weeklyTargetHours, setWeeklyTargetHours] = useState<string>('');
  const [subjectTargetHours, setSubjectTargetHours] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);

  // Log a completed session (simple)
  const [logDialogOpen, setLogDialogOpen] = useState(false);
  const [logDate, setLogDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [daySessions, setDaySessions] = useState<any[]>([]);
  const [selectedDaySessionId, setSelectedDaySessionId] = useState<string>('');

  // Today’s sessions panel (collapsed by default)
  const [todayExpanded, setTodayExpanded] = useState(false);

  // If the current week timetable isn't loaded (user never opened My Timetable), show a hint.
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
      .sort((a, b) => new Date(a?.start_at || a?.startAt).getTime() - new Date(b?.start_at || b?.startAt).getTime());
  }, [weekStudySessions, todayUtc]);


  
  useEffect(() => {
    if (!userId) return;
    const unlocked = (summary?.achievements || []).map((a) => a.key).filter(Boolean);
    if (!unlocked.length) return;

    const storageKey = `lastSeenAchievements:${userId}`;
    let seen: string[] = [];
    try {
      seen = JSON.parse(localStorage.getItem(storageKey) || "[]");
      if (!Array.isArray(seen)) seen = [];
    } catch {
      seen = [];
    }

    const newOnes = unlocked.filter((k) => !seen.includes(k));
    if (newOnes.length) {
      for (const k of newOnes) {
        const a = summary?.achievements?.find((x) => x.key === k);
        if (a) {
          toast.success(`Achievement unlocked: ${a.title}`, { description: a.detail });
        }
      }
      const merged = Array.from(new Set([...seen, ...unlocked]));
      localStorage.setItem(storageKey, JSON.stringify(merged));
    }
  }, [summary?.achievements, userId]);

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

  // Load goals summary + subjects (from backend timetable)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [API_BASE_URL, userId]);

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
          // 1) Load existing StudySession rows for that day
          const res = await fetch(
            `${API_BASE_URL}/sessions/by-day?user_id=${encodeURIComponent(userId)}&day=${encodeURIComponent(day)}`,
            { headers: { 'X-User-Id': userId } }
          );
          const rows = res.ok ? ((await res.json()) as any[]) : [];

          // Source of truth for what counts on this page:
          // the user's CURRENT "My Timetable" (localStorage weekKey), not Auto-Generate or class/busy blocks.
          const getSlotsForDay = () => {
            try {
              const d = new Date(day.slice(0, 10));
              const weekId = getWeekIdentifier(d);
              const weekKey = getUserWeekKey(weekId);
              const raw = localStorage.getItem(weekKey);
              const parsed = raw ? JSON.parse(raw) : null;
              if (!Array.isArray(parsed)) return [];
              const localDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
              const dayIdx = (localDay.getDay() + 6) % 7; // Monday=0
              return parsed.filter((s: any) => {
                if (Number(s?.day) !== dayIdx) return false;
                const t = String(s?.type || '').toLowerCase();
                // Ignore non-study placeholders: breaks + blocked times
                if (t === 'break' || t === 'lecture') return false;
                return true;
              });
            } catch {
              return [];
            }
          };

          const slots = getSlotsForDay();
          if (!slots.length) {
            // If user never loaded My Timetable locally, we can't safely create/compare.
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

          // 1) Keep ONLY backend sessions that match today's current timetable slots.
          let existing = (rows || []).filter((r) => String(r?.source || '') === 'timetable');
          existing = existing.filter((r) => {
            const rs = new Date(r?.start_at).getTime();
            const re = new Date(r?.end_at).getTime();
            return slotWindows.some((w) => within(rs, w.startMs, TOL) && within(re, w.endMs, TOL));
          });

          // 2) Ensure planned rows exist for missing timetable slots (so Goals can track skipped/missed/completed)
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
            } catch {
              // best effort
            }
          }

          // 3) Backfill missing label from timetable slot (best-effort)
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
            } catch {
              // best effort
            }
          }

          return existing;
        })
      );

      const merged = results.flat();
      setWeekStudySessions(merged);
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
        const msg = await res.text();
        toast.error('Could not update session', { description: msg });
        return;
      }
      toast.success(nextStatus === 'completed' ? 'Session logged' : 'Session skipped');
      await refreshSummary();
      await loadWeekStudySessions(summary?.period_start, summary?.period_end);
    } catch (e) {
      console.error(e);
      toast.error('Could not update session');
    }
  };



  useEffect(() => {
    if (!summary?.period_start || !summary?.period_end) return;
    loadWeekStudySessions(summary.period_start, summary.period_end);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summary?.period_start, summary?.period_end, userId]);

  const refreshDaySessions = async () => {
    if (!API_BASE_URL || !userId) return;
    setTimetableHint('');
    try {
      // 1) Load the *current* My Timetable (local) sessions for that date.
      const [yy, mm, dd] = String(logDate || '').split('-').map(Number);
      const localDay = new Date(yy, (mm || 1) - 1, dd || 1, 0, 0, 0, 0);
      const weekId = getWeekIdentifier(localDay);
      const weekKey = getUserWeekKey(weekId);

      let timetableSlots: any[] = [];
      try {
        const raw = localStorage.getItem(weekKey);
        const parsed = raw ? JSON.parse(raw) : null;
        if (Array.isArray(parsed)) {
          const dayIdx = (localDay.getDay() + 6) % 7; // Monday=0
          timetableSlots = parsed.filter((s: any) => {
            if (Number(s?.day) !== dayIdx) return false;
            const t = String(s?.type || '').toLowerCase();
            // Ignore non-study placeholders: breaks + blocked times
            if (t === 'break' || t === 'lecture') return false;
            return true;
          });
        }
      } catch {
        timetableSlots = [];
      }

      if (timetableSlots.length === 0) {
        setTimetableHint('Tip: Open “My Timetable” once so this week loads, then return here.');
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

      // 2) Only show sessions that map to the current “My Timetable” slots for that day.
      // This explicitly ignores Auto-Generate / placeholders.
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

        // Backfill missing display name from the timetable slot.
        if (!String(r?.notes || '').trim() && String(w.subject || '').trim()) {
          try {
            await fetch(`${API_BASE_URL}/sessions/${String(r?.id)}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
              body: JSON.stringify({ user_id: userId, notes: String(w.subject).trim() }),
            });
            r.notes = String(w.subject).trim();
          } catch {
            // best effort
          }
        }

        matched.push(r);
      }

      // 3) If timetable slots exist but the backend doesn't have rows yet, create them.
      // This keeps Goals logging consistent without depending on other pages.
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
        } catch {
          // best effort
        }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logDialogOpen, logDate, API_BASE_URL, userId]);

  const saveGoal = async (subjectId: string | null, targetHoursStr: string) => {
    if (!API_BASE_URL || !userId) return;
    const th = parseFloat(String(targetHoursStr || '').trim());
    if (!Number.isFinite(th) || th <= 0) {
      toast.error('Please enter a valid target hours number');
      return;
    }
    if (!summary) {
      toast.error('Summary not loaded yet');
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
        toast.error('Goal exceeds weekly availability', {
          description: `You only have about ${weeklyAvailabilityHours}h available this week based on your timetable.`,
        });
        return;
      }

      // Enforce that subject-specific goals are "within" the overall weekly goal (exclusive, not additive).
      // i.e., subject goals must fit inside the overall goal, not on top of it.
      const currentGoals = summary?.goals || [];
      const overall = currentGoals.find((g) => !g.subject_id) || null;
      const subjectGoals = currentGoals.filter((g) => !!g.subject_id);

      if (subjectId) {
        // If there is an overall goal, subject goals must not exceed it.
        if (overall && Number(overall.target_hours) > 0) {
          const overallHours = Number(overall.target_hours);
          const otherSubjectsTotal = subjectGoals
          .filter((g) => String(g.subject_id) !== String(subjectId))
          .reduce((acc, g) => acc + Number(g.target_hours || 0), 0);

          if (th > overallHours + 1e-9) {
            toast.error('Subject goal exceeds weekly goal', {
              description: `Your overall weekly goal is ${overallHours}h. Subject goals must fit within it.`,
            });
            return;
          }

          if (otherSubjectsTotal + th > overallHours + 1e-9) {
            toast.error('Subject goals exceed weekly goal', {
              description: `Your other subject goals total ${otherSubjectsTotal.toFixed(1)}h. With this, you'd exceed your weekly goal of ${overallHours}h.`,
            });
            return;
          }
        }
      } else {
        // Saving an overall goal. If subject goals already exist, ensure they still fit.
        const subjectsTotal = subjectGoals.reduce((acc, g) => acc + Number(g.target_hours || 0), 0);
        if (subjectsTotal > 0 && subjectsTotal > th + 1e-9) {
          toast.error('Weekly goal is too low', {
            description: `Your subject goals already total ${subjectsTotal.toFixed(1)}h. Increase your weekly goal or reduce subject goals.`,
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
        const msg = await res.text();
        toast.error('Could not save goal', { description: msg });
        return;
      }
      toast.success('Goal saved');
      await refreshSummary();
    } catch (e) {
      console.error(e);
      toast.error('Could not save goal');
    }
  };

  const logCompletedSession = async () => {
    if (!API_BASE_URL || !userId) return;
    if (!selectedDaySessionId) {
      toast.error('Select a session');
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    if (String(logDate) != String(today)) {
      toast.error('You can only log missed sessions for today.');
      return;
    }

    const chosen = (daySessions || []).find((s) => String(s?.id || '') === String(selectedDaySessionId));
    if (!chosen) {
      toast.error('Session not found');
      return;
    }

    const displayStatus = computeDisplayStatus(chosen);
    if (displayStatus !== 'missed') {
      toast.error('Only missed sessions can be marked completed manually (same day).');
      return;
    }

    if (String(chosen?.status || '').toLowerCase() === 'skipped') {
      toast.error('Skipped sessions cannot be marked completed.');
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
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="bg-blue-600 rounded-2xl p-8 text-white shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Award className="w-10 h-10" />
              <div>
                <h1 className="text-3xl font-bold">Goals &amp; Achievements</h1>
                <p className="text-blue-100">
                  Set targets, track progress, and celebrate consistency.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 w-full md:w-auto">
              <Button
                variant="secondary"
                className="bg-white/10 hover:bg-white/20 text-white border-white/20"
                onClick={() => onNavigate?.('dashboard')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 text-blue-100 text-sm">
            <Award className="w-4 h-4" /> Weekly progress • Deadline awareness • Personal milestones
          </div>
        </div>

        {/* Quick overview cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card data-tour="goals-this-week" className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Calendar className="h-5 w-5 text-purple-600" />
                This Week
              </CardTitle>
              <CardDescription>What’s scheduled (from My Timetable)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-2xl font-bold text-purple-700">{totalWeekSessions}</div>
              <div className="text-sm text-muted-foreground">sessions</div>
              <div className="pt-2">
                <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                  ~{totalWeekHours} hours
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Tip: If this looks empty, open <span className="font-medium">My Timetable</span> once to load the current week.
              </p>
            </CardContent>
          </Card>

          <Card data-tour="goals-upcoming-deadlines" className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                Upcoming Deadlines
              </CardTitle>
              <CardDescription>From Assessments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <div className="text-sm text-muted-foreground">Loading…</div>
              ) : upcomingDeadlines.length === 0 ? (
                <div className="text-sm text-muted-foreground">No upcoming deadlines</div>
              ) : (
                <div className="space-y-2">
                  {upcomingDeadlines.map((d) => (
                    <div key={d.id} className="rounded-lg border bg-white p-3">
                      <div className="font-medium truncate">{d.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {d.subject} • Due {new Date(d.dueDate).toLocaleString()}
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
                Manage deadlines
              </Button>
            </CardContent>
          </Card>

          <Card data-tour="goals-progress-streak" className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Activity className="h-5 w-5 text-purple-600" />
                Progress &amp; Streak
              </CardTitle>
              <CardDescription>From your completed sessions </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <div className="text-2xl font-bold text-purple-700">{completedHours.toFixed(1)}h</div>
                  <div className="text-xs text-muted-foreground">completed</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">target</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {targetHours > 0 ? `${targetHours}h` : '—'}
                  </div>
                </div>
              </div>

              <Progress value={progressPct} className="bg-blue-100" indicatorColor="bg-blue-600" />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-sm text-purple-700">
                  <Flame className="h-4 w-4 text-purple-600" /> {summary?.streak_days ?? 0}-day streak
                </div>
                <Badge className="bg-purple-100 text-purple-700 border-purple-200">{progressPct}%</Badge>
              </div>

              {summary?.achievements?.length ? (
                <div className="space-y-2">
                  {summary.achievements.slice(0, 2).map((a) => (
                    <div key={a.key} className="rounded-lg border bg-white p-3">
                      <div className="flex items-center gap-2">
                        {(() => { const Icon = ACHIEVEMENT_ICON[a.key] || CheckCircle2; return <Icon className="h-4 w-4 text-green-600" />; })()}
                        <div className="font-medium text-sm">{a.title}</div>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">{a.detail}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground">
                  Tip: use “Log Session” below to start building achievements.
                </div>
              )}

              <div data-tour="goals-weekly-goals" className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => setGoalDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" /> Set goals
                </Button>
                <Button variant="outline" onClick={() => setLogDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" /> Log session
                </Button>
              </div>

              {/* Set goals dialog */}
              <Dialog open={goalDialogOpen} onOpenChange={setGoalDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Set goals for this week</DialogTitle>
                    <DialogDescription>
                      Weekly goals.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-5">
                    <div className="space-y-2">
                      <Label>Weekly target hours</Label>
                      <Input
                        type="number"
                        min={0}
                        step={0.5}
                        placeholder={weeklyGoal ? String(weeklyGoal.target_hours) : 'e.g. 8'}
                        value={weeklyTargetHours}
                        onChange={(e) => setWeeklyTargetHours(e.target.value)}
                      />
                      <Button className="w-full" onClick={() => saveGoal(null, weeklyTargetHours)}>
                        Save weekly goal
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label>Subject-specific goal (optional)</Label>
                      <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a subject" />
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
                        placeholder="e.g. 3"
                        value={subjectTargetHours}
                        onChange={(e) => setSubjectTargetHours(e.target.value)}
                      />
                      <Button
                        variant="secondary"
                        className="w-full"
                        onClick={() => saveGoal(selectedSubjectId || null, subjectTargetHours)}
                        disabled={!selectedSubjectId}
                      >
                        Save subject goal
                      </Button>
                    </div>

                    {summary?.goals?.length ? (
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Current goals</div>
                        <div className="space-y-2">
                          {summary.goals.map((g) => (
                            <div key={g.id} className="rounded-lg border p-3">
                              <div className="flex items-center justify-between">
                                <div className="font-medium text-sm">
                                  {g.subject_title || 'Overall'}
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

              {/* Log completed session dialog */}
              <Dialog open={logDialogOpen} onOpenChange={setLogDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Log a completed study session</DialogTitle>
                    <DialogDescription>
                      This updates your backend streak and completed hours.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Input
                        type="date"
                        value={logDate}
                        onChange={(e) => {
                          setLogDate(e.target.value);
                          setSelectedDaySessionId('');
                        }}
                      />
                      <p className="text-xs text-muted-foreground">
                        You can only log sessions that exist on your current “My Timetable” for that day. Unlogged sessions become missed after midnight.
                      </p>
                      {timetableHint ? (
                        <p className="text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded-md p-2">
                          {timetableHint}
                        </p>
                      ) : null}
                    </div>

                    <div className="space-y-2">
                      <Label>Timetable sessions</Label>
                      <Select value={selectedDaySessionId} onValueChange={setSelectedDaySessionId}>
                        <SelectTrigger>
                          <SelectValue placeholder={daySessions.some((s) => computeDisplayStatus(s) === 'missed') ? 'Select a missed session' : 'No missed sessions for this day'} />
                        </SelectTrigger>
                        <SelectContent>
                          {(daySessions || [])
                            .filter((s) => computeDisplayStatus(s) === 'missed')
                            .map((s) => {
                              const st = new Date(String(s.start_at)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                              const en = new Date(String(s.end_at)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                              const subj = s.subject_id ? (subjectTitleById.get(String(s.subject_id)) || 'Subject') : (String(s?.notes || '').trim() || 'Study');
                              const label = `${st}–${en} • ${subj} • missed`;
                              return (
                                <SelectItem key={String(s.id)} value={String(s.id)}>
                                  {label}
                                </SelectItem>
                              );
                            })}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Only missed sessions for today (from your current “My Timetable”) are shown here.
                      </p>
                    </div>

                    <Button className="w-full" onClick={logCompletedSession} disabled={!selectedDaySessionId}>
                      Log selected session
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>

        {/* Today sessions (skip / missed / complete) */}
        <Card data-tour="goals-today-session" className="border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Calendar className="h-5 w-5 text-blue-600" /> Today’s sessions
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTodayExpanded((v) => !v)}
                className="text-gray-700"
              >
                {todayExpanded ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-1" /> Collapse
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-1" /> Expand
                  </>
                )}
              </Button>
            </div>
            <CardDescription>
              Backend-tracked slots from your timetable. Skipped cannot be marked completed.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-xs text-muted-foreground">
              Week totals: {weekCounts.completed} completed • {weekCounts.skipped} skipped • {weekCounts.missed} missed • {weekCounts.planned} planned
            </div>

            {!todayExpanded ? (
              <div className="text-sm text-muted-foreground">
                Hidden. Click “Expand” to view and manage today’s sessions.
              </div>
            ) : weekSessionsLoading ? (
              <div className="text-sm text-muted-foreground">Loading…</div>
            ) : todaySessions.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                No timetable sessions found for today.
              </div>
            ) : (
              <div className="space-y-2">
                {todaySessions.map((s) => {
                  const status = computeDisplayStatus(s);
                  const st = new Date(String(s.start_at)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const en = new Date(String(s.end_at)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const subj = s.subject_id ? (subjectTitleById.get(String(s.subject_id)) || 'Subject') : (String(s?.notes || '').trim() || 'Study');

                  const cur = String(s?.status || '').toLowerCase();
                  const canSkip = cur === 'planned' && status !== 'missed';
                  // Same-day rule: missed sessions can still be marked completed,
                  // but skipped can never be completed.
                  const canComplete = status === 'missed' && (cur === 'planned' || cur === 'missed');

                  return (
                    <div key={String(s.id)} className="flex items-center justify-between gap-3 rounded-lg border bg-white p-3">
                      <div className="min-w-0">
                        <div className="font-medium truncate">{st}–{en} • {subj}</div>
                        <div className="text-xs text-muted-foreground">Status: {status}</div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge variant="secondary">{status}</Badge>
                        {canComplete ? (
                          <Button size="sm" onClick={() => patchSessionStatus(String(s.id), 'completed')}>
                            Mark completed
                          </Button>
                        ) : null}
                        {canSkip ? (
                          <Button size="sm" variant="outline" onClick={() => patchSessionStatus(String(s.id), 'skipped')}>
                            Skip
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>


        {/* Detailed tracking (existing component) */}
        <ProgressTracking />
      </div>
    </div>
  );
}
