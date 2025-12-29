import { useState, useEffect } from 'react';
import { Plus, X, Calendar, Clock, BookOpen, Ban, Zap, Info, CheckCircle2, Sparkles, Brain, TrendingUp, Upload, FileSpreadsheet, Image as ImageIcon } from 'lucide-react';
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
  hoursPerWeek: number; // Total hours needed per week
  preferredTimeOfDay: 'morning' | 'afternoon' | 'evening' | 'any';
  selectedDays: string[]; // Days this course should be scheduled on
  sessionDuration: number; // Duration of each study session in minutes
  breakDuration: number; // Duration of breaks in minutes
  startTime?: string; // Preferred start time for this course (e.g., "08:00")
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

const subjectColors = [
  'bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-pink-500',
  'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500',
  'bg-teal-500', 'bg-cyan-500'
];

const priorityOptions = [
  { 
    value: 'high', 
    label: 'High', 
    icon: Zap, 
    color: 'text-red-600 bg-red-50',
    allocation: '50%',
    description: 'Critical courses, upcoming exams'
  },
  { 
    value: 'medium', 
    label: 'Medium', 
    icon: TrendingUp, 
    color: 'text-yellow-600 bg-yellow-50',
    allocation: '30%',
    description: 'Regular coursework'
  },
  { 
    value: 'low', 
    label: 'Low', 
    icon: BookOpen, 
    color: 'text-green-600 bg-green-50',
    allocation: '20%',
    description: 'Optional reading, review'
  },
];

const timeOfDayOptions = [
  { value: 'morning', label: 'Morning (6AM-12PM)', bestFor: 'Peak focus' },
  { value: 'afternoon', label: 'Afternoon (12PM-6PM)', bestFor: 'Active learning' },
  { value: 'evening', label: 'Evening (6PM-10PM)', bestFor: 'Review & practice' },
  { value: 'any', label: 'Anytime', bestFor: 'Flexible' },
];

