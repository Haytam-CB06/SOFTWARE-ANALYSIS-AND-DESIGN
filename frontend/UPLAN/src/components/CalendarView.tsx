import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ChevronLeft, ChevronRight, Plus, Download, Upload, Trash2, Calendar as CalendarIcon, Clock, GripVertical, AlertTriangle, ChevronDown, ChevronUp, RotateCcw, Copy, FileText, Sun, Moon, Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { toast } from 'sonner@2.0.3';
import { getUserWeekKey } from '../utils/userStorage';
import { courseColorForSubject } from '../utils/courseColor';
import SessionCard from './SessionCard';
import SessionDialog from './SessionDialog';
import ImportDialog from './ImportDialog';
import googleCalendarIcon from 'figma:asset/9cdb2bc588344ebf952e674647c637e389c6663e.png';

// Timetable sessions use the Goals/Achievements numeric accent (purple) for uniqueness.
const TIMETABLE_SESSION_COLOR = '#6366F1';

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

type AssessmentKind = 'assignment' | 'exam' | 'quiz' | 'project';

interface Assessment {
  id: string;
  title: string;
  subject: string;
  type: AssessmentKind;
  dueDate: string;
  completed: boolean;
}

interface CalendarViewProps {
  onSaveTimetable?: (sessions: Session[]) => void;
  onNavigate?: (page: string) => void;
  // Global admin flag (enables workspace import target)
  isGlobalAdmin?: boolean;
  // Optional: override where week sessions are stored
  weekKeyFn?: (weekId: string) => string;
  // Optional: make timetable view-only (used by Workspace members)
  readOnly?: boolean;
  // Optional: skip backend hydration/persistence
  disableBackend?: boolean;
  // Optional: custom event name to listen for external updates
  storageEventName?: string;
  // Optional: notify parent when header collapse toggles
  onOuterCollapseChange?: (collapsed: boolean) => void;

  // Optional: override backend endpoints (used for Workspace shared timetable)
  backendPaths?: {
    get: (weekId: string) => string; // should include query string
    put: (weekId: string) => string; // should include query string
  };
  // Optional: override headers for backend calls
  backendHeaders?: (currentUserId: string) => Record<string, string>;

  // Optional: workspace session status tracking (used by Workspace timetable)
  workspaceStatus?: {
    get: (weekId: string) => string; // should include query string
    put: (weekId: string) => string; // should include query string
    canEdit: boolean; // workspace admin can update statuses
  };

  // Optional: show backend-derived status badges/greying on the personal timetable
  showStatusBadges?: boolean;
}

type WorkspaceSessionStatus = 'planned' | 'completed' | 'missed' | 'skipped';

const pad2 = (n: number) => String(n).padStart(2, '0');
const toHHMM = (d: Date) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;

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
  // Deadline/assessment colors (requested):
  // - Exam: red
  // - Quiz/Test: yellow
  // - Assignment: green
  { value: 'assignment', label: 'Assignment', color: '#10B981' },
  { value: 'test', label: 'Test/Quiz', color: '#F59E0B' },
  { value: 'exam', label: 'Exam', color: '#DC2626' },
];

