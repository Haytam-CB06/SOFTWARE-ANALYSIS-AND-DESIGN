import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ChevronLeft, ChevronRight, Plus, Download, Upload, Trash2, Calendar as CalendarIcon, Clock, GripVertical, AlertTriangle, ChevronDown, ChevronUp, RotateCcw, Copy, FileText, Sun, Moon } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { toast } from 'sonner@2.0.3';
import { getUserWeekKey } from '../utils/userStorage';
import SessionCard from './SessionCard';
import SessionDialog from './SessionDialog';
import ImportDialog from './ImportDialog';
import googleCalendarIcon from 'figma:asset/9cdb2bc588344ebf952e674647c637e389c6663e.png';

interface Session {
  id: string;
  subject: string;
  startTime: string;
  endTime: string;
  day: number; // 0 = Monday, 6 = Sunday
  type: 'reading' | 'revision' | 'practice' | 'break' | 'lecture' | 'assignment' | 'test' | 'exam';
  color: string;
  deadline?: string; // ISO date string for assignment, test, exam
}

interface CalendarViewProps {
  onSaveTimetable?: (sessions: Session[]) => void;
  onNavigate?: (page: string) => void;
}

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const timeSlots = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'
];

const studyTypes = [
  { value: 'reading', label: 'Reading', color: '#3B82F6' },
  { value: 'revision', label: 'Revision', color: '#A855F7' },
  { value: 'practice', label: 'Practice', color: '#10B981' },
  { value: 'break', label: 'Break', color: '#9CA3AF' },
  { value: 'lecture', label: 'Lecture', color: '#6366F1' },
  { value: 'assignment', label: 'Assignment', color: '#F97316' },
  { value: 'test', label: 'Test/Quiz', color: '#DC2626' },
  { value: 'exam', label: 'Exam', color: '#991B1B' },
];

