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
  lastUpdated: string;
}

interface TeamCollaborationProps {
  workspaceId: string;
  members: Member[];
  currentUser: Member;
}

export default function TeamCollaboration({ workspaceId, members, currentUser }: TeamCollaborationProps) {
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

  const loadMemberProgress = () => {
    const key = `workspace_${workspaceId}_progress`;
    const saved = localStorage.getItem(key);
    if (saved) {
      setMemberProgress(JSON.parse(saved));
    } else {
      // Initialize progress for all members
      const initialProgress = members.map(member => ({
        memberId: member.id,
        memberName: member.name,
        totalSessions: 0,
        completedSessions: 0,
        upcomingSessions: 0,
        completionRate: 0,
        lastUpdated: new Date().toISOString()
      }));
      setMemberProgress(initialProgress);
      localStorage.setItem(key, JSON.stringify(initialProgress));
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
    <div className="space-y-6">
      {/* Team Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
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
            <div className="flex items-center justify-between">
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
            <div className="flex items-center justify-between">
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
            <div className="flex items-center justify-between">
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
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  Shared Schedules
                </CardTitle>
                <CardDescription>Schedules shared with the team</CardDescription>
              </div>
              <Button
                onClick={() => setIsShareDialogOpen(true)}
                className="bg-blue-600 hover:bg-blue-700"
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
                    className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow bg-white"
                  >
                    <div className="flex items-start justify-between">
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
                        <div className="flex items-center gap-4 text-sm text-gray-500">
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
                      <div className="flex items-center gap-2">
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
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white text-xs">
                            {getInitials(progress.memberName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{progress.memberName}</p>
                          <p className="text-xs text-gray-500">
                            {progress.completedSessions}/{progress.totalSessions} completed
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
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
                    <Progress value={progress.completionRate} className="h-2" />
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
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="mt-1">{getActivityIcon(activity.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">
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
        <DialogContent>
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
                        <div className="flex items-center gap-2">
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
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <div>
                        <div>All Members</div>
                        <div className="text-xs text-gray-500">Everyone can view and use</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="admins">
                    <div className="flex items-center gap-2">
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