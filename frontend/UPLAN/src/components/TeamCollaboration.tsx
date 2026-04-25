import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, Share2, TrendingUp, Clock, Eye, Users, Activity, BarChart3, AlertCircle, Download, Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { Progress } from './ui/progress';
import { getWeekIdentifier } from '../src/utils/dateUtils';
import { getCurrentUserEmail, getUserItem } from '../utils/userStorage';
import { API_BASE_URL as DEFAULT_API_BASE_URL } from '../lib/api';
import { clearPermissionError } from '../utils/permissionErrors';

interface Member {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'member';
}

interface Session {
  id: string;
  subject: string;
  startTime: string;
  endTime: string;
  color: string;
  day: string;
}

interface SharedSchedule {
  id: string;
  name: string;
  ownerId: string;
  ownerName: string;
  sharedAt: string;
  sessions: Session[];
  visibility: 'all' | 'admins';
  collaborators: string[];
}

interface TeamActivity {
  id: string;
  type: 'schedule_shared' | 'schedule_updated' | 'member_added' | 'progress_updated';
  memberId: string;
  memberName: string;
  description: string;
  timestamp: string;
}

interface MemberProgress {
  memberId: string;
  memberName: string;
  totalSessions: number;
  completedSessions: number;
  upcomingSessions: number;
  completionRate: number;
  completedHours: number;
  streakDays: number;
  goalPercent: number;
  goalTargetHours: number;
  lastUpdated: string;
}

interface TeamCollaborationProps {
  workspaceId: string;
  members: Member[];
  currentUser: Member;
}

function parseStoredArray<T = any>(raw: string | null): T[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function readScheduleSessions(source: any): Session[] {
  const sessions = source?.sessions ?? source?.calendarSessions ?? [];
  return Array.isArray(sessions) ? sessions : [];
}

function normalizeSession(session: any, index: number): Session {
  return {
    id: String(session?.id || `session-${Date.now()}-${index}`),
    subject: String(session?.subject || session?.title || 'Study session'),
    startTime: String(session?.startTime || '08:00'),
    endTime: String(session?.endTime || '09:00'),
    color: String(session?.color || '#6366F1'),
    day: String(session?.day ?? 0),
  };
}

function workspaceWeekSchedulesFromStorage(workspaceId: string) {
  const prefix = `workspace_${workspaceId}_calendarSessions_`;
  const schedules: Array<{ id: string; name: string; sessions: Session[]; source: string }> = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith(prefix)) continue;

    const weekId = key.slice(prefix.length);
    const sessions = parseStoredArray<Session>(localStorage.getItem(key)).map(normalizeSession);
    if (sessions.length === 0) continue;

    schedules.push({
      id: `workspace-${weekId}`,
      name: `Workspace schedule (${weekId})`,
      sessions,
      source: 'workspace',
    });
  }

  return schedules.sort((a, b) => b.name.localeCompare(a.name));
}

