import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Calendar as CalendarIcon, Download, Clock, Plus, BookOpen, RefreshCw, ChevronLeft, Brain, Sparkles, Save, Edit, CalendarCheck, Ban, Coffee, Calendar, Split, Merge, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { getUserWeekKey } from '../utils/userStorage';
import CourseEditDialog from './CourseEditDialog';

interface TimetableResultsProps {
  timetableData: any;
  onSave: (schedule: any) => void;
  onEdit: () => void;
  onBack: () => void;
}

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function TimetableResults({ timetableData, onSave, onEdit, onBack }: TimetableResultsProps) {
  // Debug: Log timetableData to see if availabilitySettings exist
  console.log('🔍 TimetableResults - timetableData:', timetableData);
  console.log('🔍 TimetableResults - availabilitySettings:', timetableData.availabilitySettings);
  
  // Use saved schedule if available, otherwise generate new one
  const [schedule, setSchedule] = useState(() => 
    timetableData.schedule || generateSchedule(timetableData)
  );
  const [isSaved, setIsSaved] = useState(!!timetableData.id);
  const [showBackWarning, setShowBackWarning] = useState(false);
  const [showCreateNewWarning, setShowCreateNewWarning] = useState(false);
  const [showCourseListDialog, setShowCourseListDialog] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [showCourseEditDialog, setShowCourseEditDialog] = useState(false);
  const [localTimetableData, setLocalTimetableData] = useState(timetableData);

  function generateSchedule(data: any) {
    // ============================================================================
    // 🔌 BACKEND INTEGRATION POINT - AUTO-GENERATE TIMETABLE
    // ============================================================================
    // This section generates the timetable schedule using an algorithm
    // For production, this should be handled by a backend service
    // 
    // API Endpoint: POST /api/timetable/generate
    // Request Body: {
    //   subjects: Array<{
    //     id: string,
    //     name: string,
    //     hoursPerWeek: number,
    //     priority: number,
    //     color: string
    //   }>,
    //   studyStartTime: string,       // "09:00"
    //   studyEndTime: string,         // "18:00"
    //   sessionDuration: number,      // minutes
    //   breakDuration: number,        // minutes
    //   selectedDays: string[],       // ["Monday", "Tuesday", ...]
    //   blockedTimes: Array<{...}>,
    //   availabilitySettings: {...}
    // }
    // Response: {
    //   success: boolean,
    //   schedule: Array<{
    //     id: string,
    //     subject: string,
    //     day: string,
    //     startTime: string,
    //     endTime: string,
    //     duration: number
    //   }>,
    //   stats: {
    //     totalHours: number,
    //     subjectDistribution: {...}
    //   }
    // }
    // 
    // Backend Benefits:
    // - More powerful algorithms (ML-based optimization)
    // - Handle larger datasets efficiently
    // - Save user preferences and patterns
    // - Suggest improvements based on historical data
    // 
    // TODO: Replace client-side generation with backend API call
    // ============================================================================
    
    const { subjects, studyStartTime, studyEndTime, sessionDuration, breakDuration, selectedDays, blockedTimes = [], availabilitySettings } = data;
    
    // Safety check: if no subjects, return empty schedule
    if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
      console.warn('generateSchedule: No subjects provided, returning empty schedule');
      return [];
    }
    
    // Convert availability settings to blocked times
    let allBlockedTimes = [...blockedTimes];
    
    if (availabilitySettings) {
      console.log('🔍 Processing availability settings:', availabilitySettings);
      
      // Helper function to convert time string to standardized format
      const normalizeTime = (time: string | undefined): string | null => {
        if (!time) return null;
        // If already in HH:MM format, return as is
        if (/^\d{2}:\d{2}$/.test(time)) return time;
        // If in H:MM format, pad with zero
        if (/^\d{1}:\d{2}$/.test(time)) return `0${time}`;
        return time;
      };
      
      // Add sleep hours as blocked times for all days
      const sleepFrom = availabilitySettings.sleepHours?.from || availabilitySettings.sleepHours?.start;
      const sleepTo = availabilitySettings.sleepHours?.to || availabilitySettings.sleepHours?.end;
      
      if (sleepFrom && sleepTo) {
        const normalizedSleepFrom = normalizeTime(sleepFrom);
        const normalizedSleepTo = normalizeTime(sleepTo);
        
        if (normalizedSleepFrom && normalizedSleepTo) {
          console.log(`✅ Adding sleep hours: ${normalizedSleepFrom} - ${normalizedSleepTo}`);
          days.forEach(day => {
            allBlockedTimes.push({
              id: `sleep-${day}`,
              title: 'Sleep',
              day: day,
              startTime: normalizedSleepFrom,
              endTime: normalizedSleepTo,
            });
          });
        }
      }
      
      // Add lunch break as blocked time for all days (if enabled)
      if (availabilitySettings.lunchBreak?.enabled) {
        const lunchStart = normalizeTime(availabilitySettings.lunchBreak.start);
        const lunchEnd = normalizeTime(availabilitySettings.lunchBreak.end);
        
        if (lunchStart && lunchEnd) {
          console.log(`✅ Adding lunch break: ${lunchStart} - ${lunchEnd}`);
          days.forEach(day => {
            allBlockedTimes.push({
              id: `lunch-${day}`,
              title: 'Lunch Break',
              day: day,
              startTime: lunchStart,
              endTime: lunchEnd,
            });
          });
        }
      }
      
      // Add dinner break as blocked time for all days (if enabled)
      if (availabilitySettings.dinnerBreak?.enabled) {
        const dinnerStart = normalizeTime(availabilitySettings.dinnerBreak.start);
        const dinnerEnd = normalizeTime(availabilitySettings.dinnerBreak.end);
        
        if (dinnerStart && dinnerEnd) {
          console.log(`✅ Adding dinner break: ${dinnerStart} - ${dinnerEnd}`);
          days.forEach(day => {
            allBlockedTimes.push({
              id: `dinner-${day}`,
              title: 'Dinner Break',
              day: day,
              startTime: dinnerStart,
              endTime: dinnerEnd,
            });
          });
        }
      }
      
      console.log('📋 Total blocked times (including availability):', allBlockedTimes.length);
      
      // Count how many availability blocks were added
      const availabilityBlockCount = allBlockedTimes.length - blockedTimes.length;
      if (availabilityBlockCount > 0) {
        console.log(`✅ Applied ${availabilityBlockCount} availability blocks to prevent scheduling during sleep hours and meal breaks`);
      }
    }
    
    console.log('=== SMART TIMETABLE GENERATION STARTED ===');
    console.log('Configuration:', { studyStartTime, studyEndTime, sessionDuration, breakDuration });
    console.log('Subjects:', subjects);
    console.log('Subject details with selected days:');
    subjects.forEach((subject: any) => {
      console.log(`  - ${subject.name}:`, {
        priority: subject.priority,
        hoursPerWeek: subject.hoursPerWeek,
        selectedDays: subject.selectedDays,
        preferredTime: subject.preferredTimeOfDay,
      });
    });
    console.log('Blocked times:', allBlockedTimes);
    console.log('Global selected days:', selectedDays);

    // Collect all unique days from subjects' selectedDays
    const allSelectedDays = new Set<string>();
    subjects.forEach((subject: any) => {
      console.log(`Subject: ${subject.name}, selectedDays:`, subject.selectedDays);
      if (subject.selectedDays && Array.isArray(subject.selectedDays)) {
        subject.selectedDays.forEach((day: string) => allSelectedDays.add(day));
      }
    });
    
    // Convert Set to Array and maintain day order
    const daysToSchedule = days.filter(day => allSelectedDays.has(day));
    
    console.log('Days to schedule (from subjects):', daysToSchedule);
    console.log('All selected days from subjects:', Array.from(allSelectedDays));
    
    // If no days selected in subjects, fallback to global selectedDays or all days
    if (daysToSchedule.length === 0) {
      console.warn('No days selected in any subject, using global selectedDays or all days');
      const fallbackDays = selectedDays && selectedDays.length > 0 ? selectedDays : days;
      daysToSchedule.push(...fallbackDays);
    }
    
    // Calculate total minutes needed per subject PER WEEK
    const weeklyMinutesNeeded: { [key: string]: number } = {};
    subjects.forEach((subject: any) => {
      weeklyMinutesNeeded[subject.name] = subject.hoursPerWeek * 60;
    });
    
    console.log('Weekly minutes needed per subject:', weeklyMinutesNeeded);
    
    // Track remaining minutes to allocate for each subject
    const remainingMinutes = { ...weeklyMinutesNeeded };
    
    // Calculate target minutes per day for each subject to distribute evenly
    const targetMinutesPerDay: { [key: string]: { [day: string]: number } } = {};
    subjects.forEach((subject: any) => {
      targetMinutesPerDay[subject.name] = {};
      const numDays = subject.selectedDays ? subject.selectedDays.length : 0;
      if (numDays > 0) {
        const minutesPerDay = weeklyMinutesNeeded[subject.name] / numDays;
        subject.selectedDays.forEach((day: string) => {
          targetMinutesPerDay[subject.name][day] = minutesPerDay;
        });
      }
    });
    
    console.log('Target minutes per day for even distribution:', targetMinutesPerDay);
    
    // Track how many minutes each subject has been allocated per day
    const allocatedMinutesPerDay: { [key: string]: { [day: string]: number } } = {};
    subjects.forEach((subject: any) => {
      allocatedMinutesPerDay[subject.name] = {};
      days.forEach((day: string) => {
        allocatedMinutesPerDay[subject.name][day] = 0;
      });
    });

    // Separate subjects by priority for smart scheduling
    const highPrioritySubjects = subjects.filter((s: any) => s.priority === 'high');
    const mediumPrioritySubjects = subjects.filter((s: any) => s.priority === 'medium');
    const lowPrioritySubjects = subjects.filter((s: any) => s.priority === 'low');
    
    console.log('High priority subjects:', highPrioritySubjects.map((s: any) => s.name));
    console.log('Medium priority subjects:', mediumPrioritySubjects.map((s: any) => s.name));
    console.log('Low priority subjects:', lowPrioritySubjects.map((s: any) => s.name));

    // Helper function to get time preference window
    const getTimeWindow = (preferredTime: string, dayStartMinutes: number, dayEndMinutes: number) => {
      switch (preferredTime) {
        case 'morning':
          return { start: Math.max(dayStartMinutes, 6 * 60), end: Math.min(dayEndMinutes, 12 * 60) };
        case 'afternoon':
          return { start: Math.max(dayStartMinutes, 12 * 60), end: Math.min(dayEndMinutes, 18 * 60) };
        case 'evening':
          return { start: Math.max(dayStartMinutes, 18 * 60), end: Math.min(dayEndMinutes, 22 * 60) };
        default: // 'any'
          return { start: dayStartMinutes, end: dayEndMinutes };
      }
    };

    // Helper function to check if time conflicts with blocked times
    const isTimeBlocked = (day: string, startMinutes: number, endMinutes: number) => {
      const dayBlockedTimes = allBlockedTimes.filter((bt: any) => bt.day === day);
      return dayBlockedTimes.some((bt: any) => {
        const blockStart = parseTime(bt.startTime);
        const blockEnd = parseTime(bt.endTime);
        // Check if there's any overlap
        return (startMinutes < blockEnd && endMinutes > blockStart);
      });
    };

    // Helper function to find free time slots in a day
    const findFreeSlots = (day: string, dayStartMinutes: number, dayEndMinutes: number) => {
      const dayBlockedTimes = allBlockedTimes.filter((bt: any) => bt.day === day);
      
      // Sort blocked times by start time
      const sortedBlocked = dayBlockedTimes
        .map((bt: any) => ({
          start: parseTime(bt.startTime),
          end: parseTime(bt.endTime),
        }))
        .sort((a: any, b: any) => a.start - b.start);
      
      const freeSlots: { start: number; end: number }[] = [];
      let currentTime = dayStartMinutes;
      
      for (const blocked of sortedBlocked) {
        if (currentTime < blocked.start) {
          freeSlots.push({ start: currentTime, end: blocked.start });
        }
        currentTime = Math.max(currentTime, blocked.end);
      }
      
      // Add remaining time at the end of the day
      if (currentTime < dayEndMinutes) {
        freeSlots.push({ start: currentTime, end: dayEndMinutes });
      }
      
      return freeSlots;
    };

    const schedule = days.map((day, dayIndex) => {
      // Only generate schedules for selected days
      const isSelectedDay = daysToSchedule.includes(day);
      
      if (!isSelectedDay) {
        return null; // Don't include unselected days
      }

      console.log(`\n=== Scheduling ${day} ===`);
      
      const sessions: any[] = [];
      const dayStartMinutes = parseTime(studyStartTime);
      const dayEndMinutes = parseTime(studyEndTime);
      
      // Add blocked times as sessions first
      const dayBlockedTimes = allBlockedTimes.filter((bt: any) => bt.day === day);
      dayBlockedTimes.forEach((bt: any) => {
        sessions.push({
          type: 'blocked',
          title: bt.title,
          startTime: bt.startTime,
          endTime: bt.endTime,
        });
      });

      // Get all free time slots for this day
      const freeSlots = findFreeSlots(day, dayStartMinutes, dayEndMinutes);
      console.log(`Free slots on ${day}:`, freeSlots.map(slot => `${formatTime(slot.start)}-${formatTime(slot.end)}`));
      
      // Schedule high priority subjects first (in morning slots when possible)
      let slotIndex = 0;
      
      // Priority 1: High priority subjects in optimal time windows
      for (const subject of highPrioritySubjects) {
        // STRICT CHECK: Skip if this subject should not be scheduled on this day
        if (!subject.selectedDays || !subject.selectedDays.includes(day)) {
          console.log(`Skipping ${subject.name} on ${day} - not in selected days`);
          continue; // Skip this subject for this day
        }
        
        // Get preferred start time if specified
        const preferredStartMinutes = subject.startTime ? parseTime(subject.startTime) : null;
        const timeWindow = getTimeWindow(subject.preferredTimeOfDay, dayStartMinutes, dayEndMinutes);
        
        // Keep scheduling sessions for this subject until we reach the daily target
        while (true) {
          // Check if we've already allocated enough time for this subject on this day
          const targetForDay = targetMinutesPerDay[subject.name]?.[day] || 0;
          const alreadyAllocated = allocatedMinutesPerDay[subject.name][day];
          const remainingForDay = targetForDay - alreadyAllocated;
          
          if (remainingForDay <= 0 || remainingMinutes[subject.name] <= 0) {
            console.log(`${subject.name} target reached on ${day} (allocated: ${alreadyAllocated}/${targetForDay}min)`);
            break;
          }
          
          // Try to find a slot in preferred time window
          let sessionScheduled = false;
          for (let i = 0; i < freeSlots.length; i++) {
            const slot = freeSlots[i];
            
            // If subject has a specific start time preference and this is the first session, try to use it
            let effectiveStart;
            if (preferredStartMinutes !== null && alreadyAllocated === 0) {
              // Try to start at the preferred time if it's within this slot
              if (preferredStartMinutes >= slot.start && preferredStartMinutes < slot.end) {
                effectiveStart = preferredStartMinutes;
              } else {
                // Preferred time not in this slot, use normal logic
                effectiveStart = Math.max(slot.start, timeWindow.start);
              }
            } else {
              // No preferred start time or not first session, use normal time window logic
              effectiveStart = Math.max(slot.start, timeWindow.start);
            }
            
            const effectiveEnd = Math.min(slot.end, timeWindow.end);
            
            if (effectiveStart >= effectiveEnd) continue; // No overlap
            
            const availableMinutes = effectiveEnd - effectiveStart;
            // USE SUBJECT'S SPECIFIC SESSION DURATION, not global
            const subjectSessionDuration = subject.sessionDuration || sessionDuration;
            const minutesToAllocate = Math.min(subjectSessionDuration, remainingForDay, remainingMinutes[subject.name], availableMinutes);
            
            if (minutesToAllocate >= 25) { // Minimum 25 minute session
              const sessionStart = effectiveStart;
              const sessionEnd = sessionStart + minutesToAllocate;
              
              sessions.push({
                type: 'study',
                subject: subject.name,
                color: subject.color,
                priority: subject.priority,
                startTime: formatTime(sessionStart),
                endTime: formatTime(sessionEnd),
                duration: minutesToAllocate,
              });
              
              remainingMinutes[subject.name] -= minutesToAllocate;
              allocatedMinutesPerDay[subject.name][day] += minutesToAllocate;
              console.log(`Scheduled ${subject.name}: ${formatTime(sessionStart)}-${formatTime(sessionEnd)} (${minutesToAllocate}min, day total: ${allocatedMinutesPerDay[subject.name][day]}/${targetForDay}min, remaining: ${remainingMinutes[subject.name]}min)`);
              
              // Update the free slot - USE SUBJECT'S SPECIFIC BREAK DURATION
              const subjectBreakDuration = subject.breakDuration || breakDuration;
              if (sessionEnd < slot.end) {
                freeSlots[i] = { start: sessionEnd + subjectBreakDuration, end: slot.end };
              } else {
                freeSlots.splice(i, 1);
              }
              
              sessionScheduled = true;
              break; // Break from freeSlots loop to schedule another session for this subject
            }
          }
          
          // If we couldn't schedule a session, break out of the while loop
          if (!sessionScheduled) {
            console.log(`No more suitable slots for ${subject.name} on ${day}`);
            break;
          }
        }
      }
      
      // Priority 2: Medium priority subjects
      for (const subject of mediumPrioritySubjects) {
        // STRICT CHECK: Skip if this subject should not be scheduled on this day
        if (!subject.selectedDays || !subject.selectedDays.includes(day)) {
          console.log(`Skipping ${subject.name} on ${day} - not in selected days`);
          continue; // Skip this subject for this day
        }
        
        // Get preferred start time if specified
        const preferredStartMinutes = subject.startTime ? parseTime(subject.startTime) : null;
        const timeWindow = getTimeWindow(subject.preferredTimeOfDay, dayStartMinutes, dayEndMinutes);
        
        // Keep scheduling sessions for this subject until we reach the daily target
        while (true) {
          // Check if we've already allocated enough time for this subject on this day
          const targetForDay = targetMinutesPerDay[subject.name]?.[day] || 0;
          const alreadyAllocated = allocatedMinutesPerDay[subject.name][day];
          const remainingForDay = targetForDay - alreadyAllocated;
          
          if (remainingForDay <= 0 || remainingMinutes[subject.name] <= 0) {
            console.log(`${subject.name} target reached on ${day} (allocated: ${alreadyAllocated}/${targetForDay}min)`);
            break;
          }
          
          let sessionScheduled = false;
          for (let i = 0; i < freeSlots.length; i++) {
            const slot = freeSlots[i];
            
            // If subject has a specific start time preference and this is the first session, try to use it
            let effectiveStart;
            if (preferredStartMinutes !== null && alreadyAllocated === 0) {
              // Try to start at the preferred time if it's within this slot
              if (preferredStartMinutes >= slot.start && preferredStartMinutes < slot.end) {
                effectiveStart = preferredStartMinutes;
              } else {
                // Preferred time not in this slot, use normal logic
                effectiveStart = Math.max(slot.start, timeWindow.start);
              }
            } else {
              // No preferred start time or not first session, use normal time window logic
              effectiveStart = Math.max(slot.start, timeWindow.start);
            }
            
            const effectiveEnd = Math.min(slot.end, timeWindow.end);
            
            if (effectiveStart >= effectiveEnd) continue;
            
            const availableMinutes = effectiveEnd - effectiveStart;
            // USE SUBJECT'S SPECIFIC SESSION DURATION, not global
            const subjectSessionDuration = subject.sessionDuration || sessionDuration;
            const minutesToAllocate = Math.min(subjectSessionDuration, remainingForDay, remainingMinutes[subject.name], availableMinutes);
            
            if (minutesToAllocate >= 25) {
              const sessionStart = effectiveStart;
              const sessionEnd = sessionStart + minutesToAllocate;
              
              sessions.push({
                type: 'study',
                subject: subject.name,
                color: subject.color,
                priority: subject.priority,
                startTime: formatTime(sessionStart),
                endTime: formatTime(sessionEnd),
                duration: minutesToAllocate,
              });
              
              remainingMinutes[subject.name] -= minutesToAllocate;
              allocatedMinutesPerDay[subject.name][day] += minutesToAllocate;
              console.log(`Scheduled ${subject.name}: ${formatTime(sessionStart)}-${formatTime(sessionEnd)} (${minutesToAllocate}min, day total: ${allocatedMinutesPerDay[subject.name][day]}/${targetForDay}min, remaining: ${remainingMinutes[subject.name]}min)`);
              
              // USE SUBJECT'S SPECIFIC BREAK DURATION
              const subjectBreakDuration = subject.breakDuration || breakDuration;
              if (sessionEnd < slot.end) {
                freeSlots[i] = { start: sessionEnd + subjectBreakDuration, end: slot.end };
              } else {
                freeSlots.splice(i, 1);
              }
              
              sessionScheduled = true;
              break; // Break from freeSlots loop to schedule another session for this subject
            }
          }
          
          // If we couldn't schedule a session, break out of the while loop
          if (!sessionScheduled) {
            console.log(`No more suitable slots for ${subject.name} on ${day}`);
            break;
          }
        }
      }
      
      // Priority 3: Low priority subjects
      for (const subject of lowPrioritySubjects) {
        // STRICT CHECK: Skip if this subject should not be scheduled on this day
        if (!subject.selectedDays || !subject.selectedDays.includes(day)) {
          console.log(`Skipping ${subject.name} on ${day} - not in selected days`);
          continue; // Skip this subject for this day
        }
        
        // Get preferred start time if specified
        const preferredStartMinutes = subject.startTime ? parseTime(subject.startTime) : null;
        const timeWindow = getTimeWindow(subject.preferredTimeOfDay, dayStartMinutes, dayEndMinutes);
        
        // Keep scheduling sessions for this subject until we reach the daily target
        while (true) {
          // Check if we've already allocated enough time for this subject on this day
          const targetForDay = targetMinutesPerDay[subject.name]?.[day] || 0;
          const alreadyAllocated = allocatedMinutesPerDay[subject.name][day];
          const remainingForDay = targetForDay - alreadyAllocated;
          
          if (remainingForDay <= 0 || remainingMinutes[subject.name] <= 0) {
            console.log(`${subject.name} target reached on ${day} (allocated: ${alreadyAllocated}/${targetForDay}min)`);
            break;
          }
          
          let sessionScheduled = false;
          for (let i = 0; i < freeSlots.length; i++) {
            const slot = freeSlots[i];
            
            // If subject has a specific start time preference and this is the first session, try to use it
            let effectiveStart;
            if (preferredStartMinutes !== null && alreadyAllocated === 0) {
              // Try to start at the preferred time if it's within this slot
              if (preferredStartMinutes >= slot.start && preferredStartMinutes < slot.end) {
                effectiveStart = preferredStartMinutes;
              } else {
                // Preferred time not in this slot, use normal logic
                effectiveStart = Math.max(slot.start, timeWindow.start);
              }
            } else {
              // No preferred start time or not first session, use normal time window logic
              effectiveStart = Math.max(slot.start, timeWindow.start);
            }
            
            const effectiveEnd = Math.min(slot.end, timeWindow.end);
            
            if (effectiveStart >= effectiveEnd) continue;
            
            const availableMinutes = effectiveEnd - effectiveStart;
            // USE SUBJECT'S SPECIFIC SESSION DURATION, not global
            const subjectSessionDuration = subject.sessionDuration || sessionDuration;
            const minutesToAllocate = Math.min(subjectSessionDuration, remainingForDay, remainingMinutes[subject.name], availableMinutes);
            
            if (minutesToAllocate >= 25) {
              const sessionStart = effectiveStart;
              const sessionEnd = sessionStart + minutesToAllocate;
              
              sessions.push({
                type: 'study',
                subject: subject.name,
                color: subject.color,
                priority: subject.priority,
                startTime: formatTime(sessionStart),
                endTime: formatTime(sessionEnd),
                duration: minutesToAllocate,
              });
              
              remainingMinutes[subject.name] -= minutesToAllocate;
              allocatedMinutesPerDay[subject.name][day] += minutesToAllocate;
              console.log(`Scheduled ${subject.name}: ${formatTime(sessionStart)}-${formatTime(sessionEnd)} (${minutesToAllocate}min, day total: ${allocatedMinutesPerDay[subject.name][day]}/${targetForDay}min, remaining: ${remainingMinutes[subject.name]}min)`);
              
              // USE SUBJECT'S SPECIFIC BREAK DURATION
              const subjectBreakDuration = subject.breakDuration || breakDuration;
              if (sessionEnd < slot.end) {
                freeSlots[i] = { start: sessionEnd + subjectBreakDuration, end: slot.end };
              } else {
                freeSlots.splice(i, 1);
              }
              
              sessionScheduled = true;
              break; // Break from freeSlots loop to schedule another session for this subject
            }
          }
          
          // If we couldn't schedule a session, break out of the while loop
          if (!sessionScheduled) {
            console.log(`No more suitable slots for ${subject.name} on ${day}`);
            break;
          }
        }
      }
      
      // Fill remaining free slots with any subjects that still need time
      for (const subject of subjects) {
        // STRICT CHECK: Skip if this subject should not be scheduled on this day
        if (!subject.selectedDays || !subject.selectedDays.includes(day)) {
          console.log(`Fill remaining - Skipping ${subject.name} on ${day} - not in selected days`);
          continue; // Skip this subject for this day
        }
        
        // Check if we've already allocated enough time for this subject on this day
        const targetForDay = targetMinutesPerDay[subject.name]?.[day] || 0;
        const alreadyAllocated = allocatedMinutesPerDay[subject.name][day];
        const remainingForDay = targetForDay - alreadyAllocated;
        
        // IMPORTANT: Don't overschedule on this day even if weekly minutes remain
        if (remainingForDay <= 0) {
          console.log(`Fill remaining - ${subject.name} already reached daily target on ${day} (${alreadyAllocated}/${targetForDay}min)`);
          continue;
        }
        
        if (remainingMinutes[subject.name] <= 0) {
          console.log(`Fill remaining - ${subject.name} has no remaining weekly minutes`);
          continue;
        }
        
        for (let i = 0; i < freeSlots.length; i++) {
          // Re-check both daily and weekly limits
          const currentRemainingForDay = targetForDay - allocatedMinutesPerDay[subject.name][day];
          if (currentRemainingForDay <= 0 || remainingMinutes[subject.name] <= 0) break;
          
          const slot = freeSlots[i];
          const availableMinutes = slot.end - slot.start;
          const minutesToAllocate = Math.min(sessionDuration, currentRemainingForDay, remainingMinutes[subject.name], availableMinutes);
          
          if (minutesToAllocate >= 25) {
            const sessionStart = slot.start;
            const sessionEnd = sessionStart + minutesToAllocate;
            
            sessions.push({
              type: 'study',
              subject: subject.name,
              color: subject.color,
              priority: subject.priority,
              startTime: formatTime(sessionStart),
              endTime: formatTime(sessionEnd),
              duration: minutesToAllocate,
            });
            
            remainingMinutes[subject.name] -= minutesToAllocate;
            allocatedMinutesPerDay[subject.name][day] += minutesToAllocate;
            console.log(`Fill remaining - ${subject.name}: ${formatTime(sessionStart)}-${formatTime(sessionEnd)} (${minutesToAllocate}min, day total: ${allocatedMinutesPerDay[subject.name][day]}/${targetForDay}min, remaining: ${remainingMinutes[subject.name]}min)`);
            
            if (sessionEnd < slot.end) {
              freeSlots[i] = { start: sessionEnd + breakDuration, end: slot.end };
            } else {
              freeSlots.splice(i, 1);
              i--;
            }
          }
        }
      }

      // Sort sessions by start time
      sessions.sort((a, b) => {
        const aStart = parseTime(a.startTime);
        const bStart = parseTime(b.startTime);
        return aStart - bStart;
      });

      return { day, sessions };
    }).filter(Boolean); // Remove null entries for unselected days

    console.log('\n=== SCHEDULE GENERATION COMPLETE ===');
    console.log('Remaining minutes to allocate:', remainingMinutes);
    console.log('Generated schedule with days:', schedule.map((s: any) => s.day));
    
    return schedule;
  }

  function parseTime(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      console.error('Invalid time format:', timeStr);
      return 0;
    }
    return hours * 60 + minutes;
  }

  function formatTime(minutes: number): string {
    const normalizedMinutes = ((minutes % 1440) + 1440) % 1440;
    const hours = Math.floor(normalizedMinutes / 60);
    const mins = normalizedMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  // Split long sessions into Pomodoros
  const handleSplitSessions = () => {
    const breakDuration = timetableData.breakDuration || 10;
    const pomodoroLength = 50; // Default Pomodoro session length in minutes
    
    const newSchedule = schedule.map((daySchedule: any) => {
      const newSessions: any[] = [];
      
      daySchedule.sessions.forEach((session: any) => {
        // Only split study sessions that are longer than 90 minutes
        if (session.type === 'study' && session.duration > 90) {
          const startMinutes = parseTime(session.startTime);
          const endMinutes = parseTime(session.endTime);
          const totalDuration = session.duration;
          
          // Calculate how many pomodoro sessions we can fit
          const numPomodoros = Math.floor(totalDuration / (pomodoroLength + breakDuration));
          
          if (numPomodoros > 1) {
            // Create multiple pomodoro sessions
            let currentTime = startMinutes;
            for (let i = 0; i < numPomodoros; i++) {
              newSessions.push({
                ...session,
                startTime: formatTime(currentTime),
                endTime: formatTime(currentTime + pomodoroLength),
                duration: pomodoroLength,
              });
              
              currentTime += pomodoroLength;
              
              // Add break between pomodoros (except after the last one)
              if (i < numPomodoros - 1) {
                newSessions.push({
                  type: 'break',
                  subject: 'Break',
                  startTime: formatTime(currentTime),
                  endTime: formatTime(currentTime + breakDuration),
                  duration: breakDuration,
                });
                currentTime += breakDuration;
              }
            }
            
            // Add remaining time as a final session if it's at least 25 minutes
            const remainingMinutes = endMinutes - currentTime;
            if (remainingMinutes >= 25) {
              newSessions.push({
                ...session,
                startTime: formatTime(currentTime),
                endTime: formatTime(endMinutes),
                duration: remainingMinutes,
              });
            }
          } else {
            // Not enough time for multiple pomodoros, keep as is
            newSessions.push(session);
          }
        } else {
          // Keep all other sessions as they are
          newSessions.push(session);
        }
      });
      
      return { ...daySchedule, sessions: newSessions };
    });
    
    setSchedule(newSchedule);
    setIsSaved(false);
    toast.success('🍅 Long sessions split into Pomodoros! Sessions over 90 minutes have been divided with breaks.');
  };

  // Merge adjacent sessions for the same subject
  const handleMergeSessions = () => {
    const breakDuration = timetableData.breakDuration || 10;
    
    const newSchedule = schedule.map((daySchedule: any) => {
      const mergedSessions: any[] = [];
      let i = 0;
      
      while (i < daySchedule.sessions.length) {
        const currentSession = daySchedule.sessions[i];
        
        // Only try to merge study sessions
        if (currentSession.type === 'study') {
          let merged = { ...currentSession };
          let j = i + 1;
          
          // Look ahead for adjacent sessions of the same subject
          while (j < daySchedule.sessions.length) {
            const nextSession = daySchedule.sessions[j];
            
            // Check if next session is the same subject
            if (nextSession.type === 'study' && nextSession.subject === merged.subject) {
              const mergedEnd = parseTime(merged.endTime);
              const nextStart = parseTime(nextSession.startTime);
              const gap = nextStart - mergedEnd;
              
              // Merge if sessions are within one break duration apart (or consecutive)
              if (gap <= breakDuration + 5) { // +5 minutes tolerance
                merged = {
                  ...merged,
                  endTime: nextSession.endTime,
                  duration: parseTime(nextSession.endTime) - parseTime(merged.startTime),
                };
                j++;
                
                // Skip any breaks between merged sessions
                if (j < daySchedule.sessions.length && daySchedule.sessions[j].type === 'break') {
                  j++;
                }
              } else {
                break; // Gap too large, can't merge
              }
            } else if (nextSession.type === 'break') {
              j++; // Skip breaks and check next session
            } else {
              break; // Different subject or blocked time
            }
          }
          
          mergedSessions.push(merged);
          i = j;
        } else {
          // Keep blocked times and breaks as they are
          mergedSessions.push(currentSession);
          i++;
        }
      }
      
      return { ...daySchedule, sessions: mergedSessions };
    });
    
    setSchedule(newSchedule);
    setIsSaved(false);
    toast.success('🔗 Adjacent sessions merged! Same-subject sessions close together have been combined.');
  };

  const handleSave = () => {
    const savedTimetable = {
      ...timetableData,
      schedule,
      isActive: true,
      id: Date.now().toString(),
    };
    console.log('TimetableResults: Calling onSave with:', savedTimetable);
    
    // Also save sessions to CalendarView storage for current week
    const dayMap: { [key: string]: number } = {
      'Monday': 0, 'Tuesday': 1, 'Wednesday': 2, 'Thursday': 3,
      'Friday': 4, 'Saturday': 5, 'Sunday': 6
    };

    const sessions = schedule.flatMap((daySchedule: any) =>
      daySchedule.sessions
        .filter((session: any) => session.type === 'study' || session.type === 'blocked' || session.type === 'break')
        .map((session: any) => ({
          id: `${Date.now()}-${daySchedule.day}-${session.startTime}-${Math.random()}`,
          day: dayMap[daySchedule.day] ?? 0,
          subject: session.type === 'study' ? session.subject : 
                  session.type === 'break' ? 'Break' : 
                  (session.title || 'Blocked Time'),
          startTime: session.startTime,
          endTime: session.endTime,
          color: session.color || (session.type === 'break' ? '#9CA3AF' : '#9333EA'),
          type: session.type === 'study' ? 'reading' : 
                session.type === 'break' ? 'break' :
                'lecture',
        }))
    );

    // Save to current week's CalendarView storage
    const currentDate = new Date();
    const weekId = getWeekIdentifier(currentDate);
    localStorage.setItem(getUserWeekKey(weekId), JSON.stringify(sessions));
    
    // Dispatch event to notify CalendarView
    window.dispatchEvent(new Event('calendarSessionsUpdated'));
    
    onSave(savedTimetable);
    setIsSaved(true);
    
    toast.success(`✅ Timetable saved! Sessions added to week ${weekId}`);
  };

  // Get week identifier (same logic as CalendarView)
  const getWeekIdentifier = (date: Date): string => {
    const year = date.getFullYear();
    const firstDayOfYear = new Date(year, 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    return `${year}-W${String(weekNumber).padStart(2, '0')}`;
  };

  const handleSaveToMyTimetable = () => {
    const dayMap: { [key: string]: number } = {
      'Monday': 0, 'Tuesday': 1, 'Wednesday': 2, 'Thursday': 3,
      'Friday': 4, 'Saturday': 5, 'Sunday': 6
    };

    const sessions = schedule.flatMap((daySchedule: any) =>
      daySchedule.sessions
        .filter((session: any) => session.type === 'study' || session.type === 'blocked') // Include both study and blocked times
        .map((session: any) => ({
          id: `${Date.now()}-${daySchedule.day}-${session.startTime}-${Math.random()}`,
          day: dayMap[daySchedule.day] ?? 0,
          subject: session.type === 'study' ? session.subject : (session.title || 'Blocked Time'),
          startTime: session.startTime,
          endTime: session.endTime,
          color: session.color || '#9CA3AF',
          type: session.type === 'study' ? 'reading' : 'lecture', // Use 'lecture' for blocked times so they show differently
        }))
    );

    // Get the current week identifier
    const currentDate = new Date();
    const weekId = getWeekIdentifier(currentDate);
    
    // Load existing sessions for this week
    const existingSessions = JSON.parse(localStorage.getItem(`calendarSessions_${weekId}`) || '[]');
    const allSessions = [...existingSessions, ...sessions];
    
    // Save to the week-specific key that CalendarView uses
    localStorage.setItem(`calendarSessions_${weekId}`, JSON.stringify(allSessions));
    
    // Dispatch event to notify CalendarView
    window.dispatchEvent(new Event('calendarSessionsUpdated'));
    
    toast.success(`✅ ${sessions.length} sessions added to My Timetable for week ${weekId}!`);
    console.log(`Saved ${sessions.length} sessions to calendarSessions_${weekId}`);
  };

  const handleExportPDF = () => {
    const savedTimetable = {
      ...timetableData,
      schedule,
      isActive: true,
      id: Date.now().toString(),
    };
    console.log('TimetableResults: Saving before PDF export:', savedTimetable);
    onSave(savedTimetable);
    setIsSaved(true);
    
    setTimeout(() => {
      toast.info('PDF export feature coming soon!');
    }, 1000);
  };

  const handleCreateNew = () => {
    if (!isSaved) {
      setShowCreateNewWarning(true);
    } else {
      onEdit();
    }
  };

  const handleSaveAndCreateNew = () => {
    handleSave();
    setShowCreateNewWarning(false);
    setTimeout(() => {
      onEdit();
    }, 500);
  };

  const handleDiscardAndCreateNew = () => {
    setShowCreateNewWarning(false);
    onEdit();
  };

  const handleBackClick = () => {
    if (!isSaved) {
      setShowBackWarning(true);
    } else {
      onBack();
    }
  };

  const handleDiscardAndBack = () => {
    setShowBackWarning(false);
    onBack();
  };

  const handleStayAndSave = () => {
    setShowBackWarning(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExportToGoogleCalendar = async () => {
    const isConnected = localStorage.getItem('googleCalendarConnected') === 'true';
    
    if (!isConnected) {
      toast.error('Please connect to Google Calendar in Settings first');
      return;
    }

    try {
      toast.info('Exporting to Google Calendar...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const totalEvents = schedule.reduce((sum: number, day: any) => {
        return sum + day.sessions.filter((s: any) => s.type === 'study').length;
      }, 0);
      
      toast.success(`Successfully exported ${totalEvents} study sessions to Google Calendar!`);
    } catch (error) {
      console.error('Error exporting to Google Calendar:', error);
      toast.error('Failed to export to Google Calendar');
    }
  };

  const handleEditCourseSettings = () => {
    setShowCourseListDialog(true);
  };

  const handleSaveCourse = (updatedCourse: any) => {
    // Update the subject in localTimetableData
    const updatedSubjects = localTimetableData.subjects.map((subject: any) =>
      subject.id === updatedCourse.id ? updatedCourse : subject
    );
    setLocalTimetableData({
      ...localTimetableData,
      subjects: updatedSubjects,
    });

    // Regenerate schedule with updated data
    const newSchedule = generateSchedule({
      ...localTimetableData,
      subjects: updatedSubjects,
    });
    setSchedule(newSchedule);
    setIsSaved(false);

    toast.success(`✅ Course "${updatedCourse.name}" updated! Schedule regenerated.`);
  };

  const handleDeleteCourse = (courseId: string) => {
    // Remove the course from subjects
    const updatedSubjects = localTimetableData.subjects.filter((subject: any) => subject.id !== courseId);
    
    if (updatedSubjects.length === 0) {
      toast.error('Cannot delete the last course. Please add another course first.');
      return;
    }

    setLocalTimetableData({
      ...localTimetableData,
      subjects: updatedSubjects,
    });

    // Regenerate schedule without the deleted course
    const newSchedule = generateSchedule({
      ...localTimetableData,
      subjects: updatedSubjects,
    });
    setSchedule(newSchedule);
    setIsSaved(false);

    toast.success('Course deleted! Schedule regenerated.');
  };

  const totalStudySessions = schedule.reduce((sum: number, day: any) => {
    return sum + day.sessions.filter((s: any) => s.type === 'study').length;
  }, 0);

  const totalHours = schedule.reduce((sum: number, day: any) => {
    return sum + day.sessions
      .filter((s: any) => s.type === 'study')
      .reduce((daySum: number, s: any) => daySum + s.duration, 0);
  }, 0) / 60;

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="bg-blue-600 rounded-2xl p-8 text-white shadow-lg">
        <Button
          variant="ghost"
          onClick={handleBackClick}
          className="text-white hover:bg-white/20 mb-4"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
            <Brain className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-white flex items-center gap-2">
              Your Smart Study Timetable
              <Sparkles className="h-5 w-5" />
            </h1>
            <p className="text-blue-100">
              AI-generated on {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <p className="text-blue-100 text-sm mb-1">Total Study Sessions</p>
            <p className="text-white text-2xl">{totalStudySessions}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <p className="text-blue-100 text-sm mb-1">Total Study Hours</p>
            <p className="text-white text-2xl">{totalHours.toFixed(1)}h</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <p className="text-blue-100 text-sm mb-1">Courses</p>
            <p className="text-white text-2xl">{timetableData.subjects?.length || 0}</p>
          </div>
        </div>
      </div>

      {/* AI Generation Info */}
      <Card className="border-2 border-blue-200 shadow-lg bg-blue-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-blue-900 mb-2">
                <strong>✨ AI-Optimized Schedule Generated!</strong>
              </h3>
              <p className="text-sm text-blue-800 mb-3">
                Our smart algorithm analyzed your free time and automatically created an optimized study schedule based on:
              </p>
              <ul className="text-sm text-blue-800 space-y-1 ml-4 list-disc">
                <li><strong>Priority-based allocation:</strong> High priority courses scheduled during peak focus hours</li>
                <li><strong>Time preferences:</strong> Subjects placed in your preferred time windows (morning/afternoon/evening)</li>
                <li><strong>Conflict avoidance:</strong> Study sessions only in FREE time (avoiding {timetableData.blockedTimes?.length || 0} blocked slots)</li>
                <li><strong>Optimal session length:</strong> {timetableData.sessionDuration}min sessions with {timetableData.breakDuration}min breaks</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button 
          onClick={handleSave}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Save className="h-4 w-4 mr-2" />
          Save Timetable
        </Button>
        <Button 
          variant="outline" 
          onClick={handleCreateNew}
          className="border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-950"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create New Timetable
        </Button>
        <Button 
          variant="outline" 
          onClick={handleEditCourseSettings}
          className="border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          <Settings className="h-4 w-4 mr-2" />
          Edit Settings
        </Button>
      </div>

      {/* University Schedule Integration Info */}
      {timetableData.blockedTimes && timetableData.blockedTimes.length > 0 && (
        <Card className="border-2 border-purple-200 shadow-md bg-purple-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Ban className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-purple-900 mb-2">
                  <strong>✅ Conflict-Free Scheduling Successful!</strong>
                </p>
                <p className="text-sm text-purple-800 mb-3">
                  Your study sessions were intelligently scheduled around <strong>{timetableData.blockedTimes.length} unavailable time slot{timetableData.blockedTimes.length !== 1 ? 's' : ''}</strong>. The AI only used your FREE time for study sessions.
                </p>
                <div className="flex flex-wrap gap-2">
                  {timetableData.blockedTimes.map((bt: any) => (
                    <Badge key={bt.id} className="bg-purple-600 text-white border-0 text-xs">
                      {bt.title} ({bt.day.slice(0, 3)} {bt.startTime})
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Weekly Schedule */}
      <div className="grid grid-cols-1 gap-6">
        {/* Availability & Breaks Settings - DEBUG VERSION */}
        <Card className="border-0 shadow-md bg-blue-50">
          <CardContent className="p-6">
            <h3 className="text-blue-900 mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              <strong>Availability & Breaks Settings</strong>
            </h3>
            
            {(timetableData.availabilitySettings || localTimetableData.availabilitySettings) ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Weekday Hours */}
                {(timetableData.availabilitySettings?.weekdayAvailability || localTimetableData.availabilitySettings?.weekdayAvailability) && (
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-xs text-gray-700 mb-1 flex items-center gap-1">
                      Weekday Hours:
                    </p>
                    <p className="text-sm text-gray-900">
                      {(timetableData.availabilitySettings?.weekdayAvailability || localTimetableData.availabilitySettings?.weekdayAvailability).start} - {(timetableData.availabilitySettings?.weekdayAvailability || localTimetableData.availabilitySettings?.weekdayAvailability).end}
                    </p>
                  </div>
                )}
                
                {/* Weekend Hours */}
                {(timetableData.availabilitySettings?.weekendAvailability || localTimetableData.availabilitySettings?.weekendAvailability) && 
                 !(timetableData.availabilitySettings?.weekendSameAsWeekday || localTimetableData.availabilitySettings?.weekendSameAsWeekday) && (
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-xs text-gray-700 mb-1 flex items-center gap-1">
                      Weekend Hours:
                    </p>
                    <p className="text-sm text-gray-900">
                      {(timetableData.availabilitySettings?.weekendAvailability || localTimetableData.availabilitySettings?.weekendAvailability).start} - {(timetableData.availabilitySettings?.weekendAvailability || localTimetableData.availabilitySettings?.weekendAvailability).end}
                    </p>
                  </div>
                )}
                
                {/* Sleep Hours */}
                <div className="bg-white rounded-lg p-3">
                  <p className="text-xs text-gray-700 mb-1 flex items-center gap-1">
                    Sleep Hours:
                  </p>
                  <p className="text-sm text-gray-900">
                    {(timetableData.availabilitySettings?.sleepHours?.from || localTimetableData.availabilitySettings?.sleepHours?.from) && 
                     (timetableData.availabilitySettings?.sleepHours?.to || localTimetableData.availabilitySettings?.sleepHours?.to)
                      ? `${(timetableData.availabilitySettings?.sleepHours || localTimetableData.availabilitySettings?.sleepHours).from} - ${(timetableData.availabilitySettings?.sleepHours || localTimetableData.availabilitySettings?.sleepHours).to}`
                      : '-'
                    }
                  </p>
                </div>
                
                {/* Lunch Break */}
                {((timetableData.availabilitySettings?.lunchBreak?.enabled || localTimetableData.availabilitySettings?.lunchBreak?.enabled)) && (
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-xs text-gray-700 mb-1 flex items-center gap-1">
                      Lunch Break:
                    </p>
                    <p className="text-sm text-gray-900">
                      {(timetableData.availabilitySettings?.lunchBreak || localTimetableData.availabilitySettings?.lunchBreak).start} - {(timetableData.availabilitySettings?.lunchBreak || localTimetableData.availabilitySettings?.lunchBreak).end}
                    </p>
                  </div>
                )}
                
                {/* Dinner Break */}
                {((timetableData.availabilitySettings?.dinnerBreak?.enabled || localTimetableData.availabilitySettings?.dinnerBreak?.enabled)) && (
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-xs text-gray-700 mb-1 flex items-center gap-1">
                      Dinner Break:
                    </p>
                    <p className="text-sm text-gray-900">
                      {(timetableData.availabilitySettings?.dinnerBreak || localTimetableData.availabilitySettings?.dinnerBreak).start} - {(timetableData.availabilitySettings?.dinnerBreak || localTimetableData.availabilitySettings?.dinnerBreak).end}
                    </p>
                  </div>
                )}
                
                {/* Commute Buffer */}
                {((timetableData.availabilitySettings?.commuteMinutes || localTimetableData.availabilitySettings?.commuteMinutes) > 0) && (
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-xs text-gray-700 mb-1 flex items-center gap-1">
                      Commute Buffer:
                    </p>
                    <p className="text-sm text-gray-900">
                      {(timetableData.availabilitySettings?.commuteMinutes || localTimetableData.availabilitySettings?.commuteMinutes)} minutes
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-600">No availability settings found for this timetable.</p>
            )}
          </CardContent>
        </Card>

        {schedule.length === 0 ? (
          <Card className="border-0 shadow-md">
            <CardContent className="p-12 text-center">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-10 w-10 text-red-400" />
              </div>
              <h3 className="text-gray-900 mb-2">No Schedule Generated</h3>
              <p className="text-gray-600">
                There was an issue generating the schedule. Please check that you have selected study days and added subjects.
              </p>
            </CardContent>
          </Card>
        ) : (
          schedule.map((daySchedule: any, dayIndex: number) => (
          <Card key={dayIndex} className="border-0 shadow-md">
            <CardHeader className="bg-gray-50 dark:bg-gray-900">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span className="text-gray-900 dark:text-gray-100">{daySchedule.day}</span>
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                {daySchedule.sessions.filter((s: any) => s.type === 'study').length} study session{daySchedule.sessions.filter((s: any) => s.type === 'study').length !== 1 ? 's' : ''} • {
                  (daySchedule.sessions
                    .filter((s: any) => s.type === 'study')
                    .reduce((sum: number, s: any) => sum + s.duration, 0) / 60).toFixed(1)
                }h total
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {daySchedule.sessions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No sessions scheduled for this day</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {daySchedule.sessions.map((session: any, sessionIndex: number) => (
                  <div
                    key={sessionIndex}
                    className={`
                      rounded-lg p-4 flex items-center gap-4
                      ${session.type === 'study' 
                        ? 'bg-blue-50 border-l-4 border-blue-500' 
                        : session.type === 'blocked'
                        ? 'bg-purple-50 border-l-4 border-purple-500'
                        : 'bg-accent border-l-4 border-border'
                      }
                    `}
                  >
                    <div className={`
                      w-12 h-12 rounded-lg flex items-center justify-center
                      ${session.type === 'study' ? session.color : session.type === 'blocked' ? 'bg-gradient-to-br from-purple-600 to-indigo-600' : 'bg-muted'}
                    `}>
                      {session.type === 'study' ? (
                        <BookOpen className="h-6 w-6 text-white" />
                      ) : session.type === 'blocked' ? (
                        <Ban className="h-6 w-6 text-white" />
                      ) : (
                        <Coffee className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {session.type === 'study' ? (
                          <>
                            <span className="text-foreground text-lg">{session.subject}</span>
                            {session.priority === 'high' && (
                              <Badge variant="destructive" className="text-xs">High Priority</Badge>
                            )}
                            {session.priority === 'medium' && (
                              <Badge className="text-xs bg-yellow-500">Medium Priority</Badge>
                            )}
                          </>
                        ) : session.type === 'blocked' ? (
                          <>
                            <span className="text-gray-900 text-lg">{session.title}</span>
                            <Badge className="bg-purple-100 text-purple-800 border-purple-300">Unavailable</Badge>
                          </>
                        ) : (
                          <span className="text-gray-600">Break Time</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span>{session.startTime} - {session.endTime}</span>
                        {session.duration && (
                          <>
                            <span className="text-gray-400">•</span>
                            <span>{session.duration} min</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )))}
      </div>

      {/* Tips Card */}
      <Card className="border-0 shadow-md bg-amber-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-900">
            💡 Smart Study Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-amber-900 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-amber-600 mt-1">•</span>
              <span><strong>Follow the schedule:</strong> The AI optimized this timetable based on your priorities and free time for maximum effectiveness</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-600 mt-1">•</span>
              <span><strong>Use breaks wisely:</strong> Stretch, hydrate, and rest your eyes during {timetableData.breakDuration}-minute breaks</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-600 mt-1">•</span>
              <span><strong>Track your progress:</strong> Mark completed sessions and adjust for upcoming exams by regenerating your timetable</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-600 mt-1">•</span>
              <span><strong>Stay flexible:</strong> If something comes up, you can always create a new timetable with updated blocked times</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Unsaved Changes Warning Dialog */}
      <AlertDialog open={showBackWarning} onOpenChange={setShowBackWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              ⚠️ Unsaved Timetable
            </AlertDialogTitle>
            <AlertDialogDescription>
              You haven't saved your timetable yet. If you go back to the dashboard now, all your generated schedule will be lost.
              <br /><br />
              Would you like to stay and save your timetable, or discard it and go back?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDiscardAndBack}>
              Discard & Go Back
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleStayAndSave} className="bg-blue-600 hover:bg-blue-700">
              Stay & Save
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create New Timetable Warning Dialog */}
      <AlertDialog open={showCreateNewWarning} onOpenChange={setShowCreateNewWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              ⚠️ Unsaved Timetable
            </AlertDialogTitle>
            <AlertDialogDescription>
              You haven't saved your timetable yet. If you create a new timetable now, all your generated schedule will be lost.
              <br /><br />
              Would you like to stay and save your timetable, or discard it and create a new one?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDiscardAndCreateNew}>
              Discard & Create New
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleSaveAndCreateNew} className="bg-blue-600 hover:bg-blue-700">
              Stay & Save
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Course List Dialog */}
      <Dialog open={showCourseListDialog} onOpenChange={setShowCourseListDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-blue-600" />
              Edit Course Settings
            </DialogTitle>
            <DialogDescription>
              Select a course to modify its details, change times, or delete it.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
            {localTimetableData.subjects && localTimetableData.subjects.length > 0 ? (
              localTimetableData.subjects.map((subject: any) => (
                <button
                  key={subject.id}
                  onClick={() => {
                    setSelectedCourse(subject);
                    setShowCourseEditDialog(true);
                    setShowCourseListDialog(false);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all group"
                >
                  <div className={`w-10 h-10 ${subject.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <BookOpen className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-foreground">{subject.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {subject.hoursPerWeek}h/week • {subject.priority} priority
                    </div>
                  </div>
                  <Edit className="h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                </button>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No courses available
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => setShowCourseListDialog(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Course Edit Dialog */}
      <CourseEditDialog
        isOpen={showCourseEditDialog}
        onClose={() => setShowCourseEditDialog(false)}
        course={selectedCourse}
        onSave={handleSaveCourse}
        onDelete={handleDeleteCourse}
      />
    </div>
  );
}