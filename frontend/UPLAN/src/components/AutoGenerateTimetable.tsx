import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Checkbox } from './ui/checkbox';
import { ArrowLeft, Brain, Pencil, Plus, Save, Sparkles, Trash2, Upload } from 'lucide-react';
import { getWeekIdentifier } from '../src/utils/dateUtils';
import { getUserWeekKey } from '../utils/userStorage';

type Priority = 'low' | 'medium' | 'high';
type AssessmentType = 'assignment' | 'exam' | 'quiz' | 'project';

interface AutoGenerateTimetableProps {
  onNavigate?: (page: string) => void;
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

export default function AutoGenerateTimetable({ onNavigate }: AutoGenerateTimetableProps) {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const userId = localStorage.getItem('currentUserId') || '';

  const today = useMemo(() => new Date(), []);
  const weekId = useMemo(() => getWeekIdentifier(today), [today]);
  const weekKey = useMemo(() => getUserWeekKey(weekId), [weekId]);

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
      localStorage.setItem('autoGenBreakMinutes', String(breakMinutes));
    } catch {
      // ignore
    }
  }, [breakMinutes]);

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
      const raw = localStorage.getItem(weekKey);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const existingWeekBusyBlocks = useMemo(() => {
    if (!treatExistingWeekAsBusy) return [];
    return weekSessions
      .filter((s: any) => s && typeof s.day === 'number' && s.startTime && s.endTime)
      .map((s: any) => ({
        title: s.subject || 'Busy',
        day: s.day,
        startTime: s.startTime,
        endTime: s.endTime,
      }));
  }, [weekSessions, treatExistingWeekAsBusy]);

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
    if (!API_BASE_URL || !userId) return;

    (async () => {
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

      // Load current week's study sessions from backend (so auto-generate can merge safely)
      try {
        const res = await fetch(
          `${API_BASE_URL}/timetable/user/${encodeURIComponent(userId)}/sessions?week_id=${encodeURIComponent(weekId)}`,
          { headers: { 'X-User-Id': userId } }
        );
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setWeekSessions(data);
            localStorage.setItem(weekKey, JSON.stringify(data));
            window.dispatchEvent(new Event('calendarSessionsUpdated'));
          }
        }
      } catch {
        // ignore
      }


      // Load current week study sessions from backend (so generation respects cross-browser data)
      try {
        const res = await fetch(
          `${API_BASE_URL}/timetable/user/${encodeURIComponent(userId)}/sessions?week_id=${encodeURIComponent(weekId)}`,
          { headers: { 'X-User-Id': userId } }
        );
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setWeekSessions(data);
            localStorage.setItem(weekKey, JSON.stringify(data));
          }
        }
      } catch {
        // ignore
      }
    })();
  }, [API_BASE_URL, userId, weekId, weekKey]);

  const saveStudyWindow = async () => {
    if (!API_BASE_URL || !userId) return;
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

  const handleGenerate = async () => {
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

      const payload = {
        user_id: userId,
        treat_class_schedule_as_busy: true,
        breakMinutes,
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
          ...busy.map((b) => ({ title: b.title, day: b.day, startTime: b.startTime, endTime: b.endTime })),
        ],
      };

      const res = await fetch(`${API_BASE_URL}/auto-generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const msg = await res.text();
        toast.error(`Auto generation failed: ${msg}`);
        return;
      }

      const data = await res.json();
      const generatedSessions = Array.isArray(data?.sessions) ? data.sessions : [];
      if (generatedSessions.length === 0) {
        toast.error('No free time available for the selected study window');
        return;
      }

      let merged = [...weekSessions];
      if (replaceStudySessions) {
        merged = merged.filter((s: any) => !['reading', 'revision', 'practice'].includes(s?.type));
      }
      merged = [...merged, ...generatedSessions];

      localStorage.setItem(weekKey, JSON.stringify(merged));
      setWeekSessions(merged);
      window.dispatchEvent(new Event('calendarSessionsUpdated'));

      // Persist to backend so it shows across browsers
      try {
        await fetch(`${API_BASE_URL}/timetable/user/${encodeURIComponent(userId)}/sessions?week_id=${encodeURIComponent(weekId)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
          body: JSON.stringify(merged),
        });
      } catch {
        // best effort
      }

      toast.success(`✅ Generated ${generatedSessions.length} study sessions.`);
      onNavigate?.('my-timetable');
    } catch (e) {
      console.error(e);
      toast.error('Auto generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Header (matches Create Timetable styling) */}
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
                onClick={() => onNavigate?.('my-timetable')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="ml-auto bg-blue-500 hover:bg-blue-400 text-white shadow-lg"
              >
                <Sparkles className="w-4 h-4 mr-2" /> {isGenerating ? 'Generating…' : 'Generate'}
              </Button>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 text-blue-100 text-sm">
            <Sparkles className="w-4 h-4" /> Balanced sessions • Priority-aware • Breaks respected
          </div>
        </div>

        {/* Study window */}
        <Card className="border-2 border-blue-200 shadow-lg">
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
        <Card className="border-2 border-blue-200 shadow-lg">
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
              <div className="rounded-lg border bg-white p-4 space-y-3">
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
        <Card className="border-2 border-blue-200 shadow-lg">
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
      </div>
    </div>
  );
}
