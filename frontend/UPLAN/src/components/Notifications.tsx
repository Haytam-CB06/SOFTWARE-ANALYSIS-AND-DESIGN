import React from 'react';
import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useNotifications } from '../src/hooks/useNotifications';

export default function Notifications() {
  const { notifications, unreadCount, markAllAsRead, clearNotification } = useNotifications();

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notifications
          {unreadCount > 0 && <Badge variant="destructive" className="ml-2">{unreadCount}</Badge>}
        </CardTitle>

        <Button
          variant="outline"
          size="sm"
          onClick={markAllAsRead}
          disabled={notifications.length === 0 || unreadCount === 0}
        >
          <CheckCheck className="h-4 w-4 mr-2" />
          Mark read
        </Button>
      </CardHeader>

      <CardContent className="space-y-3">
        {notifications.length === 0 ? (
          <div className="text-sm text-gray-500">No notifications</div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`flex items-start justify-between gap-3 rounded-lg border p-3 ${
                n.read ? 'bg-white' : 'bg-blue-50'
              }`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-semibold text-gray-900">{n.title}</div>
                  <div className="text-xs text-gray-500">{n.time}</div>
                  {!n.read && <Badge variant="outline">New</Badge>}
                </div>
                <div className="text-sm text-gray-700 mt-1 break-words">{n.message}</div>
              </div>

              <Button variant="ghost" size="icon" onClick={() => clearNotification(n.id)} title="Clear">
                <Trash2 className="h-4 w-4 text-gray-500" />
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