const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function CreateTimetable({ onGenerate }: CreateTimetableProps) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [newSubject, setNewSubject] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [hoursPerWeek, setHoursPerWeek] = useState('6');
  const [preferredTimeOfDay, setPreferredTimeOfDay] = useState<'morning' | 'afternoon' | 'evening' | 'any'>('any');
  const [studyStartTime, setStudyStartTime] = useState('08:00');
  const [studyEndTime, setStudyEndTime] = useState('22:00');
  const [sessionDuration, setSessionDuration] = useState('50'); // Default 50 min sessions
  const [breakDuration, setBreakDuration] = useState('10'); // Default 10 min breaks
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
  const [isImporting, setIsImporting] = useState(false); // Prevent duplicate imports
  const [availabilitySettings, setAvailabilitySettings] = useState<any>(null); // Store availability settings

  // Handle import from ImportDialog and save to Saved Timetables
  const handleImportSessions = async (importedSessions: any[], importedAvailabilitySettings?: any) => {
    // Prevent duplicate imports
    if (isImporting) {
      console.log('⚠️ Import already in progress, ignoring duplicate call');
      return;
    }

    setIsImporting(true);
    
    // Save the availability settings to state so they're included when generating timetable
    if (importedAvailabilitySettings) {
      console.log('📋 Saving availability settings to state:', importedAvailabilitySettings);
      setAvailabilitySettings(importedAvailabilitySettings);
    }
    
    console.log('🔵 handleImportSessions called with:', {
      sessionCount: importedSessions.length,
      hasAvailabilitySettings: !!importedAvailabilitySettings,
      availabilitySettings: importedAvailabilitySettings
    });

    // Filter sessions based on availability settings
    let filteredSessions = [...importedSessions];
    let conflictsRemoved = 0;

    if (importedAvailabilitySettings) {
      // Helper to convert time string to minutes
      const timeToMinutes = (time: string | undefined) => {
        if (!time || typeof time !== 'string') return null;
        const parts = time.split(':');
        if (parts.length !== 2) return null;
        const hours = parseInt(parts[0], 10);
        const minutes = parseInt(parts[1], 10);
        if (isNaN(hours) || isNaN(minutes)) return null;
        return hours * 60 + minutes;
      };

      filteredSessions = importedSessions.filter(session => {
        const sessionStart = session.startTime;
        const sessionEnd = session.endTime;
        
        // Skip validation if session times are invalid
        if (!sessionStart || !sessionEnd) {
          console.warn('Session missing time information:', session);
          return true; // Keep the session
        }

        const sessionStartMin = timeToMinutes(sessionStart);
        const sessionEndMin = timeToMinutes(sessionEnd);

        // Skip validation if time conversion failed
        if (sessionStartMin === null || sessionEndMin === null) {
          console.warn('Could not parse session times:', { sessionStart, sessionEnd });
          return true; // Keep the session
        }

        // Check Weekly Availability
        const isWeekend = session.day === 5 || session.day === 6; // Saturday = 5, Sunday = 6
        const availability = isWeekend && !importedAvailabilitySettings.weekendSameAsWeekday
          ? importedAvailabilitySettings.weekendAvailability
          : importedAvailabilitySettings.weekdayAvailability;

        if (availability && availability.start && availability.end) {
          const availStart = timeToMinutes(availability.start);
          const availEnd = timeToMinutes(availability.end);

          if (availStart !== null && availEnd !== null) {
            if (sessionStartMin < availStart || sessionEndMin > availEnd) {
              conflictsRemoved++;
              return false; // Outside availability hours
            }
          }
        }

        // Check Sleep Hours
        if (importedAvailabilitySettings.sleepHours && importedAvailabilitySettings.sleepHours.from && importedAvailabilitySettings.sleepHours.to) {
          const sleepStart = timeToMinutes(importedAvailabilitySettings.sleepHours.from);
          const sleepEnd = timeToMinutes(importedAvailabilitySettings.sleepHours.to);
          
          if (sleepStart !== null && sleepEnd !== null) {
            // Handle overnight sleep (e.g., 11:00 PM to 7:00 AM)
            if (sleepStart > sleepEnd) {
              if (sessionStartMin >= sleepStart || sessionEndMin <= sleepEnd) {
                conflictsRemoved++;
                return false; // During sleep hours
              }
            } else {
              if (sessionStartMin >= sleepStart && sessionEndMin <= sleepEnd) {
                conflictsRemoved++;
                return false; // During sleep hours
              }
            }
          }
        }

        // Check Lunch Break
        if (importedAvailabilitySettings.lunchBreak?.enabled && importedAvailabilitySettings.lunchBreak.start && importedAvailabilitySettings.lunchBreak.end) {
          const lunchStart = timeToMinutes(importedAvailabilitySettings.lunchBreak.start);
          const lunchEnd = timeToMinutes(importedAvailabilitySettings.lunchBreak.end);
          
          if (lunchStart !== null && lunchEnd !== null) {
            if ((sessionStartMin >= lunchStart && sessionStartMin < lunchEnd) ||
                (sessionEndMin > lunchStart && sessionEndMin <= lunchEnd) ||
                (sessionStartMin <= lunchStart && sessionEndMin >= lunchEnd)) {
              conflictsRemoved++;
              return false; // Overlaps with lunch break
            }
          }
        }

        // Check Dinner Break
        if (importedAvailabilitySettings.dinnerBreak?.enabled && importedAvailabilitySettings.dinnerBreak.start && importedAvailabilitySettings.dinnerBreak.end) {
          const dinnerStart = timeToMinutes(importedAvailabilitySettings.dinnerBreak.start);
          const dinnerEnd = timeToMinutes(importedAvailabilitySettings.dinnerBreak.end);
          
          if (dinnerStart !== null && dinnerEnd !== null) {
            if ((sessionStartMin >= dinnerStart && sessionStartMin < dinnerEnd) ||
                (sessionEndMin > dinnerStart && sessionEndMin <= dinnerEnd) ||
                (sessionStartMin <= dinnerStart && sessionEndMin >= dinnerEnd)) {
              conflictsRemoved++;
              return false; // Overlaps with dinner break
            }
          }
        }

        return true; // Session is valid
      });

      if (conflictsRemoved > 0) {
        console.log(`⚠️ Removed ${conflictsRemoved} sessions due to availability conflicts`);
        toast.info(`Removed ${conflictsRemoved} conflicting sessions based on your availability settings`, {
          duration: 5000,
        });
      }
    }

    // Prefer saving Imported Timetables to the backend (so they sync across browsers).
    // Fall back to localStorage for guest mode or if the backend isn't reachable.
    const backendUserId = localStorage.getItem('currentUserId') || '';
    const isUuidLike = (v: string) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);

    // Group sessions by day
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const schedule = days.map((day, dayIndex) => {
      const daySessions = filteredSessions
        .filter(session => session.day === dayIndex)
        .map(session => ({
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

    const timetableName = `Imported Timetable - ${new Date().toLocaleDateString()}`;
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
          name: timetableName,
          data: timetableData,
          is_active: false,
        });
        console.log('✅ Saved Imported Timetable to backend');
      } catch (err) {
        console.warn('⚠️ Failed to save Imported Timetable to backend; falling back to localStorage', err);

        // Fall back to local storage
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
    } else {
      // Guest mode -> local storage
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

    // Create success message based on whether availability settings were included
    const settingsMessage = importedAvailabilitySettings 
      ? ' with availability settings' 
      : '';
    
    toast.success(`✅ Saved ${filteredSessions.length} sessions to Saved Timetables${settingsMessage}!`, {
      description: 'Go to Saved Timetables to activate and view your schedule'
    });
    
    // Dispatch event to notify other components to reload
    console.log('📡 Dispatching timetablesUpdated event');
    window.dispatchEvent(new Event('timetablesUpdated'));
    
    // Close the dialog and reset the flag after a delay to ensure all events are processed
    setShowImportDialog(false);
    
    // Reset the flag after a delay to prevent rapid successive imports
    setTimeout(() => {
      setIsImporting(false);
    }, 1000);
  };

  // Load university schedule on mount
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
          toast.success(`✅ Loaded ${uniqueClassNames.size} class${uniqueClassNames.size !== 1 ? 'es' : ''} from your university schedule`);
        }
      } catch (e) {
        console.error('Error loading university schedule:', e);
      }
    }
  }, []);

  const addSubject = () => {
    if (newSubject.trim()) {
      const subject: Subject = {
        id: Date.now().toString(),
        name: newSubject.trim(),
        color: subjectColors[subjects.length % subjectColors.length],
        priority: selectedPriority,
        hoursPerWeek: parseFloat(hoursPerWeek),
        preferredTimeOfDay,
        selectedDays: [...selectedDays], // Add selected days to the subject
        sessionDuration: parseInt(sessionDuration),
        breakDuration: parseInt(breakDuration),
      };
      setSubjects([...subjects, subject]);
      setNewSubject('');
      setSelectedPriority('medium');
      setHoursPerWeek('6');
      setPreferredTimeOfDay('any');
      setShowCourseNameError(false);
      toast.success(`✅ Added ${subject.name} to your courses`);
    } else {
      setShowCourseNameError(true);
      toast.error('⚠️ Please enter a course name');
    }
  };

  const removeSubject = (id: string) => {
    setSubjects(subjects.filter(s => s.id !== id));
  };

  const updateSubjectHoursPerWeek = (id: string, hours: number) => {
    setSubjects(subjects.map(s => 
      s.id === id ? { ...s, hoursPerWeek: hours } : s
    ));
  };

  const updateSubjectTimeOfDay = (id: string, timeOfDay: 'morning' | 'afternoon' | 'evening' | 'any') => {
    setSubjects(subjects.map(s => 
      s.id === id ? { ...s, preferredTimeOfDay: timeOfDay } : s
    ));
  };

  const updateSubjectSessionDuration = (id: string, duration: number) => {
    setSubjects(subjects.map(s => 
      s.id === id ? { ...s, sessionDuration: duration } : s
    ));
  };

  const updateSubjectBreakDuration = (id: string, duration: number) => {
    setSubjects(subjects.map(s => 
      s.id === id ? { ...s, breakDuration: duration } : s
    ));
  };

  const updateSubjectStartTime = (id: string, startTime: string) => {
    setSubjects(subjects.map(s => 
      s.id === id ? { ...s, startTime } : s
    ));
  };

  const toggleSubjectDay = (subjectId: string, day: string) => {
    setSubjects(subjects.map(s => {
      if (s.id === subjectId) {
        const newDays = s.selectedDays.includes(day)
          ? s.selectedDays.filter(d => d !== day)
          : [...s.selectedDays, day];
        return { ...s, selectedDays: newDays };
      }
      return s;
    }));
  };

  const addBlockedTime = () => {
    if (!newBlockedTime.title.trim()) {
      toast.error('Please enter a title for the blocked time');
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
    toast.success('✅ Unavailable time blocked successfully!');
  };

  const removeBlockedTime = (id: string) => {
    setBlockedTimes(blockedTimes.filter(bt => bt.id !== id));
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all fields? This will clear all your subjects and settings.')) {
      setSubjects([]);
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
      toast.success('All fields have been reset!');
    }
  };

  const handleGenerate = () => {
    if (subjects.length === 0) {
      toast.error('Please add at least one course before generating a timetable');
      return;
    }

    if (selectedDays.length === 0) {
      toast.error('Please select at least one day for studying');
      return;
    }

    const timetableData = {
      subjects,
      studyStartTime,
      studyEndTime,
      sessionDuration: parseInt(sessionDuration),
      breakDuration: parseInt(breakDuration),
      createdAt: new Date().toISOString(),
      selectedDays,
      blockedTimes,
      availabilitySettings, // Include availability settings so they're saved with the timetable
    };

    onGenerate(timetableData);
    toast.success('🎉 Smart timetable generated successfully!');
    console.log('Generated timetable:', timetableData);
  };

  const handleFileImport = (type: 'excel' | 'image') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = type === 'excel' ? '.xlsx,.xls,.csv' : 'image/*';
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        toast.success(`📄 File \"${file.name}\" selected. Processing...`);
        
        // Simulate file processing
        setTimeout(() => {
          toast.info('🤖 AI is analyzing your file. This feature is in development.');
          setShowAutoGenerateDialog(false);
        }, 1500);
      }
    };
    
    input.click();
  };

  // Calculate total hours needed per week
  const totalHoursNeeded = subjects.reduce((sum, s) => sum + s.hoursPerWeek, 0);
  const highPriorityHours = subjects.filter(s => s.priority === 'high').reduce((sum, s) => sum + s.hoursPerWeek, 0);
  const mediumPriorityHours = subjects.filter(s => s.priority === 'medium').reduce((sum, s) => sum + s.hoursPerWeek, 0);
  const lowPriorityHours = subjects.filter(s => s.priority === 'low').reduce((sum, s) => sum + s.hoursPerWeek, 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="bg-blue-600 rounded-2xl p-8 text-white shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Brain className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-white">Smart Timetable Generator</h1>
              <p className="text-blue-100 text-sm">AI-powered automatic scheduling</p>
            </div>
          </div>
          <Button
            onClick={() => setShowImportDialog(true)}
            variant="outline"
            size="default"
            className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:border-white/50"
            title="Import timetable from file"
          >
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mt-4">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-white mb-2">
                <strong>How it works:</strong>
              </p>
              <ol className="text-blue-100 text-sm space-y-1 list-decimal list-inside">
                <li>Add your courses with priorities and weekly study hours needed</li>
                <li>Block out your UNAVAILABLE times (classes, work, appointments)</li>
                <li>Click "Generate" and our AI will automatically fill your FREE time with optimized study sessions</li>
              </ol>
              <p className="text-blue-100 text-sm mt-3">
                💡 <strong>Smart Features:</strong> High priority courses get 50% of study time and are scheduled during peak focus hours (mornings)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Step 1: Add Courses */}
      <Card className="border-2 border-blue-200 shadow-lg">
        <CardHeader className="bg-blue-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center">
              1
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-600" />
                Add Your Courses
              </CardTitle>
              <CardDescription>
                List all courses you need to study and set their priority levels
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          {/* Priority Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            {priorityOptions.map((option) => {
              const Icon = option.icon;
              return (
                <div key={option.value} className={`p-3 rounded-lg border-2 ${selectedPriority === option.value ? 'border-blue-500' : 'border-gray-200'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="h-4 w-4" />
                    <span className="text-sm">{option.label}</span>
                    <Badge variant="secondary" className="text-xs ml-auto">{option.allocation}</Badge>
                  </div>
                  <p className="text-xs text-gray-600">{option.description}</p>
                </div>
              );
            })}
          </div>

          {/* Add Course Form */}
          <div className="grid grid-cols-1 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="new-subject">Course Name</Label>
                <Input
                  id="new-subject"
                  placeholder="e.g., Calculus, Physics, English..."
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
                  <p className="text-xs text-red-600 mt-1">⚠️ Please enter a course name</p>
                )}
              </div>
              <div>
                <Label htmlFor="hours-per-week">Hours Needed Per Week</Label>
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
                <Label>Priority Level</Label>
                <div className="flex gap-2 mt-1">
                  {priorityOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.value}
                        onClick={() => setSelectedPriority(option.value as any)}
                        className={`
                          flex-1 px-3 py-2 rounded-lg flex items-center justify-center gap-2 transition-all text-sm
                          ${selectedPriority === option.value 
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
                <Label>Preferred Study Time</Label>
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
              className="w-full bg-blue-600 hover:bg-blue-800 dark:hover:bg-blue-900"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Course
            </Button>
          </div>

          {/* Display Added Courses */}
          {subjects.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm text-gray-700">Your Courses ({subjects.length})</h4>
                <div className="text-xs text-gray-600">
                  Total: <strong>{totalHoursNeeded}h/week</strong>
                </div>
              </div>
              {subjects.map((subject) => {
                const priorityInfo = priorityOptions.find(p => p.value === subject.priority);
                const PriorityIcon = priorityInfo?.icon || Clock;
                const timeOfDay = timeOfDayOptions.find(t => t.value === subject.preferredTimeOfDay);
                
                return (
                  <div 
                    key={subject.id} 
                    className="p-4 rounded-lg border border-gray-200 bg-white hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 ${subject.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <BookOpen className="h-5 w-5 text-white" />
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
                            <Label className="text-xs text-gray-600">Hours/Week</Label>
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
                            <Label className="text-xs text-gray-600">Preferred Time</Label>
                            <select
                              value={subject.preferredTimeOfDay}
                              onChange={(e) => updateSubjectTimeOfDay(subject.id, e.target.value as any)}
                              className="w-full h-8 px-2 rounded-md border border-input bg-white mt-1 text-sm"
                            >
                              {timeOfDayOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.value.charAt(0).toUpperCase() + option.value.slice(1)}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Start Time Field */}
                        <div className="grid grid-cols-2 gap-3 text-sm mt-3">
                          <div>
                            <Label className="text-xs text-gray-600">Preferred Start Time</Label>
                            <Input
                              type="time"
                              value={subject.startTime || ''}
                              onChange={(e) => updateSubjectStartTime(subject.id, e.target.value)}
                              className="mt-1 h-8"
                              placeholder="Optional"
                            />
                            <p className="text-xs text-gray-500 mt-0.5">Optional: Set specific start time</p>
                          </div>
                          <div>
                            {/* Empty div to maintain grid layout */}
                          </div>
                        </div>

                        {/* Session and Break Duration Settings */}
                        <div className="grid grid-cols-2 gap-3 text-sm mt-3">
                          <div>
                            <Label className="text-xs text-gray-600">Session Duration (min)</Label>
                            <Input
                              type="number"
                              min="25"
                              max="120"
                              step="5"
                              value={subject.sessionDuration}
                              onChange={(e) => updateSubjectSessionDuration(subject.id, parseInt(e.target.value) || 50)}
                              className="mt-1 h-8"
                            />
                            <p className="text-xs text-gray-500 mt-0.5">Recommended: 45-50</p>
                          </div>
                          <div>
                            <Label className="text-xs text-gray-600">Break Duration (min)</Label>
                            <Input
                              type="number"
                              min="5"
                              max="30"
                              step="5"
                              value={subject.breakDuration}
                              onChange={(e) => updateSubjectBreakDuration(subject.id, parseInt(e.target.value) || 10)}
                              className="mt-1 h-8"
                            />
                            <p className="text-xs text-gray-500 mt-0.5">Recommended: 10-15</p>
                          </div>
                        </div>

                        {/* Day Selector for this course */}
                        <div className="mt-3">
                          <Label className="text-xs text-gray-600 mb-1.5 block">Study Days for {subject.name}</Label>
                          <div className="flex flex-wrap gap-1.5">
                            {weekDays.map((day) => {
                              const isSelected = subject.selectedDays.includes(day);
                              return (
                                <button
                                  key={day}
                                  onClick={() => toggleSubjectDay(subject.id, day)}
                                  className={`
                                    px-2 py-1 rounded text-xs transition-all border
                                    ${isSelected 
                                      ? 'bg-blue-500 text-white border-blue-600' 
                                      : 'bg-gray-100 text-gray-600 border-gray-200 hover:border-gray-300'
                                    }
                                  `}
                                >
                                  {day.slice(0, 3)}
                                </button>
                              );
                            })}
                          </div>
                          {subject.selectedDays.length === 0 && (
                            <p className="text-xs text-red-600 mt-1">⚠️ Select at least one day</p>
                          )}
                          {subject.selectedDays.length > 0 && (
                            <p className="text-xs text-gray-500 mt-1">
                              {subject.selectedDays.length} day{subject.selectedDays.length !== 1 ? 's' : ''} selected
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
              })}</div>
          )}

          {/* Priority Distribution Summary */}
          {subjects.length > 0 && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-900 mb-3">
                <strong>📊 Time Allocation Summary</strong>
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-xs text-blue-700">High Priority</p>
                  <p className="text-blue-900">{highPriorityHours}h (50%)</p>
                </div>
                <div>
                  <p className="text-xs text-blue-700">Medium Priority</p>
                  <p className="text-blue-900">{mediumPriorityHours}h (30%)</p>
                </div>
                <div>
                  <p className="text-xs text-blue-700">Low Priority</p>
                  <p className="text-blue-900">{lowPriorityHours}h (20%)</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generate Button */}
      <div className="flex justify-between items-center gap-3 pt-4 pb-8">
        <Button variant="outline" onClick={handleReset}>
          Reset All
        </Button>
        <Button 
          onClick={handleGenerate}
          disabled={subjects.length === 0}
          className="bg-blue-600 hover:bg-blue-800 dark:hover:bg-blue-900 px-8"
          size="lg"
        >
          <Sparkles className="h-5 w-5 mr-2" />
          Generate Smart Timetable
        </Button>
      </div>

      {/* Bottom Info */}
      {subjects.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm text-amber-900">
            <strong>🎯 Ready to Generate!</strong> You have {subjects.length} course{subjects.length !== 1 ? 's' : ''} ({totalHoursNeeded}h/week) 
            {blockedTimes.length > 0 && ` and ${blockedTimes.length} blocked time${blockedTimes.length !== 1 ? 's' : ''}`}. 
            The AI will automatically create an optimized study schedule based on your free time and priorities.
          </p>
        </div>
      )}

      {/* Import Dialog - Same as CalendarView */}
      <ImportDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onImport={handleImportSessions}
        buttonText="Save to Timetable"
      />
    </div>
  );
}