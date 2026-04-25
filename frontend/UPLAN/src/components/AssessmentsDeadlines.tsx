import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  ArrowLeft,
  FileText,
  Plus,
  Trash2,
  Calendar,
  CheckCircle2,
  ClipboardList,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import ConfirmDeleteDialog from './ConfirmDeleteDialog';

type AssessmentType = 'assignment' | 'exam' | 'quiz' | 'project';

interface AssessmentsDeadlinesProps {
  onNavigate?: (page: string) => void;
  onBack?: () => void;
}

interface CourseRow {
  id?: string;
  title: string;
}

interface BackendAssessment {
  id: string;
  user_id: string;
  subject: string;
  type: AssessmentType | string;
  dueDate: string;
  title: string;
  completed?: boolean;
  priority?: string | null;
}

export default function AssessmentsDeadlines({ onNavigate, onBack }: AssessmentsDeadlinesProps) {
  const { t } = useTranslation();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const userId = localStorage.getItem('currentUserId') || '';

  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [assessments, setAssessments] = useState<BackendAssessment[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<BackendAssessment | null>(null);
  const [assessmentDraft, setAssessmentDraft] = useState({
    subject: '',
    type: 'exam' as AssessmentType,
    dueDate: '',
    title: '',
  });

  const fetchJson = async (url: string) => {
    const res = await fetch(url, { headers: { 'X-User-Id': userId } });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  };

  const courseOptions = useMemo(() => {
    return Array.from(new Set(courses.map((c) => (c.title || '').trim()).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b)
    );
  }, [courses]);

  useEffect(() => {
    if (!API_BASE_URL || !userId) return;

    (async () => {
      try {
        const cs = await fetchJson(`${API_BASE_URL}/auto-generate/class-schedule?user_id=${encodeURIComponent(userId)}`);
        const rows = Array.isArray(cs?.courses) ? cs.courses : [];
        if (rows.length) setCourses(rows);
      } catch {
        // ignore
      }

      try {
        const a = await fetchJson(
          `${API_BASE_URL}/assessments?user_id=${encodeURIComponent(userId)}&include_completed=true&include_past=true`
        );
        const rows = Array.isArray(a?.assessments) ? a.assessments : [];
        setAssessments(rows);
      } catch {
        // ignore
      }
    })();
  }, [API_BASE_URL, userId]);

  const addAssessment = async () => {
    if (!API_BASE_URL || !userId) return;

    const subject = (assessmentDraft.subject || '').trim();
    if (!subject) {
      toast.error(t('assessments.errors.selectCourse'));
      return;
    }

    const dueDate = (assessmentDraft.dueDate || '').trim();
    if (!dueDate) {
      toast.error(t('assessments.errors.chooseDate'));
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/assessments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
        body: JSON.stringify({
          user_id: userId,
          subject,
          type: assessmentDraft.type,
          dueDate,
          title: (assessmentDraft.title || '').trim() || undefined,
        }),
      });

      if (!res.ok) {
        const msg = await res.text();
        toast.error(msg || t('assessments.errors.createFailed'));
        return;
      }

      const data = await res.json();
      const a = data?.assessment as BackendAssessment | undefined;
      if (a) {
        setAssessments((prev) =>
          [...prev, a].sort((x, y) => String(x?.dueDate).localeCompare(String(y?.dueDate)))
        );
        setAssessmentDraft({ subject, type: assessmentDraft.type, dueDate: '', title: '' });
        toast.success(t('assessments.success.added'));
      }
    } catch (e) {
      console.error(e);
      toast.error(t('assessments.errors.createFailed'));
    }
  };

  const sortAssessments = (rows: BackendAssessment[]) =>
    [...rows].sort((a, b) => {
      if (!!a.completed !== !!b.completed) return a.completed ? 1 : -1;
      return String(a?.dueDate).localeCompare(String(b?.dueDate));
    });

  const toggleAssessmentCompleted = async (id: string, completed: boolean) => {
    if (!API_BASE_URL || !userId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/assessments/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
        body: JSON.stringify({ user_id: userId, completed }),
      });
      if (!res.ok) {
        toast.error(t('assessments.errors.updateFailed'));
        return;
      }
      const data = await res.json();
      const updated = data?.assessment as BackendAssessment | undefined;
      if (updated) {
        setAssessments((prev) => sortAssessments(prev.map((a) => (a?.id === id ? updated : a))));
      }
    } catch {
      toast.error(t('assessments.errors.updateFailed'));
    }
  };

  const deleteAssessment = async (id: string) => {
    if (!API_BASE_URL || !userId) return;
    try {
      const res = await fetch(
        `${API_BASE_URL}/assessments/${encodeURIComponent(id)}?user_id=${encodeURIComponent(userId)}`,
        { method: 'DELETE', headers: { 'X-User-Id': userId } }
      );
      if (res.ok) {
        setAssessments((prev) => prev.filter((a) => a?.id !== id));
        toast.success(t('assessments.success.deleted'));
      }
    } catch {
      // ignore
    }
  };

  const requestDeleteAssessment = (assessment: BackendAssessment) => {
    setDeleteTarget(assessment);
  };

  const confirmDeleteAssessment = async () => {
    if (!deleteTarget) return;
    await deleteAssessment(deleteTarget.id);
    setDeleteTarget(null);
  };

  const formatDueDate = (value: string) => {
    if (!value) return '';
    try {
      return new Date(value).toLocaleString();
    } catch {
      return value;
    }
  };

  return (
    
    <div className="max-w-8xl mx-auto space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        <div className="flex w-full sm:w-auto">
            <Button
              variant="secondary"
              className="w-full rounded-2xl border border-slate-200 bg-white text-slate-900 hover:bg-slate-50 dark:border-white/10 dark:bg-[#0b0b0b] dark:text-white dark:hover:bg-[#111] sm:w-auto"
              onClick={() => {
                if (onBack) onBack();
                else onNavigate?.('dashboard');
              }}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('common.back')}
            </Button>
          </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-700 text-white shadow-sm">
              <FileText className="h-5 w-5" />
            </div>
            
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
                {t('assessments.title')}
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {t('assessments.subtitle')}
              </p>
            </div>
          </div>

          
        </div>

        <Card className="rounded-[28px] border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0b0b0b]">
          <CardHeader className="rounded-t-[28px] border-b border-slate-100 bg-slate-50/70 dark:border-white/10 dark:bg-white/[0.03]">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400">
                <ClipboardList className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base">{t('assessments.listTitle')}</CardTitle>
                <CardDescription>{t('assessments.listDescription')}</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-5 p-4 md:p-6">
            {assessments.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/60 px-4 py-10 text-center dark:border-slate-700 dark:bg-slate-900/40">
                <Calendar className="mx-auto mb-3 h-10 w-10 text-slate-300 dark:text-slate-600" />
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  {t('assessments.empty.title')}
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {t('assessments.empty.description')}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {assessments.map((a) => (
                  <div
                    key={a.id}
                    className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#111]"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex min-w-0 items-start gap-3">
                        <Checkbox
                          className="mt-1"
                          checked={!!a.completed}
                          onCheckedChange={(checked) => toggleAssessmentCompleted(a.id, !!checked)}
                        />

                        <div className="min-w-0">
                          <div
                            className={`truncate font-medium ${
                              a.completed
                                ? 'text-slate-400 line-through dark:text-slate-500'
                                : 'text-slate-900 dark:text-white'
                            }`}
                          >
                            {a.title}
                          </div>

                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                            <span>{a.subject}</span>
                            <span>•</span>
                            <span>{String(a.type).toUpperCase()}</span>
                            <span>•</span>
                            <span>{t('assessments.due')} {formatDueDate(a.dueDate)}</span>
                            {a.priority ? (
                              <>
                                <span>•</span>
                                <span>{String(a.priority).toUpperCase()}</span>
                              </>
                            ) : null}
                          </div>

                          {a.completed && (
                            <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-green-700 px-2.5 py-1 text-[11px] font-medium text-white dark:bg-emerald-950/20 dark:text-emerald-300">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              {t('assessments.completed')}
                            </div>
                          )}
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => requestDeleteAssessment(a)}
                        title={t('common.delete')}
                        className="self-end rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 sm:self-auto"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/70 p-5 dark:border-slate-700 dark:bg-slate-900/40">
              <div className="mb-4">
                <div className="font-semibold text-slate-900 dark:text-white">
                  {t('assessments.add.title')}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {t('assessments.add.description')}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t('assessments.fields.course')}</Label>
                  <Select
                    value={assessmentDraft.subject}
                    onValueChange={(v) => setAssessmentDraft((p) => ({ ...p, subject: v }))}
                  >
                    <SelectTrigger className="rounded-2xl">
                      <SelectValue placeholder={t('assessments.placeholders.selectCourse')} />
                    </SelectTrigger>
                    <SelectContent>
                      {courseOptions.map((courseTitle) => (
                        <SelectItem key={courseTitle} value={courseTitle}>
                          {courseTitle}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t('assessments.courseHint')}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>{t('assessments.fields.type')}</Label>
                  <Select
                    value={assessmentDraft.type}
                    onValueChange={(v) => setAssessmentDraft((p) => ({ ...p, type: v as AssessmentType }))}
                  >
                    <SelectTrigger className="rounded-2xl">
                      <SelectValue placeholder={t('assessments.fields.type')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="exam">{t('assessments.types.exam')}</SelectItem>
                      <SelectItem value="quiz">{t('assessments.types.quiz')}</SelectItem>
                      <SelectItem value="assignment">{t('assessments.types.assignment')}</SelectItem>
                      <SelectItem value="project">{t('assessments.types.project')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t('assessments.fields.dateTime')}</Label>
                  <Input
                    type="datetime-local"
                    value={assessmentDraft.dueDate}
                    onChange={(e) => setAssessmentDraft((p) => ({ ...p, dueDate: e.target.value }))}
                    className="rounded-2xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t('assessments.fields.titleOptional')}</Label>
                  <Input
                    placeholder={t('assessments.placeholders.title')}
                    value={assessmentDraft.title}
                    onChange={(e) => setAssessmentDraft((p) => ({ ...p, title: e.target.value }))}
                    className="rounded-2xl"
                  />
                </div>
              </div>

              <div className="mt-5 flex justify-end">
                <Button
                  onClick={addAssessment}
                  className="w-full rounded-2xl bg-blue-700 text-white hover:bg-blue-800 sm:w-auto"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {t('assessments.add.button')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete assessment"
        description={`This permanently deletes "${deleteTarget?.title || deleteTarget?.subject || 'this assessment'}".`}
        confirmLabel={t('common.delete')}
        onConfirm={confirmDeleteAssessment}
      />
    </div>
  );
}
