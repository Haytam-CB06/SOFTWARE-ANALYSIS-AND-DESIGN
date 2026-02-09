import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Checkbox } from './ui/checkbox';
import { ArrowLeft, Brain, Pencil, Plus, Save, Shuffle, Sparkles, Trash2, Upload } from 'lucide-react';
import { getWeekIdentifier } from '../src/utils/dateUtils';
import { getUserWeekKey } from '../utils/userStorage';

type Priority = 'low' | 'medium' | 'high';
type AssessmentType = 'assignment' | 'exam' | 'quiz' | 'project';

interface AutoGenerateTimetableProps {
  onNavigate?: (page: string) => void;
  /** Force scope to avoid clashes between workspace vs personal auto-generate inputs */
  scope?: 'user' | 'workspace';
  /** Workspace id for workspace scope (when not using localStorage context) */
  workspaceId?: string;
  /** If true, render as an embedded panel (no big header/back navigation) */
  embedded?: boolean;
  /** Callback after workspace generation completes (eg, switch tab back to timetable) */
  onWorkspaceDone?: () => void;
}

interface BusyRow {
  id: string;
  title: string;
  day: number; // 0=Mon..6=Sun
  startTime: string;
  endTime: string;
}

interface CourseRow {
  id: string;
  title: string;
  days: number[]; // 0=Mon..6=Sun
  startTime: string;
  endTime: string;
  priority: Priority;
}

const days = [
  { id: 0, label: 'Mon' },
  { id: 1, label: 'Tue' },
  { id: 2, label: 'Wed' },
  { id: 3, label: 'Thu' },
  { id: 4, label: 'Fri' },
  { id: 5, label: 'Sat' },
  { id: 6, label: 'Sun' },
];

const uid = () => Math.random().toString(36).slice(2, 10);

const fmtDays = (ds: number[]) =>
  ds
    .slice()
    .sort((a, b) => a - b)
    .map((d) => days.find((x) => x.id === d)?.label || '')
    .filter(Boolean)
    .join(', ');

