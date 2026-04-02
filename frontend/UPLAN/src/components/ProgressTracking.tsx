import { useEffect, useMemo, useState } from 'react';
import { Award, Calendar, Clock, Flame, RefreshCw, Flag, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();

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

      if (!sumRes.ok) throw new Error(t('goals.errors.summaryNotLoaded'));
      const sumData = await sumRes.json();
      setSummary(sumData as GoalsSummary);

      if (achRes.ok) {
        const achData = await achRes.json();
        const rows = Array.isArray(achData?.achievements) ? achData.achievements : [];
        setMyAchievements(rows);
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || t('goals.errors.summaryNotLoaded'));
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

    for (const k of newOnes.slice(0, 5)) {
      const fromSummary = summary?.achievements?.find((x) => x.key === k);
      const fromMe = myAchievements?.find((x) => x.code === k);
      const title = fromSummary?.title || fromMe?.title || k;
      toast.success(t('goals.success.achievementUnlocked', { title }));
    }

    const merged = Array.from(new Set([...seen, ...unlockedKeys]));
    localStorage.setItem(storageKey, JSON.stringify(merged));
  }, [summary?.achievements, myAchievements, userId, t]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [API_BASE_URL, userId]);

  const achievementsToShow = (summary?.achievements?.length ? summary.achievements : myAchievements).slice(0, 6);

  return (
    <div className="space-y-6">
      
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{t('goals.title')}</h3>
          <p className="text-sm text-muted-foreground">
            {t('goals.subtitle')}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className="h-4 w-4 mr-2" />
          {t('dashboard.refresh')}
        </Button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Weekly Goal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flag className="h-5 w-5" />
              {t('goals.goalDialog.weeklyTarget')}
            </CardTitle>
            <CardDescription>
              {summary ? `${summary.period_start} → ${summary.period_end}` : '—'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold">
                {summary?.total_completed_hours ?? 0}h {t('goals.progress.completed')}
              </span>
              <span className="font-semibold">
                {summary?.total_target_hours ?? 0}h {t('goals.progress.target')}
              </span>
            </div>
            <Progress value={pct} />
            <div className="text-xs font-semibold">{pct}%</div>
          </CardContent>
        </Card>

        {/* Streak */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="h-5 w-5" />
              {t('goals.progress.streak', { count: summary?.streak_days ?? 0 })}
            </CardTitle>
            <CardDescription>{t('goals.progress.description')}</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="text-3xl font-semibold">
              {summary?.streak_days ?? 0}
            </div>
            <Badge variant="secondary">{t('goals.common.study')}</Badge>
          </CardContent>
        </Card>

        {/* Completed Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              {t('goals.actions.markCompleted')}
            </CardTitle>
            <CardDescription>{t('dashboard.tasksDone')}</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="text-3xl font-semibold">
              {summary?.completed_tasks ?? 0}
            </div>
            <Badge variant="secondary">{t('dashboard.tasks')}</Badge>
          </CardContent>
        </Card>

      </div>

      {/* LOWER SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Achievements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              {t('goals.title')}
            </CardTitle>
            <CardDescription>{t('goals.subtitle')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {achievementsToShow.length ? (
              achievementsToShow.map((a: any) => {
                const code = String(a.key || a.code || '');
                const Icon = ACHIEVEMENT_ICON[code] || Award;

                return (
                  <div key={code} className="flex justify-between gap-3 p-3 rounded-lg border">
                    <div className="flex gap-3">
                      <Icon className="h-4 w-4 mt-0.5" />
                      <div>
                        <div className="font-medium">{a.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {a.detail || a.description}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline">
                      {t('goals.success.achievementUnlocked')}
                    </Badge>
                  </div>
                );
              })
            ) : (
              <div className="text-sm text-muted-foreground">
                {t('goals.thisWeek.description')}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Deadlines */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {t('goals.deadlines.title')}
            </CardTitle>
            <CardDescription>
              {t('goals.deadlines.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(summary?.upcoming_deadlines || []).length ? (
              summary!.upcoming_deadlines.slice(0, 5).map((d) => (
                <div key={d.id} className="flex justify-between gap-3 p-3 rounded-lg border">
                  <div>
                    <div className="font-medium">{d.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {d.subject} • {d.type}
                    </div>
                  </div>
                  <Badge variant="secondary">
                    {new Date(d.dueDate).toLocaleDateString()}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground">
                {t('goals.deadlines.empty')}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}