export default function CalendarView({
  onSaveTimetable,
  onNavigate,
  isGlobalAdmin = false,
  weekKeyFn,
  readOnly = false,
  disableBackend = false,
  storageEventName = 'calendarSessionsUpdated',
  onOuterCollapseChange,
  backendPaths,
  backendHeaders,
  workspaceStatus,
  showStatusBadges = false,
}: CalendarViewProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  // Assessments/deadlines are rendered inside the timetable week view, but are managed
  // from the Assessments & Deadlines page (not saved back into the timetable JSON).
  const [assessmentSessions, setAssessmentSessions] = useState<Session[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const calendarExportRef = useRef<HTMLDivElement>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ day: number; time: string } | null>(null);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isImportTargetDialogOpen, setIsImportTargetDialogOpen] = useState(false);
  const [draggingSession, setDraggingSession] = useState<string | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<{ day: number; time: string } | null>(null);
  const [hasExportedThisWeek, setHasExportedThisWeek] = useState(false);
  const [headerCollapsed, setHeaderCollapsed] = useState(false);
  const [availabilitySettings, setAvailabilitySettings] = useState<any>(null);
  const isHydratingRef = useRef(true);
  const saveDebounceRef = useRef<any>(null);
  const userEditedRef = useRef(false);
  // If backend returns empty but localStorage has sessions, sync once.
  const shouldSyncRef = useRef(false);

  // Workspace status tracking (admins can mark planned/completed/missed/skipped)
  const [statusMap, setStatusMap] = useState<Record<string, WorkspaceSessionStatus>>({});
  const [isStatusLoading, setIsStatusLoading] = useState(false);
  const statusSaveDebounceRef = useRef<any>(null);

  // Personal timetable status badges (derived from backend StudySession rows)
  const [personalStatusMap, setPersonalStatusMap] = useState<Record<string, WorkspaceSessionStatus>>({});
  const [isPersonalStatusLoading, setIsPersonalStatusLoading] = useState(false);

  const makePersonalKey = (dayIsoUtc: string, startTime: string, endTime: string) => {
    return `${dayIsoUtc}|${startTime}|${endTime}`;
  };

  const getWeekStartLocal = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay(); // 0=Sun
    const diffToMonday = (day + 6) % 7;
    d.setDate(d.getDate() - diffToMonday);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const getDayBaseLocal = (weekStartLocal: Date, dayIndex: number): Date => {
    const d = new Date(weekStartLocal);
    d.setDate(d.getDate() + dayIndex);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const getSessionStartEndLocal = (weekStartLocal: Date, s: Session) => {
    const base = getDayBaseLocal(weekStartLocal, s.day);
    const startM = timeToMinutes(s.startTime);
    let endM = timeToMinutes(s.endTime);
    if (!Number.isFinite(startM) || !Number.isFinite(endM)) {
      return { start: new Date(base), end: new Date(base) };
    }
    if (endM <= startM) endM = startM + 30;
    return {
      start: new Date(base.getTime() + startM * 60_000),
      end: new Date(base.getTime() + endM * 60_000),
    };
  };

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const currentUserId = localStorage.getItem('currentUserId');

  const isAssessmentSessionId = (id: string) => (id || '').startsWith('assessment:');

  const assessmentToSession = (a: Assessment): Session | null => {
    try {
      if (!a || !a.dueDate) return null;
      const due = new Date(a.dueDate);
      if (Number.isNaN(due.getTime())) return null;

      // Map assessment types to the timetable session types/colors.
      const kind = (a.type || '').toLowerCase();
      let sessType: Session['type'] = 'assignment';
      let color = '#10B981';
      let durationMins = 30;
      if (kind === 'exam') {
        sessType = 'exam';
        color = '#DC2626';
        durationMins = 60;
      } else if (kind === 'quiz') {
        sessType = 'test';
        color = '#F59E0B';
        durationMins = 30;
      } else if (kind === 'project') {
        // Projects behave like assignments in the timetable.
        sessType = 'assignment';
        color = '#10B981';
        durationMins = 30;
      } else {
        sessType = 'assignment';
        color = '#10B981';
        durationMins = 30;
      }

      const localDay = due.getDay(); // 0=Sun
      const dayIndex = (localDay + 6) % 7; // convert to 0=Mon ... 6=Sun
      const startTime = toHHMM(due);
      const end = new Date(due.getTime() + durationMins * 60_000);
      const endTime = toHHMM(end);

      return {
        id: `assessment:${a.id}`,
        subject: (a.subject || '').trim() || '(Untitled)',
        startTime,
        endTime,
        day: dayIndex,
        type: sessType,
        color,
        deadline: a.dueDate,
      };
    } catch {
      return null;
    }
  };
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

  const getWeekStartUtc = (date: Date): Date => {
    const d = new Date(date);
    const utcDay = d.getUTCDay(); // 0=Sun
    const diffToMonday = (utcDay + 6) % 7; // Mon->0
    d.setUTCDate(d.getUTCDate() - diffToMonday);
    d.setUTCHours(0, 0, 0, 0);
    return d;
  };

  const getDayBaseUtc = (weekStartUtc: Date, dayIndex: number): Date => {
    const d = new Date(weekStartUtc);
    d.setUTCDate(d.getUTCDate() + dayIndex);
    d.setUTCHours(0, 0, 0, 0);
    return d;
  };

  const getSessionStartEndUtc = (weekStartUtc: Date, dayIndex: number, s: Session) => {
    const base = getDayBaseUtc(weekStartUtc, dayIndex);
    const startM = timeToMinutes(s.startTime);
    let endM = timeToMinutes(s.endTime);
    if (!Number.isFinite(startM) || !Number.isFinite(endM)) {
      return {
        start: new Date(base),
        end: new Date(base),
      };
    }
    if (endM <= startM) endM = startM + 30;
    return {
      start: new Date(base.getTime() + startM * 60_000),
      end: new Date(base.getTime() + endM * 60_000),
    };
  };

  const isStatusTrackableSession = (s: Session) => {
    const t = (s.type || '').toLowerCase();
    return !['sleep', 'lunch', 'break', 'busy', 'class', 'lecture'].includes(t);
  };

  const getWeekKey = (weekId: string) => (weekKeyFn ? weekKeyFn(weekId) : getUserWeekKey(weekId));

  const getEffectiveHeaders = (extra?: Record<string, string>) => {
    if (!currentUserId) return extra || {};
    const base = backendHeaders ? backendHeaders(currentUserId) : { 'X-User-Id': currentUserId };
    return { ...base, ...(extra || {}) };
  };

  // --- Workspace status tracking (view for members, edit for workspace admins) ---
  useEffect(() => {
    const loadStatus = async () => {
      if (!workspaceStatus || disableBackend) return;
      if (!API_BASE_URL || !currentUserId) return;
      const weekId = getWeekIdentifier(currentDate);

      try {
        setIsStatusLoading(true);
        const res = await fetch(`${API_BASE_URL}${workspaceStatus.get(weekId)}`, {
          method: 'GET',
          headers: getEffectiveHeaders(),
        });
        if (!res.ok) {
          // If member read is not allowed on backend, fail silently for now.
          setStatusMap({});
          return;
        }
        const data = await res.json();
        setStatusMap((data && typeof data === 'object') ? data : {});
      } catch (e) {
        setStatusMap({});
      } finally {
        setIsStatusLoading(false);
      }
    };

    loadStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate, workspaceStatus, disableBackend, API_BASE_URL, currentUserId]);

  // Personal timetable: load backend StudySession statuses for the shown week
  useEffect(() => {
    const loadPersonalStatuses = async () => {
      if (!showStatusBadges) return;
      if (workspaceStatus) return; // workspace has its own statusMap
      if (disableBackend) return;
      if (!API_BASE_URL || !currentUserId) return;

      const weekStart = getWeekStartLocal(currentDate);
      const headers = getEffectiveHeaders();

      try {
        setIsPersonalStatusLoading(true);
        const dayRequests = Array.from({ length: 7 }, (_, dayIndex) => {
          const dayBase = getDayBaseLocal(weekStart, dayIndex);
          const dayIsoUtc = dayBase.toISOString().slice(0, 10);
          const url = `${API_BASE_URL}/sessions/by-day?user_id=${encodeURIComponent(currentUserId)}&day=${encodeURIComponent(dayIsoUtc)}`;
          return fetch(url, { headers }).then(async (r) => {
            if (!r.ok) return [];
            try {
              return (await r.json()) as any[];
            } catch {
              return [];
            }
          }).then((rows) => ({ dayIsoUtc, rows }));
        });

        const results = await Promise.all(dayRequests);
        const nextMap: Record<string, WorkspaceSessionStatus> = {};
        for (const { dayIsoUtc, rows } of results) {
          for (const r of (rows || [])) {
            const st = String(r?.status || 'planned').toLowerCase();
            if (!['planned', 'completed', 'missed', 'skipped'].includes(st)) continue;
            // Match timetable slots by their local HH:MM times (Dashboard creates using local hours)
            const start = new Date(r?.start_at);
            const end = new Date(r?.end_at);
            const key = makePersonalKey(dayIsoUtc, toHHMM(start), toHHMM(end));
            nextMap[key] = st as WorkspaceSessionStatus;
          }
        }
        setPersonalStatusMap(nextMap);
      } catch (e) {
        setPersonalStatusMap({});
      } finally {
        setIsPersonalStatusLoading(false);
      }
    };

    loadPersonalStatuses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate, showStatusBadges, workspaceStatus, disableBackend, API_BASE_URL, currentUserId]);

  // Workspace: auto-mark past planned sessions as missed (best-effort, admin only)
  const autoMissStateRef = useRef<{ weekId: string; processed: Set<string> }>({ weekId: '', processed: new Set() });
  useEffect(() => {
    const autoMiss = async () => {
      if (!workspaceStatus || !workspaceStatus.canEdit) return;
      if (disableBackend) return;
      if (!API_BASE_URL || !currentUserId) return;
      if (isStatusLoading) return;

      const weekId = getWeekIdentifier(currentDate);
      if (autoMissStateRef.current.weekId !== weekId) {
        autoMissStateRef.current = { weekId, processed: new Set() };
      }

      const weekStart = getWeekStartLocal(currentDate);
      const nowMs = Date.now();
      const items: { calendar_session_id: string; status: WorkspaceSessionStatus }[] = [];

      for (const s of sessions) {
        if (!s?.id) continue;
        if (autoMissStateRef.current.processed.has(s.id)) continue;
        const { end } = getSessionStartEndLocal(weekStart, s);
        const stored = (statusMap?.[s.id] as WorkspaceSessionStatus) || 'planned';
        const isPast = end.getTime() < nowMs;
        if (isPast && (stored === 'planned')) {
          items.push({ calendar_session_id: s.id, status: 'missed' });
          autoMissStateRef.current.processed.add(s.id);
        }
      }

      if (!items.length) return;

      // Update UI immediately
      setStatusMap((prev) => {
        const next = { ...(prev || {}) } as Record<string, WorkspaceSessionStatus>;
        for (const it of items) next[it.calendar_session_id] = 'missed';
        return next;
      });

      try {
        const res = await fetch(`${API_BASE_URL}${workspaceStatus.put(weekId)}`, {
          method: 'PUT',
          headers: getEffectiveHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ items: items.map((it) => ({ ...it, marked_by_user_id: undefined })) }),
        });
        if (!res.ok) {
          // Do not toast-spam; this is best-effort
          // eslint-disable-next-line no-console
          console.warn('Auto-miss persist failed');
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('Auto-miss persist error', e);
      }
    };

    autoMiss();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessions, statusMap, isStatusLoading, currentDate, workspaceStatus, disableBackend, API_BASE_URL, currentUserId]);

  const pendingStatusChangesRef = useRef<Record<string, WorkspaceSessionStatus>>({});

  const persistPendingStatusChanges = async () => {
    if (!workspaceStatus || disableBackend) return;
    if (!workspaceStatus.canEdit) return;
    if (!API_BASE_URL || !currentUserId) return;
    const weekId = getWeekIdentifier(currentDate);
    const pending = pendingStatusChangesRef.current;
    const items = Object.entries(pending).map(([calendar_session_id, status]) => ({
      calendar_session_id,
      status,
    }));
    if (items.length === 0) return;

    // clear pending before request to avoid duplicate bursts
    pendingStatusChangesRef.current = {};

    try {
      const res = await fetch(`${API_BASE_URL}${workspaceStatus.put(weekId)}`, {
        method: 'PUT',
        headers: getEffectiveHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ items }),
      });
      if (!res.ok) {
        toast.error('Failed to save workspace session statuses');
      }
    } catch (e) {
      toast.error('Failed to save workspace session statuses');
    }
  };

  const setWorkspaceSessionStatus = (sessionId: string, status: WorkspaceSessionStatus) => {
    setStatusMap((prev) => ({ ...prev, [sessionId]: status }));

    if (!workspaceStatus || !workspaceStatus.canEdit || disableBackend) return;
    pendingStatusChangesRef.current = { ...pendingStatusChangesRef.current, [sessionId]: status };
    if (statusSaveDebounceRef.current) clearTimeout(statusSaveDebounceRef.current);
    statusSaveDebounceRef.current = setTimeout(() => {
      persistPendingStatusChanges();
    }, 250);
  };

  const getWorkspaceSessionStatus = (sessionId: string): WorkspaceSessionStatus => {
    return (statusMap?.[sessionId] as WorkspaceSessionStatus) || 'planned';
  };

  const isSessionPast = (s: Session) => {
    const weekStart = getWeekStartLocal(currentDate);
    const { end } = getSessionStartEndLocal(weekStart, s);
    return end.getTime() < Date.now();
  };

  const getEffectiveWorkspaceStatus = (s: Session): WorkspaceSessionStatus => {
    const stored = getWorkspaceSessionStatus(s.id);
    if (stored === 'planned' && isSessionPast(s)) return 'missed';
    return stored;
  };

  const getEffectivePersonalStatus = (s: Session): WorkspaceSessionStatus => {
    const weekStart = getWeekStartLocal(currentDate);
    const dayBase = getDayBaseLocal(weekStart, s.day);
    const dayIsoUtc = dayBase.toISOString().slice(0, 10);
    const key = makePersonalKey(dayIsoUtc, s.startTime, s.endTime);
    const stored = (personalStatusMap?.[key] as WorkspaceSessionStatus) || 'planned';
    if (stored === 'planned' && isSessionPast(s)) return 'missed';
    return stored;
  };

  const requireEditable = (): boolean => {
    if (!readOnly) return true;
    toast.error('Only workspace admins can edit this timetable');
    return false;
  };

  // Colors: default study sessions use a single purple accent for uniqueness.
  // Deadline/assessment sessions use the explicit palette (exam=red, quiz=test=yellow, assignment=green).
  const withCourseColor = (s: Session): Session => {
    const t = String((s as any)?.type || '').toLowerCase();
    const assessmentColor = studyTypes.find((x) => x.value === t)?.color;
    if (t === 'exam' || t === 'test' || t === 'assignment') {
      return { ...s, color: assessmentColor || s.color || TIMETABLE_SESSION_COLOR };
    }
    return { ...s, color: TIMETABLE_SESSION_COLOR };
  };

  // Sessions shown in the timetable grid include both study sessions and
  // injected assessment/deadline items for the current week.
  const allSessions = React.useMemo(() => {
    return [...(sessions || []), ...(assessmentSessions || [])];
  }, [sessions, assessmentSessions]);


  // Load sessions: prefer backend (persists across browsers), fallback to localStorage
  useEffect(() => {
    const loadSessions = () => {
      const weekId = getWeekIdentifier(currentDate);
      const savedSessions = localStorage.getItem(getWeekKey(weekId));

      // Fetch assessments that fall within the current UTC week and inject them as
      // read-only timetable items (exam/test/assignment colors) so they appear in
      // My Timetable without having to duplicate them as study sessions.
      const hydrateAssessmentsForWeek = async () => {
        if (disableBackend || !API_BASE_URL || !currentUserId) {
          setAssessmentSessions([]);
          return;
        }

        try {
          const weekStartUtc = getWeekStartUtc(currentDate);
          const weekEndUtc = new Date(weekStartUtc.getTime() + 7 * 24 * 60 * 60 * 1000);

          const res = await fetch(
            `${API_BASE_URL}/assessments?user_id=${encodeURIComponent(currentUserId)}&include_completed=true&include_past=true`,
            {
              headers: backendHeaders ? backendHeaders(currentUserId) : { 'X-User-Id': currentUserId },
            }
          );
          if (!res.ok) {
            setAssessmentSessions([]);
            return;
          }
          const data = await res.json();
          const list = Array.isArray(data?.assessments) ? data.assessments : [];

          const toType = (k: string): Session['type'] => {
            const kk = String(k || '').toLowerCase();
            if (kk === 'exam') return 'exam';
            if (kk === 'quiz') return 'test';
            if (kk === 'test') return 'test';
            if (kk === 'assignment') return 'assignment';
            // Treat projects like assignments for coloring.
            if (kk === 'project') return 'assignment';
            return 'assignment';
          };

          const durationMinutesFor = (t: Session['type']) => {
            if (t === 'exam') return 60;
            if (t === 'test') return 30;
            return 30;
          };

          const injected: Session[] = [];
          for (const a of list) {
            // Skip completed ones in the past (but keep future completed if user wants)
            const due = new Date(a?.dueDate);
            if (Number.isNaN(due.getTime())) continue;
            // Compare in UTC to match week navigation
            if (due.getTime() < weekStartUtc.getTime() || due.getTime() >= weekEndUtc.getTime()) continue;

            const type = toType(a?.type);
            const mins = durationMinutesFor(type);

            // Day index uses local week start (Monday=0) for grid positioning.
            const weekStartLocal = getWeekStartLocal(currentDate);
            const diffDays = Math.floor((new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime() - weekStartLocal.getTime()) / (24 * 60 * 60 * 1000));
            const dayIdx = Math.min(6, Math.max(0, diffDays));

            const startTime = toHHMM(due);
            const end = new Date(due.getTime() + mins * 60 * 1000);
            const endTime = toHHMM(end);

            injected.push(
              withCourseColor({
                id: `assessment:${String(a?.id ?? '')}`,
                subject: String(a?.subject || '').trim() || 'Assessment',
                startTime,
                endTime,
                day: dayIdx,
                type,
                color: studyTypes.find((x) => x.value === type)?.color || '#DC2626',
                deadline: String(a?.dueDate || ''),
              })
            );
          }

          setAssessmentSessions(injected);
        } catch (e) {
          setAssessmentSessions([]);
        }
      };

      const hydrateFromLocal = () => {
        if (savedSessions) {
          try {
            const parsed = JSON.parse(savedSessions);
            setSessions(Array.isArray(parsed) ? parsed.map(withCourseColor) : []);
            return;
          } catch (e) {
            // fallthrough
          }
        }
        setSessions([]);
      };

      const hydrateFromBackend = async () => {
        if (disableBackend || !API_BASE_URL || !currentUserId) {
          hydrateFromLocal();
          isHydratingRef.current = false;
          return;
        }
        try {
          const path = backendPaths?.get
            ? backendPaths.get(weekId)
            : `/timetable/user/${encodeURIComponent(currentUserId)}/sessions?week_id=${encodeURIComponent(weekId)}`;
          const headers = backendHeaders ? backendHeaders(currentUserId) : { 'X-User-Id': currentUserId };
          const res = await fetch(`${API_BASE_URL}${path}`, { headers });
          if (!res.ok) {
            hydrateFromLocal();
            isHydratingRef.current = false;
            return;
          }
          const data = await res.json();

          // If backend has no sessions but we have a locally saved timetable for
          // this week, prefer local and sync it back once.
          if ((Array.isArray(data) ? data.length : 0) === 0 && savedSessions) {
            try {
              const parsed = JSON.parse(savedSessions);
              if (Array.isArray(parsed) && parsed.length > 0) {
                shouldSyncRef.current = true;
                setSessions(Array.isArray(parsed) ? parsed.map(withCourseColor) : []);
                return;
              }
            } catch (e) {
              // ignore and continue with backend data
            }
          }

          // Backend returns minimal sessions (no type/color). Fill defaults.
          const makeId = () => (typeof crypto !== 'undefined' && (crypto as any).randomUUID)
            ? (crypto as any).randomUUID()
            : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
          const hydrated: Session[] = (Array.isArray(data) ? data : []).map((s: any) => ({
            id: String(s.id || makeId()),
            subject: String(s.subject || ''),
            startTime: String(s.startTime || '08:00'),
            endTime: String(s.endTime || '09:00'),
            day: Number(s.day ?? 0),
            type: (s.type as any) || 'lecture',
            color: String(s.color || '#6366F1'),
            deadline: s.deadline ? String(s.deadline) : undefined,
          }));
          setSessions(hydrated.map(withCourseColor));
        } catch (e) {
          hydrateFromLocal();
        } finally {
          isHydratingRef.current = false;
        }
      };

      hydrateFromBackend();
      hydrateAssessmentsForWeek();
      
      // Load export status for this week
      const exportKey = `${getWeekKey(weekId)}_exported`;
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

    // Start hydration
    isHydratingRef.current = true;
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
    window.addEventListener(storageEventName, handleSessionsUpdated);

    return () => {
      window.removeEventListener('userChanged', handleUserChanged);
      window.removeEventListener(storageEventName, handleSessionsUpdated);
    };
  }, [currentDate, storageEventName]);

  // Save sessions to localStorage + backend whenever they change
  useEffect(() => {
    const weekId = getWeekIdentifier(currentDate);
    localStorage.setItem(getWeekKey(weekId), JSON.stringify(sessions));
    onSaveTimetable?.(sessions);

    // Debounced backend persistence so drag/drop doesn't spam requests.
    // IMPORTANT: only persist when the user has edited sessions OR when we
    // need to sync a locally-saved timetable into an empty backend.
    if (isHydratingRef.current) return;
    if (disableBackend) return;
    if (!API_BASE_URL || !currentUserId) return;
    if (!userEditedRef.current && !shouldSyncRef.current) return;

    if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
    saveDebounceRef.current = setTimeout(async () => {
      try {
        const minimal = sessions.map(s => ({
          id: s.id,
          subject: s.subject,
          startTime: s.startTime,
          endTime: s.endTime,
          day: s.day,
          type: s.type,
          color: s.color,
          deadline: s.deadline,
        }));
        const path = backendPaths?.put
          ? backendPaths.put(weekId)
          : `/timetable/user/${encodeURIComponent(currentUserId)}/sessions?week_id=${encodeURIComponent(weekId)}`;
        const headers = backendHeaders
          ? { 'Content-Type': 'application/json', ...backendHeaders(currentUserId) }
          : { 'Content-Type': 'application/json', 'X-User-Id': currentUserId };
        await fetch(`${API_BASE_URL}${path}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(minimal),
        });
        // reset flags after a successful persist
        userEditedRef.current = false;
        shouldSyncRef.current = false;
      } catch (e) {
        // Keep quiet; local storage remains a fallback
        console.warn('[CalendarView] Failed to persist sessions to backend', e);
      }
    }, 500);
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
    if (!requireEditable()) return;
    setSelectedSlot({ day, time });
    setEditingSession(null);
    setIsDialogOpen(true);
  };

  const handleEditSession = (session: Session) => {
    if (!requireEditable()) return;
    if (String(session.id || '').startsWith('assessment:')) {
      toast.info('Edit this from Assessments & Deadlines');
      return;
    }
    setEditingSession(session);
    setIsDialogOpen(true);
  };

  const handleSaveSession = (sessionData: Omit<Session, 'id'>) => {
    if (!requireEditable()) return;

    const normalizedData: Omit<Session, 'id'> = {
      ...sessionData,
      color: TIMETABLE_SESSION_COLOR,
    };
    // Check for time conflicts and find conflicting session
    let conflictingSession: Session | null = null;
    
    const hasConflict = allSessions.some(existingSession => {
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
        duration: 2500, // Stays until dismissed
        action: {
          label: 'Dismiss',
          onClick: () => {},
        },
      });
      
      return;
    }

    if (editingSession) {
      // Update existing session
      userEditedRef.current = true;
      setSessions(sessions.map(s => s.id === editingSession.id ? { ...normalizedData, id: s.id } : s));
      const hasDeadline = normalizedData.deadline && (normalizedData.type === 'assignment' || normalizedData.type === 'test' || normalizedData.type === 'exam');
      toast.success(hasDeadline ? '✅ Session & deadline updated!' : '✅ Session updated successfully');
    } else {
      // Add new session
      const newSession: Session = {
        ...normalizedData,
        id: Date.now().toString(),
      };
      userEditedRef.current = true;
      setSessions([...sessions, newSession]);
      const hasDeadline = normalizedData.deadline && (normalizedData.type === 'assignment' || normalizedData.type === 'test' || normalizedData.type === 'exam');
      toast.success(hasDeadline ? '✅ Session added with deadline!' : '✅ Session added successfully');
    }
    setIsDialogOpen(false);
    setSelectedSlot(null);
    setEditingSession(null);
  };

  const handleDeleteSession = (id: string) => {
    if (!requireEditable()) return;
    if (String(id || '').startsWith('assessment:')) {
      toast.info('Delete this from Assessments & Deadlines');
      return;
    }
    userEditedRef.current = true;
    setSessions(sessions.filter(s => s.id !== id));
    toast.success('Session deleted successfully');
  };

  const handleClearAll = () => {
    if (!requireEditable()) return;
    setConfirmDialog({
      isOpen: true,
      title: 'Clear All Sessions',
      message: 'Are you sure you want to clear all sessions for this week?',
      onConfirm: () => {
        userEditedRef.current = true;
        setSessions([]);
        const weekId = getWeekIdentifier(currentDate);
        localStorage.removeItem(getWeekKey(weekId));
        toast.success('✅ Done! All sessions have been cleared successfully.');
      },
      confirmText: 'Clear All',
      confirmVariant: 'destructive',
    });
  };

  const handleRecurse = () => {
    if (!requireEditable()) return;
    if (sessions.length === 0) {
      toast.error('⚠️ Empty Timetable', {
        description: 'Your timetable is empty. Please add some sessions before copying to the next week.',
        duration: 2500,
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
        localStorage.setItem(getWeekKey(nextWeekId), JSON.stringify(copiedSessions));
        
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
    const weekId = getWeekIdentifier(currentDate);
    const target = calendarExportRef.current;
    if (!target) {
      toast.error('Unable to export: calendar view not found');
      return;
    }

    try {
      const { jsPDF } = await import('jspdf');
      const { toPng } = await import('html-to-image');

      // Create a landscape PDF to better match the calendar layout.
      const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Render the calendar container to a PNG.
      const dataUrl = await toPng(target, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#FFFFFF',
      });

      // Get rendered image dimensions
      const img = new Image();
      img.src = dataUrl;
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Image load failed'));
      });

      const imgWidth = img.naturalWidth || img.width;
      const imgHeight = img.naturalHeight || img.height;

      // Fit image to PDF page while keeping aspect ratio
      const scale = Math.min(pageWidth / imgWidth, pageHeight / imgHeight);
      const renderWidth = imgWidth * scale;
      const renderHeight = imgHeight * scale;

      // Multi-page support if the calendar is too tall.
      let y = 0;
      let remaining = renderHeight;
      const xOffset = (pageWidth - renderWidth) / 2;

      // Add the image in slices (jsPDF uses top-left origin)
      while (remaining > 0) {
        doc.addImage(
          dataUrl,
          'PNG',
          xOffset,
          -y,
          renderWidth,
          renderHeight
        );
        remaining -= pageHeight;
        y += pageHeight;
        if (remaining > 0) doc.addPage();
      }

      doc.save(`timetable_${weekId}.pdf`);
      toast.success('Timetable exported as PDF');
    } catch (err: any) {
      toast.error('PDF export failed', { description: err?.message || 'Unknown error' });
    }
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

  const exportToGoogleCalendar = async () => {
    try {
      if (!API_BASE_URL) {
        toast.error('Backend URL not configured (VITE_API_BASE_URL)');
        return;
      }
      if (!sessions.length) {
        toast.info('No sessions to export');
        return;
      }

      const userId = localStorage.getItem('currentUserId');
      if (!userId) {
        toast.error('You are not logged in');
        return;
      }

      const weekStart = (() => {
        const d = new Date(currentDate);
        // Monday as week start
        const monday = new Date(d);
        const day = d.getDay(); // 0=Sun..6=Sat
        const diff = (day === 0 ? -6 : 1) - day;
        monday.setDate(d.getDate() + diff);
        monday.setHours(0, 0, 0, 0);
        return monday.toISOString().slice(0, 10);
      })();

      // 1) Check if the user has linked Google Calendar
      const statusRes = await fetch(`${API_BASE_URL}/calendar/google/status/${userId}`);
      if (!statusRes.ok) {
        toast.error('Could not check Google Calendar status');
        return;
      }
      const status = await statusRes.json();

      // 2) If not linked, start OAuth. Google will NOT prompt again if the
      //    user is already signed in.
      if (!status.linked) {
        toast.info('Connect Google Calendar to export...');
        window.location.href = `${API_BASE_URL}/auth?user_id=${userId}`;
        return;
      }

      // 3) Ask whether to overwrite if we already have an export calendar.
      let overwrite = false;
      if (status.has_previous_export) {
        overwrite = window.confirm(
          'You already exported a timetable to Google Calendar.\n\nOK = Overwrite (replace previous export)\nCancel = Add on top (keep previous export)'
        );
      }

      // 4) Export directly to Google Calendar via backend
      toast.info('Exporting to Google Calendar...');
      const res = await fetch(`${API_BASE_URL}/calendar/google/export/${userId}?overwrite=${overwrite ? 'true' : 'false'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          week_start: weekStart,
          sessions: sessions.map(s => ({
            subject: s.subject,
            day: s.day,
            startTime: s.startTime,
            endTime: s.endTime,
            description: `SmartStudy session: ${s.type || 'session'}`,
          })),
        }),
      });

      if (res.status === 401) {
        // Link likely missing/expired; restart OAuth
        toast.info('Reconnecting Google Calendar...');
        window.location.href = `${API_BASE_URL}/auth?user_id=${userId}`;
        return;
      }
      if (!res.ok) {
        const msg = await res.text();
        toast.error(`Export failed: ${msg || res.statusText}`);
        return;
      }

      const data = await res.json();
      const weekId = getWeekIdentifier(currentDate);
      localStorage.setItem(`${getWeekKey(weekId)}_exported`, 'true');
      setHasExportedThisWeek(true);
      toast.success(`Exported ${data.exported_events} session(s) to Google Calendar`);
      if (data.calendar_url) {
        // Open the calendar in a new tab
        window.open(data.calendar_url, '_blank');
      }
      return;
    } catch (e) {
      console.error(e);
      toast.error('Export failed');
    }
  };

  const handleImport = (importedSessions: Session[], importedAvailabilitySettings?: any) => {
    if (!requireEditable()) return;
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
        duration: 2500,
      });
      return;
    }

    // Add imported sessions to existing sessions
    const newSessions = [...sessions, ...importedSessions].map(withCourseColor);
    userEditedRef.current = true;
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
    if (!requireEditable()) return;
    if (String(sessionId || '').startsWith('assessment:')) return;
    setDraggingSession(sessionId);
  };

  const handleDragOver = (e: React.DragEvent, day: number, time: string) => {
    if (readOnly) return;
    e.preventDefault();
    setDragOverSlot({ day, time });
  };

  const handleDrop = (e: React.DragEvent, day: number, time: string) => {
    e.preventDefault();
    if (!requireEditable()) return;
    
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
        duration: 2500, // Auto-dismiss after 10 seconds
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
    userEditedRef.current = true;
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

  const workspaceStatusCounts = workspaceStatus ? sessions.reduce(
    (acc, s) => {
      const st = getEffectiveWorkspaceStatus(s);
      acc[st] = (acc[st] || 0) + 1;
      return acc;
    },
    { planned: 0, completed: 0, missed: 0, skipped: 0 } as Record<WorkspaceSessionStatus, number>
  ) : null;

  const statusBadgeClass = (st: WorkspaceSessionStatus) => {
    switch (st) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'missed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'skipped':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div data-tour="my-timetable-main" className="h-full flex flex-col bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <div data-tour="my-timetable-header" className="border-b border-gray-200 bg-white/90 backdrop-blur-sm shadow-sm">
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
                  <h1 data-tour="my-timetable-title" className="text-xl sm:text-2xl text-gray-800 dark:text-gray-100">Study Timetable</h1>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Plan and organize your study sessions • Each week has its own schedule
                </p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {allSessions.filter(s => s.deadline && (s.type === 'assignment' || s.type === 'test' || s.type === 'exam')).length > 0 && (
                    <Badge variant="outline" className="text-xs border-red-600 text-red-600 bg-red-50 dark:border-red-400 dark:text-red-400 dark:bg-red-950/30">
                      📅 {allSessions.filter(s => s.deadline && (s.type === 'assignment' || s.type === 'test' || s.type === 'exam')).length} Deadline{allSessions.filter(s => s.deadline && (s.type === 'assignment' || s.type === 'test' || s.type === 'exam')).length > 1 ? 's' : ''}
                    </Badge>
                  )}

                  {workspaceStatusCounts && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className={`text-xs ${statusBadgeClass('completed')}`}>✅ {workspaceStatusCounts.completed} completed</Badge>
                      <Badge variant="outline" className={`text-xs ${statusBadgeClass('missed')}`}>⚠️ {workspaceStatusCounts.missed} missed</Badge>
                      <Badge variant="outline" className={`text-xs ${statusBadgeClass('skipped')}`}>⏭️ {workspaceStatusCounts.skipped} skipped</Badge>
                      <Badge variant="outline" className={`text-xs ${statusBadgeClass('planned')}`}>🗓️ {workspaceStatusCounts.planned} planned</Badge>
                      {isStatusLoading && (
                        <Badge variant="outline" className="text-xs bg-gray-50 text-gray-600 border-gray-200">Loading…</Badge>
                      )}
                    </div>
                  )}

                  {!workspaceStatus && showStatusBadges && isPersonalStatusLoading && (
                    <Badge variant="outline" className="text-xs bg-gray-50 text-gray-600 border-gray-200">Loading statuses…</Badge>
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

                {/* Auto Generate Button (opens the hidden AI generation section) */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="default" 
                      size="sm"
                      onClick={() => {
                        if (onNavigate) {
                          onNavigate('auto-generate');
                        } else {
                          toast.error('Navigation is not available');
                        }
                      }}
                      className="bg-blue-600 hover:bg-blue-800 dark:hover:bg-blue-800"
                    >
                      <Sparkles className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Auto Generate</p>
                  </TooltipContent>
                </Tooltip>

                {/* Import Timetable Button (optional) */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => {
                        // Non-admin users should use the Auto Generate flow for importing.
                        if (!isGlobalAdmin) {
                          try {
                            localStorage.setItem('autoGenerateOpenUpload', 'true');
                          } catch {
                            // ignore
                          }
                          if (onNavigate) onNavigate('auto-generate');
                          toast.info('Import is done from Auto Generate for non-admin users.');
                          return;
                        }

                        // Admin users choose import target.
                        setIsImportTargetDialogOpen(true);
                      }}
                      className="bg-blue-600 hover:bg-blue-800 dark:hover:bg-blue-800"
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Import</p>
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
            onClick={() => {
              const next = !headerCollapsed;
              setHeaderCollapsed(next);
              onOuterCollapseChange?.(next);
            }}
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

      

      {/* Calendar Grid - Simple Table Structure */}
      <div className="flex-1 overflow-auto">
        <div className="relative">
          {/* Tour target: spotlight a portion of the timetable grid (not the full table) */}
          {/*
            Tour target: highlight the *top portion* of the timetable grid (week range + day headers + first rows).
            This ensures users can actually SEE the timetable while leaving room for the tooltip below.
          */}
          <div
            data-tour="my-timetable-preview"
            aria-hidden
            className="absolute left-0 top-0 h-[260px] w-full rounded-2xl"
            style={{ opacity: 0, pointerEvents: 'none' }}
          />
          <div ref={calendarExportRef} className="min-w-[900px]">
          {/*
            Use a fixed table layout so each day column has equal width.
            Without table-fixed, HTML tables size each column based on its
            widest cell content, which can make one day (often Wednesday)
            appear wider than the rest.
          */}
          <table className="w-full border-collapse table-fixed">
            {/*
              Force truly equal day column widths.
              Even with `table-fixed`, browsers can distribute leftover fractional pixels unevenly,
              which can make one day (often mid-week) appear slightly wider.
              A colgroup with explicit widths prevents that.
            */}
            <colgroup>
              <col style={{ width: '4rem' }} />
              {Array.from({ length: 7 }).map((_, i) => (
                <col key={i} style={{ width: 'calc((100% - 4rem) / 7)' }} />
              ))}
            </colgroup>
            <thead className="sticky top-0 z-20 bg-blue-50 shadow-md">
              <tr>
                {/* Slightly narrower time column for more space in the timetable grid */}
                <th className="sticky left-0 z-30 border border-gray-300 px-2 py-3 text-left w-16 bg-blue-50">
                  <div className="text-sm font-semibold text-gray-700">Time</div>
                </th>
                {days.map((day, index) => {
                  const date = weekDates[index];
                  const isToday = date.toDateString() === new Date().toDateString();
                  
                  return (
                    <th 
                      key={day} 
                      className={`border border-gray-300 px-3 py-3 text-center ${
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
                  <td className="sticky left-0 z-10 border border-gray-300 px-2 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-50/50 dark:bg-gray-800/50 w-16">
                    {time}
                  </td>
                  {days.map((day, dayIndex) => {
                    const date = weekDates[dayIndex];
                    const isToday = date.toDateString() === new Date().toDateString();
                    
                    // Find sessions that START in this time slot
                    const sessionsInSlot = allSessions.filter(
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
                          
                          
                        })
                        }                        
                        
                        {/* Sessions in this slot */}
                        {sessionsInSlot.map((session) => {
                          const height = calculateSessionHeight(session);
                          const isPast = isSessionPast(session);
                          const uiStatus: WorkspaceSessionStatus | null = workspaceStatus
                            ? getEffectiveWorkspaceStatus(session)
                            : (showStatusBadges ? getEffectivePersonalStatus(session) : null);
                          const shouldShowBadge = !!workspaceStatus || (uiStatus !== 'planned' || isPast);
                          // Keep this tiny to avoid covering the session title.
                          const statusLabel = (s: WorkspaceSessionStatus) => {
                            switch (s) {
                              case 'completed': return '✅';
                              case 'missed': return '⚠️';
                              case 'skipped': return '⏭️';
                              default: return '🗓️';
                            }
                          };
                          // Place the badge bottom-right so it never blocks the title/time.
                          
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
                                top: `${offsetPixels}px`,
                                // Past sessions should still keep a hint of the original color.
                                filter: isPast ? 'saturate(0.9) opacity(0.85)' : undefined,
                              }}
                              className="mb-1 absolute left-0 right-0 z-10 px-2 pt-2 group"
                            >
                              {uiStatus && shouldShowBadge && (
                                <div className="absolute bottom-2 right-2 z-20 pointer-events-none">
                                  <Badge
                                    variant="outline"
                                    className={`text-[10px] px-1 py-0 leading-none ${statusBadgeClass(uiStatus)} whitespace-nowrap`}
                                    title={uiStatus}
                                  >
                                    {statusLabel(uiStatus)}
                                  </Badge>
                                </div>
                              )}

                              {workspaceStatus && workspaceStatus.canEdit && !isPast && (
                                <div className="absolute top-2 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="outline" size="sm" className="h-6 px-2 py-0 text-xs bg-white/90">
                                        <ChevronDown className="h-3 w-3" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => setWorkspaceSessionStatus(session.id, 'completed')}>✅ Mark completed</DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => setWorkspaceSessionStatus(session.id, 'missed')}>⚠️ Mark missed</DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => setWorkspaceSessionStatus(session.id, 'skipped')}>⏭️ Mark skipped</DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => setWorkspaceSessionStatus(session.id, 'planned')}>🗓️ Reset to planned</DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              )}
                              <SessionCard
                                session={session}
                                onEdit={handleEditSession}
                                onDelete={handleDeleteSession}
                                onDragStart={() => handleDragStart(session.id)}
                                isDragging={draggingSession === session.id}
                                dimmed={isPast && (workspaceStatus != null || showStatusBadges)}
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

      {/* Import Target Dialog (Admin only) */}
      <Dialog open={isImportTargetDialogOpen} onOpenChange={setIsImportTargetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import timetable</DialogTitle>
            <DialogDescription>
              Where are you importing to?
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
            <Button
              className="bg-blue-600 hover:bg-blue-800"
              onClick={() => {
                setIsImportTargetDialogOpen(false);
                setIsImportDialogOpen(true);
              }}
            >
              My Timetable
            </Button>

            <Button
              className="bg-blue-600 hover:bg-blue-800"
              onClick={() => {
                setIsImportTargetDialogOpen(false);
                try {
                  localStorage.setItem('workspaceInitialTab', 'auto-generate');
                  localStorage.setItem('workspaceAutoGenerateOpenUpload', 'true');
                } catch {
                  // ignore
                }
                if (onNavigate) onNavigate('workspace');
                toast.info('Select the workspace, then upload/import in Workspace Auto Generate.');
              }}
            >
              Workspace
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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