export default function CalendarView({ onSaveTimetable, onNavigate }: CalendarViewProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ day: number; time: string } | null>(null);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [draggingSession, setDraggingSession] = useState<string | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<{ day: number; time: string } | null>(null);
  const [hasExportedThisWeek, setHasExportedThisWeek] = useState(false);
  const [headerCollapsed, setHeaderCollapsed] = useState(false);
  const [availabilitySettings, setAvailabilitySettings] = useState<any>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    confirmVariant?: 'default' | 'destructive';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Get week identifier (e.g., "2025-W45")
  const getWeekIdentifier = (date: Date): string => {
    const year = date.getFullYear();
    const firstDayOfYear = new Date(year, 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    return `${year}-W${String(weekNumber).padStart(2, '0')}`;
  };

  // Load sessions from localStorage for current week
  useEffect(() => {
    const loadSessions = () => {
      const weekId = getWeekIdentifier(currentDate);
      const savedSessions = localStorage.getItem(getUserWeekKey(weekId));
      if (savedSessions) {
        try {
          const parsed = JSON.parse(savedSessions);
          console.log('[CalendarView] Loaded sessions:', parsed);
          console.log('[CalendarView] Session details:', parsed.map((s: Session) => ({
            id: s.id,
            subject: s.subject,
            day: days[s.day],
            time: `${s.startTime}-${s.endTime}`
          })));
          setSessions(parsed);
        } catch (e) {
          setSessions([]);
        }
      } else {
        console.log('[CalendarView] No saved sessions for week', weekId);
        setSessions([]);
      }
      
      // Load export status for this week
      const exportKey = `${getUserWeekKey(weekId)}_exported`;
      const hasExported = localStorage.getItem(exportKey) === 'true';
      setHasExportedThisWeek(hasExported);
      
      // Load availability settings from active timetable
      try {
        const storedTimetables = localStorage.getItem('timetables');
        if (storedTimetables) {
          const timetables = JSON.parse(storedTimetables);
          const activeTimetable = timetables.find((t: any) => t.isActive);
          console.log('[CalendarView] All timetables:', timetables);
          console.log('[CalendarView] Active timetable:', activeTimetable);
          
          if (activeTimetable && activeTimetable.availabilitySettings) {
            console.log('[CalendarView] ✅ Loaded availability settings:', activeTimetable.availabilitySettings);
            setAvailabilitySettings(activeTimetable.availabilitySettings);
          } else {
            console.log('[CalendarView] ⚠️ No availability settings found on active timetable');
            setAvailabilitySettings(null);
          }
        } else {
          console.log('[CalendarView] ⚠️ No timetables in localStorage');
        }
      } catch (e) {
        console.error('[CalendarView] Error loading availability settings:', e);
        setAvailabilitySettings(null);
      }
    };

    loadSessions();

    // Listen for user changes
    const handleUserChanged = () => {
      console.log('[CalendarView] User changed, clearing and reloading sessions...');
      
      // Clear sessions immediately
      setSessions([]);
      
      // Then reload new user's data
      loadSessions();
    };

    // Listen for timetable activation and session updates
    const handleSessionsUpdated = () => {
      console.log('[CalendarView] Sessions updated, reloading...');
      loadSessions();
    };

    window.addEventListener('userChanged', handleUserChanged);
    window.addEventListener('calendarSessionsUpdated', handleSessionsUpdated);

    return () => {
      window.removeEventListener('userChanged', handleUserChanged);
      window.removeEventListener('calendarSessionsUpdated', handleSessionsUpdated);
    };
  }, [currentDate]);

  // Save sessions to localStorage whenever they change
  useEffect(() => {
    if (sessions.length >= 0) {
      const weekId = getWeekIdentifier(currentDate);
      localStorage.setItem(getUserWeekKey(weekId), JSON.stringify(sessions));
      onSaveTimetable?.(sessions);
    }
  }, [sessions, currentDate, onSaveTimetable]);

  const previousWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const nextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const isCurrentWeek = () => {
    const today = new Date();
    return getWeekIdentifier(today) === getWeekIdentifier(currentDate);
  };

  const handleAddSession = (day: number, time: string) => {
    setSelectedSlot({ day, time });
    setEditingSession(null);
    setIsDialogOpen(true);
  };

  const handleEditSession = (session: Session) => {
    setEditingSession(session);
    setIsDialogOpen(true);
  };

  const handleSaveSession = (sessionData: Omit<Session, 'id'>) => {
    // Check for time conflicts and find conflicting session
    let conflictingSession: Session | null = null;
    
    const hasConflict = sessions.some(existingSession => {
      // Skip the session being edited
      if (editingSession && existingSession.id === editingSession.id) return false;
      
      // Only check sessions on the same day
      if (existingSession.day !== sessionData.day) return false;
      
      // Convert time strings to minutes for easier comparison
      const existingStart = timeToMinutes(existingSession.startTime);
      const existingEnd = timeToMinutes(existingSession.endTime);
      const newStart = timeToMinutes(sessionData.startTime);
      const newEnd = timeToMinutes(sessionData.endTime);
      
      // Check if times overlap - adjacent sessions (one ends when other starts) are OK
      const overlaps = (newStart < existingEnd && newEnd > existingStart);
      if (overlaps) {
        conflictingSession = existingSession;
      }
      return overlaps;
    });

    if (hasConflict && conflictingSession) {
      const dayName = days[sessionData.day];
      
      // Show prominent warning notification
      toast.error('⚠️ TIME CONFLICT DETECTED!', {
        description: (
          <div className="space-y-2">
            <p className="font-semibold">Cannot add "{sessionData.subject}"</p>
            <p>"{conflictingSession.subject}" is already scheduled on {dayName}</p>
            <p className="text-sm">Time: {conflictingSession.startTime} - {conflictingSession.endTime}</p>
            <p className="text-sm text-red-200">Please choose a different time slot</p>
          </div>
        ),
        duration: Infinity, // Stays until dismissed
        action: {
          label: 'Dismiss',
          onClick: () => {},
        },
      });
      
      return;
    }

    if (editingSession) {
      // Update existing session
      setSessions(sessions.map(s => s.id === editingSession.id ? { ...sessionData, id: s.id } : s));
      const hasDeadline = sessionData.deadline && (sessionData.type === 'assignment' || sessionData.type === 'test' || sessionData.type === 'exam');
      toast.success(hasDeadline ? '✅ Session & deadline updated!' : '✅ Session updated successfully');
    } else {
      // Add new session
      const newSession: Session = {
        ...sessionData,
        id: Date.now().toString(),
      };
      setSessions([...sessions, newSession]);
      const hasDeadline = sessionData.deadline && (sessionData.type === 'assignment' || sessionData.type === 'test' || sessionData.type === 'exam');
      toast.success(hasDeadline ? '✅ Session added with deadline!' : '✅ Session added successfully');
    }
    setIsDialogOpen(false);
    setSelectedSlot(null);
    setEditingSession(null);
  };

  const handleDeleteSession = (id: string) => {
    setSessions(sessions.filter(s => s.id !== id));
    toast.success('Session deleted successfully');
  };

  const handleClearAll = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Clear All Sessions',
      message: 'Are you sure you want to clear all sessions for this week?',
      onConfirm: () => {
        setSessions([]);
        const weekId = getWeekIdentifier(currentDate);
        localStorage.removeItem(getUserWeekKey(weekId));
        toast.success('✅ Done! All sessions have been cleared successfully.');
      },
      confirmText: 'Clear All',
      confirmVariant: 'destructive',
    });
  };

  const handleRecurse = () => {
    if (sessions.length === 0) {
      toast.error('⚠️ Empty Timetable', {
        description: 'Your timetable is empty. Please add some sessions before copying to the next week.',
        duration: 5000,
      });
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: 'Copy to Next Week',
      message: `Copy all ${sessions.length} session(s) from this week to the next week?`,
      onConfirm: () => {
        // Get next week's date
        const nextWeekDate = new Date(currentDate);
        nextWeekDate.setDate(currentDate.getDate() + 7);
        const nextWeekId = getWeekIdentifier(nextWeekDate);

        // Copy sessions with new IDs
        const copiedSessions = sessions.map(session => ({
          ...session,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        }));

        // Save to next week
        localStorage.setItem(getUserWeekKey(nextWeekId), JSON.stringify(copiedSessions));
        
        toast.success('Sessions copied successfully!', {
          description: `${sessions.length} session(s) copied to next week (Week ${nextWeekId})`,
          action: {
            label: 'View',
            onClick: () => setCurrentDate(nextWeekDate),
          },
        });
        
        setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} });
      },
      confirmText: 'Copy',
      confirmVariant: 'default',
    });
  };

  const exportToPDF = async () => {
    const { jsPDF } = await import('jspdf');
    const weekId = getWeekIdentifier(currentDate);
    
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(18);
    doc.text('Study Timetable', 105, 15, { align: 'center' });
    
    // Week info
    doc.setFontSize(12);
    doc.text(`Week: ${formatDateRange()}`, 105, 25, { align: 'center' });
    
    // Sessions by day
    let yPosition = 40;
    const pageHeight = doc.internal.pageSize.height;
    
    days.forEach((day, dayIndex) => {
      const daySessions = sessions.filter(s => s.day === dayIndex).sort((a, b) => 
        timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
      );
      
      if (daySessions.length === 0) return;
      
      // Check if we need a new page
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = 20;
      }
      
      // Day header
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text(day, 20, yPosition);
      yPosition += 8;
      
      // Sessions
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      daySessions.forEach(session => {
        if (yPosition > pageHeight - 20) {
          doc.addPage();
          yPosition = 20;
        }
        
        doc.text(`  ${session.startTime} - ${session.endTime}`, 25, yPosition);
        doc.text(`${session.subject} (${session.type})`, 70, yPosition);
        yPosition += 6;
      });
      
      yPosition += 5;
    });
    
    // Save PDF
    doc.save(`timetable_${weekId}.pdf`);
    toast.success('Timetable exported as PDF');
  };

  const exportToExcel = async () => {
    const XLSX = await import('xlsx');
    const weekId = getWeekIdentifier(currentDate);
    
    // Create worksheet data
    const worksheetData: any[] = [
      ['Study Timetable'],
      [`Week: ${formatDateRange()}`],
      [],
      ['Day', 'Subject', 'Start Time', 'End Time', 'Type', 'Deadline']
    ];
    
    // Add sessions
    sessions
      .sort((a, b) => {
        if (a.day !== b.day) return a.day - b.day;
        return timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
      })
      .forEach(session => {
        worksheetData.push([
          days[session.day],
          session.subject,
          session.startTime,
          session.endTime,
          session.type,
          session.deadline || ''
        ]);
      });
    
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    
    // Set column widths
    ws['!cols'] = [
      { wch: 12 },  // Day
      { wch: 25 },  // Subject
      { wch: 12 },  // Start Time
      { wch: 12 },  // End Time
      { wch: 12 },  // Type
      { wch: 15 }   // Deadline
    ];
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Timetable');
    
    // Save Excel file
    XLSX.writeFile(wb, `timetable_${weekId}.xlsx`);
    toast.success('Timetable exported as Excel');
  };

  const exportToGoogleCalendar = () => {
    // ============================================================================
    // 🔌 BACKEND INTEGRATION POINT - EXPORT TO GOOGLE CALENDAR
    // ============================================================================
    // This section exports timetable sessions to Google Calendar
    // 
    // API Endpoint: POST /api/calendar/export
    // Request Body: {
    //   sessions: Array<{
    //     subject: string,
    //     startTime: string,    // ISO datetime
    //     endTime: string,      // ISO datetime
    //     description: string,
    //     location: string
    //   }>,
    //   weekId: string,
    //   calendarId: string       // Google Calendar ID
    // }
    // Response: {
    //   success: boolean,
    //   exportedCount: number,
    //   calendarUrl: string,
    //   message: string
    // }
    // 
    // Backend Implementation:
    // - Use Google Calendar API with OAuth 2.0
    // - Create recurring events for weekly schedules
    // - Add reminders and notifications
    // - Handle timezone conversions
    // - Sync updates and deletions
    // 
    // Required: Google Calendar API credentials and user OAuth tokens
    // TODO: Implement actual Google Calendar API integration
    // ============================================================================
    
    // Empty function - backend will handle export
  };

  const handleImport = (importedSessions: Session[], importedAvailabilitySettings?: any) => {
    // Check for conflicts between imported sessions and existing sessions
    const conflicts: { imported: Session; existing: Session }[] = [];
    
    importedSessions.forEach(importedSession => {
      sessions.forEach(existingSession => {
        // Only check sessions on the same day
        if (existingSession.day === importedSession.day) {
          const existingStart = timeToMinutes(existingSession.startTime);
          const existingEnd = timeToMinutes(existingSession.endTime);
          const importedStart = timeToMinutes(importedSession.startTime);
          const importedEnd = timeToMinutes(importedSession.endTime);
          
          // Check if times overlap
          if (importedStart < existingEnd && importedEnd > existingStart) {
            conflicts.push({ imported: importedSession, existing: existingSession });
          }
        }
      });
    });
    
    if (conflicts.length > 0) {
      // Show conflict warning
      toast.error('⚠️ IMPORT CONFLICTS DETECTED!', {
        description: (
          <div className="space-y-2">
            <p className="font-semibold">{conflicts.length} conflict(s) found</p>
            {conflicts.slice(0, 2).map((conflict, idx) => (
              <div key={idx} className="text-sm">
                <p>"{conflict.imported.subject}" conflicts with "{conflict.existing.subject}"</p>
                <p className="text-xs text-red-200">on {days[conflict.imported.day]}</p>
              </div>
            ))}
            {conflicts.length > 2 && (
              <p className="text-xs text-red-200">and {conflicts.length - 2} more...</p>
            )}
          </div>
        ),
        duration: 8000,
      });
      return;
    }

    // Add imported sessions to existing sessions
    const newSessions = [...sessions, ...importedSessions];
    setSessions(newSessions);
    
    // Save availability settings to active timetable if provided
    if (importedAvailabilitySettings) {
      try {
        const storedTimetables = localStorage.getItem('timetables');
        if (storedTimetables) {
          const timetables = JSON.parse(storedTimetables);
          const activeTimetableIndex = timetables.findIndex((t: any) => t.isActive);
          
          if (activeTimetableIndex !== -1) {
            // Update the active timetable with availability settings
            timetables[activeTimetableIndex].availabilitySettings = importedAvailabilitySettings;
            localStorage.setItem('timetables', JSON.stringify(timetables));
            
            // Update local state
            setAvailabilitySettings(importedAvailabilitySettings);
            
            console.log('[CalendarView] ✅ Saved availability settings to active timetable:', importedAvailabilitySettings);
            
            toast.success(`Successfully imported ${importedSessions.length} session(s) with availability settings!`);
          } else {
            toast.success(`Successfully imported ${importedSessions.length} session(s)!`);
          }
        } else {
          toast.success(`Successfully imported ${importedSessions.length} session(s)!`);
        }
      } catch (error) {
        console.error('[CalendarView] Error saving availability settings:', error);
        toast.success(`Successfully imported ${importedSessions.length} session(s)!`);
      }
    } else {
      toast.success(`Successfully imported ${importedSessions.length} session(s)!`);
    }
  };

  // Get the dates for the current week (Monday to Sunday)
  const getWeekDates = (): Date[] => {
    const weekStart = new Date(currentDate);
    const day = weekStart.getDay();
    const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    weekStart.setDate(diff);
    
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      return date;
    });
  };

  const weekDates = getWeekDates();

  const formatDateRange = () => {
    const start = weekDates[0];
    const end = weekDates[6];
    const weekId = getWeekIdentifier(currentDate);
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} (${weekId})`;
  };

  // Helper function to convert time string to minutes
  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Helper to check if a session starts at a specific time slot
  const sessionStartsInSlot = (session: Session, slotTime: string): boolean => {
    // Convert slot time and session start time to minutes
    const slotMinutes = timeToMinutes(slotTime);
    const sessionStartMinutes = timeToMinutes(session.startTime);
    
    // Check if session starts within this hour slot (slotTime to slotTime + 60 minutes)
    // For example, 11:40 session should appear in the 11:00 slot
    return sessionStartMinutes >= slotMinutes && sessionStartMinutes < slotMinutes + 60;
  };

  // Calculate the height of a session card based on duration (in table rows)
  const calculateSessionHeight = (session: Session): number => {
    const startMinutes = timeToMinutes(session.startTime);
    const endMinutes = timeToMinutes(session.endTime);
    const durationMinutes = endMinutes - startMinutes;
    
    // Each time slot is 1 hour = 60 minutes, height is 80px per slot
    const pixelsPerMinute = 80 / 60;
    return Math.max(durationMinutes * pixelsPerMinute, 40); // Minimum 40px
  };

  // Drag and drop handlers
  const handleDragStart = (sessionId: string) => {
    setDraggingSession(sessionId);
  };

  const handleDragOver = (e: React.DragEvent, day: number, time: string) => {
    e.preventDefault();
    setDragOverSlot({ day, time });
  };

  const handleDrop = (e: React.DragEvent, day: number, time: string) => {
    e.preventDefault();
    
    if (!draggingSession) return;

    const session = sessions.find(s => s.id === draggingSession);
    if (!session) return;

    // Calculate duration
    const startMinutes = timeToMinutes(session.startTime);
    const endMinutes = timeToMinutes(session.endTime);
    const duration = endMinutes - startMinutes;

    // Calculate new end time
    const newStartMinutes = timeToMinutes(time);
    const newEndMinutes = newStartMinutes + duration;
    const newEndHours = Math.floor(newEndMinutes / 60);
    const newEndMins = newEndMinutes % 60;
    const newEndTime = `${String(newEndHours).padStart(2, '0')}:${String(newEndMins).padStart(2, '0')}`;

    // Check for conflicts
    const hasConflict = sessions.some(s => {
      if (s.id === draggingSession || s.day !== day) return false;
      
      const existingStart = timeToMinutes(s.startTime);
      const existingEnd = timeToMinutes(s.endTime);
      
      // Two sessions conflict if they overlap
      // Adjacent sessions (one ends when other starts) are OK
      return (
        (newStartMinutes < existingEnd && newEndMinutes > existingStart)
      );
    });

    if (hasConflict) {
      const draggedSession = sessions.find(s => s.id === draggingSession);
      const conflictingSession = sessions.find(s => {
        if (s.id === draggingSession || s.day !== day) return false;
        const existingStart = timeToMinutes(s.startTime);
        const existingEnd = timeToMinutes(s.endTime);
        return (
          (newStartMinutes < existingEnd && newEndMinutes > existingStart)
        );
      });
      
      toast.error('⚠️ DRAG & DROP CONFLICT!', {
        description: draggedSession && conflictingSession ? (
          <div className="space-y-2">
            <p className="font-semibold">Cannot move "{draggedSession.subject}"</p>
            <p>"{conflictingSession.subject}" is already in this time slot</p>
            <p className="text-sm">on {days[day]}: {conflictingSession.startTime} - {conflictingSession.endTime}</p>
            <p className="text-sm text-red-200">Please choose a different slot</p>
          </div>
        ) : 'Another session already exists at this time. Please choose a different slot.',
        duration: 10000, // Auto-dismiss after 10 seconds
        action: {
          label: 'Dismiss',
          onClick: () => {},
        },
      });
      setDraggingSession(null);
      setDragOverSlot(null);
      return;
    }

    // Update session
    setSessions(sessions.map(s => 
      s.id === draggingSession 
        ? { ...s, day, startTime: time, endTime: newEndTime }
        : s
    ));

    toast.success('✅ Session moved successfully', {
      description: `Moved to ${days[day]} at ${time}`,
    });
    setDraggingSession(null);
    setDragOverSlot(null);
  };

  // Function to check for overlap in a specific time slot
  const checkOverlapInSlot = (sessions: Session[], day: number, time: string): boolean => {
    const startMinutes = timeToMinutes(time);
    const endMinutes = startMinutes + 60; // Assuming each slot is 1 hour

    return sessions.some(s => {
      if (s.day !== day) return false;
      
      const existingStart = timeToMinutes(s.startTime);
      const existingEnd = timeToMinutes(s.endTime);
      
      // Check if times overlap
      return (
        (startMinutes < existingEnd && endMinutes > existingStart)
      );
    });
  };
  
  // Helper function to check if a time slot overlaps with availability settings blocks
  const getAvailabilityBlocksInSlot = (dayIndex: number, slotTime: string) => {
    if (!availabilitySettings) return [];
    
    const blocks: Array<{ type: string; label: string; start: string; end: string; }> = [];
    const slotMinutes = timeToMinutes(slotTime);
    const slotEndMinutes = slotMinutes + 60;
    
    // Check sleep hours - support both 'from/to' and 'start/end' formats
    const sleepFrom = availabilitySettings.sleepHours?.from || availabilitySettings.sleepHours?.start;
    const sleepTo = availabilitySettings.sleepHours?.to || availabilitySettings.sleepHours?.end;
    
    if (sleepFrom && sleepTo) {
      const sleepStart = timeToMinutes(sleepFrom);
      const sleepEnd = timeToMinutes(sleepTo);
      
      // Handle overnight sleep (e.g., 23:00 - 07:00)
      if (sleepStart > sleepEnd) {
        // Check if slot overlaps with evening portion (23:00 - 24:00)
        if (slotMinutes < 1440 && slotMinutes >= sleepStart) {
          blocks.push({
            type: 'sleep',
            label: 'Sleep',
            start: sleepFrom,
            end: '23:59'
          });
        }
        // Check if slot overlaps with morning portion (00:00 - 07:00)
        if (slotMinutes < sleepEnd) {
          blocks.push({
            type: 'sleep',
            label: 'Sleep',
            start: '00:00',
            end: sleepTo
          });
        }
      } else {
        // Normal sleep hours within same day
        if (slotMinutes < sleepEnd && slotEndMinutes > sleepStart) {
          blocks.push({
            type: 'sleep',
            label: 'Sleep',
            start: sleepFrom,
            end: sleepTo
          });
        }
      }
    }
    
    // Check lunch break
    if (availabilitySettings.lunchBreak?.enabled) {
      const lunchStart = timeToMinutes(availabilitySettings.lunchBreak.start);
      const lunchEnd = timeToMinutes(availabilitySettings.lunchBreak.end);
      
      if (slotMinutes < lunchEnd && slotEndMinutes > lunchStart) {
        blocks.push({
          type: 'lunch',
          label: 'Lunch',
          start: availabilitySettings.lunchBreak.start,
          end: availabilitySettings.lunchBreak.end
        });
      }
    }
    
    // Check dinner break
    if (availabilitySettings.dinnerBreak?.enabled) {
      const dinnerStart = timeToMinutes(availabilitySettings.dinnerBreak.start);
      const dinnerEnd = timeToMinutes(availabilitySettings.dinnerBreak.end);
      
      if (slotMinutes < dinnerEnd && slotEndMinutes > dinnerStart) {
        blocks.push({
          type: 'dinner',
          label: 'Dinner',
          start: availabilitySettings.dinnerBreak.start,
          end: availabilitySettings.dinnerBreak.end
        });
      }
    }
    
    return blocks;
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white/90 backdrop-blur-sm shadow-sm">
        {/* Collapsible Header Content */}
        <div 
          className="overflow-hidden transition-all duration-300 ease-in-out"
          style={{
            maxHeight: headerCollapsed ? '0px' : '500px',
            opacity: headerCollapsed ? 0 : 1,
          }}
        >
          <div className="p-4 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-xl sm:text-2xl text-gray-800 dark:text-gray-100">Study Timetable</h1>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Plan and organize your study sessions • Each week has its own schedule
                </p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {sessions.filter(s => s.deadline && (s.type === 'assignment' || s.type === 'test' || s.type === 'exam')).length > 0 && (
                    <Badge variant="outline" className="text-xs border-red-600 text-red-600 bg-red-50 dark:border-red-400 dark:text-red-400 dark:bg-red-950/30">
                      📅 {sessions.filter(s => s.deadline && (s.type === 'assignment' || s.type === 'test' || s.type === 'exam')).length} Deadline{sessions.filter(s => s.deadline && (s.type === 'assignment' || s.type === 'test' || s.type === 'exam')).length > 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 justify-end">
                {/* Add New Session Button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="default" 
                      size="sm"
                      disabled={!isCurrentWeek()}
                      onClick={() => {
                        setSelectedSlot(null);
                        setEditingSession(null);
                        setIsDialogOpen(true);
                      }}
                      className="bg-blue-600 hover:bg-blue-800 dark:hover:bg-blue-800"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Add new session</p>
                  </TooltipContent>
                </Tooltip>

                {/* Auto Generate Button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="default" 
                      size="sm"
                      onClick={() => setIsImportDialogOpen(true)}
                      className="bg-blue-600 hover:bg-blue-800 dark:hover:bg-blue-800"
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Auto Generate</p>
                  </TooltipContent>
                </Tooltip>

                {/* Copy to Next Week Button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="default" 
                      size="sm"
                      onClick={handleRecurse}
                      className="bg-blue-600 hover:bg-blue-800 dark:hover:bg-blue-800"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Copy to next week</p>
                  </TooltipContent>
                </Tooltip>

                {/* Clear All Sessions Button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="default" 
                      size="sm"
                      onClick={handleClearAll}
                      className="bg-red-600 hover:bg-red-800 dark:hover:bg-red-900"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Clear all sessions</p>
                  </TooltipContent>
                </Tooltip>

                {/* Google Calendar Export Button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant={hasExportedThisWeek ? "outline" : "outline"}
                      size="sm"
                      onClick={exportToGoogleCalendar}
                      className={hasExportedThisWeek 
                        ? "border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/20" 
                        : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-900"
                      }
                    >
                      <img src={googleCalendarIcon} alt="Google Calendar" className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Export to Google Calendar</p>
                  </TooltipContent>
                </Tooltip>

                {/* Timetable Menu Button */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="default" size="sm" className="bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-800" title="More options">
                      <CalendarIcon className="h-4 w-4" />
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={exportToPDF}>
                      <FileText className="h-4 w-4 mr-2" />
                      Export as PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={exportToExcel}>
                      <Download className="h-4 w-4 mr-2" />
                      Export as Excel
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>

        {/* Toggle Button - Always Visible */}
        <div className="flex justify-center border-t border-gray-200">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setHeaderCollapsed(!headerCollapsed)}
            className="rounded-none rounded-b-md hover:bg-blue-50 text-gray-600 hover:text-blue-600 transition-all duration-200 px-8 py-1"
          >
            {headerCollapsed ? (
              <>
                <ChevronDown className="h-4 w-4 mr-2" />
                <span className="text-xs">Show Details</span>
              </>
            ) : (
              <>
                <ChevronUp className="h-4 w-4 mr-2" />
                <span className="text-xs">Hide Details</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Week Navigation */}
      <div className="px-4 sm:px-6 py-3 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={previousWeek}
            className="hover:bg-gray-100"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="text-center flex-1">
            <div className="text-base sm:text-lg text-gray-700">{formatDateRange()}</div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={nextWeek}
            className="hover:bg-gray-100"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      {!isCurrentWeek() && (
        <div className="px-4 sm:px-6 py-2 bg-blue-50 border-b border-blue-100">
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
              className="gap-2 border-blue-300 bg-white hover:bg-blue-50"
            >
              <CalendarIcon className="h-4 w-4" />
              Go to Current Week
            </Button>
          </div>
        </div>
      )}

      {/* Availability & Breaks Settings Display */}
      {availabilitySettings && (
        <div className="px-4 sm:px-6 py-3 bg-blue-50 dark:bg-gray-800 border-b border-blue-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-blue-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Availability & Breaks Settings</h3>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {/* Weekday Hours */}
                {availabilitySettings.weekdayAvailability && (
                  <div className="bg-blue-50 dark:bg-blue-950/50 rounded-md p-2 border border-blue-200 dark:border-blue-800">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Weekday Hours:</p>
                    <p className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                      {availabilitySettings.weekdayAvailability.start} - {availabilitySettings.weekdayAvailability.end}
                    </p>
                  </div>
                )}
                
                {/* Weekend Hours */}
                {availabilitySettings.weekendAvailability && !availabilitySettings.weekendSameAsWeekday && (
                  <div className="bg-blue-50 dark:bg-blue-950/50 rounded-md p-2 border border-blue-200 dark:border-blue-800">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Weekend Hours:</p>
                    <p className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                      {availabilitySettings.weekendAvailability.start} - {availabilitySettings.weekendAvailability.end}
                    </p>
                  </div>
                )}
                
                {/* Sleep Hours */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-2 border border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Sleep Hours:</p>
                  <p className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                    {(() => {
                      const sleepFrom = availabilitySettings.sleepHours?.from || availabilitySettings.sleepHours?.start;
                      const sleepTo = availabilitySettings.sleepHours?.to || availabilitySettings.sleepHours?.end;
                      return sleepFrom && sleepTo ? `${sleepFrom} - ${sleepTo}` : '-';
                    })()}
                  </p>
                </div>
                
                {/* Lunch Break */}
                {availabilitySettings.lunchBreak?.enabled && (
                  <div className="bg-yellow-50 dark:bg-yellow-950/50 rounded-md p-2 border border-yellow-200 dark:border-yellow-800">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Lunch Break:</p>
                    <p className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                      {availabilitySettings.lunchBreak.start} - {availabilitySettings.lunchBreak.end}
                    </p>
                  </div>
                )}
                
                {/* Dinner Break */}
                {availabilitySettings.dinnerBreak?.enabled && (
                  <div className="bg-orange-50 dark:bg-orange-950/50 rounded-md p-2 border border-orange-200 dark:border-orange-800">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Dinner Break:</p>
                    <p className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                      {availabilitySettings.dinnerBreak.start} - {availabilitySettings.dinnerBreak.end}
                    </p>
                  </div>
                )}
                
                {/* Commute Buffer */}
                {availabilitySettings.commuteMinutes > 0 && (
                  <div className="bg-purple-50 dark:bg-purple-950/50 rounded-md p-2 border border-purple-200 dark:border-purple-800">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Commute Buffer:</p>
                    <p className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                      {availabilitySettings.commuteMinutes} minutes
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Calendar Grid - Simple Table Structure */}
      <div className="flex-1 overflow-auto">
        <div className="min-w-[900px]">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-20 bg-blue-50 shadow-md">
              <tr>
                <th className="sticky left-0 z-30 border border-gray-300 px-4 py-3 text-left w-24 bg-blue-50">
                  <div className="text-sm font-semibold text-gray-700">Time</div>
                </th>
                {days.map((day, index) => {
                  const date = weekDates[index];
                  const isToday = date.toDateString() === new Date().toDateString();
                  
                  return (
                    <th 
                      key={day} 
                      className={`border border-gray-300 px-4 py-3 text-center ${
                        isToday 
                          ? 'bg-blue-100' 
                          : 'bg-blue-50'
                      }`}
                    >
                      <div className={`text-sm font-semibold ${isToday ? 'text-blue-700' : 'text-gray-700'}`}>
                        {day}
                      </div>
                      <div className={`text-xs mt-1 ${isToday ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                        {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((time) => (
                <tr key={time}>
                  <td className="sticky left-0 z-10 border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-50/50 dark:bg-gray-800/50">
                    {time}
                  </td>
                  {days.map((day, dayIndex) => {
                    const date = weekDates[dayIndex];
                    const isToday = date.toDateString() === new Date().toDateString();
                    
                    // Find sessions that START in this time slot
                    const sessionsInSlot = sessions.filter(
                      s => s.day === dayIndex && sessionStartsInSlot(s, time)
                    );
                    
                    // Check if sessions in this slot have actual time conflicts (overlapping times)
                    // NOT just if they're in the same cell
                    const hasConflict = sessionsInSlot.some((session1, idx1) => {
                      return sessionsInSlot.some((session2, idx2) => {
                        if (idx1 >= idx2) return false; // Avoid checking same pair twice
                        
                        const start1 = timeToMinutes(session1.startTime);
                        const end1 = timeToMinutes(session1.endTime);
                        const start2 = timeToMinutes(session2.startTime);
                        const end2 = timeToMinutes(session2.endTime);
                        
                        // Two sessions conflict if their times actually overlap
                        return (start1 < end2 && end1 > start2);
                      });
                    });
                    
                    const isDropTarget = dragOverSlot?.day === dayIndex && dragOverSlot?.time === time;

                    return (
                      <td
                        key={`${day}-${time}`}
                        className={`border border-gray-300 p-2 align-top relative transition-colors ${
                          hasConflict
                            ? 'bg-red-50 border-red-300'
                            : isDropTarget 
                              ? 'bg-blue-100' 
                              : isToday 
                                ? 'bg-blue-50/30 hover:bg-blue-100/50' 
                                : 'bg-white hover:bg-gray-50'
                        }`}
                        style={{ height: '80px' }}
                        onDragOver={(e) => handleDragOver(e, dayIndex, time)}
                        onDrop={(e) => handleDrop(e, dayIndex, time)}
                      >
                        {/* Conflict Warning Badge */}
                        {hasConflict && (
                          <div className="absolute top-1 right-1 z-30">
                            <Badge variant="destructive" className="text-xs px-1.5 py-0.5 bg-red-600 text-white shadow-md">
                              ⚠️ Conflict
                            </Badge>
                          </div>
                        )}
                        
                        {/* Availability Blocks (Sleep, Lunch, Dinner) */}
                        {getAvailabilityBlocksInSlot(dayIndex, time).map((block, index) => {
                          const blockStartMinutes = timeToMinutes(block.start);
                          const blockEndMinutes = timeToMinutes(block.end);
                          const slotStartMinutes = timeToMinutes(time);
                          
                          // Calculate position and height within this slot
                          const offsetMinutes = Math.max(0, blockStartMinutes - slotStartMinutes);
                          const offsetPixels = (offsetMinutes / 60) * 80;
                          
                          const visibleStart = Math.max(blockStartMinutes, slotStartMinutes);
                          const visibleEnd = Math.min(blockEndMinutes, slotStartMinutes + 60);
                          const visibleDuration = visibleEnd - visibleStart;
                          const height = (visibleDuration / 60) * 80;
                          
                          return (
                            <div
                              key={`${block.type}-${index}`}
                              className={`absolute left-0 right-0 px-2 py-1 border-l-4 pointer-events-none ${
                                block.type === 'sleep' 
                                  ? 'bg-gray-300/70 dark:bg-gray-600/70 border-gray-500 dark:border-gray-400' 
                                  : block.type === 'lunch' 
                                    ? 'bg-yellow-200/70 dark:bg-yellow-700/70 border-yellow-500 dark:border-yellow-400' 
                                    : 'bg-orange-200/70 dark:bg-orange-700/70 border-orange-500 dark:border-orange-400'
                              }`}
                              style={{
                                height: `${height}px`,
                                top: `${offsetPixels}px`,
                                zIndex: 5,
                              }}
                            >
                              <span className="text-xs text-gray-700 dark:text-gray-200 font-medium">{block.label}</span>
                            </div>
                          );
                        })
                        }                        
                        
                        {/* Sessions in this slot */}
                        {sessionsInSlot.map((session) => {
                          const height = calculateSessionHeight(session);
                          
                          // Calculate vertical offset within the hour slot
                          // For example, a session at 11:40 in the 11:00 slot should start 40 minutes down
                          const slotStartMinutes = timeToMinutes(time);
                          const sessionStartMinutes = timeToMinutes(session.startTime);
                          const offsetMinutes = sessionStartMinutes - slotStartMinutes;
                          const offsetPixels = (offsetMinutes / 60) * 80; // 80px per hour slot
                          
                          return (
                            <div
                              key={session.id}
                              style={{ 
                                height: `${height}px`, 
                                minHeight: '40px',
                                top: `${offsetPixels}px`
                              }}
                              className="mb-1 absolute left-0 right-0 z-10 px-2 pt-2"
                            >
                              <SessionCard
                                session={session}
                                onEdit={handleEditSession}
                                onDelete={handleDeleteSession}
                                onDragStart={() => handleDragStart(session.id)}
                                isDragging={draggingSession === session.id}
                              />
                            </div>
                          );
                        })}
                        
                        {/* Add Session Button - Always available in background */}
                        <button
                          onClick={() => handleAddSession(dayIndex, time)}
                          className="absolute inset-0 w-full h-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100/30 rounded transition-colors group z-0"
                        >
                          <Plus className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Session Dialog */}
      <SessionDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setSelectedSlot(null);
          setEditingSession(null);
        }}
        onSave={handleSaveSession}
        initialData={editingSession || (selectedSlot ? {
          day: selectedSlot.day,
          startTime: selectedSlot.time,
          endTime: (() => {
            // Calculate end time as 1 hour after start time
            const startMinutes = timeToMinutes(selectedSlot.time);
            const endMinutes = startMinutes + 60;
            const endHours = Math.floor(endMinutes / 60);
            const endMins = endMinutes % 60;
            return `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;
          })(),
          subject: '',
          type: 'reading',
          color: studyTypes[0].color,
        } : undefined)}
        studyTypes={studyTypes}
      />

      {/* Import Dialog */}
      <ImportDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        onImport={handleImport}
      />

      {/* Confirm Dialog */}
      <Dialog open={confirmDialog.isOpen} onOpenChange={() => setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-gray-100">{confirmDialog.title}</DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">{confirmDialog.message}</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} })}
              className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              variant={confirmDialog.confirmVariant || 'default'}
              onClick={() => {
                confirmDialog.onConfirm();
                setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} });
              }}
              className={confirmDialog.confirmVariant === 'destructive' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}
            >
              {confirmDialog.confirmText || 'Confirm'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}