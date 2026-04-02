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
import { useTranslation } from 'react-i18next';

interface PomodoroWidgetProps {
  show: boolean;
  onClose: () => void;
}

export default function PomodoroWidget({ show, onClose }: PomodoroWidgetProps) {
  const { t } = useTranslation();

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

  useEffect(() => {
    if (isPinned) {
      setIsExpanded(false);
    }
  }, [isPinned]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isPinned && !isFloating) return;

    const target = e.target as HTMLElement;
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

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
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
        return 'text-blue-700 dark:text-blue-400';
      case 'break':
        return 'text-green-600 dark:text-green-400';
      case 'longBreak':
        return 'text-purple-600 dark:text-purple-400';
    }
  };

  const getModeLabel = () => {
  switch (mode) {
    case 'focus':
      return t('pomodoro.modes.focus');
    case 'break':
      return t('pomodoro.modes.break');
    case 'longBreak':
      return t('pomodoro.modes.longBreak');
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

  if (isFocusMode) {
    return (
      <div className="fixed inset-0 z-50 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_30%),radial-gradient(circle_at_bottom,_rgba(168,85,247,0.16),_transparent_28%)] bg-slate-950 text-white">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-3 sm:px-6">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.18em] text-white/50">
                {t('pomodoro.modes.focus')}
              </p>
              <div className="mt-1 flex items-center gap-2">
                <Badge className="rounded-full border-white/10 bg-white/10 px-3 py-1 text-white">
                  {getModeLabel()}
                </Badge>
                {linkedTaskName && (
                  <div className="min-w-0 max-w-[55vw] truncate text-sm text-white/70 sm:max-w-none">
                    {linkedTaskName}
                  </div>
                )}
              </div>
            </div>

            <Button
              onClick={toggleFocusMode}
              size="icon"
              variant="ghost"
              className="h-11 w-11 rounded-full border border-white/10 bg-white/5 text-white hover:bg-white/10"
            >
              <Minimize2 className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex flex-1 items-center justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6">
            <div className="w-full max-w-5xl">
              <div className="grid items-center gap-8 lg:grid-cols-[1fr_auto_1fr]">
                <div className="hidden lg:block">
                  <div className="space-y-4 rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur">
                    <div>
                      <p className="text-sm text-white/60">{t('pomodoro.sessionsToday')}</p>
                      <p className="mt-1 text-4xl font-semibold">{sessionCount}</p>
                    </div>
                    <div>
                      <p className="text-sm text-white/60">{t('pomodoro.totalSessions')}</p>
                      <p className="mt-1 text-4xl font-semibold">{stats.totalFocusSessions}</p>
                    </div>
                    <div>
                      <p className="text-sm text-white/60">{t('pomodoro.focusTime')}</p>
                      <p className="mt-1 text-4xl font-semibold">
                        {Math.round(stats.totalFocusTime / 60)}h
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mx-auto w-full max-w-[360px] sm:max-w-[430px] lg:max-w-[520px]">
                  <div className="relative aspect-square">
                    <svg className="h-full w-full -rotate-90" viewBox="0 0 220 220">
                      <circle
                        cx="110"
                        cy="110"
                        r="96"
                        stroke="currentColor"
                        strokeWidth="10"
                        fill="none"
                        className="text-white/10"
                      />
                      <circle
                        cx="110"
                        cy="110"
                        r="96"
                        stroke="currentColor"
                        strokeWidth="10"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 96}`}
                        strokeDashoffset={`${
                          2 * Math.PI * 96 * (1 - getProgress() / 100)
                        }`}
                        className={`${getModeColor()} transition-all duration-1000 ease-linear drop-shadow-[0_0_10px_rgba(255,255,255,0.15)]`}
                        strokeLinecap="round"
                      />
                    </svg>

                    <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
                      <div className="text-[3rem] font-semibold leading-none tracking-tight tabular-nums sm:text-[4.5rem] lg:text-[5.5rem]">
                        {formatTime(time)}
                      </div>

                      <div className="mt-3 text-sm text-white/60 sm:text-base">
                        {isActive ? t('pomodoro.stayWithIt') : t('pomodoro.readyWhenYouAre')}
                      </div>

                      {linkedTaskName && (
                        <div className="mt-4 inline-flex max-w-[85%] items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-xs text-white/80 sm:text-sm">
                          <Link2 className="h-4 w-4 shrink-0" />
                          <span className="truncate">{linkedTaskName}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-3 sm:flex sm:items-center sm:justify-center">
                    <Button
                      onClick={isActive ? pause : start}
                      size="lg"
                      className="col-span-2 h-12 rounded-2xl bg-blue-500 px-6 text-base text-white hover:bg-blue-700 sm:col-span-1 sm:h-14 sm:px-8 sm:text-lg"
                    >
                      {isActive ? (
                        <Pause className="mr-2 h-5 w-5" />
                      ) : (
                        <Play className="mr-2 h-5 w-5" />
                      )}
                      {isActive ? t('pomodoro.actions.pause') : t('pomodoro.actions.start')}
                    </Button>

                    <Button
                      onClick={reset}
                      size="lg"
                      variant="outline"
                      className="h-12 rounded-2xl border-white/20 bg-white/5 text-white hover:bg-white/10 sm:h-14 sm:px-6"
                    >
                      <SkipForward className="mr-2 h-5 w-5" />
                      {t('pomodoro.actions.reset')}
                    </Button>

                    <Button
                      onClick={toggleFocusMode}
                      size="lg"
                      variant="outline"
                      className="h-12 rounded-2xl border-white/20 bg-white/5 text-white hover:bg-white/10 sm:h-14 sm:px-6"
                    >
                      <Minimize2 className="mr-2 h-5 w-5" />
                      {t('pomodoro.actions.exit')}
                    </Button>
                  </div>

                  <div className="mt-6 grid grid-cols-3 gap-2 lg:hidden">
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-center">
                      <div className="text-xl font-semibold">{sessionCount}</div>
                      <div className="mt-1 text-[11px] text-white/60">{t('pomodoro.today')}</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-center">
                      <div className="text-xl font-semibold">{stats.totalFocusSessions}</div>
                      <div className="mt-1 text-[11px] text-white/60">{t('pomodoro.total')}</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-center">
                      <div className="text-xl font-semibold">
                        {Math.round(stats.totalFocusTime / 60)}h
                      </div>
                      <div className="mt-1 text-[11px] text-white/60">{t('pomodoro.focusShort')}</div>
                    </div>
                  </div>
                </div>

                <div className="hidden lg:block" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={widgetRef}
      className={`z-50 ${
        isPinned || isFloating
          ? 'fixed'
          : 'fixed bottom-3 right-3 sm:bottom-6 sm:right-6 animate-in slide-in-from-bottom-5 duration-300'
      } ${
        isDragging
          ? 'cursor-grabbing'
          : isPinned || isFloating
          ? 'cursor-grab'
          : ''
      }`}
      style={
        isPinned || isFloating
          ? {
              left: `${position.x}px`,
              top: `${position.y}px`,
              transition: isDragging ? 'none' : 'all 0.3s ease',
            }
          : undefined
      }
      onMouseDown={handleMouseDown}
    >
      <div className="relative">
        <Button
          size="sm"
          variant="ghost"
          className={`absolute z-20 rounded-full border border-background/80 bg-red-500 p-0 text-white shadow-lg hover:bg-red-600 ${
            isPinned ? '-right-1 -top-1 h-5 w-5' : '-right-1 -top-1 h-8 w-8 sm:-right-2 sm:-top-2'
          }`}
          onClick={handleClose}
          title={t('pomodoro.closeTimer')}
        >
          <X className={isPinned ? 'h-3 w-3' : 'h-4 w-4'} />
        </Button>

        <Card
          className={`overflow-hidden border border-white/10 bg-slate-900/95 shadow-2xl backdrop-blur transition-all ${
            isPinned
              ? isExpanded
                ? 'w-[340px] rounded-[24px]'
                : 'w-[188px] rounded-[20px]'
              : 'w-[calc(100vw-1rem)] max-w-[380px] rounded-[28px] sm:w-[380px]'
          }`}
        >
          <CardHeader
            className={`${isPinned ? 'border-b-0 bg-transparent' : 'border-b border-white/10 bg-white/[0.03]'} ${
              isPinned ? 'px-2.5 py-1.5' : 'px-4 py-3'
            } ${isPinned || isFloating ? 'cursor-grab active:cursor-grabbing' : ''}`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <div
                  className={`shrink-0 items-center justify-center bg-blue-500/15 text-blue-300 ${
                    isPinned ? 'flex h-7 w-7 rounded-xl' : 'flex h-9 w-9 rounded-2xl'
                  }`}
                >
                  <Timer className={isPinned ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
                </div>
                <div className="min-w-0">
                  <div className={`truncate font-semibold text-white ${isPinned ? 'text-xs' : ''}`}>
                    {t('pomodoro.title')}
                  </div>
                  {!isPinned && (
                    <div className="mt-0.5 text-xs text-white/50">
                      {isActive ? t('pomodoro.running') : t('pomodoro.paused')}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <Badge
                  className={`rounded-full border ${
                    mode === 'focus'
                      ? 'border-blue-400/30 bg-blue-500/15 text-blue-300'
                      : mode === 'break'
                      ? 'border-green-400/30 bg-green-500/15 text-green-300'
                      : 'border-purple-400/30 bg-purple-500/15 text-purple-300'
                  } ${isPinned ? 'h-5 px-1.5 py-0 text-[9px]' : ''}`}
                >
                  {isPinned ? getModeLabel().split(' ')[0] : getModeLabel()}
                </Badge>

                {!isPinned && (
                  <>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 rounded-full text-blue-200 hover:bg-white/10"
                      onClick={() => setShowSettings(true)}
                      title={t('common.settings')}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 rounded-full text-blue-200 hover:bg-white/10"
                      onClick={toggleFocusMode}
                      title={t('pomodoro.focusMode')}
                    >
                      <Maximize2 className="h-4 w-4" />
                    </Button>
                  </>
                )}

                {isPinned && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 rounded-full text-blue-200 hover:bg-white/10"
                    onClick={() => setIsExpanded(!isExpanded)}
                    title={isExpanded ? t('pomodoro.actions.minimize') : t('pomodoro.actions.expand')}                  >
                    <ChevronDown
                      className={`h-3.5 w-3.5 transition-transform ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                    />
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>

          {isPinned && !isExpanded && (
            <CardContent className="bg-transparent p-2">
              <div className="flex items-center gap-2">
                <div className="relative h-10 w-10 shrink-0">
                  <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-white/10"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 42}`}
                      strokeDashoffset={`${
                        2 * Math.PI * 42 * (1 - getProgress() / 100)
                      }`}
                      className={`${getModeColor()} transition-all duration-1000 ease-linear`}
                      strokeLinecap="round"
                    />
                  </svg>

                  <div className="absolute inset-0 flex items-center justify-center text-[9px] font-semibold text-white tabular-nums">
                    {formatTime(time)}
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="truncate text-[10px] font-medium text-white/90">
                    {t('pomodoro.focusSession')}
                  </div>

                  <div className="mt-1 flex items-center gap-1">
                    <Button
                      onClick={isActive ? pause : start}
                      size="icon"
                      className="h-7 w-7 rounded-full bg-white text-slate-900 hover:bg-white/90"
                    >
                      {isActive ? (
                        <Pause className="h-3 w-3 fill-current" />
                      ) : (
                        <Play className="h-3 w-3 fill-current" />
                      )}
                    </Button>

                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={reset}
                      className="h-7 w-7 rounded-full text-white/80 hover:bg-white/10 hover:text-white"
                    >
                      <SkipForward className="h-3 w-3" />
                    </Button>

                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setIsExpanded(true)}
                      className="h-7 w-7 rounded-full text-white/80 hover:bg-white/10 hover:text-white"
                    >
                      <Maximize2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          )}

          {(!isPinned || isExpanded) && (
            <CardContent className="bg-transparent p-4 sm:p-6">
              <div className="text-center">
                <div className="mb-6 flex justify-center">
                  <div className="relative h-[220px] w-[220px] sm:h-[250px] sm:w-[250px]">
                    <svg className="h-full w-full -rotate-90" viewBox="0 0 220 220">
                      <circle
                        cx="110"
                        cy="110"
                        r="96"
                        stroke="currentColor"
                        strokeWidth="10"
                        fill="none"
                        className="text-white/10"
                      />
                      <circle
                        cx="110"
                        cy="110"
                        r="96"
                        stroke="currentColor"
                        strokeWidth="10"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 96}`}
                        strokeDashoffset={`${
                          2 * Math.PI * 96 * (1 - getProgress() / 100)
                        }`}
                        className={`${getModeColor()} transition-all duration-1000 ease-linear`}
                        strokeLinecap="round"
                      />
                    </svg>

                    <div className="absolute inset-0 flex flex-col items-center justify-center px-4">
                      <div className="text-5xl font-semibold tracking-tight text-white tabular-nums sm:text-6xl">
                        {formatTime(time)}
                      </div>
                      {linkedTaskName && (
                        <div className="mt-3 max-w-[85%] truncate text-xs text-white/60 sm:text-sm">
                          {linkedTaskName}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mb-5 grid grid-cols-3 gap-2">
                  <Button
                    size="sm"
                    variant={mode === 'focus' ? 'default' : 'outline'}
                    onClick={() => setMode('focus')}
                    className={
                      mode === 'focus'
                        ? 'h-10 rounded-xl bg-blue-500 text-white hover:bg-blue-700'
                        : 'h-10 rounded-xl border-white/10 bg-white/5 text-blue-200 hover:bg-white/10'
                    }
                  >
                    {t('pomodoro.modes.focus')}
                  </Button>
                  <Button
                    size="sm"
                    variant={mode === 'break' ? 'default' : 'outline'}
                    onClick={() => setMode('break')}
                    className={
                      mode === 'break'
                        ? 'h-10 rounded-xl bg-green-500 text-white hover:bg-green-600'
                        : 'h-10 rounded-xl border-white/10 bg-white/5 text-blue-200 hover:bg-white/10'
                    }
                  >
                    {t('pomodoro.modes.break')}
                  </Button>
                  <Button
                    size="sm"
                    variant={mode === 'longBreak' ? 'default' : 'outline'}
                    onClick={() => setMode('longBreak')}
                    className={
                      mode === 'longBreak'
                        ? 'h-10 rounded-xl bg-purple-500 text-white hover:bg-purple-600'
                        : 'h-10 rounded-xl border-white/10 bg-white/5 text-blue-200 hover:bg-white/10'
                    }
                  >
                    {t('pomodoro.modes.longBreak')}
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:justify-center sm:gap-3">
                  <Button
                    onClick={isActive ? pause : start}
                    size="lg"
                    className="col-span-2 h-12 rounded-2xl bg-blue-500 px-6 text-white hover:bg-blue-700 sm:col-span-1"
                  >
                    {isActive ? (
                      <Pause className="mr-2 h-5 w-5" />
                    ) : (
                      <Play className="mr-2 h-5 w-5" />
                    )}
                    {isActive ? t('pomodoro.actions.pause') : t('pomodoro.actions.start')}
                  </Button>

                  <Button
                    size="lg"
                    variant="outline"
                    onClick={reset}
                    className="h-12 rounded-2xl border-white/10 bg-white/5 px-5 text-white hover:bg-white/10"
                  >
                    <SkipForward className="mr-2 h-5 w-5" />
                    {t('pomodoro.actions.reset')}
                  </Button>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={togglePinned}
                    className={`h-10 rounded-xl ${
                      isPinned
                        ? 'bg-blue-500/15 text-blue-300 hover:bg-blue-500/25'
                        : 'text-blue-200 hover:bg-white/10'
                    }`}
                    title={
                      isPinned
                        ? t('pomodoro.unpinWidgetHint')
                        : t('pomodoro.pinWidgetHint')
                    }
                  >
                    {isPinned ? (
                      <Pin className="mr-2 h-4 w-4 fill-current" />
                    ) : (
                      <PinOff className="mr-2 h-4 w-4" />
                    )}
                    {t('pomodoro.actions.focus')}
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-10 rounded-xl text-blue-200 hover:bg-white/10"
                    onClick={() => setShowSettings(true)}
                    title={t('pomodoro.actions.settings')}

                  >
                    <Settings className="mr-2 h-4 w-4" />
                    {t('pomodoro.actions.settings')}
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-10 rounded-xl text-blue-200 hover:bg-white/10"
                    onClick={toggleFocusMode}
                    title={t('pomodoro.focusMode')}
                  >
                    <Maximize2 className="mr-2 h-4 w-4" />
                    {t('pomodoro.modes.focus')}
                  </Button>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      </div>

      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-[28px] sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t('pomodoro.settings.title')}</DialogTitle>
            <DialogDescription>
              {t('pomodoro.settingsDescription')}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">{t('pomodoro.settings.durationsMinutes')}</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>{t('pomodoro.settings.focus')}</Label>
                  <Input
                    type="number"
                    min="1"
                    max="60"
                    value={settings.focusDuration}
                    onChange={(e) =>
                      updateSettings({
                        focusDuration: parseInt(e.target.value) || 25,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('pomodoro.settings.break')}</Label>
                  <Input
                    type="number"
                    min="1"
                    max="30"
                    value={settings.breakDuration}
                    onChange={(e) =>
                      updateSettings({
                        breakDuration: parseInt(e.target.value) || 5,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('pomodoro.settings.longBreak')}</Label>
                  <Input
                    type="number"
                    min="1"
                    max="60"
                    value={settings.longBreakDuration}
                    onChange={(e) =>
                      updateSettings({
                        longBreakDuration: parseInt(e.target.value) || 15,
                      })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold">{t('pomodoro.settings.autoStart')}</h3>
              <div className="flex items-center justify-between gap-4">
                <Label>{t('pomodoro.settings.autoStartBreaks')}</Label>
                <Switch
                  checked={settings.autoStartBreaks}
                  onCheckedChange={(checked) =>
                    updateSettings({ autoStartBreaks: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between gap-4">
                <Label>{t('pomodoro.settings.autoStartPomodoros')}</Label>
                <Switch
                  checked={settings.autoStartPomodoros}
                  onCheckedChange={(checked) =>
                    updateSettings({ autoStartPomodoros: checked })
                  }
                />
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold">{t('pomodoro.settings.notifications')}</h3>
              <div className="flex items-center justify-between gap-4">
                <Label>{t('pomodoro.settings.desktopNotifications')}</Label>
                <Switch
                  checked={settings.notifications}
                  onCheckedChange={(checked) =>
                    updateSettings({ notifications: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between gap-4">
                <Label>{t('pomodoro.settings.soundAlerts')}</Label>
                <Switch
                  checked={settings.soundEnabled}
                  onCheckedChange={(checked) =>
                    updateSettings({ soundEnabled: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between gap-4">
                <Label>{t('pomodoro.settings.vibrationMobile')}</Label>
                <Switch
                  checked={settings.vibrationEnabled}
                  onCheckedChange={(checked) =>
                    updateSettings({ vibrationEnabled: checked })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold">{t('pomodoro.settings.sessionSettings')}</h3>
              <Label>{t('pomodoro.settings.longBreakAfterEvery')}</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="2"
                  max="10"
                  value={settings.longBreakInterval}
                  onChange={(e) =>
                    updateSettings({
                      longBreakInterval: parseInt(e.target.value) || 4,
                    })
                  }
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">
                  {t('pomodoro.settings.focusSessions')}
                </span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}