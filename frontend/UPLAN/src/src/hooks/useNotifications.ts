import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { getUserItem, setUserItem, getUserWeekKey } from '../../utils/userStorage';
import { apiJsonAuthed } from '../../lib/api';
import i18n from '../../i18n';

export interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  timestamp: number;
  read: boolean;
  type: 'session_reminder' | 'session_started' | 'timetable_updated' | 'message' | 'info';
  source?: 'local' | 'backend';
  backendId?: string;
  deepLink?: string | null;
  status?: string;
  senderName?: string;
  avatarUrl?: string | null;
}

type DirectConversationNotification = {
  friend: {
    id: string;
    full_name?: string | null;
    username?: string | null;
    email?: string | null;
    profile_picture_url?: string | null;
  };
  last_message?: {
    id?: number;
    content?: string | null;
    created_at?: string | null;
    sender_id?: string | null;
  } | null;
  unread_count?: number;
  nickname?: string | null;
};

type BackendNotification = {
  id: string;
  user_id?: string;
  session_id?: string | null;
  channel?: string;
  template?: string;
  send_at?: string;
  status?: string;
  error_message?: string | null;
};

const parseNotificationTimestamp = (sendAt?: string): number => {
  const timestamp = sendAt ? Date.parse(sendAt) : NaN;
  return Number.isFinite(timestamp) ? timestamp : Date.now();
};

const shouldShowBackendNotification = (row: BackendNotification, now: number): boolean => {
  if (!row.id) return false;

  const status = String(row.status || '').toLowerCase();
  if (status === 'cancelled') return false;

  const timestamp = parseNotificationTimestamp(row.send_at);
  if (status === 'pending' && timestamp > now) return false;

  return true;
};

const getWeekIdentifier = (date: Date) => {
  const startOfWeek = new Date(date);
  startOfWeek.setDate(date.getDate() - date.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  return startOfWeek.toISOString().split('T')[0];
};

const formatTimeAgo = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  const absDiff = Math.abs(diff);
  const minutes = Math.floor(absDiff / 60000);
  const hours = Math.floor(absDiff / 3600000);
  const days = Math.floor(absDiff / 86400000);

  if (minutes < 1) return 'Just now';

  if (diff < 0) {
    if (minutes < 60) return `In ${minutes} min`;
    if (hours < 24) return `In ${hours} hour${hours > 1 ? 's' : ''}`;
    return `In ${days} day${days > 1 ? 's' : ''}`;
  }

  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  return `${days} day${days > 1 ? 's' : ''} ago`;
};

const readStoredNotifications = (): Notification[] => {
  const saved = getUserItem('notifications');
  if (!saved) return [];

  try {
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((n: Partial<Notification>) => {
        const timestamp = Number(n.timestamp || Date.now());
        return {
          id: String(n.id || `local-${timestamp}`),
          title: String(n.title || 'Notification'),
          message: String(n.message || ''),
          timestamp,
          time: formatTimeAgo(timestamp),
          read: !!n.read,
          type: (n.type || 'info') as Notification['type'],
          source: 'local' as const,
          senderName: n.senderName ? String(n.senderName) : undefined,
          avatarUrl: n.avatarUrl ? String(n.avatarUrl) : null,
        };
      })
      .filter((n: Notification) => n.id && n.message);
  } catch (e) {
    console.error('Error loading notifications:', e);
    return [];
  }
};

const readStoredSet = (key: string): Set<string> => {
  const saved = getUserItem(key);
  if (!saved) return new Set();

  try {
    const parsed = JSON.parse(saved);
    return new Set(Array.isArray(parsed) ? parsed.map(String) : []);
  } catch (e) {
    console.error(`Error loading ${key}:`, e);
    return new Set();
  }
};

const parseBackendTemplate = (template?: string): {
  message: string;
  type?: string;
  deepLink?: string | null;
} => {
  const raw = (template || '').trim();
  if (!raw) return { message: '' };

  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return {
        message: String(parsed.message || parsed.text || raw),
        type: typeof parsed.type === 'string' ? parsed.type : undefined,
        deepLink: typeof parsed.deep_link === 'string' ? parsed.deep_link : null,
      };
    }
  } catch {
    // Plain text templates are expected for older records.
  }

  return { message: raw };
};

