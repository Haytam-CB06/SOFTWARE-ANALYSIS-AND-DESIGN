import { useEffect, useMemo, useState } from 'react';
import { Award, Calendar, Clock, Flame, RefreshCw, Flag, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { toast } from 'sonner';

interface GoalsSummary {
  period_start: string;
  period_end: string;
  total_target_hours: number;
  total_completed_hours: number;
  streak_days: number;
  completed_tasks: number;
  upcoming_deadlines: Array<{ id: string; title: string; type: string; dueDate: string; subject: string }>;
  achievements: Array<{ key: string; title: string; detail: string; unlocked_at?: string | null }>;
}

const ACHIEVEMENT_ICON: Record<string, any> = {
  weekly_goal: Flag,
  streak_3: Flame,
  streak_7: Flame,
  tasks_3: Calendar,
  hours_10_week: Clock,
};

interface UserAchievement {
  code: string;
  title: string;
  description: string;
  points: number;
  unlocked_at?: string | null;
}

export default function ProgressTracking() {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const userId = localStorage.getItem('currentUserId') || '';
  const tzOffsetMinutes = new Date().getTimezoneOffset();

  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<GoalsSummary | null>(null);
  const [myAchievements, setMyAchievements] = useState<UserAchievement[]>([]);

  const pct = useMemo(() => {
    const done = summary?.total_completed_hours ?? 0;
    const target = summary?.total_target_hours ?? 0;
    if (!target || target <= 0) return 0;
    return Math.min(100, Math.round((done / target) * 100));
  }, [summary]);

  const load = async () => {
    if (!API_BASE_URL || !userId) return;
    setLoading(true);
    try {
      const [sumRes, achRes] = await Promise.all([
        fetch(
          `${API_BASE_URL}/goals/summary?user_id=${encodeURIComponent(userId)}&tz_offset_minutes=${encodeURIComponent(
            String(tzOffsetMinutes)
          )}`,
          { headers: { 'X-User-Id': userId } }
        ),
        fetch(`${API_BASE_URL}/achievements/me?user_id=${encodeURIComponent(userId)}`, {
          headers: { 'X-User-Id': userId },
        }),
      ]);

      if (!sumRes.ok) throw new Error('Failed to load progress summary');
      const sumData = await sumRes.json();
      setSummary(sumData as GoalsSummary);

      if (achRes.ok) {
        const achData = await achRes.json();
        const rows = Array.isArray(achData?.achievements) ? achData.achievements : [];
        setMyAchievements(rows);
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || 'Failed to load progress');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userId) return;

    const unlockedKeys = [
      ...((summary?.achievements || []).map((a) => a.key).filter(Boolean)),
            ...((myAchievements || []).map((a) => a.code).filter(Boolean)),
    ];
    if (!unlockedKeys.length) return;

    const storageKey = `lastSeenAchievements:${userId}`;
    let seen: string[] = [];
    try {
      seen = JSON.parse(localStorage.getItem(storageKey) || '[]');
      if (!Array.isArray(seen)) seen = [];
    } catch {
      seen = [];
    }

    const newOnes = unlockedKeys.filter((k) => !seen.includes(k));
    if (!newOnes.length) return;

    // Prefer summary-achievement titles if available, else fall back to /achievements/me
    for (const k of newOnes.slice(0, 5)) {
      const fromSummary = summary?.achievements?.find((x) => x.key === k);
      const fromMe = myAchievements?.find((x) => x.code === k);
      const title = fromSummary?.title || fromMe?.title || k;
      const desc = fromSummary?.detail || fromMe?.description || '';
      toast.success(`Achievement unlocked: ${title}`, desc ? { description: desc } : undefined);
    }

    const merged = Array.from(new Set([...seen, ...unlockedKeys]));
    localStorage.setItem(storageKey, JSON.stringify(merged));
  }, [summary?.achievements, myAchievements, userId]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [API_BASE_URL, userId]);

  const achievementsToShow = (summary?.achievements?.length ? summary.achievements : myAchievements).slice(0, 6);

  return (
    <div className="space-y-6">
    <div className="flex items-center justify-between">
    <div>
    <h3 className="text-lg font-semibold">Progress Tracking</h3>
    <p className="text-sm text-muted-foreground">Real progress from completed Study Sessions + Assessments</p>
    </div>
    <Button variant="outline" size="sm" onClick={load} disabled={loading}>
    <RefreshCw className="h-4 w-4 mr-2" />
    Refresh
    </Button>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    <Card>
    <CardHeader>
    <CardTitle className="flex items-center gap-2">
    <Flag className="h-5 w-5" /> Weekly Goal
    </CardTitle>
    <CardDescription>{summary ? `${summary.period_start} → ${summary.period_end}` : '—'}</CardDescription>
    </CardHeader>
    <CardContent className="space-y-3">
    <div className="flex items-center justify-between text-sm">
    <span className="text-purple-700 font-semibold">{summary?.total_completed_hours ?? 0}h done</span>
    <span className="text-purple-700 font-semibold">{summary?.total_target_hours ?? 0}h target</span>
    </div>
    <Progress value={pct} className="bg-blue-100" indicatorColor="bg-blue-600" />
    <div className="text-xs font-semibold text-purple-700">{pct}%</div>
    </CardContent>
    </Card>

    <Card>
    <CardHeader>
    <CardTitle className="flex items-center gap-2">
    <Flame className="h-5 w-5" /> Streak
    </CardTitle>
    <CardDescription>Days in a row with ≥ 15 minutes</CardDescription>
    </CardHeader>
    <CardContent className="flex items-center justify-between">
    <div className="text-3xl font-bold text-purple-700">{summary?.streak_days ?? 0}</div>
    <Badge variant="secondary">days</Badge>
    </CardContent>
    </Card>

    <Card>
    <CardHeader>
    <CardTitle className="flex items-center gap-2">
    <CheckCircle2 className="h-5 w-5" /> Completed Deadlines
    </CardTitle>
    <CardDescription>Assessments completed in the period</CardDescription>
    </CardHeader>
    <CardContent className="flex items-center justify-between">
    <div className="text-3xl font-bold text-purple-700">{summary?.completed_tasks ?? 0}</div>
    <Badge variant="secondary">tasks</Badge>
    </CardContent>
    </Card>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
    <Card>
    <CardHeader>
    <CardTitle className="flex items-center gap-2">
    <Award className="h-5 w-5" /> Achievements
    </CardTitle>
    <CardDescription>Unlocked based on your real activity</CardDescription>
    </CardHeader>
    <CardContent className="space-y-3">
    {achievementsToShow.length ? (
      achievementsToShow.map((a: any) => {
        const code = String(a.key || a.code || '');
        const Icon = ACHIEVEMENT_ICON[code] || Award;

        return (
          <div
          key={a.key || a.code}
          className="flex items-start justify-between gap-3 p-3 rounded-lg border"
          >
          <div className="flex items-start gap-3 min-w-0">
          <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div className="min-w-0">
          <div className="font-medium truncate">{a.title}</div>
          <div className="text-xs text-muted-foreground line-clamp-2">
          {a.detail || a.description}
          </div>
          </div>
          </div>
          <Badge variant="outline">Unlocked</Badge>
          </div>
        );
      })
    ) : (
      <div className="text-sm text-muted-foreground">
      No achievements yet — complete a session or deadline to start unlocking.
      </div>
    )}
    </CardContent>
    </Card>

    <Card>
    <CardHeader>
    <CardTitle className="flex items-center gap-2">
    <Calendar className="h-5 w-5" /> Upcoming Deadlines
    </CardTitle>
    <CardDescription>Next 5 assessments due</CardDescription>
    </CardHeader>
    <CardContent className="space-y-3">
    {(summary?.upcoming_deadlines || []).length ? (
      summary!.upcoming_deadlines.slice(0, 5).map((d) => (
        <div key={d.id} className="flex items-start justify-between gap-3 p-3 rounded-lg border">
        <div className="min-w-0">
        <div className="font-medium truncate">{d.title}</div>
        <div className="text-xs text-muted-foreground truncate">
        {d.subject} • {d.type}
        </div>
        </div>
        <Badge variant="secondary">{new Date(d.dueDate).toLocaleDateString()}</Badge>
        </div>
      ))
    ) : (
      <div className="text-sm text-muted-foreground">No upcoming deadlines.</div>
    )}
    </CardContent>
    </Card>
    </div>
    </div>
  );
}
