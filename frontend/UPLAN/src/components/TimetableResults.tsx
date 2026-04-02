import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();

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
          console.log(`Adding sleep hours: ${normalizedSleepFrom} - ${normalizedSleepTo}`);
          days.forEach(day => {
            allBlockedTimes.push({
              id: `sleep-${day}`,
              title: t('timetable.blocked.sleep'),
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
          console.log(`Adding lunch break: ${lunchStart} - ${lunchEnd}`);
          days.forEach(day => {
            allBlockedTimes.push({
              id: `lunch-${day}`,
              title: t('timetable.blocked.lunchBreak'),
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
          console.log(`Adding dinner break: ${dinnerStart} - ${dinnerEnd}`);
          days.forEach(day => {
            allBlockedTimes.push({
              id: `dinner-${day}`,
              title: t('timetable.blocked.dinnerBreak'),
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
        console.log(`Applied ${availabilityBlockCount} availability blocks to prevent scheduling during sleep hours and meal breaks`);
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
                  subject: t('timetable.break'),
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
    toast.success(t('timetable.toast.splitSuccess'));
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
    toast.success(t('timetable.toast.mergeSuccess'));
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
                  session.type === 'break' ? t('timetable.break') : 
                  (session.title || t('timetable.blocked.default')),
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
    const existingSessions = JSON.parse(localStorage.getItem(getUserWeekKey(weekId)) || '[]');
    const allSessions = [...existingSessions, ...sessions];
    localStorage.setItem(getUserWeekKey(weekId), JSON.stringify(allSessions));
    
    // Dispatch event to notify CalendarView
    window.dispatchEvent(new Event('calendarSessionsUpdated'));
    
    onSave(savedTimetable);
    setIsSaved(true);
    
    toast.success(t('timetable.toast.savedWithWeek', { weekId }));
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
          subject: session.type === 'study' ? session.subject : (session.title || t('timetable.blocked.default')),
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
    
    toast.success(t('timetable.toast.addedToMyTimetable', { count: sessions.length, weekId }));
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
      toast.info(t('timetable.toast.pdfComingSoon'));
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
      toast.error(t('timetable.toast.googleCalendarConnectFirst'));
      return;
    }

    try {
      toast.info(t('timetable.toast.exportingGoogleCalendar'));
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const totalEvents = schedule.reduce((sum: number, day: any) => {
        return sum + day.sessions.filter((s: any) => s.type === 'study').length;
      }, 0);
      
      toast.success(t('timetable.toast.exportedGoogleCalendar', { count: totalEvents }));
    } catch (error) {
      console.error('Error exporting to Google Calendar:', error);
      toast.error(t('timetable.toast.failedGoogleCalendar'));
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

    toast.success(t('timetable.toast.courseUpdated', { name: updatedCourse.name }));
  };

  const handleDeleteCourse = (courseId: string) => {
    // Remove the course from subjects
    const updatedSubjects = localTimetableData.subjects.filter((subject: any) => subject.id !== courseId);
    
    if (updatedSubjects.length === 0) {
      toast.error(t('timetable.toast.cannotDeleteLastCourse'));
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

    toast.success(t('timetable.toast.courseDeleted'));
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
      <div className="mb-6">
  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
    <div className="min-w-0">
      <Button
        variant="ghost"
        onClick={handleBackClick}
        className="mb-3 h-9 rounded-xl px-0 text-muted-foreground hover:bg-transparent hover:text-foreground"
      >
        <ChevronLeft className="mr-2 h-4 w-4" />
        {t('timetable.back')}
      </Button>

      <h1 className="text-xl font-semibold text-foreground">{t('timetable.title')}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {t('timetable.subtitle')}
      </p>
    </div>

    <div className="grid grid-cols-3 gap-2 sm:min-w-[280px]">
      <div className="rounded-xl border border-border bg-card px-4 py-3 text-center">
        <p className="text-[11px] text-muted-foreground">{t('timetable.stats.sessions')}</p>
        <p className="mt-1 text-sm font-semibold text-foreground">{totalStudySessions}</p>
      </div>
      <div className="rounded-xl border border-border bg-card px-4 py-3 text-center">
        <p className="text-[11px] text-muted-foreground">{t('timetable.stats.hours')}</p>
        <p className="mt-1 text-sm font-semibold text-foreground">{totalHours.toFixed(1)}h</p>
      </div>
      <div className="rounded-xl border border-border bg-card px-4 py-3 text-center">
        <p className="text-[11px] text-muted-foreground">{t('timetable.stats.courses')}</p>
        <p className="mt-1 text-sm font-semibold text-foreground">{timetableData.subjects?.length || 0}</p>
      </div>
    </div>
  </div>
</div>

      {/* AI Generation Info */}
      <Card className="rounded-2xl border border-border bg-card shadow-sm">
  <CardContent className="p-6">
    <div className="flex items-start gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/30">
        <Settings className="h-5 w-5 text-blue-700" />
      </div>
      <div className="flex-1">
        <h3 className="mb-2 text-sm font-semibold text-foreground">
          {t('timetable.summary.title')}
        </h3>
        <p className="mb-3 text-sm text-muted-foreground">
          {t('timetable.summary.description')}
        </p>
        <ul className="ml-4 list-disc space-y-1 text-sm text-muted-foreground">
          <li><strong className="text-foreground">{t('timetable.summary.priorityLabel')}</strong> {t('timetable.summary.priorityText')}</li>
          <li><strong className="text-foreground">{t('timetable.summary.timePreferencesLabel')}</strong> {t('timetable.summary.timePreferencesText')}</li>
          <li><strong className="text-foreground">{t('timetable.summary.conflictAvoidanceLabel')}</strong> {t('timetable.summary.conflictAvoidanceText', { count: timetableData.blockedTimes?.length || 0 })}</li>
          <li><strong className="text-foreground">{t('timetable.summary.sessionStructureLabel')}</strong> {t('timetable.summary.sessionStructureText', { sessionDuration: timetableData.sessionDuration, breakDuration: timetableData.breakDuration })}</li>
        </ul>
      </div>
    </div>
  </CardContent>
</Card>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:flex-wrap">
  <Button onClick={handleSave} className="h-10 rounded-xl bg-blue-700 text-white hover:bg-blue-700">
    <Save className="mr-2 h-4 w-4" />
    {t('timetable.actions.save')}
  </Button>

  <Button variant="outline" onClick={handleEditCourseSettings} className="h-10 rounded-xl">
    <Edit className="mr-2 h-4 w-4" />
    {t('timetable.actions.editCourses')}
  </Button>

  <Button variant="outline" onClick={handleSplitSessions} className="h-10 rounded-xl">
    <Split className="mr-2 h-4 w-4" />
    {t('timetable.actions.splitLongSessions')}
  </Button>

  <Button variant="outline" onClick={handleMergeSessions} className="h-10 rounded-xl">
    <Merge className="mr-2 h-4 w-4" />
    {t('timetable.actions.mergeAdjacentSessions')}
  </Button>

  <Button variant="outline" onClick={handleCreateNew} className="h-10 rounded-xl">
    <Plus className="mr-2 h-4 w-4" />
    {t('timetable.actions.createNew')}
  </Button>
</div>

      {/* University Schedule Integration Info */}
      {timetableData.blockedTimes && timetableData.blockedTimes.length > 0 && (
        <Card className="rounded-2xl border border-border bg-card shadow-sm">
  <CardContent className="p-4">
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/30">
        <Ban className="h-5 w-5 text-purple-600" />
      </div>
      <div className="flex-1">
        <p className="mb-2 text-sm font-semibold text-foreground">
          {t('timetable.unavailableTime.title')}
        </p>
        <p className="mb-3 text-sm text-muted-foreground">
          {t('timetable.unavailableTime.description', { count: timetableData.blockedTimes.length })}
        </p>
        <div className="flex flex-wrap gap-2">
          {timetableData.blockedTimes.map((bt: any) => (
            <Badge key={bt.id} variant="secondary" className="text-xs">
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
        <Card className="rounded-2xl border border-border bg-card shadow-sm">
          <CardContent className="p-6">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Clock className="h-5 w-5" />
              <strong>{t('timetable.availability.title')}</strong>
            </h3>
            
            {(timetableData.availabilitySettings || localTimetableData.availabilitySettings) ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Weekday Hours */}
                {(timetableData.availabilitySettings?.weekdayAvailability || localTimetableData.availabilitySettings?.weekdayAvailability) && (
                  <div className="rounded-xl border border-border bg-muted/20 p-3">
                    <p className="text-xs text-gray-700 mb-1 flex items-center gap-1">
                      {t('timetable.availability.weekdayHours')}
                    </p>
                    <p className="text-sm text-gray-900">
                      {(timetableData.availabilitySettings?.weekdayAvailability || localTimetableData.availabilitySettings?.weekdayAvailability).start} - {(timetableData.availabilitySettings?.weekdayAvailability || localTimetableData.availabilitySettings?.weekdayAvailability).end}
                    </p>
                  </div>
                )}
                
                {/* Weekend Hours */}
                {(timetableData.availabilitySettings?.weekendAvailability || localTimetableData.availabilitySettings?.weekendAvailability) && 
                 !(timetableData.availabilitySettings?.weekendSameAsWeekday || localTimetableData.availabilitySettings?.weekendSameAsWeekday) && (
                  <div className="rounded-xl border border-border bg-muted/20 p-3">
                    <p className="text-xs text-gray-700 mb-1 flex items-center gap-1">
                      {t('timetable.availability.weekendHours')}
                    </p>
                    <p className="text-sm text-gray-900">
                      {(timetableData.availabilitySettings?.weekendAvailability || localTimetableData.availabilitySettings?.weekendAvailability).start} - {(timetableData.availabilitySettings?.weekendAvailability || localTimetableData.availabilitySettings?.weekendAvailability).end}
                    </p>
                  </div>
                )}
                
                {/* Sleep Hours */}
                <div className="rounded-xl border border-border bg-muted/20 p-3">
                  <p className="text-xs text-gray-700 mb-1 flex items-center gap-1">
                    {t('timetable.availability.sleepHours')}
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
                  <div className="rounded-xl border border-border bg-muted/20 p-3">
                    <p className="text-xs text-gray-700 mb-1 flex items-center gap-1">
                      {t('timetable.availability.lunchBreak')}
                    </p>
                    <p className="text-sm text-gray-900">
                      {(timetableData.availabilitySettings?.lunchBreak || localTimetableData.availabilitySettings?.lunchBreak).start} - {(timetableData.availabilitySettings?.lunchBreak || localTimetableData.availabilitySettings?.lunchBreak).end}
                    </p>
                  </div>
                )}
                
                {/* Dinner Break */}
                {((timetableData.availabilitySettings?.dinnerBreak?.enabled || localTimetableData.availabilitySettings?.dinnerBreak?.enabled)) && (
                  <div className="rounded-xl border border-border bg-muted/20 p-3">
                    <p className="text-xs text-gray-700 mb-1 flex items-center gap-1">
                      {t('timetable.availability.dinnerBreak')}
                    </p>
                    <p className="text-sm text-gray-900">
                      {(timetableData.availabilitySettings?.dinnerBreak || localTimetableData.availabilitySettings?.dinnerBreak).start} - {(timetableData.availabilitySettings?.dinnerBreak || localTimetableData.availabilitySettings?.dinnerBreak).end}
                    </p>
                  </div>
                )}
                
                {/* Commute Buffer */}
                {((timetableData.availabilitySettings?.commuteMinutes || localTimetableData.availabilitySettings?.commuteMinutes) > 0) && (
                  <div className="rounded-xl border border-border bg-muted/20 p-3">
                    <p className="text-xs text-gray-700 mb-1 flex items-center gap-1">
                      {t('timetable.availability.commuteBuffer')}
                    </p>
                    <p className="text-sm text-gray-900">
                      {t('timetable.availability.commuteMinutes', { count: (timetableData.availabilitySettings?.commuteMinutes || localTimetableData.availabilitySettings?.commuteMinutes) })}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-600">{t('timetable.availability.noneFound')}</p>
            )}
          </CardContent>
        </Card>

        {schedule.length === 0 ? (
          <Card className="rounded-2xl border border-border bg-card shadow-sm">
            <CardContent className="p-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                <Calendar className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mb-2 text-base font-semibold text-foreground">{t('timetable.empty.title')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('timetable.empty.description')}
              </p>
            </CardContent>
          </Card>
        ) : (
          schedule.map((daySchedule: any, dayIndex: number) => (
          <Card key={dayIndex} className="rounded-2xl border border-border bg-card shadow-sm">
            <CardHeader className="rounded-t-2xl border-b border-border bg-muted/20">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-700 dark:text-blue-400" />
                <span className="text-gray-900 dark:text-gray-100">{t(`days.${daySchedule.day.toLowerCase()}`)}</span>
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                {t('timetable.dayDescription', {
                  count: daySchedule.sessions.filter((s: any) => s.type === 'study').length,
                  hours: (
                    daySchedule.sessions
                      .filter((s: any) => s.type === 'study')
                      .reduce((sum: number, s: any) => sum + s.duration, 0) / 60
                  ).toFixed(1)
                })}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {daySchedule.sessions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>{t('timetable.dayEmpty')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {daySchedule.sessions.map((session: any, sessionIndex: number) => (
                  <div
                    key={sessionIndex}
                    className={`flex items-center gap-4 rounded-xl border p-4 ${
                      session.type === 'study'
                        ? 'border-blue-200/60 bg-blue-50/40 dark:border-blue-900/30 dark:bg-blue-950/10'
                        : session.type === 'blocked'
                        ? 'border-purple-200/60 bg-purple-50/40 dark:border-purple-900/30 dark:bg-purple-950/10'
                        : 'border-border bg-muted/20'
                    }`}
                  >
                    <div className={`flex h-11 w-11 items-center justify-center rounded-xl border ${
                        session.type === 'study'
                          ? 'border-blue-200 bg-blue-100 text-blue-700 dark:border-blue-900/30 dark:bg-blue-950/20 dark:text-blue-400'
                          : session.type === 'blocked'
                          ? 'border-purple-200 bg-purple-100 text-purple-700 dark:border-purple-900/30 dark:bg-purple-950/20 dark:text-purple-400'
                          : 'border-border bg-muted text-muted-foreground'
                      }`}>
                      {session.type === 'study' ? (
                        <BookOpen className="h-5 w-5" />
                      ) : session.type === 'blocked' ? (
                        <Ban className="h-5 w-5 " />
                      ) : (
                        <Coffee className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {session.type === 'study' ? (
                          <>
                            <span className="text-sm font-semibold text-foreground">{session.subject}</span>
                            {session.priority === 'high' && (
                              <Badge variant="destructive" className="text-xs">
                                {t('priority.high')}
                              </Badge>
                            )}
                            {session.priority === 'medium' && (
                              <Badge variant="secondary" className="text-xs">
                                {t('priority.medium')}
                              </Badge>
                            )}
                          </>
                        ) : session.type === 'blocked' ? (
                          <>
                            <span className="text-sm font-semibold text-foreground">{session.title}</span>
                            <Badge variant="secondary" className="text-xs">
                              {t('timetable.unavailable')}
                            </Badge>
                          </>
                        ) : (
                          <span className="text-sm font-medium text-muted-foreground">{t('timetable.break')}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span>{session.startTime} - {session.endTime}</span>
                        {session.duration && (
                          <>
                            <span className="text-gray-400">•</span>
                            <span>{t('timetable.minutes', { count: session.duration })}</span>
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
      <Card className="rounded-2xl border border-amber-200 bg-amber-50/70 shadow-sm dark:border-amber-900/30 dark:bg-amber-950/10">
        <CardHeader>
          <CardTitle className="text-amber-900 dark:text-red-200">
            {t('timetable.tips.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-amber-900 dark:text-amber-200">
            <li className="flex items-start gap-2">
              <span className="mt-1">•</span>
              <span><strong>{t('timetable.tips.followScheduleLabel')}</strong> {t('timetable.tips.followScheduleText')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1">•</span>
              <span><strong>{t('timetable.tips.useBreaksLabel')}</strong> {t('timetable.tips.useBreaksText')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1">•</span>
              <span><strong>{t('timetable.tips.adjustWhenNeededLabel')}</strong> {t('timetable.tips.adjustWhenNeededText')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1">•</span>
              <span><strong>{t('timetable.tips.stayConsistentLabel')}</strong> {t('timetable.tips.stayConsistentText')}</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Unsaved Changes Warning Dialog */}
      <AlertDialog open={showBackWarning} onOpenChange={setShowBackWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {t('timetable.unsaved.title')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('timetable.unsaved.backDescription')}
              <br /><br />
              {t('timetable.unsaved.backQuestion')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDiscardAndBack}>
              {t('timetable.unsaved.discardAndGoBack')}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleStayAndSave} className="bg-blue-700 hover:bg-blue-700">
              {t('timetable.unsaved.stayAndSave')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create New Timetable Warning Dialog */}
      <AlertDialog open={showCreateNewWarning} onOpenChange={setShowCreateNewWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {t('timetable.unsaved.titleWithWarning')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('timetable.unsaved.createNewDescription')}
              <br /><br />
              {t('timetable.unsaved.createNewQuestion')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDiscardAndCreateNew}>
              {t('timetable.unsaved.discardAndCreateNew')}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleSaveAndCreateNew} className="bg-blue-700 hover:bg-blue-700">
              {t('timetable.unsaved.stayAndSave')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Course List Dialog */}
      <Dialog open={showCourseListDialog} onOpenChange={setShowCourseListDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-blue-700" />
              {t('timetable.courseDialog.title')}
            </DialogTitle>
            <DialogDescription>
              {t('timetable.courseDialog.description')}
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
                  className="group flex w-full items-center gap-3 rounded-xl border border-border bg-card p-3 text-left transition-colors hover:bg-muted/20"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/30">
                    <BookOpen className="h-5 w-5 text-blue-700" />
                  </div>

                  <div className="flex-1 text-left">
                    <div className="text-foreground">{subject.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {t('timetable.courseDialog.courseMeta', { hours: subject.hoursPerWeek, priority: subject.priority })}
                    </div>
                  </div>

                  <Edit className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-blue-700" />
                </button>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {t('timetable.courseDialog.noCourses')}
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => setShowCourseListDialog(false)}>
              {t('common.close')}
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