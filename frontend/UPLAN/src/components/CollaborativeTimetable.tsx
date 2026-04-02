import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Calendar,
  Plus,
  Trash2,
  Eye,
  Activity,
  History,
  Save,
  X,
  ChevronDown,
  ChevronUp,
  UserCircle2,
  MousePointer2,
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';

interface Member {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'member';
  avatar?: string;
}

interface Session {
  id: string;
  title: string;
  subject: string;
  day: string;
  startTime: string;
  endTime: string;
  color: string;
  type?: string;
  location?: string;
  createdBy?: string;
  editedBy?: string;
  lastEdited?: string;
}

interface Presence {
  userId: string;
  userName: string;
  timestamp: number;
  color: string;
  currentSession?: string;
  cursorPosition?: { x: number; y: number };
}

interface ActivityItem {
  id: string;
  userId: string;
  userName: string;
  action: string;
  timestamp: string;
  sessionTitle?: string;
}

interface CollaborativeTimetableProps {
  workspace: any;
  currentUser: Member;
  timetableId: string;
  onClose: () => void;
}

const PRESENCE_COLORS = [
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#EC4899',
  '#14B8A6',
  '#F97316',
];

const TIMETABLE_SESSION_COLOR = '#6366F1';

export default function CollaborativeTimetable({
  workspace,
  currentUser,
  timetableId,
  onClose,
}: CollaborativeTimetableProps) {
  const { t } = useTranslation();

  const DAYS = [
    t('collaborativeTimetable.days.monday'),
    t('collaborativeTimetable.days.tuesday'),
    t('collaborativeTimetable.days.wednesday'),
    t('collaborativeTimetable.days.thursday'),
    t('collaborativeTimetable.days.friday'),
    t('collaborativeTimetable.days.saturday'),
    t('collaborativeTimetable.days.sunday'),
  ];

  const HOURS = Array.from({ length: 14 }, (_, i) => i + 7);

  const [timetable, setTimetable] = useState<any>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [presenceList, setPresenceList] = useState<Presence[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isAddSessionOpen, setIsAddSessionOpen] = useState(false);
  const [isEditSessionOpen, setIsEditSessionOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [showActivities, setShowActivities] = useState(false);
  const [newSession, setNewSession] = useState<Partial<Session>>({
    title: '',
    subject: '',
    day: '',
    startTime: '09:00',
    endTime: '10:00',
    color: '#3B82F6',
    type: '',
    location: '',
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const userColor = useRef(PRESENCE_COLORS[Math.floor(Math.random() * PRESENCE_COLORS.length)]);
  const lastMousePosition = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!newSession.day) {
      setNewSession((prev) => ({ ...prev, day: DAYS[0], type: t('collaborativeTimetable.sessionTypes.lecture') }));
    }
  }, [DAYS, newSession.day, t]);

  useEffect(() => {
    loadTimetableData();
    loadActivities();
  }, [timetableId]);

  useEffect(() => {
    updatePresence();
    const interval = setInterval(() => {
      updatePresence();
      loadPresence();
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        lastMousePosition.current = {
          x: ((e.clientX - rect.left) / rect.width) * 100,
          y: ((e.clientY - rect.top) / rect.height) * 100,
        };
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const loadTimetableData = () => {
    const timetables = JSON.parse(localStorage.getItem(`workspace_${workspace.id}_timetables`) || '[]');
    const found = timetables.find((t: any) => t.id === timetableId);
    if (found) {
      setTimetable(found);
      setSessions(found.sessions || []);
    }
  };

  const saveTimetableData = (updatedSessions: Session[], action: string, sessionTitle?: string) => {
    const timetables = JSON.parse(localStorage.getItem(`workspace_${workspace.id}_timetables`) || '[]');
    const updated = timetables.map((t: any) => {
      if (t.id === timetableId) {
        return {
          ...t,
          sessions: updatedSessions,
          lastModified: new Date().toISOString(),
          lastModifiedBy: currentUser.name,
        };
      }
      return t;
    });
    localStorage.setItem(`workspace_${workspace.id}_timetables`, JSON.stringify(updated));
    setSessions(updatedSessions);
    addActivity(action, sessionTitle);
  };

  const updatePresence = () => {
    const key = `workspace_${workspace.id}_timetable_${timetableId}_presence`;
    const presences = JSON.parse(localStorage.getItem(key) || '[]');

    const now = Date.now();
    const filtered = presences.filter(
      (p: Presence) => now - p.timestamp < 10000 && p.userId !== currentUser.id
    );

    const newPresence: Presence = {
      userId: currentUser.id,
      userName: currentUser.name,
      timestamp: now,
      color: userColor.current,
      currentSession: selectedSession?.id,
      cursorPosition: lastMousePosition.current,
    };

    filtered.push(newPresence);
    localStorage.setItem(key, JSON.stringify(filtered));
  };

  const loadPresence = () => {
    const key = `workspace_${workspace.id}_timetable_${timetableId}_presence`;
    const presences = JSON.parse(localStorage.getItem(key) || '[]');

    const now = Date.now();
    const filtered = presences.filter(
      (p: Presence) => p.userId !== currentUser.id && now - p.timestamp < 10000
    );

    setPresenceList(filtered);
  };

  const addActivity = (action: string, sessionTitle?: string) => {
    const activity: ActivityItem = {
      id: `activity-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      action,
      timestamp: new Date().toISOString(),
      sessionTitle,
    };

    const key = `workspace_${workspace.id}_timetable_${timetableId}_activities`;
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    existing.unshift(activity);

    if (existing.length > 50) {
      existing.splice(50);
    }

    localStorage.setItem(key, JSON.stringify(existing));
    setActivities(existing);
  };

  const loadActivities = () => {
    const key = `workspace_${workspace.id}_timetable_${timetableId}_activities`;
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    setActivities(existing);
  };

  const handleAddSession = () => {
    if (!newSession.title || !newSession.subject) {
      toast.error(t('collaborativeTimetable.errors.requiredFields'));
      return;
    }

    const session: Session = {
      id: `session-${Date.now()}`,
      title: newSession.title!,
      subject: newSession.subject!,
      day: newSession.day!,
      startTime: newSession.startTime!,
      endTime: newSession.endTime!,
      color: newSession.color!,
      type: newSession.type,
      location: newSession.location,
      createdBy: currentUser.name,
      editedBy: currentUser.name,
      lastEdited: new Date().toISOString(),
    };

    const updated = [...sessions, session];
    saveTimetableData(updated, t('collaborativeTimetable.activity.createdAction'), session.title);
    setIsAddSessionOpen(false);
    resetNewSession();
    toast.success(t('collaborativeTimetable.success.sessionAdded'));
  };

  const handleEditSession = () => {
    if (!selectedSession || !newSession.title || !newSession.subject) {
      toast.error(t('collaborativeTimetable.errors.requiredFields'));
      return;
    }

    const updated = sessions.map((s) => {
      if (s.id === selectedSession.id) {
        return {
          ...s,
          ...newSession,
          editedBy: currentUser.name,
          lastEdited: new Date().toISOString(),
        } as Session;
      }
      return s;
    });

    saveTimetableData(updated, t('collaborativeTimetable.activity.editedAction'), newSession.title!);
    setIsEditSessionOpen(false);
    setSelectedSession(null);
    resetNewSession();
    toast.success(t('collaborativeTimetable.success.sessionUpdated'));
  };

  const handleDeleteSession = (session: Session) => {
    if (confirm(t('collaborativeTimetable.confirm.deleteSession', { title: session.title }))) {
      const updated = sessions.filter((s) => s.id !== session.id);
      saveTimetableData(updated, t('collaborativeTimetable.activity.deletedAction'), session.title);
      toast.success(t('collaborativeTimetable.success.sessionDeleted'));
    }
  };

  const openEditSession = (session: Session) => {
    setSelectedSession(session);
    setNewSession({
      title: session.title,
      subject: session.subject,
      day: session.day,
      startTime: session.startTime,
      endTime: session.endTime,
      color: session.color,
      type: session.type,
      location: session.location,
    });
    setIsEditSessionOpen(true);
  };

  const resetNewSession = () => {
    setNewSession({
      title: '',
      subject: '',
      day: DAYS[0],
      startTime: '09:00',
      endTime: '10:00',
      color: '#3B82F6',
      type: t('collaborativeTimetable.sessionTypes.lecture'),
      location: '',
    });
  };

  const getSessionsForDayAndTime = (day: string, hour: number) => {
    return sessions.filter((session) => {
      if (session.day !== day) return false;
      const startHour = parseInt(session.startTime.split(':')[0]);
      return startHour === hour;
    });
  };

  const getSessionDuration = (startTime: string, endTime: string) => {
    const start = parseInt(startTime.split(':')[0]) + parseInt(startTime.split(':')[1]) / 60;
    const end = parseInt(endTime.split(':')[0]) + parseInt(endTime.split(':')[1]) / 60;
    return end - start;
  };

  const formatTime = (time: string) => {
    const [hour, minute] = time.split(':');
    const h = parseInt(hour);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${displayHour}:${minute} ${ampm}`;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return t('collaborativeTimetable.timeAgo.justNow');
    if (minutes < 60) return t('collaborativeTimetable.timeAgo.minutesAgo', { count: minutes });
    if (hours < 24) return t('collaborativeTimetable.timeAgo.hoursAgo', { count: hours });
    return t('collaborativeTimetable.timeAgo.daysAgo', { count: days });
  };

  if (!timetable) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center">
          <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">{t('collaborativeTimetable.loading')}</p>
        </div>
      </div>
    );
  }

  const canEdit =
    workspace.settings?.allowAllMembersToEditTimetables ||
    timetable.ownerId === currentUser.id ||
    currentUser.role === 'admin';

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{timetable?.name || 'Timetable'}</h2>
                <p className="text-sm text-gray-500">{timetable.description}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {presenceList.slice(0, 5).map((presence) => (
                  <div
                    key={presence.userId}
                    className="relative"
                    title={t('collaborativeTimetable.presence.viewingTitle', { name: presence.userName })}
                  >
                    <Avatar
                      className="h-8 w-8 border-2 border-white ring-2 transition-all hover:scale-110"
                      style={{ ringColor: presence.color }}
                    >
                      <AvatarFallback
                        className="text-white text-xs"
                        style={{ backgroundColor: presence.color }}
                      >
                        {getInitials(presence.userName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border border-white" />
                  </div>
                ))}
              </div>
              {presenceList.length > 5 && (
                <Badge variant="secondary" className="text-xs">
                  +{presenceList.length - 5}
                </Badge>
              )}
              {presenceList.length > 0 && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Eye className="h-3 w-3" />
                  <span>{t('collaborativeTimetable.presence.viewingCount', { count: presenceList.length })}</span>
                </div>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowActivities(!showActivities)}
              className="gap-2"
            >
              {showActivities ? <ChevronUp className="h-4 w-4" /> : <History className="h-4 w-4" />}
              {t('collaborativeTimetable.actions.activity')}
              {activities.length > 0 && (
                <Badge variant="secondary" className="ml-1">{activities.length}</Badge>
              )}
            </Button>

            {canEdit && (
              <Button
                onClick={() => setIsAddSessionOpen(true)}
                className="bg-blue-700 hover:bg-blue-800 dark:hover:bg-blue-900"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t('collaborativeTimetable.actions.addSession')}
              </Button>
            )}
          </div>
        </div>

        {showActivities && (
          <div className="mt-4 border-t pt-4">
            <div className="bg-gray-50 rounded-lg p-4 max-h-48 overflow-y-auto">
              <div className="flex items-center gap-2 mb-3">
                <Activity className="h-4 w-4 text-gray-600" />
                <h3 className="text-sm font-semibold text-gray-900">{t('collaborativeTimetable.activity.title')}</h3>
              </div>
              {activities.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">{t('collaborativeTimetable.activity.empty')}</p>
              ) : (
                <div className="space-y-2">
                  {activities.slice(0, 10).map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 text-sm">
                      <Avatar className="h-6 w-6 flex-shrink-0">
                        <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                          {getInitials(activity.userName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-900">
                          <span className="font-medium">{activity.userName}</span>{' '}
                          <span className="text-gray-600">{activity.action}</span>
                          {activity.sessionTitle && (
                            <span className="font-medium"> "{activity.sessionTitle}"</span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500">{getTimeAgo(activity.timestamp)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto p-6" ref={containerRef}>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="p-3 text-left text-sm font-semibold text-gray-900 border-r border-gray-200 w-24">
                    {t('collaborativeTimetable.table.time')}
                  </th>
                  {DAYS.map((day) => (
                    <th key={day} className="p-3 text-center text-sm font-semibold text-gray-900 border-r border-gray-200 last:border-r-0">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {HOURS.map((hour) => (
                  <tr key={hour} className="border-b border-gray-200 last:border-b-0">
                    <td className="p-3 text-sm text-gray-600 border-r border-gray-200 bg-gray-50 font-medium">
                      {hour}:00
                    </td>
                    {DAYS.map((day) => {
                      const daySessions = getSessionsForDayAndTime(day, hour);
                      return (
                        <td
                          key={day}
                          className="border-r border-gray-200 last:border-r-0 p-1 align-top bg-white hover:bg-gray-50 transition-colors relative min-h-[80px]"
                        >
                          {daySessions.map((session) => {
                            const duration = getSessionDuration(session.startTime, session.endTime);
                            const editingUser = presenceList.find((p) => p.currentSession === session.id);

                            return (
                              <div
                                key={session.id}
                                className="rounded-lg p-2 mb-1 text-white text-xs shadow-sm hover:shadow-md transition-all cursor-pointer group relative"
                                style={{
                                  backgroundColor: PRESENCE_COLORS,
                                  minHeight: `${duration * 60}px`,
                                  border: editingUser ? `2px solid ${editingUser.color}` : 'none',
                                }}
                                onClick={() => canEdit && openEditSession(session)}
                              >
                                {editingUser && (
                                  <div
                                    className="absolute -top-2 -right-2 z-10"
                                    title={t('collaborativeTimetable.presence.viewingSession', { name: editingUser.userName })}
                                  >
                                    <Avatar className="h-5 w-5 ring-2 ring-white" style={{ backgroundColor: editingUser.color }}>
                                      <AvatarFallback className="text-white text-[8px]">
                                        {getInitials(editingUser.userName)}
                                      </AvatarFallback>
                                    </Avatar>
                                  </div>
                                )}
                                <div className="font-semibold truncate">{session.title}</div>
                                <div className="text-white/90 truncate">{session.subject}</div>
                                <div className="text-white/80 text-[10px] mt-1">
                                  {formatTime(session.startTime)} - {formatTime(session.endTime)}
                                </div>
                                {session.location && (
                                  <div className="text-white/80 text-[10px] truncate">{session.location}</div>
                                )}
                                {canEdit && (
                                  <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0 bg-white/20 hover:bg-white/30"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteSession(session);
                                      }}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                )}
                                {session.editedBy && (
                                  <div className="text-[9px] text-white/70 mt-1 flex items-center gap-1">
                                    <UserCircle2 className="h-2.5 w-2.5" />
                                    <span>{t('collaborativeTimetable.table.editedBy', { name: session.editedBy })}</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {presenceList.map((presence) => {
          if (!presence.cursorPosition) return null;
          return (
            <div
              key={presence.userId}
              className="fixed pointer-events-none z-50 transition-all duration-100"
              style={{
                left: `${presence.cursorPosition.x}%`,
                top: `${presence.cursorPosition.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <MousePointer2
                className="h-5 w-5 drop-shadow-lg"
                style={{ color: presence.color }}
                fill={presence.color}
              />
              <div
                className="text-white text-xs px-2 py-0.5 rounded-full mt-1 whitespace-nowrap shadow-lg"
                style={{ backgroundColor: presence.color }}
              >
                {presence.userName}
              </div>
            </div>
          );
        })}
      </div>

      <Dialog
        open={isAddSessionOpen || isEditSessionOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddSessionOpen(false);
            setIsEditSessionOpen(false);
            setSelectedSession(null);
            resetNewSession();
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {isEditSessionOpen
                ? t('collaborativeTimetable.dialog.editTitle')
                : t('collaborativeTimetable.dialog.addTitle')}
            </DialogTitle>
            <DialogDescription>
              {isEditSessionOpen
                ? t('collaborativeTimetable.dialog.editDescription')
                : t('collaborativeTimetable.dialog.addDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">{t('collaborativeTimetable.fields.sessionTitle')}</Label>
              <Input
                id="title"
                placeholder={t('collaborativeTimetable.placeholders.sessionTitle')}
                value={newSession.title}
                onChange={(e) => setNewSession({ ...newSession, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">{t('collaborativeTimetable.fields.subject')}</Label>
              <Input
                id="subject"
                placeholder={t('collaborativeTimetable.placeholders.subject')}
                value={newSession.subject}
                onChange={(e) => setNewSession({ ...newSession, subject: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="day">{t('collaborativeTimetable.fields.day')}</Label>
              <Select value={newSession.day} onValueChange={(value) => setNewSession({ ...newSession, day: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS.map((day) => (
                    <SelectItem key={day} value={day}>{day}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">{t('collaborativeTimetable.fields.type')}</Label>
              <Select value={newSession.type} onValueChange={(value) => setNewSession({ ...newSession, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={t('collaborativeTimetable.sessionTypes.lecture')}>{t('collaborativeTimetable.sessionTypes.lecture')}</SelectItem>
                  <SelectItem value={t('collaborativeTimetable.sessionTypes.lab')}>{t('collaborativeTimetable.sessionTypes.lab')}</SelectItem>
                  <SelectItem value={t('collaborativeTimetable.sessionTypes.tutorial')}>{t('collaborativeTimetable.sessionTypes.tutorial')}</SelectItem>
                  <SelectItem value={t('collaborativeTimetable.sessionTypes.study')}>{t('collaborativeTimetable.sessionTypes.study')}</SelectItem>
                  <SelectItem value={t('collaborativeTimetable.sessionTypes.exam')}>{t('collaborativeTimetable.sessionTypes.exam')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="startTime">{t('collaborativeTimetable.fields.startTime')}</Label>
              <Input
                id="startTime"
                type="time"
                value={newSession.startTime}
                onChange={(e) => setNewSession({ ...newSession, startTime: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">{t('collaborativeTimetable.fields.endTime')}</Label>
              <Input
                id="endTime"
                type="time"
                value={newSession.endTime}
                onChange={(e) => setNewSession({ ...newSession, endTime: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">{t('collaborativeTimetable.fields.location')}</Label>
              <Input
                id="location"
                placeholder={t('collaborativeTimetable.placeholders.location')}
                value={newSession.location}
                onChange={(e) => setNewSession({ ...newSession, location: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">{t('collaborativeTimetable.fields.color')}</Label>
              <div className="flex gap-2">
                <Input
                  id="color"
                  type="color"
                  value={newSession.color}
                  onChange={(e) => setNewSession({ ...newSession, color: e.target.value })}
                  className="w-16 h-10"
                />
                <Input
                  type="text"
                  value={newSession.color}
                  onChange={(e) => setNewSession({ ...newSession, color: e.target.value })}
                  placeholder="#3B82F6"
                  className="flex-1"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddSessionOpen(false);
                setIsEditSessionOpen(false);
                setSelectedSession(null);
                resetNewSession();
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={isEditSessionOpen ? handleEditSession : handleAddSession}
              className="bg-blue-700 hover:bg-blue-800 dark:hover:bg-blue-900"
            >
              <Save className="h-4 w-4 mr-2" />
              {isEditSessionOpen
                ? t('collaborativeTimetable.actions.saveChanges')
                : t('collaborativeTimetable.actions.addSession')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}