const titleForBackendNotification = (notification: BackendNotification, parsedType?: string) => {
  if (parsedType === 'session_reminder') return 'Study Session Reminder';
  if (notification.status === 'failed') return 'Notification Failed';
  if (notification.channel === 'email') return 'Email Reminder';
  if (notification.channel === 'push') return 'Push Notification';
  return 'Notification';
};

const typeForBackendNotification = (parsedType?: string): Notification['type'] => {
  if (parsedType === 'session_reminder') return 'session_reminder';
  return 'info';
};

const playNotificationSound = () => {
  try {
    const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextCtor) return;
    const context = new AudioContextCtor();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, context.currentTime);
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.08, context.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.24);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.25);
    oscillator.onended = () => {
      void context.close();
    };
  } catch {
    // Audio should never block notifications.
  }
};

export function useNotifications() {
  const [localNotifications, setLocalNotifications] = useState<Notification[]>(readStoredNotifications);
  const [backendRows, setBackendRows] = useState<BackendNotification[]>([]);
  const [readBackendIds, setReadBackendIds] = useState<Set<string>>(() => readStoredSet('readBackendNotifications'));
  const [hiddenBackendIds, setHiddenBackendIds] = useState<Set<string>>(() => readStoredSet('hiddenBackendNotifications'));
  const [notifiedSessions, setNotifiedSessions] = useState<Set<string>>(() => readStoredSet('notifiedSessions'));
  const [seenMessageNotificationIds, setSeenMessageNotificationIds] = useState<Set<string>>(() => readStoredSet('seenMessageNotifications'));
  const [timeTick, setTimeTick] = useState(0);

  const backendNotifications = useMemo(() => {
    void timeTick;
    const now = Date.now();

    return backendRows
      .filter((row) => shouldShowBackendNotification(row, now) && !hiddenBackendIds.has(String(row.id)))
      .map((row) => {
        const parsed = parseBackendTemplate(row.template);
        const timestamp = parseNotificationTimestamp(row.send_at);
        const message =
          row.status === 'failed' && row.error_message
            ? `${parsed.message || 'Notification could not be sent'}: ${row.error_message}`
            : parsed.message || 'Notification';

        return {
          id: `backend:${row.id}`,
          backendId: String(row.id),
          title: titleForBackendNotification(row, parsed.type),
          message,
          timestamp: Number.isFinite(timestamp) ? timestamp : Date.now(),
          time: '',
          read: readBackendIds.has(String(row.id)),
          type: typeForBackendNotification(parsed.type),
          source: 'backend' as const,
          deepLink: parsed.deepLink,
          status: row.status,
        };
      });
  }, [backendRows, hiddenBackendIds, readBackendIds, timeTick]);

  const notifications = useMemo(() => {
    void timeTick;

    return [...localNotifications, ...backendNotifications]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 50)
      .map((notification) => ({
        ...notification,
        time: formatTimeAgo(notification.timestamp),
      }));
  }, [backendNotifications, localNotifications, timeTick]);

  const addNotification = useCallback((notification: Notification) => {
    const timestamp = Number(notification.timestamp || Date.now());
    const normalized: Notification = {
      ...notification,
      timestamp,
      time: formatTimeAgo(timestamp),
      source: 'local',
    };

    setLocalNotifications((prev) => [
      normalized,
      ...prev.filter((n) => n.id !== normalized.id),
    ].slice(0, 50));
  }, []);

  const loadBackendNotifications = useCallback(async () => {
    const userId =
      localStorage.getItem('currentUserId') ||
      localStorage.getItem('userId') ||
      localStorage.getItem('user_id');

    if (!userId) {
      setBackendRows([]);
      return;
    }

    try {
      const rows = await apiJsonAuthed<BackendNotification[]>(
        `/notifications/?user_id=${encodeURIComponent(userId)}&limit=50&due_only=true`,
        'GET'
      );
      setBackendRows(Array.isArray(rows) ? rows : []);
    } catch (e) {
      console.warn('Failed to load backend notifications:', e);
    }
  }, []);

  useEffect(() => {
    loadBackendNotifications();

    const interval = setInterval(loadBackendNotifications, 60000);
    window.addEventListener('userChanged', loadBackendNotifications);

    return () => {
      clearInterval(interval);
      window.removeEventListener('userChanged', loadBackendNotifications);
    };
  }, [loadBackendNotifications]);

  // Update time ago strings periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeTick((tick) => tick + 1);
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Save notifications to localStorage
  useEffect(() => {
    setUserItem('notifications', JSON.stringify(localNotifications));
  }, [localNotifications]);

  useEffect(() => {
    setUserItem('readBackendNotifications', JSON.stringify([...readBackendIds]));
  }, [readBackendIds]);

  useEffect(() => {
    setUserItem('hiddenBackendNotifications', JSON.stringify([...hiddenBackendIds]));
  }, [hiddenBackendIds]);

  // Save notified sessions to localStorage
  useEffect(() => {
    setUserItem('notifiedSessions', JSON.stringify([...notifiedSessions]));
  }, [notifiedSessions]);

  useEffect(() => {
    setUserItem('seenMessageNotifications', JSON.stringify([...seenMessageNotificationIds]));
  }, [seenMessageNotificationIds]);

  // Check for upcoming sessions
  useEffect(() => {
    const checkSessions = () => {
      const now = new Date();
      const currentDay = now.getDay();
      const currentTime = now.getHours() * 60 + now.getMinutes();

      // Load calendar sessions
      const weekId = getWeekIdentifier(now);
      const loadedSessions = localStorage.getItem(getUserWeekKey(weekId));
      
      if (!loadedSessions) return;

      try {
        const sessions = JSON.parse(loadedSessions);
        
        sessions.forEach((session: any) => {
          if (session.day !== currentDay) return;

          const [startHour, startMinute] = session.startTime.split(':').map(Number);
          const sessionStartTime = startHour * 60 + startMinute;
          const timeDiff = sessionStartTime - currentTime;

          const sessionId = `${session.day}-${session.startTime}-${session.subject}`;
          const notificationId10 = `${sessionId}-10min`;
          const notificationIdStart = `${sessionId}-start`;

          if (timeDiff > 8 && timeDiff <= 10 && !notifiedSessions.has(notificationId10)) {
            const reminderTitle = i18n.t('notifications.studyReminder', 'Study session reminder');
            const reminderBody = i18n.t('notifications.studyReminderBody', {
              subject: session.subject,
              minutes: 10,
              defaultValue: `${session.subject} starts in 10 minutes`,
            });

            addNotification({
              id: notificationId10,
              title: reminderTitle,
              message: reminderBody,
              timestamp: Date.now(),
              time: 'Just now',
              read: false,
              type: 'session_reminder',
            });

            toast.info(reminderTitle, {
              description: reminderBody,
            });

            setNotifiedSessions((prev) => new Set([...prev, notificationId10]));
          }

          if (timeDiff >= -2 && timeDiff <= 2 && !notifiedSessions.has(notificationIdStart)) {
            const startedTitle = i18n.t('notifications.studyStarted', 'Study session started');
            const startedBody = i18n.t('notifications.studyStartedBody', {
              subject: session.subject,
              defaultValue: `${session.subject} is starting now`,
            });

            addNotification({
              id: notificationIdStart,
              title: startedTitle,
              message: startedBody,
              timestamp: Date.now(),
              time: 'Just now',
              read: false,
              type: 'session_started',
            });

            toast.success(startedTitle, {
              description: startedBody,
            });

            setNotifiedSessions((prev) => new Set([...prev, notificationIdStart]));
          }
        });
      } catch (e) {
        console.error('Error checking sessions:', e);
      }
    };

    // Check immediately
    checkSessions();

    // Check every minute
    const interval = setInterval(checkSessions, 60000);

    // Reset notified sessions at midnight
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const timeUntilMidnight = tomorrow.getTime() - now.getTime();

    const midnightTimeout = setTimeout(() => {
      setNotifiedSessions(new Set());
      // Set up daily reset
      setInterval(() => {
        setNotifiedSessions(new Set());
      }, 86400000); // 24 hours
    }, timeUntilMidnight);

    return () => {
      clearInterval(interval);
      clearTimeout(midnightTimeout);
    };
  }, [notifiedSessions]);

  useEffect(() => {
    const checkMessages = async () => {
      const currentUserId =
        localStorage.getItem('currentUserId') ||
        localStorage.getItem('userId') ||
        localStorage.getItem('user_id');

      if (!currentUserId) return;

      try {
        const conversations = await apiJsonAuthed<DirectConversationNotification[]>(
          `/user/${encodeURIComponent(currentUserId)}/conversations`,
          'GET'
        );

        if (!Array.isArray(conversations)) return;

        conversations.forEach((conversation) => {
          const unreadCount = Number(conversation.unread_count || 0);
          const lastMessage = conversation.last_message;
          const senderId = String(lastMessage?.sender_id || '');
          const isIncoming = !!senderId && senderId !== String(currentUserId);
          const messageId = lastMessage?.id;

          if (!unreadCount || !lastMessage?.content || !isIncoming || !messageId) return;

          const notificationId = `message:${conversation.friend.id}:${messageId}`;
          if (seenMessageNotificationIds.has(notificationId)) return;

          const senderName =
            conversation.nickname ||
            conversation.friend.full_name ||
            conversation.friend.username ||
            conversation.friend.email ||
            'New message';

          const avatarUrl = conversation.friend.profile_picture_url
            ? `${import.meta.env.VITE_API_BASE_URL}${conversation.friend.profile_picture_url}`
            : null;
          const timestamp = lastMessage.created_at ? Date.parse(lastMessage.created_at) : Date.now();

          const notification: Notification = {
            id: notificationId,
            title: senderName,
            message: String(lastMessage.content),
            timestamp: Number.isFinite(timestamp) ? timestamp : Date.now(),
            time: 'Just now',
            read: false,
            type: 'message',
            source: 'local',
            senderName,
            avatarUrl,
            deepLink: `?page=messages`,
          };

          addNotification(notification);
          toast.info(senderName, {
            description: notification.message,
          });
          playNotificationSound();

          if (typeof window !== 'undefined' && 'Notification' in window) {
            if (Notification.permission === 'granted') {
              const browserNotification = new Notification(senderName, {
                body: notification.message,
                icon: avatarUrl || undefined,
                tag: notificationId,
              });
              browserNotification.onclick = () => {
                window.focus();
              };
            } else if (Notification.permission === 'default') {
              void Notification.requestPermission();
            }
          }

          setSeenMessageNotificationIds((prev) => new Set([...prev, notificationId]));
        });
      } catch (e) {
        console.warn('Failed to load direct message notifications:', e);
      }
    };

    void checkMessages();
    const interval = window.setInterval(() => {
      void checkMessages();
    }, 15000);
    window.addEventListener('focus', checkMessages);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', checkMessages);
    };
  }, [addNotification, seenMessageNotificationIds]);

  const markAllAsRead = () => {
    setLocalNotifications((prev) =>
      prev.map((n) => ({ ...n, read: true }))
    );
    setReadBackendIds((prev) => {
      const next = new Set(prev);
      const now = Date.now();
      backendRows.forEach((row) => {
        if (shouldShowBackendNotification(row, now) && !hiddenBackendIds.has(String(row.id))) {
          next.add(String(row.id));
        }
      });
      return next;
    });
  };

  const clearNotification = (id: string) => {
    if (id.startsWith('backend:')) {
      const backendId = id.slice('backend:'.length);
      setHiddenBackendIds((prev) => new Set([...prev, backendId]));
      return;
    }

    setLocalNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    addNotification,
    markAllAsRead,
    clearNotification,
    unreadCount,
  };
}
