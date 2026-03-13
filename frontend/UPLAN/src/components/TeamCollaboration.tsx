import { useState, useEffect } from 'react';
import { Calendar, Share2, TrendingUp, CheckCircle2, Clock, Eye, Users, Activity, BarChart3, AlertCircle, Download, Upload, Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { Progress } from './ui/progress';

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
  collaborators: string[]; // member IDs who can edit
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

export default function TeamCollaboration({ workspaceId, members, currentUser }: TeamCollaborationProps) {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const [sharedSchedules, setSharedSchedules] = useState<SharedSchedule[]>([]);
  const [teamActivities, setTeamActivities] = useState<TeamActivity[]>([]);
  const [memberProgress, setMemberProgress] = useState<MemberProgress[]>([]);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<string>('');
  const [shareVisibility, setShareVisibility] = useState<'all' | 'admins'>('all');
  const [availableTimetables, setAvailableTimetables] = useState<any[]>([]);

  useEffect(() => {
    loadSharedSchedules();
    loadTeamActivities();
    loadMemberProgress();
    loadAvailableTimetables();
  }, [workspaceId]);

  const loadAvailableTimetables = () => {
    const timetables = JSON.parse(localStorage.getItem('timetables') || '[]');
    setAvailableTimetables(timetables);
  };

  const loadSharedSchedules = () => {
    const key = `workspace_${workspaceId}_schedules`;
    const saved = localStorage.getItem(key);
    if (saved) {
      setSharedSchedules(JSON.parse(saved));
    }
  };

  const loadTeamActivities = () => {
    const key = `workspace_${workspaceId}_activities`;
    const saved = localStorage.getItem(key);
    if (saved) {
      setTeamActivities(JSON.parse(saved));
    }
  };

  const loadMemberProgress = async () => {
    const userId = currentUser.id || localStorage.getItem('currentUserId') || '';
    if (!API_BASE_URL || !userId) return;

    // Default to current week (UTC, Monday..Sunday)
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
        memberName: String(r.memberName ?? 'Member'),
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
      // fall back to zeroed progress if backend unavailable
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
  };

  const saveTeamActivities = (activities: TeamActivity[]) => {
    const key = `workspace_${workspaceId}_activities`;
    localStorage.setItem(key, JSON.stringify(activities));
    setTeamActivities(activities);
  };

  const handleShareSchedule = () => {
    if (!selectedSchedule) {
      toast.error('Please select a schedule to share');
      return;
    }

    const timetable = availableTimetables.find(t => t.id === selectedSchedule);
    if (!timetable) {
      toast.error('Schedule not found');
      return;
    }

    const newSharedSchedule: SharedSchedule = {
      id: `shared-${Date.now()}`,
      name: timetable.name,
      ownerId: currentUser.id,
      ownerName: currentUser.name,
      sharedAt: new Date().toISOString(),
      sessions: timetable.sessions || [],
      visibility: shareVisibility,
      collaborators: [currentUser.id]
    };

    const updated = [...sharedSchedules, newSharedSchedule];
    saveSharedSchedules(updated);

    // Add activity
    const activity: TeamActivity = {
      id: `activity-${Date.now()}`,
      type: 'schedule_shared',
      memberId: currentUser.id,
      memberName: currentUser.name,
      description: `shared schedule "${timetable.name}" with the team`,
      timestamp: new Date().toISOString()
    };
    saveTeamActivities([activity, ...teamActivities].slice(0, 50)); // Keep last 50 activities

    setIsShareDialogOpen(false);
    setSelectedSchedule('');
    toast.success(`Schedule "${timetable.name}" shared successfully!`);
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

    // Add activity
    const member = members.find(m => m.id === memberId);
    if (member) {
      const activity: TeamActivity = {
        id: `activity-${Date.now()}`,
        type: 'progress_updated',
        memberId: member.id,
        memberName: member.name,
        description: `updated their progress to ${completed}/${total} sessions completed`,
        timestamp: new Date().toISOString()
      };
      saveTeamActivities([activity, ...teamActivities].slice(0, 50));
    }

    toast.success('Progress updated successfully!');
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'schedule_shared':
        return <Share2 className="h-4 w-4 text-blue-600" />;
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

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return past.toLocaleDateString();
  };

  const teamStats = {
    totalSchedules: sharedSchedules.length,
    totalActivities: teamActivities.length,
    avgCompletionRate: memberProgress.length > 0
      ? Math.round(memberProgress.reduce((acc, p) => acc + p.completionRate, 0) / memberProgress.length)
      : 0,
    activeMembers: memberProgress.filter(p => p.completedSessions > 0).length
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      {/* Team Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-600">Shared Schedules</p>
                <p className="text-2xl mt-1">{teamStats.totalSchedules}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Members</p>
                <p className="text-2xl mt-1">{teamStats.activeMembers}</p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Completion</p>
                <p className="text-2xl mt-1">{teamStats.avgCompletionRate}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-600">Recent Updates</p>
                <p className="text-2xl mt-1">{teamStats.totalActivities}</p>
              </div>
              <Activity className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Shared Schedules */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  Shared Schedules
                </CardTitle>
                <CardDescription>Schedules shared with the team</CardDescription>
              </div>
              <Button
                onClick={() => setIsShareDialogOpen(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 sm:w-auto"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share Schedule
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {sharedSchedules.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="mb-2">No shared schedules yet</p>
                <p className="text-sm">Share a schedule to collaborate with your team</p>
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
                            {schedule.sessions.length} sessions
                          </Badge>
                          {schedule.visibility === 'admins' && (
                            <Badge variant="outline" className="text-xs border-blue-200 text-blue-600">
                              Admins only
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            <span>Shared by {schedule.ownerName}</span>
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
                          onClick={() => toast.info('Viewing schedule details...')}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-blue-600 border-blue-300 hover:bg-blue-50"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Import
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Team Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              Team Progress
            </CardTitle>
            <CardDescription>Track completion rates across the team</CardDescription>
          </CardHeader>
          <CardContent>
            {memberProgress.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No progress data yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {memberProgress.map((progress) => (
                  <div key={progress.memberId} className="space-y-2">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white text-xs">
                            {getInitials(progress.memberName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="truncate text-sm font-medium text-gray-900">{progress.memberName}</p>
                          <p className="text-xs text-gray-500">
                            {progress.completedSessions}/{progress.totalSessions} completed
                          </p>
                          <p className="text-xs text-gray-500">
                            {progress.completedHours.toFixed(1)}h · Streak {progress.streakDays}d · Goal {progress.goalPercent}%
                          </p>
                        </div>
                      </div>
                      <div className="flex min-w-0 items-center gap-2">
                        <Badge
                          variant="secondary"
                          className={
                            progress.completionRate >= 80
                              ? 'bg-green-100 text-green-700'
                              : progress.completionRate >= 50
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-700'
                          }
                        >
                          {progress.completionRate}%
                        </Badge>
                      </div>
                    </div>
                    <Progress value={progress.goalPercent} className="h-2" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-orange-600" />
              Recent Activity
            </CardTitle>
            <CardDescription>What your team has been up to</CardDescription>
          </CardHeader>
          <CardContent>
            {teamActivities.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Activity className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No recent activity</p>
              </div>
            ) : (
              <div className="space-y-3">
                {teamActivities.slice(0, 10).map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-gray-50"
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

      {/* Share Schedule Dialog */}
      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent className="max-h-[90vh] w-[95vw] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Share Schedule with Team</DialogTitle>
            <DialogDescription>
              Select a schedule to share with your workspace members
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Schedule</Label>
              <Select value={selectedSchedule} onValueChange={setSelectedSchedule}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a schedule to share" />
                </SelectTrigger>
                <SelectContent>
                  {availableTimetables.length === 0 ? (
                    <div className="p-4 text-center text-sm text-gray-500">
                      <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p>No schedules available</p>
                      <p className="text-xs mt-1">Create a timetable first</p>
                    </div>
                  ) : (
                    availableTimetables.map((timetable) => (
                      <SelectItem key={timetable.id} value={timetable.id}>
                        <div className="flex min-w-0 items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <div>
                            <div>{timetable.name}</div>
                            <div className="text-xs text-gray-500">
                              {timetable.sessions?.length || 0} sessions
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
              <Label>Visibility</Label>
              <Select value={shareVisibility} onValueChange={(v) => setShareVisibility(v as 'all' | 'admins')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex min-w-0 items-center gap-2">
                      <Users className="h-4 w-4" />
                      <div>
                        <div>All Members</div>
                        <div className="text-xs text-gray-500">Everyone can view and use</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="admins">
                    <div className="flex min-w-0 items-center gap-2">
                      <Shield className="h-4 w-4" />
                      <div>
                        <div>Admins Only</div>
                        <div className="text-xs text-gray-500">Only admins can view</div>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsShareDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleShareSchedule} className="bg-blue-600 hover:bg-blue-700">
              <Share2 className="h-4 w-4 mr-2" />
              Share Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}