export default function TeamCollaboration({ workspaceId, members, currentUser }: TeamCollaborationProps) {
  const { t, i18n } = useTranslation();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL;
  const tzOffsetMinutes = -new Date().getTimezoneOffset();

  const [sharedSchedules, setSharedSchedules] = useState<SharedSchedule[]>([]);
  const [teamActivities, setTeamActivities] = useState<TeamActivity[]>([]);
  const [memberProgress, setMemberProgress] = useState<MemberProgress[]>([]);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [previewSchedule, setPreviewSchedule] = useState<SharedSchedule | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<string>('');
  const [shareVisibility, setShareVisibility] = useState<'all' | 'admins'>('all');
  const [availableTimetables, setAvailableTimetables] = useState<any[]>([]);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false);

  useEffect(() => {
    loadSharedSchedules();
    loadTeamActivities();
    loadMemberProgress();
    loadAvailableTimetables();
  }, [workspaceId]);

  const loadAvailableTimetables = async () => {
    const weekId = getWeekIdentifier(new Date());
    const workspaceWeekKey = `workspace_${workspaceId}_calendarSessions_${weekId}`;
    const workspaceSessions = parseStoredArray<Session>(localStorage.getItem(workspaceWeekKey));
    const storedWorkspaceSchedules = workspaceWeekSchedulesFromStorage(workspaceId);
    const userEmail = getCurrentUserEmail();
    const currentUserId = currentUser.id || localStorage.getItem('currentUserId') || '';

    let backendWorkspaceSessions: Session[] = [];
    if (API_BASE_URL && currentUserId) {
      try {
        setIsLoadingSchedules(true);
        const res = await fetch(
          `${API_BASE_URL}/workspaces/${encodeURIComponent(String(workspaceId))}/sessions?week_id=${encodeURIComponent(weekId)}`,
          { headers: { 'X-User-Id': currentUserId } }
        );
        if (res.ok) {
          backendWorkspaceSessions = parseStoredArray<Session>(JSON.stringify(await res.json()));
          if (backendWorkspaceSessions.length > 0) {
            localStorage.setItem(workspaceWeekKey, JSON.stringify(backendWorkspaceSessions));
          }
        }
      } catch (err) {
        console.error('Failed to load workspace schedules for sharing', err);
      } finally {
        setIsLoadingSchedules(false);
      }
    }

    const savedUserTimetables = [
      ...parseStoredArray<any>(getUserItem('timetables')),
      ...parseStoredArray<any>(userEmail ? localStorage.getItem(`timetables_${userEmail}`) : null),
      ...parseStoredArray<any>(localStorage.getItem('timetables')),
    ];
    const resolvedWorkspaceSessions = backendWorkspaceSessions.length > 0 ? backendWorkspaceSessions : workspaceSessions;

    const options = [
      ...(resolvedWorkspaceSessions.length > 0
        ? [{
            id: `workspace-${weekId}`,
            name: `Workspace schedule (${weekId})`,
            sessions: resolvedWorkspaceSessions.map(normalizeSession),
            source: 'workspace',
          }]
        : []),
      ...storedWorkspaceSchedules,
      ...savedUserTimetables.map((timetable) => ({
        ...timetable,
        id: String(timetable.id ?? `saved-${timetable.name ?? Date.now()}`),
        name: String(timetable.name ?? 'Saved timetable'),
        sessions: readScheduleSessions(timetable).map(normalizeSession),
        source: 'saved',
      })),
    ];

    const seen = new Set<string>();
    setAvailableTimetables(options.filter((option) => {
      if (seen.has(option.id)) return false;
      seen.add(option.id);
      return readScheduleSessions(option).length > 0;
    }));
  };

  const loadSharedSchedules = () => {
    const key = `workspace_${workspaceId}_schedules`;
    const saved = localStorage.getItem(key);
    setSharedSchedules(parseStoredArray<SharedSchedule>(saved));
  };

  const loadTeamActivities = () => {
    const key = `workspace_${workspaceId}_activities`;
    const saved = localStorage.getItem(key);
    setTeamActivities(parseStoredArray<TeamActivity>(saved));
  };

  const loadMemberProgress = async () => {
    const userId = currentUser.id || localStorage.getItem('currentUserId') || '';
    if (!API_BASE_URL || !userId) return;

    const now = new Date();
    const utcDay = now.getUTCDay();
    const diffToMonday = (utcDay + 6) % 7;
    const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    monday.setUTCDate(monday.getUTCDate() - diffToMonday);
    const sunday = new Date(monday);
    sunday.setUTCDate(sunday.getUTCDate() + 6);

    const ps = monday.toISOString().slice(0, 10);
    const pe = sunday.toISOString().slice(0, 10);

    try {
      const res = await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/progress?period_start=${encodeURIComponent(ps)}&period_end=${encodeURIComponent(pe)}&tz_offset_minutes=${encodeURIComponent(String(tzOffsetMinutes))}`, {
        headers: { 'X-User-Id': userId },
      });
      if (!res.ok) throw new Error('Failed to load progress');
      const data = await res.json();
      const rows = Array.isArray(data?.members) ? data.members : [];
      setMemberProgress(rows.map((r: any) => ({
        memberId: String(r.memberId ?? ''),
        memberName: String(r.memberName ?? t('teamCollaboration.defaults.member')),
        totalSessions: Number(r.totalSessions ?? 0),
        completedSessions: Number(r.completedSessions ?? 0),
        upcomingSessions: Number(r.upcomingSessions ?? 0),
        completionRate: Number(r.completionRate ?? 0),
        completedHours: Number(r.completedHours ?? 0),
        streakDays: Number(r.streakDays ?? 0),
        goalPercent: Number(r.goalPercent ?? 0),
        goalTargetHours: Number(r.goalTargetHours ?? 0),
        lastUpdated: new Date().toISOString(),
      })));
    } catch (err) {
      console.error(err);
      const initialProgress = members.map(member => ({
        memberId: member.id,
        memberName: member.name,
        totalSessions: 0,
        completedSessions: 0,
        upcomingSessions: 0,
        completionRate: 0,
        completedHours: 0,
        streakDays: 0,
        goalPercent: 0,
        goalTargetHours: 0,
        lastUpdated: new Date().toISOString(),
      }));
      setMemberProgress(initialProgress);
    }
  };

  const saveSharedSchedules = (schedules: SharedSchedule[]) => {
    const key = `workspace_${workspaceId}_schedules`;
    localStorage.setItem(key, JSON.stringify(schedules));
    setSharedSchedules(schedules);
    window.dispatchEvent(new Event(`workspaceSharedSchedulesUpdated_${workspaceId}`));
  };

  const saveTeamActivities = (activities: TeamActivity[]) => {
    const key = `workspace_${workspaceId}_activities`;
    localStorage.setItem(key, JSON.stringify(activities));
    setTeamActivities(activities);
  };

  const handleShareSchedule = () => {
    if (!selectedSchedule) {
      toast.error(t('teamCollaboration.errors.selectSchedule'));
      return;
    }

    const timetable = availableTimetables.find(t => t.id === selectedSchedule);
    if (!timetable) {
      toast.error(t('teamCollaboration.errors.scheduleNotFound'));
      return;
    }

    const sessions = readScheduleSessions(timetable).map(normalizeSession);
    if (sessions.length === 0) {
      toast.error('This schedule has no sessions to share.');
      return;
    }

    const newSharedSchedule: SharedSchedule = {
      id: `shared-${Date.now()}`,
      name: timetable.name,
      ownerId: currentUser.id,
      ownerName: currentUser.name,
      sharedAt: new Date().toISOString(),
      sessions,
      visibility: shareVisibility,
      collaborators: [currentUser.id]
    };

    const updated = [...sharedSchedules, newSharedSchedule];
    saveSharedSchedules(updated);

    const activity: TeamActivity = {
      id: `activity-${Date.now()}`,
      type: 'schedule_shared',
      memberId: currentUser.id,
      memberName: currentUser.name,
      description: t('teamCollaboration.activities.scheduleShared', { name: timetable.name }),
      timestamp: new Date().toISOString()
    };
    saveTeamActivities([activity, ...teamActivities].slice(0, 50));

    setIsShareDialogOpen(false);
    setSelectedSchedule('');
    toast.success(t('teamCollaboration.success.shared', { name: timetable.name }));
  };

  const handleImportSharedSchedule = async (schedule: SharedSchedule) => {
    if (!schedule.sessions.length) {
      toast.error('This shared schedule has no sessions to import.');
      return;
    }

    const weekId = getWeekIdentifier(new Date());
    const workspaceWeekKey = `workspace_${workspaceId}_calendarSessions_${weekId}`;
    const sessions = schedule.sessions.map(normalizeSession);
    localStorage.setItem(workspaceWeekKey, JSON.stringify(sessions));

    const currentUserId = currentUser.id || localStorage.getItem('currentUserId') || '';
    if (API_BASE_URL && currentUserId) {
      try {
        const res = await fetch(
          `${API_BASE_URL}/workspaces/${encodeURIComponent(String(workspaceId))}/sessions?week_id=${encodeURIComponent(weekId)}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'X-User-Id': currentUserId,
            },
            body: JSON.stringify(sessions.map((session) => ({
              ...session,
              day: Number(session.day),
            }))),
          }
        );
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(clearPermissionError(res.status, data?.detail, 'schedule-import'));
        }
      } catch (err: any) {
        toast.error(err?.message || 'Only workspace admins can import schedules into the workspace timetable.');
      }
    }

    window.dispatchEvent(new Event(`workspaceCalendarSessionsUpdated_${workspaceId}`));
    toast.success(`Imported "${schedule.name}" into the workspace timetable for ${weekId}.`);
  };

  const handleUpdateProgress = (memberId: string, completed: number, total: number) => {
    const updated = memberProgress.map(p => {
      if (p.memberId === memberId) {
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
        return {
          ...p,
          totalSessions: total,
          completedSessions: completed,
          upcomingSessions: total - completed,
          completionRate,
          lastUpdated: new Date().toISOString()
        };
      }
      return p;
    });

    const key = `workspace_${workspaceId}_progress`;
    localStorage.setItem(key, JSON.stringify(updated));
    setMemberProgress(updated);

    const member = members.find(m => m.id === memberId);
    if (member) {
      const activity: TeamActivity = {
        id: `activity-${Date.now()}`,
        type: 'progress_updated',
        memberId: member.id,
        memberName: member.name,
        description: t('teamCollaboration.activities.progressUpdated', { completed, total }),
        timestamp: new Date().toISOString()
      };
      saveTeamActivities([activity, ...teamActivities].slice(0, 50));
    }

    toast.success(t('teamCollaboration.success.progressUpdated'));
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'schedule_shared':
        return <Share2 className="h-4 w-4 text-blue-700" />;
      case 'schedule_updated':
        return <Calendar className="h-4 w-4 text-green-600" />;
      case 'member_added':
        return <Users className="h-4 w-4 text-purple-600" />;
      case 'progress_updated':
        return <TrendingUp className="h-4 w-4 text-orange-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return t('teamCollaboration.time.justNow');
    if (diffMins < 60) return t('teamCollaboration.time.minutesAgo', { count: diffMins });
    if (diffHours < 24) return t('teamCollaboration.time.hoursAgo', { count: diffHours });
    if (diffDays < 7) return t('teamCollaboration.time.daysAgo', { count: diffDays });
    return past.toLocaleDateString(i18n.language || 'en');
  };

  const teamStats = {
    totalSchedules: sharedSchedules.length,
    totalActivities: teamActivities.length,
    avgCompletionRate: memberProgress.length > 0
      ? Math.round(memberProgress.reduce((acc, p) => acc + p.completionRate, 0) / memberProgress.length)
      : 0,
    activeMembers: memberProgress.filter(p => p.completedSessions > 0).length
  };

  const progressTotals = memberProgress.reduce(
    (acc, progress) => {
      acc.totalSessions += progress.totalSessions;
      acc.completedSessions += progress.completedSessions;
      acc.upcomingSessions += progress.upcomingSessions;
      acc.completedHours += progress.completedHours;
      acc.goalPercent += progress.goalPercent;
      if (progress.totalSessions > 0 && progress.completionRate < 50) acc.atRisk += 1;
      return acc;
    },
    {
      totalSessions: 0,
      completedSessions: 0,
      upcomingSessions: 0,
      completedHours: 0,
      goalPercent: 0,
      atRisk: 0,
    }
  );

  const cohortCompletion =
    progressTotals.totalSessions > 0
      ? Math.round((progressTotals.completedSessions / progressTotals.totalSessions) * 100)
      : 0;
  const cohortGoal =
    memberProgress.length > 0
      ? Math.round(progressTotals.goalPercent / memberProgress.length)
      : 0;
  const topPerformer = [...memberProgress].sort((a, b) => b.completionRate - a.completionRate)[0];

  const getProgressStatus = (completionRate: number, totalSessions: number) => {
    if (totalSessions === 0) return { label: 'No sessions', className: 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300' };
    if (completionRate >= 80) return { label: 'On track', className: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/25 dark:text-emerald-300' };
    if (completionRate >= 50) return { label: 'Needs focus', className: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/25 dark:text-amber-300' };
    return { label: 'At risk', className: 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-950/25 dark:text-red-300' };
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="border-b border-slate-200 p-5 dark:border-slate-800 lg:border-b-0 lg:border-r">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                  <Shield className="h-3.5 w-3.5" />
                  University plan
                </div>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
                  Cohort progress command center
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Monitor attendance-style completion, study hours, and at-risk learners across the workspace from one institutional view.
                </p>
              </div>

              <Button
                onClick={async () => {
                  await loadAvailableTimetables();
                  setIsShareDialogOpen(true);
                }}
                className="h-10 rounded-lg bg-slate-950 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
              >
                <Share2 className="mr-2 h-4 w-4" />
                Share schedule
              </Button>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Cohort completion</p>
                  <p className="mt-1 text-4xl font-semibold tracking-tight text-slate-950 dark:text-white">
                    {cohortCompletion}%
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-right dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Completed sessions</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                    {progressTotals.completedSessions} / {progressTotals.totalSessions}
                  </p>
                </div>
              </div>
              <Progress value={cohortCompletion} className="mt-4 h-2" />
            </div>
          </div>

          <div className="grid grid-cols-2 divide-x divide-y divide-slate-200 dark:divide-slate-800">
            {[
              { label: 'Active learners', value: `${teamStats.activeMembers}/${members.length}`, icon: Users },
              { label: 'Study hours', value: `${progressTotals.completedHours.toFixed(1)}h`, icon: Clock },
              { label: 'Goal average', value: `${cohortGoal}%`, icon: TrendingUp },
              { label: 'Needs attention', value: progressTotals.atRisk, icon: AlertCircle },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="min-h-[128px] p-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
                    <Icon className="h-4 w-4" />
                  </div>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                    {stat.label}
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-slate-950 dark:text-white">
                    {stat.value}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-700" />
                  {t('teamCollaboration.sharedSchedules.title')}
                </CardTitle>
                <CardDescription>{t('teamCollaboration.sharedSchedules.description')}</CardDescription>
              </div>
              <Button
                onClick={async () => {
                  await loadAvailableTimetables();
                  setIsShareDialogOpen(true);
                }}
                className="w-full bg-blue-700 hover:bg-blue-700 sm:w-auto"
              >
                <Share2 className="h-4 w-4 mr-2" />
                {t('teamCollaboration.actions.shareSchedule')}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {sharedSchedules.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="mb-2">{t('teamCollaboration.empty.schedulesTitle')}</p>
                <p className="text-sm">{t('teamCollaboration.empty.schedulesDescription')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sharedSchedules.map((schedule) => (
                  <div
                    key={schedule.id}
                    className="rounded-xl border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium text-gray-900">{schedule.name}</h3>
                          <Badge variant="secondary" className="text-xs">
                            {t('teamCollaboration.sessionsCount', { count: schedule.sessions.length })}
                          </Badge>
                          {schedule.visibility === 'admins' && (
                            <Badge variant="outline" className="text-xs border-blue-200 text-blue-700">
                              {t('teamCollaboration.visibility.adminsOnly')}
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            <span>{t('teamCollaboration.sharedBy', { name: schedule.ownerName })}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{formatTimeAgo(schedule.sharedAt)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex min-w-0 items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPreviewSchedule(schedule)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          {t('teamCollaboration.actions.view')}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-blue-700 border-blue-300 hover:bg-blue-50"
                          onClick={() => {
                            void handleImportSharedSchedule(schedule);
                          }}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          {t('teamCollaboration.actions.import')}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="gap-0 overflow-hidden rounded-[24px] border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <CardHeader className="border-b border-slate-100 pb-5 dark:border-slate-800">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-950 dark:text-white">
                  <BarChart3 className="h-5 w-5 text-slate-700 dark:text-slate-200" />
                  Learner progress
                </CardTitle>
                <CardDescription className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Completion, study hours, streaks, and goal progress for every workspace member.
                </CardDescription>
              </div>
              <Badge variant="outline" className="w-fit rounded-md border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                {memberProgress.length} learners
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {memberProgress.length === 0 ? (
              <div className="px-6 py-10 text-center text-slate-500 dark:text-slate-400">
                <BarChart3 className="mx-auto mb-3 h-12 w-12 text-slate-300 dark:text-slate-700" />
                <p>No progress data is available yet.</p>
                <p className="mt-1 text-sm">Generated workspace sessions will appear here after learners start completing them.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {memberProgress.map((progress) => {
                  const status = getProgressStatus(progress.completionRate, progress.totalSessions);
                  return (
                  <div key={progress.memberId} className="p-4 transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-900/40">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar className="h-10 w-10 border border-slate-200 dark:border-slate-800">
                          <AvatarFallback className="bg-slate-900 text-xs font-semibold text-white dark:bg-white dark:text-slate-950">
                            {getInitials(progress.memberName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="flex min-w-0 flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">{progress.memberName}</p>
                            {topPerformer?.memberId === progress.memberId && progress.completionRate > 0 && (
                              <Badge variant="outline" className="rounded-md border-emerald-200 bg-emerald-50 text-[11px] text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300">
                                Top performer
                              </Badge>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {progress.completedSessions} of {progress.totalSessions} sessions completed
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                            {progress.completedHours.toFixed(1)}h studied · {progress.streakDays} day streak · {progress.upcomingSessions} upcoming
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 sm:justify-end">
                        <Badge variant="outline" className={`rounded-md ${status.className}`}>
                          {status.label}
                        </Badge>
                        <span className="min-w-12 text-right text-sm font-semibold text-slate-950 dark:text-white">
                          {progress.completionRate}%
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
                      <Progress value={progress.goalPercent} className="h-2" />
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        Goal {progress.goalPercent}%
                      </span>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-orange-600" />
              {t('teamCollaboration.activity.title')}
            </CardTitle>
            <CardDescription>{t('teamCollaboration.activity.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            {teamActivities.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Activity className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>{t('teamCollaboration.empty.activity')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {teamActivities.slice(0, 10).map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 rounded-2xl p-3 transition-colors hover:bg-gray-50"
                  >
                    <div className="mt-1">{getActivityIcon(activity.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="break-words text-sm text-gray-900">
                        <span className="font-medium">{activity.memberName}</span>{' '}
                        {activity.description}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatTimeAgo(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!previewSchedule} onOpenChange={(open) => !open && setPreviewSchedule(null)}>
        <DialogContent className="max-h-[90vh] w-[95vw] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{previewSchedule?.name || 'Shared schedule'}</DialogTitle>
            <DialogDescription>
              Shared by {previewSchedule?.ownerName || 'Workspace'} · {previewSchedule ? formatTimeAgo(previewSchedule.sharedAt) : ''}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {(previewSchedule?.sessions || []).length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
                This shared schedule has no sessions.
              </div>
            ) : (
              (previewSchedule?.sessions || []).map((session, index) => (
                <div
                  key={session.id || `${previewSchedule?.id}-${index}`}
                  className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">
                        {session.subject || 'Study session'}
                      </p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {session.day || 'Scheduled day'} · {session.startTime || '--:--'} - {session.endTime || '--:--'}
                      </p>
                    </div>
                    <Badge variant="outline" className="w-fit rounded-md">
                      Session {index + 1}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewSchedule(null)}>
              Close
            </Button>
            {previewSchedule && (
              <Button
                onClick={async () => {
                  await handleImportSharedSchedule(previewSchedule);
                  setPreviewSchedule(null);
                }}
                className="bg-slate-950 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
              >
                <Download className="mr-2 h-4 w-4" />
                Import to workspace
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent className="max-h-[90vh] w-[95vw] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('teamCollaboration.shareDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('teamCollaboration.shareDialog.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('teamCollaboration.shareDialog.selectSchedule')}</Label>
              <Select value={selectedSchedule} onValueChange={setSelectedSchedule}>
                <SelectTrigger>
                  <SelectValue placeholder={t('teamCollaboration.shareDialog.schedulePlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {availableTimetables.length === 0 ? (
                    <div className="p-4 text-center text-sm text-gray-500">
                      <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p>{t('teamCollaboration.shareDialog.noSchedules')}</p>
                      <p className="text-xs mt-1">{t('teamCollaboration.shareDialog.createFirst')}</p>
                    </div>
                  ) : (
                    availableTimetables.map((timetable) => (
                      <SelectItem key={timetable.id} value={timetable.id}>
                        <div className="flex min-w-0 items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <div>
                            <div>{timetable.name}</div>
                            <div className="text-xs text-gray-500">
                              {t('teamCollaboration.sessionsCount', { count: readScheduleSessions(timetable).length })}
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('teamCollaboration.shareDialog.visibility')}</Label>
              <Select value={shareVisibility} onValueChange={(v) => setShareVisibility(v as 'all' | 'admins')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex min-w-0 items-center gap-2">
                      <Users className="h-4 w-4" />
                      <div>
                        <div>{t('teamCollaboration.visibility.allMembers')}</div>
                        <div className="text-xs text-gray-500">{t('teamCollaboration.visibility.allMembersHelp')}</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="admins">
                    <div className="flex min-w-0 items-center gap-2">
                      <Shield className="h-4 w-4" />
                      <div>
                        <div>{t('teamCollaboration.visibility.adminsOnly')}</div>
                        <div className="text-xs text-gray-500">{t('teamCollaboration.visibility.adminsOnlyHelp')}</div>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsShareDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleShareSchedule} className="bg-blue-700 hover:bg-blue-700">
              <Share2 className="h-4 w-4 mr-2" />
              {t('teamCollaboration.actions.shareSchedule')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
