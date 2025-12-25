import { useState, useEffect } from 'react';
import { Bell, Plus, X, Clock, Calendar, Trash2, Check } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from './ui/dialog';
import { Switch } from './ui/switch';
import { toast } from 'sonner@2.0.3';

interface Reminder {
  id: string;
  title: string;
  description: string;
  time: string;
  days: string[];
  enabled: boolean;
  type: 'study' | 'break' | 'exam' | 'custom';
}

const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function Reminders() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [newReminder, setNewReminder] = useState<Partial<Reminder>>({
    title: '',
    description: '',
    time: '09:00',
    days: [],
    type: 'study',
    enabled: true,
  });

  // Load reminders from localStorage
  useEffect(() => {
    const savedReminders = localStorage.getItem('reminders');
    const savedNotificationsEnabled = localStorage.getItem('notificationsEnabled');
    
    if (savedReminders) {
      setReminders(JSON.parse(savedReminders));
    }
    
    if (savedNotificationsEnabled === 'true') {
      setNotificationsEnabled(true);
      requestNotificationPermission();
    }
  }, []);

  // Save reminders to localStorage
  useEffect(() => {
    if (reminders.length > 0 || localStorage.getItem('reminders')) {
      localStorage.setItem('reminders', JSON.stringify(reminders));
    }
  }, [reminders]);

  // Request notification permission
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        toast.success('Notifications enabled!');
      } else {
        toast.error('Notification permission denied');
        setNotificationsEnabled(false);
      }
    } else {
      toast.error('Notifications not supported in this browser');
      setNotificationsEnabled(false);
    }
  };

  // Toggle notifications
  const toggleNotifications = async (enabled: boolean) => {
    if (enabled) {
      await requestNotificationPermission();
    }
    setNotificationsEnabled(enabled);
    localStorage.setItem('notificationsEnabled', enabled.toString());
  };

  // Check and show notifications
  useEffect(() => {
    if (!notificationsEnabled) return;

    const checkReminders = () => {
      const now = new Date();
      const currentDay = weekDays[now.getDay() === 0 ? 6 : now.getDay() - 1]; // Adjust for Sunday
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      reminders.forEach(reminder => {
        if (
          reminder.enabled &&
          reminder.days.includes(currentDay) &&
          reminder.time === currentTime
        ) {
          showNotification(reminder);
        }
      });
    };

    const interval = setInterval(checkReminders, 60000); // Check every minute
    checkReminders(); // Check immediately

    return () => clearInterval(interval);
  }, [reminders, notificationsEnabled]);

  // Show browser notification
  const showNotification = (reminder: Reminder) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(reminder.title, {
        body: reminder.description,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
      });
      
      // Also show a toast
      toast.info(`🔔 ${reminder.title}`, {
        description: reminder.description,
      });
    }
  };

  // Add reminder
  const handleAddReminder = () => {
    if (!newReminder.title || !newReminder.time || !newReminder.days || newReminder.days.length === 0) {
      toast.error('Please fill in all required fields and select at least one day');
      return;
    }

    const reminder: Reminder = {
      id: Date.now().toString(),
      title: newReminder.title,
      description: newReminder.description || '',
      time: newReminder.time,
      days: newReminder.days,
      type: newReminder.type || 'study',
      enabled: true,
    };

    setReminders([...reminders, reminder]);
    setNewReminder({
      title: '',
      description: '',
      time: '09:00',
      days: [],
      type: 'study',
      enabled: true,
    });
    setIsAddDialogOpen(false);
    toast.success('Reminder added successfully!');
  };

  // Delete reminder
  const deleteReminder = (id: string) => {
    setReminders(reminders.filter(r => r.id !== id));
    toast.success('Reminder deleted');
  };

  // Toggle reminder enabled
  const toggleReminder = (id: string) => {
    setReminders(reminders.map(r => 
      r.id === id ? { ...r, enabled: !r.enabled } : r
    ));
  };

  // Toggle day selection
  const toggleDay = (day: string) => {
    const currentDays = newReminder.days || [];
    setNewReminder({
      ...newReminder,
      days: currentDays.includes(day)
        ? currentDays.filter(d => d !== day)
        : [...currentDays, day]
    });
  };

  // Get type color
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'study': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'break': return 'bg-green-100 text-green-800 border-green-300';
      case 'exam': return 'bg-red-100 text-red-800 border-red-300';
      case 'custom': return 'bg-purple-100 text-purple-800 border-purple-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // Preset reminders
  const presetReminders = [
    {
      title: 'Morning Study Session',
      description: 'Time to start your morning study session!',
      time: '09:00',
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      type: 'study' as const,
    },
    {
      title: 'Afternoon Study Session',
      description: 'Don\'t forget your afternoon study time!',
      time: '14:00',
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      type: 'study' as const,
    },
    {
      title: 'Take a Break',
      description: 'Time for a well-deserved break!',
      time: '11:00',
      days: weekDays,
      type: 'break' as const,
    },
  ];

  const addPresetReminder = (preset: typeof presetReminders[0]) => {
    const reminder: Reminder = {
      id: Date.now().toString(),
      ...preset,
      enabled: true,
    };
    setReminders([...reminders, reminder]);
    toast.success('Preset reminder added!');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-blue-600 dark:text-blue-400">Reminders & Notifications</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Set up reminders for your study sessions and important tasks
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Add Reminder
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Reminder</DialogTitle>
              <DialogDescription>
                Set up a new reminder to stay on top of your study schedule.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={newReminder.title}
                  onChange={(e) => setNewReminder({ ...newReminder, title: e.target.value })}
                  placeholder="e.g., Study Mathematics"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={newReminder.description}
                  onChange={(e) => setNewReminder({ ...newReminder, description: e.target.value })}
                  placeholder="Additional details..."
                />
              </div>
              <div>
                <Label htmlFor="time">Time *</Label>
                <Input
                  id="time"
                  type="time"
                  value={newReminder.time}
                  onChange={(e) => setNewReminder({ ...newReminder, time: e.target.value })}
                />
              </div>
              <div>
                <Label>Type</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {['study', 'break', 'exam', 'custom'].map((type) => (
                    <Button
                      key={type}
                      type="button"
                      variant={newReminder.type === type ? 'default' : 'outline'}
                      onClick={() => setNewReminder({ ...newReminder, type: type as Reminder['type'] })}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Repeat on *</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {weekDays.map((day) => (
                    <Button
                      key={day}
                      type="button"
                      variant={(newReminder.days || []).includes(day) ? 'default' : 'outline'}
                      onClick={() => toggleDay(day)}
                      className="justify-start"
                    >
                      {day.slice(0, 3)}
                    </Button>
                  ))}
                </div>
              </div>
              <Button 
                onClick={handleAddReminder}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                Create Reminder
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-gray-100">Notification Settings</CardTitle>
          <CardDescription>
            Enable browser notifications to receive reminders
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-gray-900 dark:text-gray-100">Browser Notifications</p>
                <p className="text-gray-600 dark:text-gray-400">
                  Get notified about your scheduled reminders
                </p>
              </div>
            </div>
            <Switch
              checked={notificationsEnabled}
              onCheckedChange={toggleNotifications}
            />
          </div>
        </CardContent>
      </Card>

      {/* Preset Reminders */}
      <div>
        <h2 className="mb-4 text-gray-900 dark:text-gray-100">Quick Add Presets</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {presetReminders.map((preset, index) => (
            <Card key={index} className="cursor-pointer hover:border-blue-500 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-gray-900 dark:text-gray-100">{preset.title}</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => addPresetReminder(preset)}
                    className="text-blue-600 hover:text-blue-700 -mt-2 -mr-2"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-3">{preset.description}</p>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">{preset.time}</span>
                </div>
                <Badge className={`mt-2 ${getTypeColor(preset.type)}`}>
                  {preset.type.charAt(0).toUpperCase() + preset.type.slice(1)}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Active Reminders */}
      <div>
        <h2 className="mb-4 text-gray-900 dark:text-gray-100">Your Reminders</h2>
        {reminders.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Bell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">No reminders set</p>
              <p className="text-gray-400 mt-2">Create your first reminder or add a preset</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {reminders.map((reminder) => (
              <Card key={reminder.id} className={reminder.enabled ? '' : 'opacity-60'}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-gray-900 dark:text-gray-100">{reminder.title}</h3>
                        <Badge className={getTypeColor(reminder.type)}>
                          {reminder.type}
                        </Badge>
                      </div>
                      {reminder.description && (
                        <p className="text-gray-600 dark:text-gray-400">{reminder.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={reminder.enabled}
                        onCheckedChange={() => toggleReminder(reminder.id)}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteReminder(reminder.id)}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-3 pb-3 border-b">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-400">{reminder.time}</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {reminder.days.map((day) => (
                      <Badge key={day} variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                        {day.slice(0, 3)}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Info Card */}
      <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <Bell className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-blue-900 dark:text-blue-100">
                <strong>Tip:</strong> Make sure to allow notifications in your browser settings for the best experience.
              </p>
              <p className="text-blue-700 dark:text-blue-300 mt-1">
                Reminders will work even when the app is running in the background.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
