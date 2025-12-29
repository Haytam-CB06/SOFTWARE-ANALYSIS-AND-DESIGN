import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ArrowLeft, Award, Calendar, Target, TrendingUp, Flame, Plus, CheckCircle2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import ProgressTracking from './ProgressTracking';
import { getWeekIdentifier } from '../src/utils/dateUtils';
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

export default function GoalsAchievements({ onNavigate }: GoalsAchievementsProps) {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const userId = localStorage.getItem('currentUserId') || '';

  const weekId = useMemo(() => getWeekIdentifier(new Date()), []);
  const weekKey = useMemo(() => getUserWeekKey(weekId), [weekId]);

  const [assessments, setAssessments] = useState<BackendAssessment[]>([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<GoalsSummary | null>(null);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);

  // Goal creation inputs
  const [weeklyTargetHours, setWeeklyTargetHours] = useState<string>('');
  const [subjectTargetHours, setSubjectTargetHours] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);

  // Log a completed session (simple)
  const [logDialogOpen, setLogDialogOpen] = useState(false);
  const [logSubjectId, setLogSubjectId] = useState<string>('');
  const [logDate, setLogDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [logStartTime, setLogStartTime] = useState('18:00');
  const [logDurationMin, setLogDurationMin] = useState<string>('60');

  const weekSessions = useMemo(() => {
    try {
      const raw = localStorage.getItem(weekKey);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [weekKey]);

  const totalWeekSessions = weekSessions.length;
  const totalWeekHours = useMemo(() => {
    const toMin = (t: string) => {
      const [hh, mm] = String(t || '0:0').split(':').map((x) => parseInt(x, 10));
      return (Number.isFinite(hh) ? hh : 0) * 60 + (Number.isFinite(mm) ? mm : 0);
    };
    let mins = 0;
    for (const s of weekSessions) {
      if (!s?.startTime || !s?.endTime) continue;
      mins += Math.max(0, toMin(s.endTime) - toMin(s.startTime));
    }
    return Math.round((mins / 60) * 10) / 10;
  }, [weekSessions]);

  const upcomingDeadlines = useMemo(() => {
    const now = Date.now();
    return assessments
      .filter((a) => !a.completed && a.dueDate && new Date(a.dueDate).getTime() >= now)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 5);
  }, [assessments]);

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
          if (!logSubjectId && opts.length > 0) setLogSubjectId(opts[0].id);
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
    const durMin = parseInt(String(logDurationMin || '').trim(), 10);
    if (!Number.isFinite(durMin) || durMin <= 0) {
      toast.error('Enter a valid duration (minutes)');
      return;
    }
    if (!logSubjectId) {
      toast.error('Select a subject');
      return;
    }
    try {
      const startIso = `${logDate}T${logStartTime}:00Z`;
      const start = new Date(startIso);
      const end = new Date(start.getTime() + durMin * 60 * 1000);
      const body = {
        user_id: userId,
        subject_id: logSubjectId,
        start_at: start.toISOString(),
        end_at: end.toISOString(),
        source: 'manual',
      };
      const res = await fetch(`${API_BASE_URL}/sessions/completed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const msg = await res.text();
        toast.error('Could not log session', { description: msg });
        return;
      }
      toast.success('Session logged');
      setLogDialogOpen(false);
      await refreshSummary();
    } catch (e) {
      console.error(e);
      toast.error('Could not log session');
    }
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
            <Target className="w-4 h-4" /> Weekly progress • Deadline awareness • Personal milestones
          </div>
        </div>

        {/* Quick overview cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Calendar className="h-5 w-5 text-blue-600" />
                This Week
              </CardTitle>
              <CardDescription>What’s scheduled (from My Timetable)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-2xl font-bold text-blue-700">{totalWeekSessions}</div>
              <div className="text-sm text-muted-foreground">sessions</div>
              <div className="pt-2">
                <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                  ~{totalWeekHours} hours
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Tip: If this looks empty, open <span className="font-medium">My Timetable</span> once to load the current week.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Upcoming Deadlines
              </CardTitle>
              <CardDescription>From Assessments &amp; Deadlines</CardDescription>
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

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Target className="h-5 w-5 text-purple-600" />
                Progress &amp; Streak
              </CardTitle>
              <CardDescription>From your completed sessions (backend)</CardDescription>
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

              <Progress value={progressPct} />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-sm text-orange-700">
                  <Flame className="h-4 w-4" /> {summary?.streak_days ?? 0}-day streak
                </div>
                <Badge className="bg-purple-100 text-purple-700 border-purple-200">{progressPct}%</Badge>
              </div>

              {summary?.achievements?.length ? (
                <div className="space-y-2">
                  {summary.achievements.slice(0, 2).map((a) => (
                    <div key={a.key} className="rounded-lg border bg-white p-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
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

              <div className="grid grid-cols-2 gap-2">
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
                      Weekly goals are stored in the backend and used for achievements and summaries.
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
                      <Label>Subject</Label>
                      <Select value={logSubjectId} onValueChange={setLogSubjectId}>
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
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-2 col-span-2">
                        <Label>Date</Label>
                        <Input type="date" value={logDate} onChange={(e) => setLogDate(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Start</Label>
                        <Input type="time" value={logStartTime} onChange={(e) => setLogStartTime(e.target.value)} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Duration (minutes)</Label>
                      <Input
                        type="number"
                        min={10}
                        step={5}
                        value={logDurationMin}
                        onChange={(e) => setLogDurationMin(e.target.value)}
                      />
                    </div>

                    <Button className="w-full" onClick={logCompletedSession}>
                      Log completed session
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>

        {/* Detailed tracking (existing component) */}
        <ProgressTracking />
      </div>
    </div>
  );
}