export default function AutoGenerateTimetable({ onNavigate, scope, workspaceId: workspaceIdProp, embedded, onWorkspaceDone }: AutoGenerateTimetableProps) {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const userId = localStorage.getItem('currentUserId') || '';

  // Backward compatible context (older flow used localStorage), but props take priority.
  const autoGenContext = useMemo(() => {
    try {
      const raw = localStorage.getItem('autoGenerateContext');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const resolvedScope: 'user' | 'workspace' = scope || (autoGenContext?.scope === 'workspace' ? 'workspace' : 'user');
  const isWorkspaceContext = resolvedScope === 'workspace' && !!(workspaceIdProp || autoGenContext?.workspaceId);
  const workspaceId = isWorkspaceContext ? String(workspaceIdProp || autoGenContext?.workspaceId || '') : '';

  const today = useMemo(() => new Date(), []);
  const weekId = useMemo(() => getWeekIdentifier(today), [today]);
  const targetWeekKey = useMemo(() => {
    return isWorkspaceContext
      ? `workspace_${workspaceId}_calendarSessions_${weekId}`
      : getUserWeekKey(weekId);
  }, [isWorkspaceContext, workspaceId, weekId]);
  const targetStorageEventName = useMemo(() => {
    return isWorkspaceContext
      ? `workspaceCalendarSessionsUpdated_${workspaceId}`
      : 'calendarSessionsUpdated';
  }, [isWorkspaceContext, workspaceId]);

  const uploadSectionRef = useRef<HTMLDivElement | null>(null);

  // If another page redirects here for importing, scroll to the upload section.
  useEffect(() => {
    const flagKey = resolvedScope === 'workspace' ? 'workspaceAutoGenerateOpenUpload' : 'autoGenerateOpenUpload';
    try {
      if (localStorage.getItem(flagKey) === 'true') {
        localStorage.removeItem(flagKey);
        // Small delay to allow layout to render.
        setTimeout(() => {
          uploadSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
      }
    } catch {
      // ignore
    }
  }, [resolvedScope]);

  // Study window
  const [weekdayStart, setWeekdayStart] = useState('08:00');
  const [weekdayEnd, setWeekdayEnd] = useState('19:00');
  const [includeWeekends, setIncludeWeekends] = useState(false);
  const [weekendSame, setWeekendSame] = useState(true);
  const [weekendStart, setWeekendStart] = useState('08:00');
  const [weekendEnd, setWeekendEnd] = useState('19:00');

  // Break preference between consecutive generated study sessions
  const [breakMinutes, setBreakMinutes] = useState<number>(() => {
    try {
      const raw = localStorage.getItem('autoGenBreakMinutes');
      const n = raw ? parseInt(raw, 10) : 10;
      if (!Number.isFinite(n)) return 10;
      return Math.max(0, Math.min(180, n));
    } catch {
      return 10;
    }
  });

  useEffect(() => {
    try {
      if (!isWorkspaceContext) {
        localStorage.setItem('autoGenBreakMinutes', String(breakMinutes));
      }
    } catch {
      // ignore
    }
  }, [breakMinutes, isWorkspaceContext]);

  // RNG seed support (optional). If set, the same inputs + seed reproduce the same timetable.
  const [seed, setSeed] = useState<string>(() => {
    try {
      return localStorage.getItem('autoGenSeed') || '';
    } catch {
      return '';
    }
  });

  useEffect(() => {
    try {
      if (!isWorkspaceContext) {
        localStorage.setItem('autoGenSeed', seed);
      }
    } catch {
      // ignore
    }
  }, [seed, isWorkspaceContext]);

  // Course schedule
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [courseMode, setCourseMode] = useState<'none' | 'fill' | 'upload'>('none');
  const [courseDraft, setCourseDraft] = useState<CourseRow>({
    id: uid(),
    title: '',
    days: [0],
    startTime: '09:00',
    endTime: '10:00',
    priority: 'medium',
  });
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);

  // Busy time
  const [busy, setBusy] = useState<BusyRow[]>([]);
  const [busyComposerOpen, setBusyComposerOpen] = useState(false);
  const [busyDraft, setBusyDraft] = useState<BusyRow>({
    id: uid(),
    title: 'Busy time',
    day: 0,
    startTime: '12:00',
    endTime: '13:00',
  });
  const [editingBusyId, setEditingBusyId] = useState<string | null>(null);


  // Calendar merging options
  const [treatExistingWeekAsBusy, setTreatExistingWeekAsBusy] = useState(true);
  const [replaceStudySessions, setReplaceStudySessions] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const [weekSessions, setWeekSessions] = useState<any[]>(() => {
    try {
      const raw = localStorage.getItem(targetWeekKey);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  // Assessments & deadlines are important busy time.
  // They must be treated as *busy* so auto-generate never creates overlapping sessions.
  const [assessments, setAssessments] = useState<any[]>([]);

  const getWeekStartMonday = (d: Date) => {
    const dd = new Date(d);
    dd.setHours(0, 0, 0, 0);
    // Convert JS day (Sun=0..Sat=6) -> Mon=0..Sun=6
    const monIdx = (dd.getDay() + 6) % 7;
    dd.setDate(dd.getDate() - monIdx);
    return dd;
  };

  const pad2 = (n: number) => String(n).padStart(2, '0');

  const assessmentsBusyBlocks = useMemo(() => {
    if (!Array.isArray(assessments) || assessments.length === 0) return [];

    const weekStart = getWeekStartMonday(today);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    return assessments
      .filter((a: any) => {
        const due = new Date(a?.dueDate || a?.due_at || a?.due_at_iso || '');
        if (Number.isNaN(due.getTime())) return false;
        return due >= weekStart && due < weekEnd;
      })
      .map((a: any) => {
        const due = new Date(a?.dueDate || a?.due_at || a?.due_at_iso);
        // Default: block 60 minutes for an assessment/deadline if no estimate is set.
        const estHours = Number(a?.estimateHours ?? a?.estimate_hours ?? 0);
        const durationMins = Number.isFinite(estHours) && estHours > 0 ? Math.round(estHours * 60) : 60;
        const end = new Date(due);
        end.setMinutes(end.getMinutes() + durationMins);

        const day = (due.getDay() + 6) % 7;
        const startTime = `${pad2(due.getHours())}:${pad2(due.getMinutes())}`;
        const endTime = `${pad2(end.getHours())}:${pad2(end.getMinutes())}`;

        return {
          title: `${a?.subject || ''} ${String(a?.type || a?.kind || 'deadline').toUpperCase()}`.trim() || 'Deadline',
          day,
          startTime,
          endTime,
        };
      });
  }, [assessments, today]);

  const existingWeekBusyBlocks = useMemo(() => {
    if (!treatExistingWeekAsBusy) return [];
    return weekSessions
      // If the user chooses "Replace existing study sessions", those study sessions
      // should NOT be treated as busy time during generation, otherwise the generator
      // sees no free time and returns "No free time available".
      .filter((s: any) => {
        if (!s || typeof s.day !== 'number' || !s.startTime || !s.endTime) return false;
        if (!replaceStudySessions) return true;
        return !['reading', 'revision', 'practice'].includes(String(s.type || '').toLowerCase());
      })
      .map((s: any) => ({
        title: s.subject || 'Busy',
        day: s.day,
        startTime: s.startTime,
        endTime: s.endTime,
      }));
  }, [weekSessions, treatExistingWeekAsBusy, replaceStudySessions]);

  const fetchJson = async (url: string) => {
    const res = await fetch(url, { headers: { 'X-User-Id': userId } });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  };

  const putJson = async (url: string, body: any) => {
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  };

  // Load assessments so they can be treated as busy time during auto-generation.
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!userId || isWorkspaceContext) return;
        const a = await fetchJson(
          `${API_BASE_URL}/assessments?user_id=${encodeURIComponent(userId)}&include_completed=false&include_past=false`
        );
        const rows = Array.isArray(a?.assessments) ? a.assessments : [];
        if (mounted) setAssessments(rows);
      } catch {
        // best effort
      }
    })();
    return () => {
      mounted = false;
    };
  }, [API_BASE_URL, userId, isWorkspaceContext]);




  useEffect(() => {
    if (!API_BASE_URL || !userId) return;

    (async () => {
      if (isWorkspaceContext && workspaceId) {
        // Workspace-shared inputs (admins can coordinate) — stored in backend.
        try {
          const res = await fetchJson(`${API_BASE_URL}/workspaces/${encodeURIComponent(workspaceId)}/auto-generate-config`);
          const cfg = res?.config || {};
          const win = cfg.study_window;
          if (win) {
            setWeekdayStart(win.weekdayStart || '08:00');
            setWeekdayEnd(win.weekdayEnd || '19:00');
            setIncludeWeekends(!!win.includeWeekends);
            setWeekendSame(!!win.weekendSameAsWeekday);
            setWeekendStart(win.weekendStart || '08:00');
            setWeekendEnd(win.weekendEnd || '19:00');
          }
          const csRows = Array.isArray(cfg.class_schedule) ? cfg.class_schedule : [];
          if (csRows.length) {
            setCourses(
              csRows.map((c: any) => ({
                id: c.id || uid(),
                title: c.title || '',
                days: Array.isArray(c.days) ? c.days : [0],
                startTime: c.startTime || '09:00',
                endTime: c.endTime || '10:00',
                priority: c.priority || 'medium',
              }))
            );
          }
          const blocks = Array.isArray(cfg.busy_blocks) ? cfg.busy_blocks : [];
          if (blocks.length) {
            setBusy(
              blocks.map((x: any) => ({
                id: x.id || uid(),
                title: x.title || 'Busy time',
                day: typeof x.day === 'number' ? x.day : 0,
                startTime: x.startTime || '12:00',
                endTime: x.endTime || '13:00',
              }))
            );
          }
          if (typeof cfg.break_minutes === 'number') {
            setBreakMinutes(Math.max(0, Math.min(180, cfg.break_minutes)));
          }
          if (typeof cfg.seed === 'string') {
            setSeed(cfg.seed);
          }
        } catch {
          // ignore
        }
      } else {
        // User-personal inputs
        try {
          const w = await fetchJson(`${API_BASE_URL}/auto-generate/study-window?user_id=${userId}`);
          const win = w?.window;
          if (win) {
            setWeekdayStart(win.weekdayStart || '08:00');
            setWeekdayEnd(win.weekdayEnd || '19:00');
            setIncludeWeekends(!!win.includeWeekends);
            setWeekendSame(!!win.weekendSameAsWeekday);
            setWeekendStart(win.weekendStart || '08:00');
            setWeekendEnd(win.weekendEnd || '19:00');
          }
        } catch {
          // ignore
        }

        try {
          const cs = await fetchJson(`${API_BASE_URL}/auto-generate/class-schedule?user_id=${userId}`);
          const rows = Array.isArray(cs?.courses) ? cs.courses : [];
          if (rows.length) setCourses(rows);
        } catch {
          // ignore
        }

        try {
          const b = await fetchJson(`${API_BASE_URL}/auto-generate/busy-blocks?user_id=${userId}`);
          const blocks = Array.isArray(b?.busy_blocks) ? b.busy_blocks : [];
          if (blocks.length) {
            setBusy(
              blocks.map((x: any) => ({
                id: x.id || uid(),
                title: x.title || 'Busy time',
                day: typeof x.day === 'number' ? x.day : 0,
                startTime: x.startTime || '12:00',
                endTime: x.endTime || '13:00',
              }))
            );
          }
        } catch {
          // ignore
        }
      }

      // Load current week's study sessions from backend (user mode only)
      if (!isWorkspaceContext) {
        try {
          const res = await fetch(
            `${API_BASE_URL}/timetable/user/${encodeURIComponent(userId)}/sessions?week_id=${encodeURIComponent(weekId)}`,
            { headers: { 'X-User-Id': userId } }
          );
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) {
              setWeekSessions(data);
              localStorage.setItem(targetWeekKey, JSON.stringify(data));
              window.dispatchEvent(new Event(targetStorageEventName));
            }
          }
        } catch {
          // ignore
        }
      }
    })();
  }, [API_BASE_URL, userId, weekId, targetWeekKey, targetStorageEventName, isWorkspaceContext, workspaceId]);

  const buildWorkspaceConfig = () => {
    return {
      study_window: {
        weekdayStart,
        weekdayEnd,
        includeWeekends,
        weekendSameAsWeekday: weekendSame,
        weekendStart: weekendSame ? null : weekendStart,
        weekendEnd: weekendSame ? null : weekendEnd,
      },
      class_schedule: courses.map((c) => ({
        title: c.title,
        priority: c.priority,
        days: c.days,
        startTime: c.startTime,
        endTime: c.endTime,
      })),
      busy_blocks: busy.map((b) => ({
        title: b.title,
        day: b.day,
        startTime: b.startTime,
        endTime: b.endTime,
      })),
        // Backend expects breakMinutes (camelCase). Using snake_case causes the
        // server to fall back to its default (10 minutes).
        breakMinutes: breakMinutes,
      seed,
    };
  };

  const saveWorkspaceConfig = async (opts?: { successToast?: string; closeCourseMode?: boolean }) => {
    if (!API_BASE_URL || !userId || !isWorkspaceContext || !workspaceId) return;
    try {
      await putJson(`${API_BASE_URL}/workspaces/${encodeURIComponent(workspaceId)}/auto-generate-config`, {
        config: buildWorkspaceConfig(),
      });
      if (opts?.successToast) toast.success(opts.successToast);
      if (opts?.closeCourseMode) setCourseMode('none');
    } catch (e: any) {
      toast.error(`Failed to save workspace auto-generate data: ${e?.message || 'error'}`);
    }
  };

  const saveStudyWindow = async () => {
    if (!API_BASE_URL || !userId) return;
    if (isWorkspaceContext) {
      await saveWorkspaceConfig();
      return;
    }
    try {
      await putJson(`${API_BASE_URL}/auto-generate/study-window`, {
        user_id: userId,
        window: {
          weekdayStart,
          weekdayEnd,
          includeWeekends,
          weekendSameAsWeekday: weekendSame,
          weekendStart: weekendSame ? null : weekendStart,
          weekendEnd: weekendSame ? null : weekendEnd,
        },
      });
    } catch {
      // ignore
    }
  };

  const saveBusyBlocks = async () => {
    if (!API_BASE_URL || !userId) return;
    if (isWorkspaceContext) {
      await saveWorkspaceConfig({ successToast: '✅ Busy time saved to workspace' });
      return;
    }
    try {
      await putJson(`${API_BASE_URL}/auto-generate/busy-blocks`, {
        user_id: userId,
        busy_blocks: busy.map((b) => ({
          title: b.title,
          day: b.day,
          startTime: b.startTime,
          endTime: b.endTime,
        })),
      });
    } catch (e: any) {
      toast.error(`Failed to save busy time: ${e?.message || 'error'}`);
    }
  };

  const saveClassSchedule = async () => {
    if (!API_BASE_URL || !userId) return;
    if (courses.length === 0) {
      toast.error('Add at least one course in your class timetable');
      return;
    }
    if (isWorkspaceContext) {
      await saveWorkspaceConfig({ successToast: '✅ Class timetable saved to workspace', closeCourseMode: true });
      return;
    }
    try {
      await putJson(`${API_BASE_URL}/auto-generate/class-schedule`, {
        user_id: userId,
        courses: courses.map((c) => ({
          title: c.title,
          priority: c.priority,
          days: c.days,
          startTime: c.startTime,
          endTime: c.endTime,
        })),
      });
      toast.success('✅ Class timetable saved');
      setCourseMode('none');
    } catch (e: any) {
      toast.error(`Failed to save class timetable: ${e?.message || 'error'}`);
    }
  };

  const handleUploadTimetable = async (file: File) => {
    if (!API_BASE_URL || !userId) return;
    const isCsv = file.name.toLowerCase().endsWith('.csv') || file.type.includes('csv');
    const isImage = file.type.startsWith('image/');

    if (!isCsv && !isImage) {
      toast.error('Upload a CSV or image file');
      return;
    }

    const form = new FormData();
    form.append('file', file);

    try {
      const endpoint = isCsv ? 'extract-csv' : 'extract-image';
      const res = await fetch(`${API_BASE_URL}/timetable/${endpoint}`, {
        method: 'POST',
        body: form,
        headers: { 'X-User-Id': userId },
      });
      if (!res.ok) {
        const msg = await res.text();
        toast.error(`Upload failed: ${msg}`);
        return;
      }

      const data = await res.json();
      const items: any[] = Array.isArray(data?.items) ? data.items : [];
      if (items.length === 0) {
        toast.error('No classes detected from the uploaded file');
        return;
      }

      // backend items use 0=Sun..6=Sat
      const backendToFrontendDay = (d: number) => ((d - 1 + 7) % 7);

      // Group by title + start + end to allow multi-day selection
      const grouped = new Map<string, CourseRow>();
      for (const it of items) {
        const title = (it.subject_title || it.subjectTitle || it.subject || it.title || '').toString().trim();
        const start = (it.start_time || it.startTime || '').toString().slice(0, 5);
        const end = (it.end_time || it.endTime || '').toString().slice(0, 5);
        const dayBackend = typeof it.day_of_week === 'number' ? it.day_of_week : it.dayOfWeek;
        const day = typeof dayBackend === 'number' ? backendToFrontendDay(dayBackend) : null;
        if (!title || !start || !end || day === null) continue;

        const key = `${title}__${start}__${end}`;
        if (!grouped.has(key)) {
          grouped.set(key, {
            id: uid(),
            title,
            days: [day],
            startTime: start,
            endTime: end,
            priority: 'medium',
          });
        } else {
          const existing = grouped.get(key)!;
          existing.days = Array.from(new Set([...existing.days, day]));
        }
      }

      const imported = Array.from(grouped.values());
      if (imported.length === 0) {
        toast.error('Imported file did not match the expected timetable format');
        return;
      }

      setCourses(imported);
      setCourseMode('upload');
      toast.success(`✅ Imported ${imported.length} timetable row(s). Now set priorities and click Save.`);
    } catch (e) {
      console.error(e);
      toast.error('Upload failed');
    }
  };

  const addCourseFromDraft = () => {
    const title = (courseDraft.title || '').trim();
    if (!title) {
      toast.error('Course name is required');
      return;
    }
    if (!courseDraft.days || courseDraft.days.length === 0) {
      toast.error('Select at least one day');
      return;
    }
    setCourses((prev) => [
      ...prev,
      {
        ...courseDraft,
        id: uid(),
        title,
        days: Array.from(new Set(courseDraft.days)).sort((a, b) => a - b),
      },
    ]);
    setCourseDraft({ id: uid(), title: '', days: [0], startTime: '09:00', endTime: '10:00', priority: 'medium' });
  };

  const removeCourse = (id: string) => setCourses((prev) => prev.filter((c) => c.id !== id));

  const duplicateCourse = (c: CourseRow) => {
    // Users often have the same course on multiple days with different times.
    // We support that by allowing multiple rows with the same course name.
    const copy: CourseRow = {
      ...c,
      id: uid(),
      // Default to a single day so the user can adjust without accidentally duplicating all days.
      days: (c.days && c.days.length ? [c.days[0]] : [0]),
    };
    setCourses((prev) => [...prev, copy]);
    setEditingCourseId(copy.id);
  };

  const addBusyFromDraft = () => {
    const title = (busyDraft.title || '').trim() || 'Busy time';
    setBusy((prev) => [...prev, { ...busyDraft, id: uid(), title }]);
    setBusyDraft({ id: uid(), title: 'Busy time', day: 0, startTime: '12:00', endTime: '13:00' });
  };

  const removeBusy = (id: string) => setBusy((prev) => prev.filter((b) => b.id !== id));

  const handleGenerate = async (opts?: { shuffle?: boolean }) => {
    if (!API_BASE_URL) {
      toast.error('Missing VITE_API_BASE_URL. Configure your frontend env.');
      return;
    }
    if (!userId) {
      toast.error('You are not logged in');
      return;
    }

    if (courses.length === 0) {
      toast.error('Fill or upload your class timetable first');
      return;
    }

    setIsGenerating(true);
    try {
      // Persist user settings (best-effort)
      await Promise.allSettled([saveStudyWindow(), saveBusyBlocks(), saveClassSchedule()]);

      const seedTrim = (seed || '').trim();
      const seedNum = seedTrim ? parseInt(seedTrim, 10) : null;
      const useSeed = Number.isFinite(seedNum as any) && (seedNum as any) >= 0;
      const shuffle = !!opts?.shuffle;

      const courseBusyBlocks = isWorkspaceContext
        ? courses.flatMap((c) =>
            (Array.isArray(c.days) ? c.days : []).map((d) => ({
              title: c.title || 'Class',
              day: d,
              startTime: c.startTime,
              endTime: c.endTime,
            }))
          )
        : [];

      const payload = {
        user_id: userId,
        // In workspace context, class schedule & busy blocks are workspace-shared inputs,
        // so we ignore the user's stored busy blocks/class schedule and pass everything explicitly.
        treat_class_schedule_as_busy: !isWorkspaceContext,
        use_stored_busy_blocks: !isWorkspaceContext,
        // Backend expects breakMinutes (camelCase). If this isn't sent,
        // the server falls back to its default (10).
        breakMinutes: breakMinutes,
        // Controlled randomness:
        // - if seed is provided -> reproducible output
        // - if shuffle true -> ignore seed and generate a new one
        seed: shuffle ? null : useSeed ? seedNum : null,
        shuffle,
        window: {
          weekdayStart,
          weekdayEnd,
          includeWeekends,
          weekendSameAsWeekday: weekendSame,
          weekendStart: weekendSame ? null : weekendStart,
          weekendEnd: weekendSame ? null : weekendEnd,
        },
        busy_blocks: [
          ...existingWeekBusyBlocks,
          // Treat assessments/deadlines in the current week as busy blocks so no overlaps are generated.
          ...assessmentsBusyBlocks,
          ...busy.map((b) => ({ title: b.title, day: b.day, startTime: b.startTime, endTime: b.endTime })),
          ...courseBusyBlocks,
        ],
      };

      const res = await fetch(`${API_BASE_URL}/auto-generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const msg = await res.text();
        toast.error(`Auto generation failed`);
        return;
      }

      const data = await res.json();
      const generatedSessions = Array.isArray(data?.sessions) ? data.sessions : [];

      // Show / persist the actual seed used by the backend (even when the user didn't set one).
      const usedSeed = data?.meta?.seed;
      if (usedSeed !== undefined && usedSeed !== null) {
        setSeed(String(usedSeed));
      }

      if (generatedSessions.length === 0) {
        toast.error('No free time available for the selected study window');
        return;
      }

      let merged = [...weekSessions];
      if (replaceStudySessions) {
        merged = merged.filter((s: any) => !['reading', 'revision', 'practice'].includes(s?.type));
      }
      merged = [...merged, ...generatedSessions];

      localStorage.setItem(targetWeekKey, JSON.stringify(merged));
      setWeekSessions(merged);
      window.dispatchEvent(new Event(targetStorageEventName));

      // Persist to backend so it shows across browsers/devices.
      // - user mode: /timetable/user/{id}/sessions
      // - workspace mode: /workspaces/{workspaceId}/sessions (admin-only)
      try {
        const url = isWorkspaceContext
          ? `${API_BASE_URL}/workspaces/${encodeURIComponent(workspaceId)}/sessions?week_id=${encodeURIComponent(weekId)}`
          : `${API_BASE_URL}/timetable/user/${encodeURIComponent(userId)}/sessions?week_id=${encodeURIComponent(weekId)}`;
        await fetch(url, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
          body: JSON.stringify(merged),
        });
      } catch {
        // best effort
      }

      toast.success(
        `✅ Generated ${generatedSessions.length} study sessions${data?.meta?.seed !== undefined ? ` (seed: ${data.meta.seed})` : ''}.`
      );
      try {
        localStorage.removeItem('autoGenerateContext');
      } catch {
        // ignore
      }
      if (embedded) {
        // Embedded mode (Workspace tab): don't navigate pages; let parent switch views.
        if (isWorkspaceContext) onWorkspaceDone?.();
      } else if (isWorkspaceContext) {
        try {
          localStorage.setItem('workspaceOpenTab', 'timetable');
        } catch {
          // ignore
        }
        onNavigate?.('workspace');
      } else {
        onNavigate?.('my-timetable');
      }
    } catch (e) {
      console.error(e);
      toast.error('Auto generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={embedded ? "" : "min-h-screen bg-gradient-to-b from-blue-50 to-white"}>
      <div className={embedded ? "space-y-6" : "max-w-4xl mx-auto px-4 py-8 space-y-6"}>
        {/* Header (matches Create Timetable styling) */}
        {!embedded && (
        <div className="bg-blue-600 rounded-2xl p-8 text-white shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Brain className="w-10 h-10" />
              <div>
                <h1 className="text-3xl font-bold">Auto Generate Study Timetable</h1>
                <p className="text-blue-100">
                  Fill your free time automatically using your study window, classes, and busy time.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 w-full md:w-auto">
              <Button
                variant="secondary"
                className="bg-white/10 hover:bg-white/20 text-white border-white/20"
                onClick={() => {
                  if (embedded) {
                    if (isWorkspaceContext) onWorkspaceDone?.();
                    return;
                  }
                  try {
                    localStorage.removeItem('autoGenerateContext');
                  } catch {
                    // ignore
                  }
                  if (isWorkspaceContext) {
                    try {
                      localStorage.setItem('workspaceOpenTab', 'timetable');
                    } catch {
                      // ignore
                    }
                    onNavigate?.('workspace');
                  } else {
                    onNavigate?.('my-timetable');
                  }
                }}
              >
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 text-blue-100 text-sm">
            <Sparkles className="w-4 h-4" /> Balanced sessions • Priority-aware • Breaks respected
          </div>
        </div>
        )}

        {/* Study window */}
        <Card data-tour="auto-study-window" className="border-2 border-blue-200 shadow-lg">
          <CardHeader className="bg-blue-50 rounded-t-lg border-b border-blue-100">
            <CardTitle className="flex items-center gap-2">
              <div className="bg-blue-500 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold">1</div>
              Study Window
            </CardTitle>
            <CardDescription className="text-blue-700">
              Set when you're available to study (editable anytime — great for exam periods).
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Weekday start</Label>
              <Input type="time" value={weekdayStart} onChange={(e) => setWeekdayStart(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Weekday end</Label>
              <Input type="time" value={weekdayEnd} onChange={(e) => setWeekdayEnd(e.target.value)} />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Break between study sessions (minutes)</Label>
              <Input
                type="number"
                min={0}
                max={180}
                step={5}
                value={breakMinutes}
                onChange={(e) => {
                  const n = parseInt(e.target.value || '0', 10);
                  setBreakMinutes(Number.isFinite(n) ? Math.max(0, Math.min(180, n)) : 0);
                }}
              />
              <p className="text-xs text-muted-foreground">
                We’ll leave this gap between consecutive generated sessions so you can rest/reset.
              </p>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Seed (optional)</Label>
              <Input
                type="number"
                min={0}
                max={2147483647}
                step={1}
                value={seed}
                onChange={(e) => setSeed(e.target.value)}
                placeholder="Leave blank for random"
              />
              <p className="text-xs text-muted-foreground">
                Leave blank to get a different timetable each time. Use the same seed to reproduce the exact same output.
              </p>
            </div>

            <div className="flex items-center justify-between col-span-full">
              <div className="space-y-1">
                <Label>Include weekends</Label>
                <p className="text-xs text-muted-foreground">If enabled, we also fill free time on Saturday and Sunday.</p>
              </div>
              <Switch checked={includeWeekends} onCheckedChange={setIncludeWeekends} />
            </div>

            {includeWeekends && (
              <>
                <div className="flex items-center justify-between col-span-full">
                  <div className="space-y-1">
                    <Label>Use same weekend window</Label>
                    <p className="text-xs text-muted-foreground">Weekend hours equal weekday hours.</p>
                  </div>
                  <Switch checked={weekendSame} onCheckedChange={setWeekendSame} />
                </div>

                {!weekendSame && (
                  <>
                    <div className="space-y-2">
                      <Label>Weekend start</Label>
                      <Input type="time" value={weekendStart} onChange={(e) => setWeekendStart(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Weekend end</Label>
                      <Input type="time" value={weekendEnd} onChange={(e) => setWeekendEnd(e.target.value)} />
                    </div>
                  </>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Class schedule */}
        <Card data-tour="auto-class-schedule" className="border-2 border-blue-200 shadow-lg">
          <CardHeader className="bg-blue-50 rounded-t-lg border-b border-blue-100">
            <CardTitle className="flex items-center gap-2">
              <div className="bg-blue-500 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold">2</div>
              Class Schedule &amp; Priority
            </CardTitle>
            <CardDescription className="text-blue-700">
              Add your current school timetable (courses + times) and set the priority of each course. The system uses your
              class schedule + busy time to detect free time, then fills it with balanced study sessions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Button variant={courseMode === 'fill' ? 'default' : 'outline'} onClick={() => setCourseMode('fill')}>
                <Plus className="w-4 h-4 mr-2" /> Fill Current Timetable
              </Button>
              <Button variant={courseMode === 'upload' ? 'default' : 'outline'} onClick={() => setCourseMode('upload')}>
                <Upload className="w-4 h-4 mr-2" /> Upload (Image/CSV)
              </Button>
              <div className="ml-auto flex items-center gap-2">
                <Button variant="secondary" onClick={saveClassSchedule}>
                  <Save className="w-4 h-4 mr-2" /> Save
                </Button>
              </div>
            </div>

            {courseMode === 'upload' && (
              <div ref={uploadSectionRef} className="rounded-lg border bg-white p-4 space-y-3">
                <div className="space-y-1">
                  <Label>Upload timetable</Label>
                  <p className="text-xs text-muted-foreground">
                    Upload a CSV (recommended) or an image of your timetable. After import, set priorities and click Save.
                  </p>
                </div>
                <Input
                  type="file"
                  accept=".csv,image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUploadTimetable(f);
                    e.currentTarget.value = '';
                  }}
                />
              </div>
            )}

            {/* Existing course rows */}
            {courses.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                No class timetable saved yet. Use <span className="font-medium">Fill Current Timetable</span> or <span className="font-medium">Upload</span> to add it.
              </div>
            ) : (
              <div className="space-y-2">
                {courses.map((c) => {
                  const isEditing = editingCourseId === c.id;
                  return (
                    <div key={c.id} className="rounded-lg border bg-white">
                      {!isEditing ? (
                        <div className="p-3 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-medium truncate">{c.title}</div>
                            <div className="text-xs text-muted-foreground">
                              {fmtDays(c.days)} • {c.startTime}–{c.endTime} • {c.priority.toUpperCase()}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => duplicateCourse(c)}
                              title="Add another time slot for this course"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setEditingCourseId(c.id)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => removeCourse(c.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label>Course name</Label>
                              <Input
                                value={c.title}
                                onChange={(e) =>
                                  setCourses((prev) => prev.map((x) => (x.id === c.id ? { ...x, title: e.target.value } : x)))
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Priority</Label>
                              <Select
                                value={c.priority}
                                onValueChange={(v) =>
                                  setCourses((prev) => prev.map((x) => (x.id === c.id ? { ...x, priority: v as Priority } : x)))
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Priority" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="high">High</SelectItem>
                                  <SelectItem value="medium">Medium</SelectItem>
                                  <SelectItem value="low">Low</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label>Start</Label>
                              <Input
                                type="time"
                                value={c.startTime}
                                onChange={(e) =>
                                  setCourses((prev) => prev.map((x) => (x.id === c.id ? { ...x, startTime: e.target.value } : x)))
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>End</Label>
                              <Input
                                type="time"
                                value={c.endTime}
                                onChange={(e) =>
                                  setCourses((prev) => prev.map((x) => (x.id === c.id ? { ...x, endTime: e.target.value } : x)))
                                }
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Days</Label>
                            <div className="flex flex-wrap gap-3">
                              {days.map((d) => (
                                <label key={d.id} className="flex items-center gap-2 text-sm">
                                  <Checkbox
                                    checked={c.days.includes(d.id)}
                                    onCheckedChange={(checked) => {
                                      setCourses((prev) =>
                                        prev.map((x) => {
                                          if (x.id !== c.id) return x;
                                          const next = new Set(x.days);
                                          if (checked) next.add(d.id);
                                          else next.delete(d.id);
                                          return { ...x, days: Array.from(next).sort((a, b) => a - b) };
                                        })
                                      );
                                    }}
                                  />
                                  {d.label}
                                </label>
                              ))}
                            </div>
                          </div>

                          <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setEditingCourseId(null)}>
                              Done
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add new course row (Fill mode) */}
            {courseMode === 'fill' && (
              <div className="rounded-lg border bg-white p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Add course row</div>
                    <div className="text-xs text-muted-foreground">Same course can appear multiple times with different days or times.</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Course name</Label>
                    <Input value={courseDraft.title} onChange={(e) => setCourseDraft((p) => ({ ...p, title: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select value={courseDraft.priority} onValueChange={(v) => setCourseDraft((p) => ({ ...p, priority: v as Priority }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Start</Label>
                    <Input type="time" value={courseDraft.startTime} onChange={(e) => setCourseDraft((p) => ({ ...p, startTime: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>End</Label>
                    <Input type="time" value={courseDraft.endTime} onChange={(e) => setCourseDraft((p) => ({ ...p, endTime: e.target.value }))} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Days</Label>
                  <div className="flex flex-wrap gap-3">
                    {days.map((d) => (
                      <label key={d.id} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={courseDraft.days.includes(d.id)}
                          onCheckedChange={(checked) => {
                            setCourseDraft((p) => {
                              const next = new Set(p.days);
                              if (checked) next.add(d.id);
                              else next.delete(d.id);
                              return { ...p, days: Array.from(next).sort((a, b) => a - b) };
                            });
                          }}
                        />
                        {d.label}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="secondary" onClick={addCourseFromDraft}>
                    <Plus className="w-4 h-4 mr-2" /> Add
                  </Button>
                  <Button variant="outline" onClick={() => setCourseMode('none')}>
                    Done
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Busy time */}
        <Card data-tour="auto-busy-time" className="border-2 border-blue-200 shadow-lg">
          <CardHeader className="bg-blue-50 rounded-t-lg border-b border-blue-100">
            <CardTitle className="flex items-center gap-2">
              <div className="bg-blue-500 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold">3</div>
              Busy Time
            </CardTitle>
            <CardDescription className="text-blue-700">
              Add extra busy blocks (work, commute, errands). Auto-generate will never place study sessions inside these periods.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Treat existing calendar sessions as busy</Label>
                <p className="text-xs text-muted-foreground">
                  Uses your current week sessions as additional busy time ({weekSessions.length} session(s) found).
                </p>
              </div>
              <Switch checked={treatExistingWeekAsBusy} onCheckedChange={setTreatExistingWeekAsBusy} />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Replace existing study sessions</Label>
                <p className="text-xs text-muted-foreground">If enabled, we remove previously generated study sessions before adding new ones.</p>
              </div>
              <Switch checked={replaceStudySessions} onCheckedChange={setReplaceStudySessions} />
            </div>

            {busy.length > 0 && (
              <div className="space-y-2">
                {busy.map((b) => {
                  const isEditing = editingBusyId === b.id;
                  return (
                    <div key={b.id} className="rounded-lg border bg-white">
                      {!isEditing ? (
                        <div className="p-3 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-medium truncate">{b.title}</div>
                            <div className="text-xs text-muted-foreground">
                              {days.find((d) => d.id === b.day)?.label} • {b.startTime}–{b.endTime}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" onClick={() => setEditingBusyId(b.id)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => removeBusy(b.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label>Title</Label>
                              <Input
                                value={b.title}
                                onChange={(e) => setBusy((prev) => prev.map((x) => (x.id === b.id ? { ...x, title: e.target.value } : x)))}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Day</Label>
                              <Select value={String(b.day)} onValueChange={(v) => setBusy((prev) => prev.map((x) => (x.id === b.id ? { ...x, day: Number(v) } : x)))}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {days.map((d) => (
                                    <SelectItem key={d.id} value={String(d.id)}>
                                      {d.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Start</Label>
                              <Input type="time" value={b.startTime} onChange={(e) => setBusy((prev) => prev.map((x) => (x.id === b.id ? { ...x, startTime: e.target.value } : x)))} />
                            </div>
                            <div className="space-y-2">
                              <Label>End</Label>
                              <Input type="time" value={b.endTime} onChange={(e) => setBusy((prev) => prev.map((x) => (x.id === b.id ? { ...x, endTime: e.target.value } : x)))} />
                            </div>
                          </div>

                          <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setEditingBusyId(null)}>
                              Done
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {!busyComposerOpen ? (
              <Button variant="secondary" onClick={() => setBusyComposerOpen(true)}>
                <Plus className="w-4 h-4 mr-2" /> Add busy block
              </Button>
            ) : (
              <div className="rounded-lg border bg-white p-4 space-y-3">
                <div className="font-medium">Add busy block</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input value={busyDraft.title} onChange={(e) => setBusyDraft((p) => ({ ...p, title: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Day</Label>
                    <Select value={String(busyDraft.day)} onValueChange={(v) => setBusyDraft((p) => ({ ...p, day: Number(v) }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {days.map((d) => (
                          <SelectItem key={d.id} value={String(d.id)}>
                            {d.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Start</Label>
                    <Input type="time" value={busyDraft.startTime} onChange={(e) => setBusyDraft((p) => ({ ...p, startTime: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>End</Label>
                    <Input type="time" value={busyDraft.endTime} onChange={(e) => setBusyDraft((p) => ({ ...p, endTime: e.target.value }))} />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="secondary" onClick={addBusyFromDraft}>
                    <Plus className="w-4 h-4 mr-2" /> Add
                  </Button>
                  <Button
                    variant="outline"
                    onClick={async () => {
                      await saveBusyBlocks();
                      setBusyComposerOpen(false);
                    }}
                  >
                    Done
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer action (Generate at the bottom) */}
        <div className="sticky bottom-0 pt-2 pb-4 bg-gradient-to-t from-white via-white/95 to-transparent">
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              data-tour="auto-shuffle"
              onClick={() => handleGenerate({ shuffle: true })}
              disabled={isGenerating}
              className="shadow-lg"
            >
              <Shuffle className="w-4 h-4 mr-2" /> Shuffle
            </Button>

            <Button
              data-tour="auto-generate"
              onClick={() => handleGenerate({ shuffle: false })}
              disabled={isGenerating}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
            >
              <Sparkles className="w-4 h-4 mr-2" /> {isGenerating ? 'Generating…' : 'Generate'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
