import { useState, useEffect } from 'react';
import { toast } from 'sonner@2.0.3';
import { storageService } from '../services/storageService';
import { Timetable, Session } from '../types';
import { convertScheduleToSessions } from '../utils/scheduleUtils';
import { getWeekIdentifier } from '../utils/dateUtils';
import { getCurrentUserEmail } from '../../utils/userStorage';

/**
 * Custom hook for managing timetables
 */
export const useTimetables = () => {
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [calendarSessions, setCalendarSessions] = useState<Session[]>([]);
  const [currentUser, setCurrentUser] = useState<string | null>(null); // Don't call getCurrentUserEmail here!

  // Load timetables and sessions from storage on mount and when user changes
  useEffect(() => {
    const userEmail = getCurrentUserEmail();
    
    // If user changed, update the state
    if (userEmail !== currentUser) {
      console.log(`[useTimetables] User changed from "${currentUser}" to "${userEmail}"`);
      setCurrentUser(userEmail);
      
      // Clear all state when user changes
      setTimetables([]);
      setCalendarSessions([]);
    }
    
    const savedTimetables = storageService.getTimetables();
    const savedSessions = storageService.getCalendarSessions();
    
    console.log(`[useTimetables] Loading data for user: ${userEmail || 'not logged in'}`);
    console.log(`[useTimetables] Loaded ${savedTimetables.length} timetables`);
    
    setTimetables(savedTimetables);
    setCalendarSessions(savedSessions);
  }, [currentUser]);

  // Listen for storage changes (when user switches accounts)
  useEffect(() => {
    const handleStorageChange = () => {
      const userEmail = getCurrentUserEmail();
      console.log(`[useTimetables] Storage changed, current user: ${userEmail}`);
      setCurrentUser(userEmail);
    };

    const handleTimetablesUpdated = () => {
      console.log(`[useTimetables] Timetables updated event received`);
      const savedTimetables = storageService.getTimetables();
      console.log(`[useTimetables] Reloading ${savedTimetables.length} timetables`);
      setTimetables(savedTimetables);
    };

    // Listen for custom event when user changes
    window.addEventListener('userChanged', handleStorageChange);
    // Listen for timetables updated event
    window.addEventListener('timetablesUpdated', handleTimetablesUpdated);
    
    return () => {
      window.removeEventListener('userChanged', handleStorageChange);
      window.removeEventListener('timetablesUpdated', handleTimetablesUpdated);
    };
  }, []);

  // Note: We don't auto-save timetables on state change to prevent duplicate saves
  // Each function that modifies timetables saves directly to storage

  // Save calendar sessions to storage
  useEffect(() => {
    storageService.saveCalendarSessions(calendarSessions);
  }, [calendarSessions]);

  const saveTimetable = (timetable: Timetable) => {
    console.log('=== SAVING TIMETABLE ===');
    console.log('Timetable to save:', timetable);
    console.log('Current timetables:', timetables);

    // Deactivate all other timetables
    const updatedTimetables = timetables.map((t) => ({
      ...t,
      isActive: false,
    }));

    // Convert schedule to calendar sessions
    const calendarSessionsFromSchedule = convertScheduleToSessions(timetable.schedule);
    console.log('Converted to calendar sessions:', calendarSessionsFromSchedule.length, 'sessions');
    console.log('Sample session start times:', calendarSessionsFromSchedule.slice(0, 3).map(s => `${s.subject}: ${s.startTime}-${s.endTime}`));

    // Add sessions to the timetable object
    const timetableWithSessions = {
      ...timetable,
      calendarSessions: calendarSessionsFromSchedule,
    };

    // Add new timetable as active
    const newTimetables = [...updatedTimetables, timetableWithSessions];
    console.log('New timetables array:', newTimetables.length, 'timetables');

    setTimetables(newTimetables);
    setCalendarSessions(calendarSessionsFromSchedule);

    // Save to localStorage
    storageService.saveTimetables(newTimetables);
    storageService.saveCalendarSessions(calendarSessionsFromSchedule);

    // Also save to current week's CalendarView storage
    const currentDate = new Date();
    const weekId = getWeekIdentifier(currentDate);
    storageService.saveCalendarSessionsForWeek(calendarSessionsFromSchedule, weekId);

    // Dispatch event to notify CalendarView
    window.dispatchEvent(new Event('calendarSessionsUpdated'));

    console.log(`✅ Saved ${calendarSessionsFromSchedule.length} sessions to localStorage for week ${weekId}`);

    toast.success(
      `✅ Timetable saved successfully! Sessions added to week ${weekId}. Redirecting...`
    );
  };

  const deleteTimetable = (id: string) => {
    const updatedTimetables = timetables.filter((t) => t.id !== id);
    setTimetables(updatedTimetables);
    // Save to storage since we removed auto-save
    storageService.saveTimetables(updatedTimetables);
  };

  const setActiveTimetable = (id: string) => {
    console.log('=== ACTIVATING TIMETABLE ===');
    console.log('Timetable ID:', id);
    
    const updatedTimetables = timetables.map((t) => ({
      ...t,
      isActive: t.id === id,
    }));

    setTimetables(updatedTimetables);
    // Save to storage since we removed auto-save
    storageService.saveTimetables(updatedTimetables);

    // Load the sessions from the active timetable
    const activeTimetable = updatedTimetables.find((t) => t.id === id);
    console.log('Active timetable found:', activeTimetable);
    
    if (activeTimetable && activeTimetable.calendarSessions) {
      console.log('Using calendarSessions from timetable:', activeTimetable.calendarSessions.length, 'sessions');
      console.log('Sample session start times:', activeTimetable.calendarSessions.slice(0, 3).map(s => `${s.subject}: ${s.startTime}-${s.endTime}`));
      setCalendarSessions(activeTimetable.calendarSessions);

      // Save to both old format and current week's format
      storageService.saveCalendarSessions(activeTimetable.calendarSessions);

      // Also save to current week's CalendarView storage
      const currentDate = new Date();
      const weekId = getWeekIdentifier(currentDate);
      storageService.saveCalendarSessionsForWeek(activeTimetable.calendarSessions, weekId);

      // Dispatch event to notify CalendarView
      window.dispatchEvent(new Event('calendarSessionsUpdated'));

      toast.success(
        `Timetable activated! ${activeTimetable.calendarSessions.length} sessions loaded to "My Timetable" for week ${weekId}.`
      );
    } else if (activeTimetable && activeTimetable.schedule) {
      console.log('No calendarSessions found, converting from schedule');
      // Convert schedule to sessions if calendarSessions don't exist
      const convertedSessions = convertScheduleToSessions(activeTimetable.schedule);
      console.log('Converted sessions:', convertedSessions.length, 'sessions');
      console.log('Sample converted session start times:', convertedSessions.slice(0, 3).map(s => `${s.subject}: ${s.startTime}-${s.endTime}`));
      
      setCalendarSessions(convertedSessions);

      // Save to both old format and current week's format
      storageService.saveCalendarSessions(convertedSessions);

      // Also save to current week's CalendarView storage
      const currentDate = new Date();
      const weekId = getWeekIdentifier(currentDate);
      storageService.saveCalendarSessionsForWeek(convertedSessions, weekId);

      // Dispatch event to notify CalendarView
      window.dispatchEvent(new Event('calendarSessionsUpdated'));

      toast.success(
        `Timetable activated! ${convertedSessions.length} sessions loaded to "My Timetable" for week ${weekId}.`
      );
    } else {
      console.warn('No calendarSessions or schedule found in timetable');
      toast.error('Could not load sessions from timetable - no schedule data found');
    }
  };

  const saveCalendarTimetable = (sessions: Session[]) => {
    setCalendarSessions(sessions);
    storageService.saveCalendarSessions(sessions);
  };

  return {
    timetables,
    calendarSessions,
    saveTimetable,
    deleteTimetable,
    setActiveTimetable,
    saveCalendarTimetable,
  };
};