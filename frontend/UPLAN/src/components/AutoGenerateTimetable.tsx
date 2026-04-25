import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Checkbox } from './ui/checkbox';
import {
  ArrowLeft,
  Pencil,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Upload,
  Clock3,
  Briefcase,
  BookOpen,
  Wand2,
  FileImage,
  FileSpreadsheet,
} from 'lucide-react';
import { getWeekIdentifier } from '../src/utils/dateUtils';
import { getUserWeekKey } from '../utils/userStorage';
import { useTranslation } from 'react-i18next';

type Priority = 'low' | 'medium' | 'high';

interface AutoGenerateTimetableProps {
  onNavigate?: (page: string) => void;
  onBack?: () => void;
  scope?: 'user' | 'workspace';
  workspaceId?: string;
  embedded?: boolean;
  onWorkspaceDone?: () => void;
}

interface BusyRow {
  id: string;
  title: string;
  day: number;
  startTime: string;
  endTime: string;
}

interface CourseRow {
  id: string;
  title: string;
  days: number[];
  startTime: string;
  endTime: string;
  priority: Priority;
}

const dayIds = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

const uid = () => Math.random().toString(36).slice(2, 10);

export default function AutoGenerateTimetable({
  onNavigate,
  onBack,
  scope,
  workspaceId: workspaceIdProp,
  embedded,
  onWorkspaceDone,
}: AutoGenerateTimetableProps) {
  const { t } = useTranslation();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const userId = localStorage.getItem('currentUserId') || '';
  const uploadSectionRef = useRef<HTMLDivElement | null>(null);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);

  const days = useMemo(
    () => [
      { id: 0, label: t('days.monday') },
      { id: 1, label: t('days.tuesday') },
      { id: 2, label: t('days.wednesday') },
      { id: 3, label: t('days.thursday') },
      { id: 4, label: t('days.friday') },
      { id: 5, label: t('days.saturday') },
      { id: 6, label: t('days.sunday') },
    ],
    [t]
  );

  const fmtDays = (ds: number[]) =>
    ds
      .slice()
      .sort((a, b) => a - b)
      .map((d) => days.find((x) => x.id === d)?.label || '')
      .filter(Boolean)
      .join(', ');

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
    return isWorkspaceContext ? `workspace_${workspaceId}_calendarSessions_${weekId}` : getUserWeekKey(weekId);
  }, [isWorkspaceContext, workspaceId, weekId]);
  const targetStorageEventName = useMemo(() => {
    return isWorkspaceContext ? `workspaceCalendarSessionsUpdated_${workspaceId}` : 'calendarSessionsUpdated';
  }, [isWorkspaceContext, workspaceId]);

  useEffect(() => {
    const flagKey = resolvedScope === 'workspace' ? 'workspaceAutoGenerateOpenUpload' : 'autoGenerateOpenUpload';
    try {
      if (localStorage.getItem(flagKey) === 'true') {
        localStorage.removeItem(flagKey);
        setTimeout(() => {
          uploadSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
      }
    } catch {
      // ignore
    }
  }, [resolvedScope]);

  const [weekdayStart, setWeekdayStart] = useState('08:00');
  const [weekdayEnd, setWeekdayEnd] = useState('19:00');
  const [includeWeekends, setIncludeWeekends] = useState(false);
  const [weekendSame, setWeekendSame] = useState(true);
  const [weekendStart, setWeekendStart] = useState('08:00');
  const [weekendEnd, setWeekendEnd] = useState('19:00');
  const [importWarnings, setImportWarnings] = useState<string[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
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

  const [busy, setBusy] = useState<BusyRow[]>([]);
  const [busyComposerOpen, setBusyComposerOpen] = useState(false);
  const [busyDraft, setBusyDraft] = useState<BusyRow>({
    id: uid(),
    title: t('autoGenerate.busyDefaultTitle'),
    day: 0,
    startTime: '12:00',
    endTime: '13:00',
  });
  const [editingBusyId, setEditingBusyId] = useState<string | null>(null);

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

  const [assessments, setAssessments] = useState<any[]>([]);

  const getWeekStartMonday = (d: Date) => {
    const dd = new Date(d);
    dd.setHours(0, 0, 0, 0);
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
        const estHours = Number(a?.estimateHours ?? a?.estimate_hours ?? 0);
        const durationMins = Number.isFinite(estHours) && estHours > 0 ? Math.round(estHours * 60) : 60;
        const end = new Date(due);
        end.setMinutes(end.getMinutes() + durationMins);

        const day = (due.getDay() + 6) % 7;
        const startTime = `${pad2(due.getHours())}:${pad2(due.getMinutes())}`;
        const endTime = `${pad2(end.getHours())}:${pad2(end.getMinutes())}`;

        return {
          title:
            `${a?.subject || ''} ${String(a?.type || a?.kind || t('autoGenerate.deadlineFallback')).toUpperCase()}`.trim() ||
            t('autoGenerate.deadlineFallback'),
          day,
          startTime,
          endTime,
        };
      });
  }, [assessments, today, t]);

  const existingWeekBusyBlocks = useMemo(() => {
    if (!treatExistingWeekAsBusy) return [];
    return weekSessions
      .filter((s: any) => {
        if (!s || typeof s.day !== 'number' || !s.startTime || !s.endTime) return false;
        if (!replaceStudySessions) return true;
        return !['reading', 'revision', 'practice'].includes(String(s.type || '').toLowerCase());
      })
      .map((s: any) => ({
        title: s.subject || t('autoGenerate.busyFallback'),
        day: s.day,
        startTime: s.startTime,
        endTime: s.endTime,
      }));
  }, [weekSessions, treatExistingWeekAsBusy, replaceStudySessions, t]);

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
                title: x.title || t('autoGenerate.busyDefaultTitle'),
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
                title: x.title || t('autoGenerate.busyDefaultTitle'),
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
  }, [API_BASE_URL, userId, weekId, targetWeekKey, targetStorageEventName, isWorkspaceContext, workspaceId, t]);

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
    } catch {
      toast.error(t('autoGenerate.errors.saveWorkspaceConfig'));
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
      await saveWorkspaceConfig({ successToast: t('autoGenerate.success.busySavedWorkspace') });
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
    } catch {
      toast.error(t('autoGenerate.errors.saveBusy'));
    }
  };

  const saveClassSchedule = async () => {
    if (!API_BASE_URL || !userId) return;
    if (courses.length === 0) {
      toast.error(t('autoGenerate.errors.addCourseFirst'));
      return;
    }
    if (isWorkspaceContext) {
      await saveWorkspaceConfig({
        successToast: t('autoGenerate.success.classSavedWorkspace'),
        closeCourseMode: true,
      });
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
      toast.success(t('autoGenerate.success.classSaved'));
      setCourseMode('none');
    } catch {
      toast.error(t('autoGenerate.errors.saveClass'));
    }
  };
  const looksLikeRealCourse = (value: string) => {
    const s = (value || '').trim().toUpperCase();
    if (!s) return false;

    // reject very short junk
    if (s.length < 3) return false;

    // reject generic labels / room-only noise
    if (/^(ROOM|LAB|SECTION|SEC|TIME|DAY|COURSE|SUBJECT|CLASS|LECTURE)$/.test(s)) {
      return false;
    }

    // reject pure numbers / punctuation
    if (/^[\d\W_]+$/.test(s)) return false;

    // reject obvious OCR garbage like 1-2 random chars mixed with symbols
    const compact = s.replace(/[^A-Z0-9]/g, '');
    if (compact.length < 3) return false;

    return true;
  };

  const isValidTimeRange = (start: string, end: string) => {
    if (!start || !end) return false;
    if (start.length < 5 || end.length < 5) return false;
    return start < end;
  };
  const handleUploadTimetable = async (file: File) => {
  if (!API_BASE_URL || !userId) return;

  const lower = file.name.toLowerCase();
  const isCsv = lower.endsWith('.csv') || file.type.includes('csv');
  const isExcel = lower.endsWith('.xlsx') || lower.endsWith('.xls');
  const isImage = file.type.startsWith('image/');

  if (!isCsv && !isImage && !isExcel) {
    toast.error(t('autoGenerate.errors.uploadCsvOrImage'));
    return;
  }

  const form = new FormData();
  form.append('file', file);

  try {
    const res = await fetch(`${API_BASE_URL}/timetable/import-preview`, {
      method: 'POST',
      body: form,
      headers: { 'X-User-Id': userId },
    });

    if (!res.ok) {
      toast.error(t('autoGenerate.errors.uploadFailed'));
      return;
    }

    const data = await res.json();
    const items: any[] = Array.isArray(data?.items) ? data.items : [];
    const warnings: string[] = Array.isArray(data?.warnings) ? data.warnings : [];
    const errors: string[] = Array.isArray(data?.errors) ? data.errors : [];

    setImportWarnings(warnings);
    setImportErrors(errors);

    if (items.length === 0) {
      toast.error(t('autoGenerate.errors.noClassesDetected'));
      return;
    }

    // IMPORTANT:
    // keep this as identity mapping only if backend preview now returns Monday-first (0=Mon..6=Sun)
    const backendToFrontendDay = (d: number) => d;

    const grouped = new Map<string, CourseRow>();

for (const it of items) {
  const rawTitle = (it.subject_title || '').toString().trim();
  const title = rawTitle.toUpperCase();
  const start = (it.start_time || '').toString().slice(0, 5);
  const end = (it.end_time || '').toString().slice(0, 5);
  const dayBackend = typeof it.day_of_week === 'number' ? it.day_of_week : null;
  const day = dayBackend !== null ? backendToFrontendDay(dayBackend) : null;

  if (!title || day === null) continue;
  if (!looksLikeRealCourse(title)) continue;
  if (!isValidTimeRange(start, end)) continue;
  if (day < 0 || day > 6) continue;

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
    existing.days = Array.from(new Set([...existing.days, day])).sort((a, b) => a - b);
  }
}

    const imported = Array.from(grouped.values());

    if (imported.length === 0) {
      toast.error(t('autoGenerate.errors.invalidImportFormat'));
      return;
    }

    // stricter protection for image OCR imports
    if (isImage && imported.length > 8) {
      toast.error('Too many courses detected from the image. Remove wrong rows or use CSV/Excel.');
      return;
    }

    setCourses(imported);
    setCourseMode('upload');

    if (warnings.length > 0) {
      toast.success(
        `${t('autoGenerate.success.importedRows', { count: imported.length })} (${warnings.length} ${t('autoGenerate.warningsLabel')})`
      );
    } else {
      toast.success(t('autoGenerate.success.importedRows', { count: imported.length }));
    }
  } catch (e) {
    console.error(e);
    toast.error(t('autoGenerate.errors.uploadFailedGeneric'));
  }
};

  const addCourseFromDraft = () => {
    const title = (courseDraft.title || '').trim();
    if (!title) {
      toast.error(t('autoGenerate.errors.courseNameRequired'));
      return;
    }
    if (!courseDraft.days || courseDraft.days.length === 0) {
      toast.error(t('autoGenerate.errors.selectAtLeastOneDay'));
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
    const copy: CourseRow = {
      ...c,
      id: uid(),
      days: c.days && c.days.length ? [c.days[0]] : [0],
    };
    setCourses((prev) => [...prev, copy]);
    setEditingCourseId(copy.id);
  };

  const addBusyFromDraft = () => {
    const title = (busyDraft.title || '').trim() || t('autoGenerate.busyDefaultTitle');
    setBusy((prev) => [...prev, { ...busyDraft, id: uid(), title }]);
    setBusyDraft({ id: uid(), title: t('autoGenerate.busyDefaultTitle'), day: 0, startTime: '12:00', endTime: '13:00' });
  };

  const removeBusy = (id: string) => setBusy((prev) => prev.filter((b) => b.id !== id));

  const handleGenerate = async (opts?: { shuffle?: boolean }) => {
    if (!API_BASE_URL) {
      toast.error(t('autoGenerate.errors.missingApiBase'));
      return;
    }
    if (!userId) {
      toast.error(t('autoGenerate.errors.notLoggedIn'));
      return;
    }

    if (courses.length === 0) {
      toast.error(t('autoGenerate.errors.fillOrUploadFirst'));
      return;
    }
    if (courses.length > 8) {
    toast.error('Too many imported courses. Please remove incorrect rows before generating.');
    return;
  }
    setIsGenerating(true);
    try {
      await Promise.allSettled([saveStudyWindow(), saveBusyBlocks(), saveClassSchedule()]);

      const seedTrim = (seed || '').trim();
      const seedNum = seedTrim ? parseInt(seedTrim, 10) : null;
      const useSeed = Number.isFinite(seedNum as any) && (seedNum as any) >= 0;
      const shuffle = !!opts?.shuffle;

      const courseBusyBlocks = isWorkspaceContext
        ? courses.flatMap((c) =>
            (Array.isArray(c.days) ? c.days : []).map((d) => ({
              title: c.title || t('autoGenerate.classFallback'),
              day: d,
              startTime: c.startTime,
              endTime: c.endTime,
            }))
          )
        : [];

      const payload = {
        user_id: userId,
        treat_class_schedule_as_busy: !isWorkspaceContext,
        use_stored_busy_blocks: !isWorkspaceContext,
        breakMinutes: breakMinutes,
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
        toast.error(t('autoGenerate.errors.generateFailed'));
        return;
      }

      const data = await res.json();
      const generatedSessions = Array.isArray(data?.sessions) ? data.sessions : [];

      const usedSeed = data?.meta?.seed;
      if (usedSeed !== undefined && usedSeed !== null) {
        setSeed(String(usedSeed));
      }

      if (generatedSessions.length === 0) {
        toast.error(t('autoGenerate.errors.noFreeTime'));
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
        t('autoGenerate.success.generatedSessions', {
          count: generatedSessions.length,
          seed: data?.meta?.seed !== undefined ? ` (seed: ${data.meta.seed})` : '',
        })
      );

      try {
        localStorage.removeItem('autoGenerateContext');
      } catch {
        // ignore
      }

      if (embedded) {
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
      toast.error(t('autoGenerate.errors.generateFailed'));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4 sm:p-6 lg:p-8">
      <div className={embedded ? 'space-y-6' : 'mx-auto max-w-5xl space-y-6 px-4 py-8'}>
        {!embedded && (
          <div className="mb-2">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-700 text-white shadow-sm">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
                    {t('autoGenerate.title')}
                  </h1>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {t('autoGenerate.subtitle')}
                  </p>
                </div>
              </div>

              <div className="flex w-full md:w-auto">
                <Button
                  variant="secondary"
                  className="w-full rounded-2xl border border-slate-200 bg-white text-slate-900 hover:bg-slate-50 dark:border-white/10 dark:bg-[#0b0b0b] dark:text-white dark:hover:bg-[#111] md:w-auto"
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
                    if (onBack) {
                      onBack();
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
                  }}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> {t('common.back')}
                </Button>
              </div>
            </div>
          </div>
        )}

        <Card data-tour="auto-study-window" className="rounded-[28px] border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0b0b0b]">
          <CardHeader className="rounded-t-[28px] border-b border-slate-100 bg-slate-50/70 dark:border-white/10 dark:bg-white/[0.03]">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400">
                <Clock3 className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base">{t('autoGenerate.studyWindow.title')}</CardTitle>
                <CardDescription>{t('autoGenerate.studyWindow.description')}</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 md:p-6">
            <div className="space-y-2">
              <Label>{t('autoGenerate.studyWindow.weekdayStart')}</Label>
              <Input type="time" value={weekdayStart} onChange={(e) => setWeekdayStart(e.target.value)} className="rounded-2xl" />
            </div>

            <div className="space-y-2">
              <Label>{t('autoGenerate.studyWindow.weekdayEnd')}</Label>
              <Input type="time" value={weekdayEnd} onChange={(e) => setWeekdayEnd(e.target.value)} className="rounded-2xl" />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>{t('autoGenerate.studyWindow.breakMinutes')}</Label>
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
                className="rounded-2xl"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('autoGenerate.studyWindow.breakHelp')}
              </p>
            </div>

            <div className="col-span-full flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/40 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <Label>{t('autoGenerate.studyWindow.includeWeekends')}</Label>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t('autoGenerate.studyWindow.includeWeekendsHelp')}
                </p>
              </div>
              <Switch checked={includeWeekends} onCheckedChange={setIncludeWeekends} />
            </div>

            {includeWeekends && (
              <>
                <div className="col-span-full flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/40 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <Label>{t('autoGenerate.studyWindow.sameWeekend')}</Label>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {t('autoGenerate.studyWindow.sameWeekendHelp')}
                    </p>
                  </div>
                  <Switch checked={weekendSame} onCheckedChange={setWeekendSame} />
                </div>

                {!weekendSame && (
                  <>
                    <div className="space-y-2">
                      <Label>{t('autoGenerate.studyWindow.weekendStart')}</Label>
                      <Input type="time" value={weekendStart} onChange={(e) => setWeekendStart(e.target.value)} className="rounded-2xl" />
                    </div>

                    <div className="space-y-2">
                      <Label>{t('autoGenerate.studyWindow.weekendEnd')}</Label>
                      <Input type="time" value={weekendEnd} onChange={(e) => setWeekendEnd(e.target.value)} className="rounded-2xl" />
                    </div>
                  </>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card data-tour="auto-class-schedule" className="rounded-[28px] border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0b0b0b]">
          <CardHeader className="rounded-t-[28px] border-b border-slate-100 bg-slate-50/70 dark:border-white/10 dark:bg-white/[0.03]">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base">{t('autoGenerate.classSchedule.title')}</CardTitle>
                <CardDescription>{t('autoGenerate.classSchedule.description')}</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-5 p-4 md:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant={courseMode === 'fill' ? 'default' : 'outline'}
                onClick={() => setCourseMode('fill')}
                className="rounded-2xl"
              >
                <Plus className="mr-2 h-4 w-4" />
                {t('autoGenerate.classSchedule.fillButton')}
              </Button>

              <Button
                variant={courseMode === 'upload' ? 'default' : 'outline'}
                onClick={() => setCourseMode('upload')}
                className="rounded-2xl"
              >
                <Upload className="mr-2 h-4 w-4" />
                {t('autoGenerate.classSchedule.uploadButton')}
              </Button>

              <div className="ml-auto flex items-center gap-2">
                <Button variant="secondary" onClick={saveClassSchedule} className="rounded-2xl">
                  <Save className="mr-2 h-4 w-4" />
                  {t('common.save')}
                </Button>
              </div>
            </div>

            {courseMode === 'upload' && (
              <div
                ref={uploadSectionRef}
                className="rounded-3xl border border-dashed border-blue-300 bg-blue-50/60 p-5 dark:border-blue-900/40 dark:bg-blue-950/10"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-2">
                    <Label>{t('autoGenerate.upload.title')}</Label>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {t('autoGenerate.upload.description')}
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                        <FileSpreadsheet className="h-3.5 w-3.5" />
                        CSV / XLSX
                      </div>

                      <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                        <FileImage className="h-3.5 w-3.5" />
                        PNG / JPG / JPEG (review required)
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                    <Button
                      type="button"
                      onClick={() => uploadInputRef.current?.click()}
                      className="rounded-2xl bg-blue-700 text-white hover:bg-blue-700"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {t('autoGenerate.upload.selectFile')}
                    </Button>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {t('autoGenerate.upload.buttonHint')}
                    </span>
                  </div>
                </div>

                <input
                  ref={uploadInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xlsm,image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUploadTimetable(f);
                    e.currentTarget.value = '';
                  }}
                />
              </div>
            )}

            {courses.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/60 px-4 py-8 text-center dark:border-slate-700 dark:bg-slate-900/40">
                <BookOpen className="mx-auto mb-3 h-10 w-10 text-slate-300 dark:text-slate-600" />
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  {t('autoGenerate.classSchedule.emptyTitle')}
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {t('autoGenerate.classSchedule.emptyDescription')}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {courses.map((c) => {
                  const isEditing = editingCourseId === c.id;
                  return (
                    <div key={c.id} className="rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-[#111]">
                      {!isEditing ? (
                        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <div className="truncate font-semibold text-slate-900 dark:text-white">{c.title}</div>
                            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                              {fmtDays(c.days)} • {c.startTime}–{c.endTime} • {t(`autoGenerate.priority.${c.priority}`)}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 self-end sm:self-auto">
                            <Button variant="ghost" size="icon" onClick={() => duplicateCourse(c)} title={t('autoGenerate.classSchedule.addAnotherSlot')} className="rounded-xl">
                              <Plus className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setEditingCourseId(c.id)} className="rounded-xl">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => removeCourse(c.id)} className="rounded-xl">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3 p-4">
                          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            <div className="space-y-2">
                              <Label>{t('autoGenerate.classSchedule.courseName')}</Label>
                              <Input
                                value={c.title}
                                onChange={(e) =>
                                  setCourses((prev) => prev.map((x) => (x.id === c.id ? { ...x, title: e.target.value } : x)))
                                }
                                className="rounded-2xl"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>{t('autoGenerate.classSchedule.priority')}</Label>
                              <Select
                                value={c.priority}
                                onValueChange={(v) =>
                                  setCourses((prev) => prev.map((x) => (x.id === c.id ? { ...x, priority: v as Priority } : x)))
                                }
                              >
                                <SelectTrigger className="rounded-2xl">
                                  <SelectValue placeholder={t('autoGenerate.classSchedule.priority')} />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="high">{t('autoGenerate.priority.high')}</SelectItem>
                                  <SelectItem value="medium">{t('autoGenerate.priority.medium')}</SelectItem>
                                  <SelectItem value="low">{t('autoGenerate.priority.low')}</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label>{t('autoGenerate.classSchedule.start')}</Label>
                              <Input
                                type="time"
                                value={c.startTime}
                                onChange={(e) =>
                                  setCourses((prev) => prev.map((x) => (x.id === c.id ? { ...x, startTime: e.target.value } : x)))
                                }
                                className="rounded-2xl"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>{t('autoGenerate.classSchedule.end')}</Label>
                              <Input
                                type="time"
                                value={c.endTime}
                                onChange={(e) =>
                                  setCourses((prev) => prev.map((x) => (x.id === c.id ? { ...x, endTime: e.target.value } : x)))
                                }
                                className="rounded-2xl"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>{t('autoGenerate.classSchedule.days')}</Label>
                            <div className="flex flex-wrap gap-3">
                              {days.map((d) => (
                                <label key={d.id} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
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

                          <div className="flex justify-end">
                            <Button variant="outline" onClick={() => setEditingCourseId(null)} className="rounded-2xl">
                              {t('common.done')}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {courseMode === 'fill' && (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/70 p-5 dark:border-slate-700 dark:bg-slate-900/40">
                <div className="mb-4">
                  <div className="font-semibold text-slate-900 dark:text-white">{t('autoGenerate.classSchedule.addCourseRow')}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {t('autoGenerate.classSchedule.addCourseRowHelp')}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{t('autoGenerate.classSchedule.courseName')}</Label>
                    <Input value={courseDraft.title} onChange={(e) => setCourseDraft((p) => ({ ...p, title: e.target.value }))} className="rounded-2xl" />
                  </div>

                  <div className="space-y-2">
                    <Label>{t('autoGenerate.classSchedule.priority')}</Label>
                    <Select value={courseDraft.priority} onValueChange={(v) => setCourseDraft((p) => ({ ...p, priority: v as Priority }))}>
                      <SelectTrigger className="rounded-2xl">
                        <SelectValue placeholder={t('autoGenerate.classSchedule.priority')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">{t('autoGenerate.priority.high')}</SelectItem>
                        <SelectItem value="medium">{t('autoGenerate.priority.medium')}</SelectItem>
                        <SelectItem value="low">{t('autoGenerate.priority.low')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>{t('autoGenerate.classSchedule.start')}</Label>
                    <Input type="time" value={courseDraft.startTime} onChange={(e) => setCourseDraft((p) => ({ ...p, startTime: e.target.value }))} className="rounded-2xl" />
                  </div>

                  <div className="space-y-2">
                    <Label>{t('autoGenerate.classSchedule.end')}</Label>
                    <Input type="time" value={courseDraft.endTime} onChange={(e) => setCourseDraft((p) => ({ ...p, endTime: e.target.value }))} className="rounded-2xl" />
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <Label>{t('autoGenerate.classSchedule.days')}</Label>
                  <div className="flex flex-wrap gap-3">
                    {days.map((d) => (
                      <label key={d.id} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
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

                <div className="mt-5 flex justify-end gap-2">
                  <Button variant="secondary" onClick={addCourseFromDraft} className="rounded-2xl">
                    <Plus className="mr-2 h-4 w-4" />
                    {t('common.add')}
                  </Button>
                  <Button variant="outline" onClick={() => setCourseMode('none')} className="rounded-2xl">
                    {t('common.done')}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-tour="auto-busy-time" className="rounded-[28px] border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0b0b0b]">
          <CardHeader className="rounded-t-[28px] border-b border-slate-100 bg-slate-50/70 dark:border-white/10 dark:bg-white/[0.03]">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400">
                <Briefcase className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base">{t('autoGenerate.busyTime.title')}</CardTitle>
                <CardDescription>{t('autoGenerate.busyTime.description')}</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-5 p-4 md:p-6">
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/40 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <Label>{t('autoGenerate.busyTime.treatExisting')}</Label>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t('autoGenerate.busyTime.treatExistingHelp', { count: weekSessions.length })}
                </p>
              </div>
              <Switch checked={treatExistingWeekAsBusy} onCheckedChange={setTreatExistingWeekAsBusy} />
            </div>

            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/40 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <Label>{t('autoGenerate.busyTime.replaceExisting')}</Label>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t('autoGenerate.busyTime.replaceExistingHelp')}
                </p>
              </div>
              <Switch checked={replaceStudySessions} onCheckedChange={setReplaceStudySessions} />
            </div>

            {busy.length > 0 && (
              <div className="space-y-3">
                {busy.map((b) => {
                  const isEditing = editingBusyId === b.id;
                  return (
                    <div key={b.id} className="rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-[#111]">
                      {!isEditing ? (
                        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <div className="truncate font-semibold text-slate-900 dark:text-white">{b.title}</div>
                            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                              {days.find((d) => d.id === b.day)?.label} • {b.startTime}–{b.endTime}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 self-end sm:self-auto">
                            <Button variant="ghost" size="icon" onClick={() => setEditingBusyId(b.id)} className="rounded-xl">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => removeBusy(b.id)} className="rounded-xl">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3 p-4">
                          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            <div className="space-y-2">
                              <Label>{t('autoGenerate.busyTime.titleLabel')}</Label>
                              <Input
                                value={b.title}
                                onChange={(e) => setBusy((prev) => prev.map((x) => (x.id === b.id ? { ...x, title: e.target.value } : x)))}
                                className="rounded-2xl"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>{t('autoGenerate.busyTime.day')}</Label>
                              <Select value={String(b.day)} onValueChange={(v) => setBusy((prev) => prev.map((x) => (x.id === b.id ? { ...x, day: Number(v) } : x)))}>
                                <SelectTrigger className="rounded-2xl">
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
                              <Label>{t('autoGenerate.busyTime.start')}</Label>
                              <Input
                                type="time"
                                value={b.startTime}
                                onChange={(e) => setBusy((prev) => prev.map((x) => (x.id === b.id ? { ...x, startTime: e.target.value } : x)))}
                                className="rounded-2xl"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>{t('autoGenerate.busyTime.end')}</Label>
                              <Input
                                type="time"
                                value={b.endTime}
                                onChange={(e) => setBusy((prev) => prev.map((x) => (x.id === b.id ? { ...x, endTime: e.target.value } : x)))}
                                className="rounded-2xl"
                              />
                            </div>
                          </div>

                          <div className="flex justify-end">
                            <Button variant="outline" onClick={() => setEditingBusyId(null)} className="rounded-2xl">
                              {t('common.done')}
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
              <Button variant="secondary" onClick={() => setBusyComposerOpen(true)} className="rounded-2xl">
                <Plus className="mr-2 h-4 w-4" />
                {t('autoGenerate.busyTime.addBusy')}
              </Button>
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/70 p-5 dark:border-slate-700 dark:bg-slate-900/40">
                <div className="mb-4 font-semibold text-slate-900 dark:text-white">
                  {t('autoGenerate.busyTime.addBusy')}
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{t('autoGenerate.busyTime.titleLabel')}</Label>
                    <Input value={busyDraft.title} onChange={(e) => setBusyDraft((p) => ({ ...p, title: e.target.value }))} className="rounded-2xl" />
                  </div>

                  <div className="space-y-2">
                    <Label>{t('autoGenerate.busyTime.day')}</Label>
                    <Select value={String(busyDraft.day)} onValueChange={(v) => setBusyDraft((p) => ({ ...p, day: Number(v) }))}>
                      <SelectTrigger className="rounded-2xl">
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
                    <Label>{t('autoGenerate.busyTime.start')}</Label>
                    <Input type="time" value={busyDraft.startTime} onChange={(e) => setBusyDraft((p) => ({ ...p, startTime: e.target.value }))} className="rounded-2xl" />
                  </div>

                  <div className="space-y-2">
                    <Label>{t('autoGenerate.busyTime.end')}</Label>
                    <Input type="time" value={busyDraft.endTime} onChange={(e) => setBusyDraft((p) => ({ ...p, endTime: e.target.value }))} className="rounded-2xl" />
                  </div>
                </div>

                <div className="mt-5 flex justify-end gap-2">
                  <Button variant="secondary" onClick={addBusyFromDraft} className="rounded-2xl">
                    <Plus className="mr-2 h-4 w-4" />
                    {t('common.add')}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={async () => {
                      await saveBusyBlocks();
                      setBusyComposerOpen(false);
                    }}
                    className="rounded-2xl"
                  >
                    {t('common.done')}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="sticky bottom-4 z-10 flex justify-end gap-2">
          <Button
            data-tour="auto-generate"
            onClick={() => handleGenerate({ shuffle: false })}
            disabled={isGenerating}
            className="rounded-2xl bg-blue-700 px-5 text-white shadow-lg hover:bg-blue-700"
          >
            <Wand2 className="mr-2 h-4 w-4" />
            {isGenerating ? t('autoGenerate.generating') : t('autoGenerate.generate')}
          </Button>
        </div>
      </div>
    </div>
  );
}
