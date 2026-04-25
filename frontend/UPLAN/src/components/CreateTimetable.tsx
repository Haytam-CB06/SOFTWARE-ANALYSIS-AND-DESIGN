import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  X,
  Calendar,
  Clock,
  BookOpen,
  Ban,
  Zap,
  Info,
  CheckCircle2,
  Sparkles,
  Brain,
  TrendingUp,
  Upload,
  FileSpreadsheet,
  Image as ImageIcon,
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { toast } from 'sonner';
import ImportDialog from './ImportDialog';
import { storageService } from '../src/services/storageService';
import { createStudyTimetable } from '../src/services/backendApi';
import { Timetable } from '../src/types';

interface Subject {
  id: string;
  name: string;
  color: string;
  priority: 'high' | 'medium' | 'low';
  hoursPerWeek: number;
  preferredTimeOfDay: 'morning' | 'afternoon' | 'evening' | 'any';
  selectedDays: string[];
  sessionDuration: number;
  breakDuration: number;
  startTime?: string;
}

interface BlockedTime {
  id: string;
  title: string;
  day: string;
  startTime: string;
  endTime: string;
}

interface CreateTimetableProps {
  onGenerate: (data: any) => void;
}

const subjectColors = ['bg-blue-700'];

const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function CreateTimetable({ onGenerate }: CreateTimetableProps) {
  const { t } = useTranslation();

  const priorityOptions = [
    {
      value: 'high',
      label: t('createTimetable.priority.high'),
      icon: Zap,
      color: 'text-white bg-black dark:text-black dark:bg-white',
      allocation: '50%',
      description: t('createTimetable.priority.highDesc'),
    },
    {
      value: 'medium',
      label: t('createTimetable.priority.medium'),
      icon: TrendingUp,
      color: 'text-white bg-black dark:text-black dark:bg-white',
      allocation: '30%',
      description: t('createTimetable.priority.mediumDesc'),
    },
    {
      value: 'low',
      label: t('createTimetable.priority.low'),
      icon: BookOpen,
      color: 'text-white bg-black dark:text-black dark:bg-white',
      allocation: '20%',
      description: t('createTimetable.priority.lowDesc'),
    },
  ];

  const timeOfDayOptions = [
    { value: 'morning', label: t('createTimetable.time.morning'), bestFor: t('createTimetable.timeBest.morning') },
    { value: 'afternoon', label: t('createTimetable.time.afternoon'), bestFor: t('createTimetable.timeBest.afternoon') },
    { value: 'evening', label: t('createTimetable.time.evening'), bestFor: t('createTimetable.timeBest.evening') },
    { value: 'any', label: t('createTimetable.time.any'), bestFor: t('createTimetable.timeBest.any') },
  ];

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [timetableName, setTimetableName] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [hoursPerWeek, setHoursPerWeek] = useState('6');
  const [preferredTimeOfDay, setPreferredTimeOfDay] = useState<'morning' | 'afternoon' | 'evening' | 'any'>('any');
  const [studyStartTime, setStudyStartTime] = useState('08:00');
  const [studyEndTime, setStudyEndTime] = useState('22:00');
  const [sessionDuration, setSessionDuration] = useState('50');
  const [breakDuration, setBreakDuration] = useState('10');
  const [selectedDays, setSelectedDays] = useState<string[]>(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
  const [blockedTimes, setBlockedTimes] = useState<BlockedTime[]>([]);
  const [newBlockedTime, setNewBlockedTime] = useState({
    title: '',
    day: 'Monday',
    startTime: '09:00',
    endTime: '10:00',
  });
  const [showCourseNameError, setShowCourseNameError] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [availabilitySettings, setAvailabilitySettings] = useState<any>(null);

  const handleImportSessions = async (importedSessions: any[], importedAvailabilitySettings?: any) => {
    const trimmedTimetableName = timetableName.trim();

    if (isImporting) {
      console.log('⚠️ Import already in progress, ignoring duplicate call');
      return;
    }

    setIsImporting(true);

    if (importedAvailabilitySettings) {
      console.log('📋 Saving availability settings to state:', importedAvailabilitySettings);
      setAvailabilitySettings(importedAvailabilitySettings);
    }

    console.log('🔵 handleImportSessions called with:', {
      sessionCount: importedSessions.length,
      hasAvailabilitySettings: !!importedAvailabilitySettings,
      availabilitySettings: importedAvailabilitySettings,
    });

    let filteredSessions = [...importedSessions];
    let conflictsRemoved = 0;

    if (importedAvailabilitySettings) {
      const timeToMinutes = (time: string | undefined) => {
        if (!time || typeof time !== 'string') return null;
        const parts = time.split(':');
        if (parts.length !== 2) return null;
        const hours = parseInt(parts[0], 10);
        const minutes = parseInt(parts[1], 10);
        if (isNaN(hours) || isNaN(minutes)) return null;
        return hours * 60 + minutes;
      };

      filteredSessions = importedSessions.filter((session) => {
        const sessionStart = session.startTime;
        const sessionEnd = session.endTime;

        if (!sessionStart || !sessionEnd) {
          console.warn('Session missing time information:', session);
          return true;
        }

        const sessionStartMin = timeToMinutes(sessionStart);
        const sessionEndMin = timeToMinutes(sessionEnd);

        if (sessionStartMin === null || sessionEndMin === null) {
          console.warn('Could not parse session times:', { sessionStart, sessionEnd });
          return true;
        }

        const isWeekend = session.day === 5 || session.day === 6;
        const availability =
          isWeekend && !importedAvailabilitySettings.weekendSameAsWeekday
            ? importedAvailabilitySettings.weekendAvailability
            : importedAvailabilitySettings.weekdayAvailability;

        if (availability && availability.start && availability.end) {
          const availStart = timeToMinutes(availability.start);
          const availEnd = timeToMinutes(availability.end);

          if (availStart !== null && availEnd !== null) {
            if (sessionStartMin < availStart || sessionEndMin > availEnd) {
              conflictsRemoved++;
              return false;
            }
          }
        }

        if (
          importedAvailabilitySettings.sleepHours &&
          importedAvailabilitySettings.sleepHours.from &&
          importedAvailabilitySettings.sleepHours.to
        ) {
          const sleepStart = timeToMinutes(importedAvailabilitySettings.sleepHours.from);
          const sleepEnd = timeToMinutes(importedAvailabilitySettings.sleepHours.to);

          if (sleepStart !== null && sleepEnd !== null) {
            if (sleepStart > sleepEnd) {
              if (sessionStartMin >= sleepStart || sessionEndMin <= sleepEnd) {
                conflictsRemoved++;
                return false;
              }
            } else {
              if (sessionStartMin >= sleepStart && sessionEndMin <= sleepEnd) {
                conflictsRemoved++;
                return false;
              }
            }
          }
        }

        if (
          importedAvailabilitySettings.lunchBreak?.enabled &&
          importedAvailabilitySettings.lunchBreak.start &&
          importedAvailabilitySettings.lunchBreak.end
        ) {
          const lunchStart = timeToMinutes(importedAvailabilitySettings.lunchBreak.start);
          const lunchEnd = timeToMinutes(importedAvailabilitySettings.lunchBreak.end);

          if (lunchStart !== null && lunchEnd !== null) {
            if (
              (sessionStartMin >= lunchStart && sessionStartMin < lunchEnd) ||
              (sessionEndMin > lunchStart && sessionEndMin <= lunchEnd) ||
              (sessionStartMin <= lunchStart && sessionEndMin >= lunchEnd)
            ) {
              conflictsRemoved++;
              return false;
            }
          }
        }

        if (
          importedAvailabilitySettings.dinnerBreak?.enabled &&
          importedAvailabilitySettings.dinnerBreak.start &&
          importedAvailabilitySettings.dinnerBreak.end
        ) {
          const dinnerStart = timeToMinutes(importedAvailabilitySettings.dinnerBreak.start);
          const dinnerEnd = timeToMinutes(importedAvailabilitySettings.dinnerBreak.end);

          if (dinnerStart !== null && dinnerEnd !== null) {
            if (
              (sessionStartMin >= dinnerStart && sessionStartMin < dinnerEnd) ||
              (sessionEndMin > dinnerStart && sessionEndMin <= dinnerEnd) ||
              (sessionStartMin <= dinnerStart && sessionEndMin >= dinnerEnd)
            ) {
              conflictsRemoved++;
              return false;
            }
          }
        }

        return true;
      });

      if (conflictsRemoved > 0) {
        console.log(` Removed ${conflictsRemoved} sessions due to availability conflicts`);
        toast.info(
          t('createTimetable.import.removedConflicts', { count: conflictsRemoved }),
          { duration: 5000 }
        );
      }
    }

    const backendUserId = localStorage.getItem('currentUserId') || '';
    const isUuidLike = (v: string) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const schedule = days.map((day, dayIndex) => {
      const daySessions = filteredSessions
        .filter((session) => session.day === dayIndex)
        .map((session) => ({
          subject: session.subject,
          startTime: session.startTime,
          endTime: session.endTime,
          type: (session.type === 'break' ? 'break' : 'study') as 'study' | 'break',
          priority: 'medium' as const,
          color: session.color,
        }));

      return {
        day,
        sessions: daySessions,
      };
    });

    const resolvedTimetableName =
      trimmedTimetableName || t('createTimetable.import.defaultName', { date: new Date().toLocaleDateString() });

    const timetableData = {
      weekStartDate: new Date().toISOString(),
      schedule,
      calendarSessions: filteredSessions,
      availabilitySettings: importedAvailabilitySettings,
      createdAt: new Date().toISOString(),
    };

    if (isUuidLike(backendUserId)) {
      try {
        await createStudyTimetable({
          user_id: backendUserId,
          name: resolvedTimetableName,
          data: timetableData,
          is_active: false,
        });
        console.log('Saved Imported Timetable to backend');
      } catch (err) {
        console.warn('⚠️ Failed to save Imported Timetable to backend; falling back to localStorage', err);

        const existingTimetables = storageService.getTimetables();
        const timetableId = `timetable-${Date.now()}`;
        const newTimetable: Timetable = {
          id: timetableId,
          name: resolvedTimetableName,
          weekStartDate: timetableData.weekStartDate,
          schedule: schedule,
          isActive: false,
          createdAt: timetableData.createdAt,
          calendarSessions: filteredSessions,
          availabilitySettings: importedAvailabilitySettings,
        };

        storageService.saveTimetables([...existingTimetables, newTimetable]);
      }
    } else {
      const existingTimetables = storageService.getTimetables();
      const timetableId = `timetable-${Date.now()}`;
      const newTimetable: Timetable = {
        id: timetableId,
        name: timetableName,
        weekStartDate: timetableData.weekStartDate,
        schedule: schedule,
        isActive: false,
        createdAt: timetableData.createdAt,
        calendarSessions: filteredSessions,
        availabilitySettings: importedAvailabilitySettings,
      };

      storageService.saveTimetables([...existingTimetables, newTimetable]);
    }

    const settingsMessage = importedAvailabilitySettings
      ? t('createTimetable.import.withAvailability')
      : '';

    toast.success(
      t('createTimetable.import.savedSuccess', {
        count: filteredSessions.length,
        settingsMessage,
      }),
      {
        description: t('createTimetable.import.savedDescription'),
      }
    );

    console.log('📡 Dispatching timetablesUpdated event');
    window.dispatchEvent(new Event('timetablesUpdated'));

    setShowImportDialog(false);

    setTimeout(() => {
      setIsImporting(false);
    }, 1000);
  };

  useEffect(() => {
    const savedSchedule = localStorage.getItem('universitySchedule');
    if (savedSchedule) {
      try {
        const universityClasses = JSON.parse(savedSchedule);
        const convertedClasses = universityClasses.map((cls: any) => ({
          id: cls.id,
          title: cls.title,
          day: cls.day,
          startTime: cls.startTime,
          endTime: cls.endTime,
        }));
        setBlockedTimes(convertedClasses);
        if (convertedClasses.length > 0) {
          const uniqueClassNames = new Set(convertedClasses.map((c: any) => c.title));
          toast.success(
            t('createTimetable.university.loaded', {
              count: uniqueClassNames.size,
            })
          );
        }
      } catch (e) {
        console.error('Error loading university schedule:', e);
      }
    }
  }, [t]);

  const addSubject = () => {
    if (newSubject.trim()) {
      const subject: Subject = {
        id: Date.now().toString(),
        name: newSubject.trim(),
        color: subjectColors[subjects.length % subjectColors.length],
        priority: selectedPriority,
        hoursPerWeek: parseFloat(hoursPerWeek),
        preferredTimeOfDay,
        selectedDays: [...selectedDays],
        sessionDuration: parseInt(sessionDuration),
        breakDuration: parseInt(breakDuration),
      };
      setSubjects([...subjects, subject]);
      setNewSubject('');
      setSelectedPriority('medium');
      setHoursPerWeek('6');
      setPreferredTimeOfDay('any');
      setShowCourseNameError(false);
      toast.success(t('createTimetable.success.courseAdded', { name: subject.name }));
    } else {
      setShowCourseNameError(true);
      toast.error(t('createTimetable.errors.courseNameEnter'));
    }
  };

  const removeSubject = (id: string) => {
    setSubjects(subjects.filter((s) => s.id !== id));
  };

  const updateSubjectHoursPerWeek = (id: string, hours: number) => {
    setSubjects(subjects.map((s) => (s.id === id ? { ...s, hoursPerWeek: hours } : s)));
  };

  const updateSubjectTimeOfDay = (id: string, timeOfDay: 'morning' | 'afternoon' | 'evening' | 'any') => {
    setSubjects(subjects.map((s) => (s.id === id ? { ...s, preferredTimeOfDay: timeOfDay } : s)));
  };

  const updateSubjectSessionDuration = (id: string, duration: number) => {
    setSubjects(subjects.map((s) => (s.id === id ? { ...s, sessionDuration: duration } : s)));
  };

  const updateSubjectBreakDuration = (id: string, duration: number) => {
    setSubjects(subjects.map((s) => (s.id === id ? { ...s, breakDuration: duration } : s)));
  };

  const updateSubjectStartTime = (id: string, startTime: string) => {
    setSubjects(subjects.map((s) => (s.id === id ? { ...s, startTime } : s)));
  };

  const toggleSubjectDay = (subjectId: string, day: string) => {
    setSubjects(
      subjects.map((s) => {
        if (s.id === subjectId) {
          const newDays = s.selectedDays.includes(day)
            ? s.selectedDays.filter((d) => d !== day)
            : [...s.selectedDays, day];
          return { ...s, selectedDays: newDays };
        }
        return s;
      })
    );
  };

  const addBlockedTime = () => {
    if (!newBlockedTime.title.trim()) {
      toast.error(t('createTimetable.errors.blockedTitle'));
      return;
    }

    const blockedTime: BlockedTime = {
      id: Date.now().toString(),
      title: newBlockedTime.title,
      day: newBlockedTime.day,
      startTime: newBlockedTime.startTime,
      endTime: newBlockedTime.endTime,
    };

    setBlockedTimes([...blockedTimes, blockedTime]);
    setNewBlockedTime({
      title: '',
      day: 'Monday',
      startTime: '09:00',
      endTime: '10:00',
    });
    toast.success(t('createTimetable.success.blockedAdded'));
  };

  const removeBlockedTime = (id: string) => {
    setBlockedTimes(blockedTimes.filter((bt) => bt.id !== id));
  };

  const handleReset = () => {
    if (confirm(t('createTimetable.confirm.reset'))) {
      setSubjects([]);
      setTimetableName('');
      setNewSubject('');
      setSelectedPriority('medium');
      setHoursPerWeek('6');
      setPreferredTimeOfDay('any');
      setStudyStartTime('08:00');
      setStudyEndTime('22:00');
      setSessionDuration('50');
      setBreakDuration('10');
      setSelectedDays(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
      setBlockedTimes([]);
      toast.success(t('createTimetable.success.reset'));
    }
  };

  const handleGenerate = () => {
    if (!timetableName.trim()) {
      toast.error(t('createTimetable.errors.timetableName'));
      return;
    }

    if (subjects.length === 0) {
      toast.error(t('createTimetable.errors.noCourses'));
      return;
    }

    if (selectedDays.length === 0) {
      toast.error(t('createTimetable.errors.noDays'));
      return;
    }

    const timetableData = {
      name: timetableName.trim(),
      subjects,
      studyStartTime,
      studyEndTime,
      sessionDuration: parseInt(sessionDuration),
      breakDuration: parseInt(breakDuration),
      createdAt: new Date().toISOString(),
      selectedDays,
      blockedTimes,
      availabilitySettings,
    };

    onGenerate(timetableData);
    toast.success(t('createTimetable.success.generated'));
    console.log('Generated timetable:', timetableData);
  };

  const handleFileImport = (type: 'excel' | 'image') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = type === 'excel' ? '.xlsx,.xls,.csv' : 'image/*';

    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        toast.success(t('createTimetable.file.selected', { name: file.name }));

        setTimeout(() => {
          toast.info(t('createTimetable.file.analyzing'));
          setShowAutoGenerateDialog(false);
        }, 1500);
      }
    };

    input.click();
  };

  const totalHoursNeeded = subjects.reduce((sum, s) => sum + s.hoursPerWeek, 0);
  const highPriorityHours = subjects.filter((s) => s.priority === 'high').reduce((sum, s) => sum + s.hoursPerWeek, 0);
  const mediumPriorityHours = subjects.filter((s) => s.priority === 'medium').reduce((sum, s) => sum + s.hoursPerWeek, 0);
  const lowPriorityHours = subjects.filter((s) => s.priority === 'low').reduce((sum, s) => sum + s.hoursPerWeek, 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold text-foreground">{t('createTimetable.title')}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('createTimetable.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:w-auto">
            <div className="rounded-xl border border-border bg-card px-4 py-3 text-center">
              <p className="text-[11px] text-muted-foreground">{t('createTimetable.stats.courses')}</p>
              <p className="mt-1 text-sm font-semibold text-foreground">{subjects.length}</p>
            </div>
            <div className="rounded-xl border border-border bg-card px-4 py-3 text-center">
              <p className="text-[11px] text-muted-foreground">{t('createTimetable.stats.hoursPerWeek')}</p>
              <p className="mt-1 text-sm font-semibold text-foreground">{totalHoursNeeded}</p>
            </div>
          </div>
        </div>
      </div>

      <Card data-tour="create-timetable-details" className="rounded-2xl border border-border bg-card shadow-sm">
        <CardHeader className="rounded-t-2xl border-b border-border bg-muted/30">
          <div>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Calendar className="h-5 w-5 text-blue-700" />
              {t('createTimetable.details.title')}
            </CardTitle>
            <CardDescription>
              {t('createTimetable.details.description')}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div>
            <Label htmlFor="timetable-name" className="text-xs font-medium text-muted-foreground">
              {t('createTimetable.details.name')}
            </Label>
            <Input
              id="timetable-name"
              placeholder={t('createTimetable.details.placeholder')}
              value={timetableName}
              onChange={(e) => setTimetableName(e.target.value)}
              className="mt-1 bg-white"
            />
          </div>
        </CardContent>
      </Card>

      <Card data-tour="create-course-setup" className="rounded-2xl border border-border bg-card shadow-sm">
        <CardHeader className="rounded-t-2xl border-b border-border bg-muted/30">
          <div>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <BookOpen className="h-5 w-5 text-blue-700" />
              {t('createTimetable.courseSetup.title')}
            </CardTitle>
            <CardDescription>
              {t('createTimetable.courseSetup.description')}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            {priorityOptions.map((option) => {
              const Icon = option.icon;
              return (
                <div
                  key={option.value}
                  className={`rounded-xl border p-3 transition-colors ${
                    selectedPriority === option.value
                      ? 'border-blue-500 bg-blue-50/60 dark:border-blue-500/40 dark:bg-blue-950/20'
                      : 'border-border bg-card'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="h-4 w-4" />
                    <span className="text-sm">{option.label}</span>
                    <Badge variant="secondary" className="text-xs ml-auto">
                      {option.allocation}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600">{option.description}</p>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 gap-4 rounded-xl border border-border bg-muted/20 p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="new-subject" className="text-xs font-medium text-muted-foreground">
                  {t('createTimetable.fields.courseName')}
                </Label>
                <Input
                  id="new-subject"
                  placeholder={t('createTimetable.fields.coursePlaceholder')}
                  value={newSubject}
                  onChange={(e) => {
                    setNewSubject(e.target.value);
                    if (showCourseNameError) {
                      setShowCourseNameError(false);
                    }
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && addSubject()}
                  className={`bg-white ${showCourseNameError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                />
                {showCourseNameError && (
                  <p className="mt-1 text-xs text-red-600">{t('createTimetable.errors.courseNameRequired')}</p>
                )}
              </div>
              <div>
                <Label htmlFor="hours-per-week" className="text-xs font-medium text-muted-foreground">
                  {t('createTimetable.fields.hoursNeeded')}
                </Label>
                <Input
                  id="hours-per-week"
                  type="number"
                  min="1"
                  max="20"
                  step="0.5"
                  value={hoursPerWeek}
                  onChange={(e) => setHoursPerWeek(e.target.value)}
                  className="bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-medium text-muted-foreground">
                  {t('createTimetable.fields.priorityLevel')}
                </Label>
                <div className="flex gap-2 mt-1">
                  {priorityOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.value}
                        onClick={() => setSelectedPriority(option.value as any)}
                        className={`
                          flex-1 px-3 py-2 rounded-lg flex items-center justify-center gap-2 transition-all text-sm
                          ${
                            selectedPriority === option.value
                              ? option.color + ' ring-2 ring-offset-2 ring-current'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }
                        `}
                      >
                        <Icon className="h-4 w-4" />
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <Label className="text-xs font-medium text-muted-foreground">
                  {t('createTimetable.fields.preferredStudyTime')}
                </Label>
                <select
                  value={preferredTimeOfDay}
                  onChange={(e) => setPreferredTimeOfDay(e.target.value as any)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-white mt-1"
                >
                  {timeOfDayOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Button
              onClick={addSubject}
              className="h-10 w-full rounded-xl bg-blue-700 text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('createTimetable.actions.addCourse')}
            </Button>
          </div>

          {subjects.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm text-gray-700">
                  {t('createTimetable.courses.title', { count: subjects.length })}
                </h4>
                <div className="text-xs text-gray-600">
                  {t('createTimetable.courses.total')} <strong>{t('createTimetable.courses.totalHours', { count: totalHoursNeeded })}</strong>
                </div>
              </div>
              {subjects.map((subject) => {
                const priorityInfo = priorityOptions.find((p) => p.value === subject.priority);
                const PriorityIcon = priorityInfo?.icon || Clock;

                return (
                  <div
                    key={subject.id}
                    className="rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted/20"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/40">
                        <BookOpen className="h-5 w-5 text-blue-700" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-foreground truncate">{subject.name}</h3>
                          <Badge
                            variant="secondary"
                            className={`${priorityInfo?.color} border-0 flex items-center gap-1`}
                          >
                            <PriorityIcon className="h-3 w-3" />
                            <span className="text-xs">{priorityInfo?.label}</span>
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <Label className="text-xs font-medium text-muted-foreground">
                              {t('createTimetable.fields.hoursPerWeek')}
                            </Label>
                            <Input
                              type="number"
                              min="1"
                              max="20"
                              step="0.5"
                              value={subject.hoursPerWeek}
                              onChange={(e) => updateSubjectHoursPerWeek(subject.id, parseFloat(e.target.value) || 1)}
                              className="mt-1 h-8"
                            />
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-muted-foreground">
                              {t('createTimetable.fields.preferredTime')}
                            </Label>
                            <select
                              value={subject.preferredTimeOfDay}
                              onChange={(e) => updateSubjectTimeOfDay(subject.id, e.target.value as any)}
                              className="w-full h-8 px-2 rounded-md border border-input bg-white mt-1 text-sm"
                            >
                              {timeOfDayOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {t(`createTimetable.timeShort.${option.value}`)}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm mt-3">
                          <div>
                            <Label className="text-xs font-medium text-muted-foreground">
                              {t('createTimetable.fields.preferredStartTime')}
                            </Label>
                            <Input
                              type="time"
                              value={subject.startTime || ''}
                              onChange={(e) => updateSubjectStartTime(subject.id, e.target.value)}
                              className="mt-1 h-8"
                              placeholder={t('createTimetable.fields.optional')}
                            />
                            <p className="text-xs text-gray-500 mt-0.5">
                              {t('createTimetable.hints.startTime')}
                            </p>
                          </div>
                          <div></div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm mt-3">
                          <div>
                            <Label className="text-xs font-medium text-muted-foreground">
                              {t('createTimetable.fields.sessionDuration')}
                            </Label>
                            <Input
                              type="number"
                              min="25"
                              max="120"
                              step="5"
                              value={subject.sessionDuration}
                              onChange={(e) => updateSubjectSessionDuration(subject.id, parseInt(e.target.value) || 50)}
                              className="mt-1 h-8"
                            />
                            <p className="text-xs text-gray-500 mt-0.5">
                              {t('createTimetable.hints.sessionDuration')}
                            </p>
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-muted-foreground">
                              {t('createTimetable.fields.breakDuration')}
                            </Label>
                            <Input
                              type="number"
                              min="5"
                              max="30"
                              step="5"
                              value={subject.breakDuration}
                              onChange={(e) => updateSubjectBreakDuration(subject.id, parseInt(e.target.value) || 10)}
                              className="mt-1 h-8"
                            />
                            <p className="text-xs text-gray-500 mt-0.5">
                              {t('createTimetable.hints.breakDuration')}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3">
                          <Label className="text-xs font-medium text-muted-foreground">
                            {t('createTimetable.fields.studyDaysFor', { name: subject.name })}
                          </Label>
                          <div className="flex flex-wrap gap-1.5">
                            {weekDays.map((day) => {
                              const isSelected = subject.selectedDays.includes(day);
                              return (
                                <button
                                  key={day}
                                  onClick={() => toggleSubjectDay(subject.id, day)}
                                  className={`
                                    px-2 py-1 rounded text-xs transition-all border
                                    ${
                                      isSelected
                                        ? 'bg-blue-500 text-white border-blue-600'
                                        : 'bg-gray-100 text-gray-600 border-gray-200 hover:border-gray-300'
                                    }
                                  `}
                                >
                                  {t(`days.short.${day}`)}
                                </button>
                              );
                            })}
                          </div>
                          {subject.selectedDays.length === 0 && (
                            <p className="mt-1 text-xs text-red-600">
                              {t('createTimetable.errors.selectStudyDay')}
                            </p>
                          )}
                          {subject.selectedDays.length > 0 && (
                            <p className="text-xs text-gray-500 mt-1">
                              {t('createTimetable.selectedDays', { count: subject.selectedDays.length })}
                            </p>
                          )}
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSubject(subject.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-100"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {subjects.length > 0 && (
            <div data-tour="create-timetable-summary" className="rounded-xl border border-border bg-muted/20 p-4">
              <p className="mb-3 text-sm font-medium text-foreground">
                <strong>{t('createTimetable.summaryCard.title')}</strong>
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">{t('createTimetable.priority.highLabel')}</p>
                  <p className="text-foreground">{t('createTimetable.summaryCard.hoursPercent', { count: highPriorityHours, percent: 50 })}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('createTimetable.priority.mediumLabel')}</p>
                  <p className="text-foreground">{t('createTimetable.summaryCard.hoursPercent', { count: mediumPriorityHours, percent: 30 })}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('createTimetable.priority.lowLabel')}</p>
                  <p className="text-foreground">{t('createTimetable.summaryCard.hoursPercent', { count: lowPriorityHours, percent: 20 })}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 border-t border-border pt-6 pb-8 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="outline" onClick={handleReset} className="h-10 rounded-xl">
          {t('createTimetable.actions.resetAll')}
        </Button>
        <Button
          data-tour="create-generate"
          onClick={handleGenerate}
          disabled={subjects.length === 0}
          className="h-10 rounded-xl bg-blue-700 px-6 text-white hover:bg-blue-700"
        >
          <Sparkles className="h-5 w-5 mr-2" />
          {t('createTimetable.actions.generate')}
        </Button>
      </div>

      {subjects.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
          <p className="text-sm text-amber-900 dark:text-red-200">
            {t('createTimetable.readySummary', {
              courses: subjects.length,
              hours: totalHoursNeeded,
              blockedCount: blockedTimes.length,
            })}
          </p>
        </div>
      )}

      <ImportDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onImport={handleImportSessions}
        buttonText={t('createTimetable.actions.saveToTimetable')}
      />
    </div>
  );
}
