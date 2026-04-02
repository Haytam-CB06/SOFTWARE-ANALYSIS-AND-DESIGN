import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getUserItem, setUserItem, getUserWeekKey } from '../../utils/userStorage';

export interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  timestamp: number;
  read: boolean;
  type: 'session_reminder' | 'session_started' | 'timetable_updated' | 'info';
}

const getWeekIdentifier = (date: Date) => {
  const startOfWeek = new Date(date);
  startOfWeek.setDate(date.getDate() - date.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  return startOfWeek.toISOString().split('T')[0];
};

const formatTimeAgo = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  return `${days} day${days > 1 ? 's' : ''} ago`;
};

const getDayName = (dayIndex: number): string => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayIndex];
};

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifiedSessions, setNotifiedSessions] = useState<Set<string>>(new Set());

  // Load notifications from localStorage
  useEffect(() => {
    const loadNotifications = () => {
      const saved = getUserItem('notifications');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // Update time ago strings
          const updated = parsed.map((n: Notification) => ({
            ...n,
            time: formatTimeAgo(n.timestamp),
          }));
          setNotifications(updated);
        } catch (e) {
          console.error('Error loading notifications:', e);
          setNotifications([]);
        }
      }

      const savedNotified = getUserItem('notifiedSessions');
      if (savedNotified) {
        try {
          setNotifiedSessions(new Set(JSON.parse(savedNotified)));
        } catch (e) {
          console.error('Error loading notified sessions:', e);
        }
      }
    };

    loadNotifications();
  }, []);

  // Update time ago strings periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          time: formatTimeAgo(n.timestamp),
        }))
      );
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Save notifications to localStorage
  useEffect(() => {
    setUserItem('notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Save notified sessions to localStorage
  useEffect(() => {
    setUserItem('notifiedSessions', JSON.stringify([...notifiedSessions]));
  }, [notifiedSessions]);

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
          const notificationId30 = `${sessionId}-30min`;
          const notificationIdStart = `${sessionId}-start`;

          // Notification 30 minutes before
          if (timeDiff > 28 && timeDiff <= 30 && !notifiedSessions.has(notificationId30)) {
            addNotification({
              id: notificationId30,
              title: 'Study Session Reminder',
              message: `${session.subject} study session starts in 30 minutes`,
              timestamp: Date.now(),
              time: 'Just now',
              read: false,
              type: 'session_reminder',
            });

            // Show toast notification
            toast.info(' Study Session Reminder', {
              description: `${session.subject} study session starts in 30 minutes`,
            });

            setNotifiedSessions((prev) => new Set([...prev, notificationId30]));
          }

          // Notification when session starts
          if (timeDiff >= -2 && timeDiff <= 2 && !notifiedSessions.has(notificationIdStart)) {
            addNotification({
              id: notificationIdStart,
              title: 'Study Session Started',
              message: `${session.subject} study session is starting now!`,
              timestamp: Date.now(),
              time: 'Just now',
              read: false,
              type: 'session_started',
            });

            // Show toast notification
            toast.success(' Study Session Started!', {
              description: `${session.subject} study session is starting now!`,
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

  const addNotification = (notification: Notification) => {
    setNotifications((prev) => [notification, ...prev]);
  };

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read: true }))
    );
  };

  const clearNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
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
