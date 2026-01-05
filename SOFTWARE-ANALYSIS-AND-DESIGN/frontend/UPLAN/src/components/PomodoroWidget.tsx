import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Timer, Play, Pause, X, ChevronDown, SkipForward, Settings, Maximize2, Minimize2, Sun, Moon, Eye, Focus, Link2, Unlink, Pin, PinOff } from 'lucide-react';
import { usePomodoro } from '../contexts/PomodoroContext';
import { setUserItem } from '../utils/userStorage';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Switch } from './ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface PomodoroWidgetProps {
  show: boolean;
  onClose: () => void;
}

export default function PomodoroWidget({ show, onClose }: PomodoroWidgetProps) {
  const {
    isActive,
    time,
    totalTime,
    mode,
    sessionCount,
    isFocusMode,
    isFloating,
    isPinned,
    theme,
    linkedTaskId,
    linkedTaskName,
    start,
    pause,
    reset,
    skip,
    setMode,
    setTheme,
    toggleFocusMode,
    toggleFloating,
    togglePinned,
    unlinkTask,
    settings,
    updateSettings,
    stats,
  } = usePomodoro();

  const handleClose = () => {
    // Manual end: stop the timer and close the widget (persists across refresh).
    try {
      pause();
      reset();
      unlinkTask();
    } catch {
      // ignore
    }

    try {
      setUserItem('pomodoroWidgetOpen', 'false');
    } catch {
      // ignore
    }

    try {
      window.dispatchEvent(new CustomEvent('pomodoro:close'));
    } catch {
      // ignore
    }

    onClose();
  };

  const [isExpanded, setIsExpanded] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: window.innerWidth - 400, y: 24 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const widgetRef = useRef<HTMLDivElement>(null);

  // Auto-minimize when pinned
  useEffect(() => {
    if (isPinned) {
      setIsExpanded(false);
    }
  }, [isPinned]);

  // Handle mouse down for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    // Allow dragging when pinned or floating
    if (!isPinned && !isFloating) return;
    
    const target = e.target as HTMLElement;
    // Don't interfere with buttons, inputs, or interactive elements
    if (target.closest('button, input, select, textarea, [role="dialog"]')) return;

    setIsDragging(true);
    const rect = widgetRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
    e.preventDefault();
  };

  // Handle mouse move for dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Allow dragging when pinned or floating
      if (!isDragging || (!isPinned && !isFloating)) return;

      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;

      const maxX = window.innerWidth - (widgetRef.current?.offsetWidth || 380);
      const maxY = window.innerHeight - (widgetRef.current?.offsetHeight || 400);

      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, isFloating, isPinned]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const getProgress = () => {
    // totalTime comes from the context and supports custom durations (e.g., remaining session time)
    const fallbackTotal = mode === 'focus'
      ? settings.focusDuration * 60
      : mode === 'break'
      ? settings.breakDuration * 60
      : settings.longBreakDuration * 60;

    const total = totalTime > 0 ? totalTime : fallbackTotal;
    return total > 0 ? ((total - time) / total) * 100 : 0;
  };

  const getModeColor = () => {
    switch (mode) {
      case 'focus':
        return 'text-blue-600 dark:text-blue-400';
      case 'break':
        return 'text-green-600 dark:text-green-400';
      case 'longBreak':
        return 'text-purple-600 dark:text-purple-400';
    }
  };

  const getModeLabel = () => {
    switch (mode) {
      case 'focus':
        return 'Focus';
      case 'break':
        return 'Break';
      case 'longBreak':
        return 'Long Break';
    }
  };

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="h-4 w-4" />;
      case 'dark':
        return <Moon className="h-4 w-4" />;
      case 'muted':
        return <Eye className="h-4 w-4" />;
      case 'focus':
        return <Focus className="h-4 w-4" />;
    }
  };

  if (!show) return null;

  // Focus Mode - Full Screen
  if (isFocusMode) {
    return (
      <div className="fixed inset-0 z-50 bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          {/* Circular Progress Ring */}
          <div className="relative w-96 h-96 mb-8">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="192"
                cy="192"
                r="180"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-white/20"
              />
              <circle
                cx="192"
                cy="192"
                r="180"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 180}`}
                strokeDashoffset={`${2 * Math.PI * 180 * (1 - getProgress() / 100)}`}
                className={`${getModeColor()} transition-all duration-1000 ease-linear`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-9xl font-bold mb-4 tabular-nums">
                {formatTime(time)}
              </div>
              <Badge className="text-2xl px-6 py-2 bg-white/20 text-white border-white/30">
                {getModeLabel()}
              </Badge>
              {linkedTaskName && (
                <div className="mt-4 text-xl text-white/80 flex items-center gap-2">
                  <Link2 className="h-5 w-5" />
                  {linkedTaskName}
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4">
            <Button
              onClick={isActive ? pause : start}
              size="lg"
              className="bg-blue-500 hover:bg-blue-600 text-white px-12 py-6 text-xl"
            >
              {isActive ? <Pause className="h-8 w-8 mr-3" /> : <Play className="h-8 w-8 mr-3" />}
              {isActive ? 'Pause' : 'Start'}
            </Button>
            <Button
              onClick={reset}
              size="lg"
              variant="outline"
              className="bg-transparent border-2 border-white/50 text-white hover:bg-white/10 hover:border-white px-8 py-6 text-xl"
            >
              <SkipForward className="h-6 w-6 mr-2" />
              Reset
            </Button>
            <Button
              onClick={toggleFocusMode}
              size="lg"
              variant="outline"
              className="bg-transparent border-2 border-white/50 text-white hover:bg-white/10 hover:border-white px-8 py-6 text-xl"
            >
              <Minimize2 className="h-6 w-6 mr-2" />
              Exit
            </Button>
          </div>

          {/* Stats */}
          <div className="mt-12 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div>
              <div className="text-5xl font-bold">{sessionCount}</div>
              <div className="text-white/60 mt-2">Sessions Today</div>
            </div>
            <div>
              <div className="text-5xl font-bold">{stats.totalFocusSessions}</div>
              <div className="text-white/60 mt-2">Total Sessions</div>
            </div>
            <div>
              <div className="text-5xl font-bold">{Math.round(stats.totalFocusTime / 60)}h</div>
              <div className="text-white/60 mt-2">Focus Time</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Normal Widget View
  return (
    <div
      ref={widgetRef}
      className={`z-50 ${ 
        isPinned || isFloating
          ? 'fixed' 
          : 'fixed bottom-6 right-6 animate-in slide-in-from-bottom-5 duration-300'
      } ${isDragging ? 'cursor-grabbing' : (isPinned || isFloating) ? 'cursor-grab' : ''}`}
      style={(isPinned || isFloating) ? { 
        left: `${position.x}px`, 
        top: `${position.y}px`,
        transition: isDragging ? 'none' : 'all 0.3s ease'
      } : undefined}
      onMouseDown={handleMouseDown}
    >
      <div className="relative">
        {/* Close button */}
        <Button
          size="sm"
          variant="ghost"
          className="absolute -top-2 -right-2 z-10 h-7 w-7 p-0 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg border-2 border-white"
          onClick={handleClose}
          title="Close timer"
        >
          <X className="h-4 w-4" />
        </Button>

        <Card className="border-2 border-blue-500 shadow-2xl bg-gray-800 w-[380px] overflow-hidden">
          {/* Header */}
          <CardHeader className={`bg-transparent border-b border-gray-700 px-4 py-3 ${
            (isPinned || isFloating) ? 'cursor-grab active:cursor-grabbing' : ''
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Timer className="h-5 w-5 text-blue-400" />
                <span className="font-semibold text-white">Pomodoro Timer</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge 
                  className={`${
                    mode === 'focus' 
                      ? 'bg-blue-500/20 text-blue-300 border-blue-400/50' 
                      : mode === 'break'
                      ? 'bg-green-500/20 text-green-300 border-green-400/50'
                      : 'bg-purple-500/20 text-purple-300 border-purple-400/50'
                  } border`}
                >
                  {getModeLabel()}
                </Badge>
                {!isPinned && (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 hover:bg-gray-700 text-blue-300"
                      onClick={() => setShowSettings(true)}
                      title="Settings"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 hover:bg-gray-700 text-blue-300"
                      onClick={toggleFocusMode}
                      title="Focus mode"
                    >
                      <Maximize2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
                {isPinned && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 hover:bg-gray-700 text-blue-300"
                    onClick={() => setIsExpanded(!isExpanded)}
                    title={isExpanded ? "Minimize" : "Expand"}
                  >
                    <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          
          {/* Body - Minimized View (when pinned and not expanded) */}
          {isPinned && !isExpanded && (
            <CardContent className="p-4 bg-transparent">
              <div className="text-center">
                {/* Compact Timer Display */}
                <div className="text-5xl font-bold text-white tabular-nums tracking-tight mb-3">
                  {formatTime(time)}
                </div>
                
                {/* Compact Control Buttons */}
                <div className="flex items-center justify-center gap-2">
                  <Button
                    onClick={isActive ? pause : start}
                    size="sm"
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4"
                  >
                    {isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  <Button 
                    size="sm"
                    variant="outline" 
                    onClick={reset}
                    className="border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white px-4"
                  >
                    <SkipForward className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          )}

          {/* Body - Full View (when not pinned or expanded) */}
          {(!isPinned || isExpanded) && (
            <CardContent className="p-8 bg-transparent">
              <div className="text-center">
                {/* Large Timer Display */}
                <div className="mb-8">
                  <div className="text-8xl font-bold text-white tabular-nums tracking-tight">
                    {formatTime(time)}
                  </div>
                </div>

                {/* Mode Switcher Buttons */}
                <div className="flex items-center justify-center gap-2 mb-6">
                  <Button
                    size="sm"
                    variant={mode === 'focus' ? 'default' : 'outline'}
                    onClick={() => setMode('focus')}
                    className={mode === 'focus' 
                      ? 'bg-blue-500 hover:bg-blue-600 text-white border-0' 
                      : 'bg-blue-900/30 border-blue-700 text-blue-300 hover:bg-blue-800/50 hover:text-white'
                    }
                  >
                    Focus
                  </Button>
                  <Button
                    size="sm"
                    variant={mode === 'break' ? 'default' : 'outline'}
                    onClick={() => setMode('break')}
                    className={mode === 'break' 
                      ? 'bg-green-500 hover:bg-green-600 text-white border-0' 
                      : 'bg-blue-900/30 border-blue-700 text-blue-300 hover:bg-blue-800/50 hover:text-white'
                    }
                  >
                    Break
                  </Button>
                  <Button
                    size="sm"
                    variant={mode === 'longBreak' ? 'default' : 'outline'}
                    onClick={() => setMode('longBreak')}
                    className={mode === 'longBreak' 
                      ? 'bg-purple-500 hover:bg-purple-600 text-white border-0' 
                      : 'bg-blue-900/30 border-blue-700 text-blue-300 hover:bg-blue-800/50 hover:text-white'
                    }
                  >
                    Long Break
                  </Button>
                </div>

                {/* Control Buttons */}
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Button
                    onClick={isActive ? pause : start}
                    size="lg"
                    className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-6 text-lg"
                  >
                    {isActive ? <Pause className="h-5 w-5 mr-2" /> : <Play className="h-5 w-5 mr-2" />}
                    {isActive ? 'Pause' : 'Start'}
                  </Button>
                  <Button 
                    size="lg"
                    variant="outline" 
                    onClick={reset}
                    className="border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white px-8 py-6 text-lg"
                  >
                    <SkipForward className="h-5 w-5 mr-2" />
                    Reset
                  </Button>
                </div>

                {/* Pin/Settings/Focus Buttons */}
                <div className="flex items-center justify-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={togglePinned}
                    className={`${
                      isPinned 
                        ? 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30' 
                        : 'text-blue-300 hover:bg-gray-700'
                    } transition-all`}
                    title={isPinned ? 'Unpin widget (will close on navigation)' : 'Pin widget (stays open on navigation)'}
                  >
                    {isPinned ? <Pin className="h-4 w-4 mr-2 fill-current" /> : <PinOff className="h-4 w-4 mr-2" />}
                    {isPinned ? 'Pinned' : 'Pin'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-blue-300 hover:bg-gray-700"
                    onClick={() => setShowSettings(true)}
                    title="Settings"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-blue-300 hover:bg-gray-700"
                    onClick={toggleFocusMode}
                    title="Focus mode"
                  >
                    <Maximize2 className="h-4 w-4 mr-2" />
                    Focus
                  </Button>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Pomodoro Settings</DialogTitle>
            <DialogDescription>
              Customize your Pomodoro timer preferences
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 mt-4">
            {/* Durations */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Durations (minutes)</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Focus</Label>
                  <Input
                    type="number"
                    min="1"
                    max="60"
                    value={settings.focusDuration}
                    onChange={(e) => updateSettings({ focusDuration: parseInt(e.target.value) || 25 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Break</Label>
                  <Input
                    type="number"
                    min="1"
                    max="30"
                    value={settings.breakDuration}
                    onChange={(e) => updateSettings({ breakDuration: parseInt(e.target.value) || 5 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Long Break</Label>
                  <Input
                    type="number"
                    min="1"
                    max="60"
                    value={settings.longBreakDuration}
                    onChange={(e) => updateSettings({ longBreakDuration: parseInt(e.target.value) || 15 })}
                  />
                </div>
              </div>
            </div>

            {/* Auto-start */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm">Auto-start</h3>
              <div className="flex items-center justify-between">
                <Label>Auto-start breaks</Label>
                <Switch
                  checked={settings.autoStartBreaks}
                  onCheckedChange={(checked) => updateSettings({ autoStartBreaks: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Auto-start pomodoros</Label>
                <Switch
                  checked={settings.autoStartPomodoros}
                  onCheckedChange={(checked) => updateSettings({ autoStartPomodoros: checked })}
                />
              </div>
            </div>

            {/* Notifications */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm">Notifications</h3>
              <div className="flex items-center justify-between">
                <Label>Desktop notifications</Label>
                <Switch
                  checked={settings.notifications}
                  onCheckedChange={(checked) => updateSettings({ notifications: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Sound alerts</Label>
                <Switch
                  checked={settings.soundEnabled}
                  onCheckedChange={(checked) => updateSettings({ soundEnabled: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Vibration (mobile)</Label>
                <Switch
                  checked={settings.vibrationEnabled}
                  onCheckedChange={(checked) => updateSettings({ vibrationEnabled: checked })}
                />
              </div>
            </div>

            {/* Long break interval */}
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Session settings</h3>
              <Label>Long break after every</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="2"
                  max="10"
                  value={settings.longBreakInterval}
                  onChange={(e) => updateSettings({ longBreakInterval: parseInt(e.target.value) || 4 })}
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">focus sessions</span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}