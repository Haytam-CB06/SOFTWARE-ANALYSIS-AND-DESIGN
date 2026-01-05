import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner@2.0.3';
import { storageService } from '../services/storageService';
import { Timetable, Session } from '../types';
import { convertScheduleToSessions } from '../utils/scheduleUtils';
import { getWeekIdentifier } from '../utils/dateUtils';
import { getCurrentUserEmail } from '../../utils/userStorage';
import {
  activateStudyTimetable,
  createStudyTimetable,
  deleteStudyTimetable,
  listStudyTimetables,
  updateStudyTimetable,
  applyStudyTimetable,
  type BackendStudyTimetable,
} from '../services/backendApi';

function isUuidLike(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function toTimetable(b: BackendStudyTimetable): Timetable {
  const data: any = b.data || {};

  const schedule = Array.isArray(data.schedule) ? data.schedule : [];
  const calendarSessions = Array.isArray(data.calendarSessions) ? data.calendarSessions : undefined;

  return {
    id: String(b.id),
    name: String(b.name || 'Saved Timetable'),
    weekStartDate:
      typeof data.weekStartDate === 'string'
        ? data.weekStartDate
        : typeof data.createdAt === 'string'
          ? data.createdAt
          : b.created_at || new Date().toISOString(),
    schedule,
    isActive: !!b.is_active,
    createdAt: b.created_at || (typeof data.createdAt === 'string' ? data.createdAt : new Date().toISOString()),
    calendarSessions,
    availabilitySettings: data.availabilitySettings,
  } as Timetable;
}

/**
 * Custom hook for managing timetables.
 *
 * ✅ Saved Timetables are stored in the backend when a user is logged in
 * (so they sync across browsers/devices). Local storage is kept as a fallback
 * and for calendar session caching.
 */
export const useTimetables = () => {
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [calendarSessions, setCalendarSessions] = useState<Session[]>([]);

  const [userId, setUserId] = useState(() => localStorage.getItem('currentUserId') || '');
  const [userEmail, setUserEmail] = useState(() => getCurrentUserEmail() || '');
  const userKey = isUuidLike(userId) ? userId : userEmail;

  const lastUserKeyRef = useRef<string>('');
  const refreshingRef = useRef(false);

  const refresh = async (): Promise<Timetable[]> => {
    if (refreshingRef.current) return timetables;
    refreshingRef.current = true;
    try {
      // Keep user identifiers in sync with localStorage
      const latestUserId = localStorage.getItem('currentUserId') || '';
      const latestEmail = getCurrentUserEmail() || '';
      if (latestUserId !== userId) setUserId(latestUserId);
      if (latestEmail !== userEmail) setUserEmail(latestEmail);

      const effectiveUserId = isUuidLike(latestUserId) ? latestUserId : userId;

      // Always load calendar sessions from local cache (CalendarView syncs to backend separately)
      const savedSessions = storageService.getCalendarSessions();
      setCalendarSessions(savedSessions);

      if (isUuidLike(effectiveUserId)) {
        // One-time migration (best-effort): push legacy local timetables to backend
        const migrationKey = `studyTimetablesMigrated:${effectiveUserId}`;
        if (!localStorage.getItem(migrationKey)) {
          const local = storageService.getTimetables();
          const unsynced = local.filter((t) => !isUuidLike(String(t.id)));
          if (unsynced.length) {
            for (const t of unsynced) {
              try {
                // Store the timetable content under `data`.
                // Backend assigns the definitive UUID id and active flag.
                await createStudyTimetable({
                  user_id: effectiveUserId,
                  name: t.name || 'Imported Timetable',
                  data: {
                    weekStartDate: t.weekStartDate,
                    schedule: t.schedule,
                    calendarSessions: t.calendarSessions,
                    availabilitySettings: (t as any).availabilitySettings,
                    createdAt: t.createdAt,
                  },
                });
              } catch {
                // ignore individual migration failures
              }
            }
          }
          localStorage.setItem(migrationKey, '1');
        }

        const backend = await listStudyTimetables(effectiveUserId);
        const mapped = backend.map(toTimetable).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
        setTimetables(mapped);
        return mapped;
      } else {
        // Fallback to local storage (e.g., guest mode)
        const local = storageService.getTimetables();
        setTimetables(local);
        return local;
      }
    } catch (e: any) {
      console.error('[useTimetables] refresh failed:', e);
      // Fallback to local storage if backend is unreachable
      const local = storageService.getTimetables();
      setTimetables(local);
      return local;
    } finally {
      refreshingRef.current = false;
    }
  };

  // Initial load and user switch handling
  useEffect(() => {
    if (userKey !== lastUserKeyRef.current) {
      lastUserKeyRef.current = userKey;
      setTimetables([]);
      setCalendarSessions([]);
    }
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userKey]);

  // Listen for custom events (account switch, timetable changes)
  useEffect(() => {
    const handleUserChanged = () => void refresh();
    const handleTimetablesUpdated = () => void refresh();

    window.addEventListener('userChanged', handleUserChanged);
    window.addEventListener('timetablesUpdated', handleTimetablesUpdated);
    return () => {
      window.removeEventListener('userChanged', handleUserChanged);
      window.removeEventListener('timetablesUpdated', handleTimetablesUpdated);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist calendar sessions locally (CalendarView handles backend sync)
  useEffect(() => {
    storageService.saveCalendarSessions(calendarSessions);
  }, [calendarSessions]);

  const saveTimetable = async (timetable: Timetable) => {
    try {
      // Convert schedule to calendar sessions for immediate CalendarView use
      const calendarSessionsFromSchedule = convertScheduleToSessions(timetable.schedule);

      const timetableWithSessions: Timetable = {
        ...timetable,
        calendarSessions: calendarSessionsFromSchedule,
      };

      // Update local calendar view cache (regardless of backend)
      setCalendarSessions(calendarSessionsFromSchedule);
      storageService.saveCalendarSessions(calendarSessionsFromSchedule);

      const weekId = getWeekIdentifier(new Date());
      storageService.saveCalendarSessionsForWeek(calendarSessionsFromSchedule, weekId);
      window.dispatchEvent(new Event('calendarSessionsUpdated'));

      const effectiveUserId = localStorage.getItem('currentUserId') || userId;
      if (isUuidLike(effectiveUserId)) {
        await createStudyTimetable({
          user_id: effectiveUserId,
          name: timetableWithSessions.name || 'Saved Timetable',
          data: {
            weekStartDate: timetableWithSessions.weekStartDate,
            schedule: timetableWithSessions.schedule,
            calendarSessions: timetableWithSessions.calendarSessions,
            availabilitySettings: (timetableWithSessions as any).availabilitySettings,
            createdAt: timetableWithSessions.createdAt,
          },
        });
        await refresh();
      } else {
        // Guest mode: local-only save
        const updatedTimetables = timetables.map((t) => ({ ...t, isActive: false }));
        const newTimetables = [...updatedTimetables, { ...timetableWithSessions, isActive: true }];
        setTimetables(newTimetables);
        storageService.saveTimetables(newTimetables);
      }

      toast.success(`✅ Timetable saved successfully! Sessions added to week ${weekId}. Redirecting...`);
    } catch (e: any) {
      console.error('[useTimetables] saveTimetable failed:', e);
      toast.error(`Could not save timetable: ${e?.message || 'Unknown error'}`);
    }
  };

  const deleteTimetable = async (id: string) => {
    try {
      const effectiveUserId = localStorage.getItem('currentUserId') || userId;
      if (isUuidLike(effectiveUserId) && isUuidLike(id)) {
        await deleteStudyTimetable(id, effectiveUserId);
        await refresh();
      } else {
        const updated = timetables.filter((t) => t.id !== id);
        setTimetables(updated);
        storageService.saveTimetables(updated);
      }
    } catch (e: any) {
      console.error('[useTimetables] deleteTimetable failed:', e);
      toast.error(`Could not delete timetable: ${e?.message || 'Unknown error'}`);
    }
  };

  const setActiveTimetable = async (id: string) => {
    try {
      const effectiveUserId = localStorage.getItem('currentUserId') || userId;
      let active: Timetable | undefined;

      if (isUuidLike(effectiveUserId) && isUuidLike(id)) {
        await activateStudyTimetable(id, effectiveUserId);
        const latest = await refresh();
        active = latest.find((t) => t.id === id) || latest.find((t) => t.isActive);
      } else {
        const updated = timetables.map((t) => ({ ...t, isActive: t.id === id }));
        setTimetables(updated);
        storageService.saveTimetables(updated);
        active = updated.find((t) => t.id === id) || updated.find((t) => t.isActive);
      }

      // Load sessions from the active timetable
      const sessions = active?.calendarSessions?.length
        ? active.calendarSessions
        : active?.schedule
          ? convertScheduleToSessions(active.schedule)
          : [];

      if (sessions.length) {
        setCalendarSessions(sessions);
        storageService.saveCalendarSessions(sessions);

        const weekId = getWeekIdentifier(new Date());
        storageService.saveCalendarSessionsForWeek(sessions, weekId);
        window.dispatchEvent(new Event('calendarSessionsUpdated'));

        toast.success(`Timetable activated! ${sessions.length} sessions loaded to "My Timetable" for week ${weekId}.`);
      } else {
        toast.error('Could not load sessions from timetable - no schedule data found');
      }
    } catch (e: any) {
      console.error('[useTimetables] setActiveTimetable failed:', e);
      toast.error(`Could not activate timetable: ${e?.message || 'Unknown error'}`);
    }
  };

  const renameTimetable = async (id: string, newName: string) => {
    const name = (newName || '').trim();
    if (!name) return;
    try {
      const effectiveUserId = localStorage.getItem('currentUserId') || userId;
      if (isUuidLike(effectiveUserId) && isUuidLike(id)) {
        await updateStudyTimetable(id, effectiveUserId, { name });
        await refresh();
      } else {
        const updated = timetables.map((t) => (t.id === id ? { ...t, name } : t));
        setTimetables(updated);
        storageService.saveTimetables(updated);
      }
      toast.success('Timetable renamed');
    } catch (e: any) {
      console.error('[useTimetables] renameTimetable failed:', e);
      toast.error(e?.message || 'Could not rename timetable');
    }
  };

  const duplicateTimetable = async (id: string) => {
    try {
      const src = timetables.find((t) => t.id === id);
      if (!src) throw new Error('Timetable not found');
      const effectiveUserId = localStorage.getItem('currentUserId') || userId;

      const copyName = `${src.name || 'Saved Timetable'} (Copy)`;
      const data: any = {
        schedule: (src as any).schedule,
        calendarSessions: (src as any).calendarSessions,
        availabilitySettings: (src as any).availabilitySettings,
        createdAt: new Date().toISOString(),
      };

      if (isUuidLike(effectiveUserId)) {
        await createStudyTimetable({ user_id: effectiveUserId, name: copyName, data, is_active: false });
        await refresh();
      } else {
        const newLocal: Timetable = {
          ...src,
          id: `local-${Date.now()}`,
          name: copyName,
          isActive: false,
          createdAt: new Date().toISOString(),
        } as any;
        const updated = [newLocal, ...timetables.map((t) => ({ ...t, isActive: false }))];
        setTimetables(updated);
        storageService.saveTimetables(updated);
      }

      toast.success('Timetable duplicated');
    } catch (e: any) {
      console.error('[useTimetables] duplicateTimetable failed:', e);
      toast.error(e?.message || 'Could not duplicate timetable');
    }
  };

  const applyTimetableToWeek = async (id: string, mode: 'overwrite' | 'merge') => {
    try {
      const effectiveUserId = localStorage.getItem('currentUserId') || userId;
      if (!isUuidLike(effectiveUserId) || !isUuidLike(id)) {
        // Offline/local fallback: reuse existing activation behavior
        await setActiveTimetable(id);
        return;
      }

      const weekId = getWeekIdentifier(new Date());
      const tzOffsetMinutes = -new Date().getTimezoneOffset(); // minutes east of UTC

      const res = await applyStudyTimetable(id, effectiveUserId, {
        week_id: weekId,
        mode,
        tz_offset_minutes: tzOffsetMinutes,
        activate: true,
      });

      await refresh();

      if (res?.ok) {
        toast.success(`Applied timetable: created ${res.created} sessions (skipped ${res.skipped_duplicates} duplicates, ${res.skipped_overlaps} overlaps).`);
      } else {
        toast.success('Timetable applied');
      }
    } catch (e: any) {
      console.error('[useTimetables] applyTimetableToWeek failed:', e);
      toast.error(e?.message || 'Could not apply timetable');
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
    renameTimetable,
    duplicateTimetable,
    applyTimetableToWeek,
    saveCalendarTimetable,
  };
};
