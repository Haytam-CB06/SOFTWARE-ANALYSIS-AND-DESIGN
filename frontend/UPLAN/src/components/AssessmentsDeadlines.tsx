import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ArrowLeft, FileText, Plus, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

type AssessmentType = 'assignment' | 'exam' | 'quiz' | 'project';

interface AssessmentsDeadlinesProps {
  onNavigate?: (page: string) => void;
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

export default function AssessmentsDeadlines({ onNavigate }: AssessmentsDeadlinesProps) {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const userId = localStorage.getItem('currentUserId') || '';

  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [assessments, setAssessments] = useState<BackendAssessment[]>([]);
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
    return Array.from(new Set(courses.map((c) => (c.title || '').trim()).filter(Boolean)))
      .sort((a, b) => a.localeCompare(b));
  }, [courses]);

  useEffect(() => {
    if (!API_BASE_URL || !userId) return;

    (async () => {
      // Load courses (so the dropdown matches Auto Generate)
      try {
        const cs = await fetchJson(`${API_BASE_URL}/auto-generate/class-schedule?user_id=${encodeURIComponent(userId)}`);
        const rows = Array.isArray(cs?.courses) ? cs.courses : [];
        if (rows.length) setCourses(rows);
      } catch {
        // ignore
      }

      // Load assessments
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
      toast.error('Please select a course for the assessment');
      return;
    }

    const dueDate = (assessmentDraft.dueDate || '').trim();
    if (!dueDate) {
      toast.error('Please choose a date/time for the assessment');
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
        toast.error(msg || 'Failed to create assessment');
        return;
      }

      const data = await res.json();
      const a = data?.assessment as BackendAssessment | undefined;
      if (a) {
        setAssessments((prev) =>
          [...prev, a].sort((x, y) => String(x?.dueDate).localeCompare(String(y?.dueDate)))
        );
        setAssessmentDraft({ subject, type: assessmentDraft.type, dueDate: '', title: '' });
        toast.success('Assessment added');
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to create assessment');
    }
  };

  const toggleAssessmentCompleted = async (id: string, completed: boolean) => {
    if (!API_BASE_URL || !userId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/assessments/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
        body: JSON.stringify({ user_id: userId, completed }),
      });
      if (!res.ok) {
        toast.error('Failed to update');
        return;
      }
      const data = await res.json();
      const updated = data?.assessment as BackendAssessment | undefined;
      if (updated) {
        setAssessments((prev) => prev.map((a) => (a?.id === id ? updated : a)));
      }
    } catch {
      toast.error('Failed to update');
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
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Header (matches Create Timetable styling) */}
        <div className="bg-blue-600 rounded-2xl p-8 text-white shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <FileText className="w-10 h-10" />
              <div>
                <h1 className="text-3xl font-bold">Assessments</h1>
                <p className="text-blue-100">
                  Track exams, quizzes, assignments, and projects — and keep your Dashboard deadlines accurate.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 w-full md:w-auto">
              <Button
                variant="secondary"
                className="bg-white/10 hover:bg-white/20 text-white border-white/20"
                onClick={() => onNavigate?.('auto-generate')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 text-blue-100 text-sm">
            <FileText className="w-4 h-4" /> Add deadlines once • See them everywhere
          </div>
        </div>

        <Card className="border-2 border-blue-200 shadow-lg">
          <CardHeader className="bg-blue-50 rounded-t-lg border-b border-blue-100">
            <CardTitle className="flex items-center gap-2 text-gray-900">
              Assessments
            </CardTitle>
            <CardDescription className="text-blue-700">
              These automatically show up in the Dashboard <span className="font-medium">Deadlines</span> tab.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {assessments.length === 0 ? (
              <div className="text-sm text-muted-foreground">No assessments added yet.</div>
            ) : (
              <div className="space-y-2">
                {assessments.map((a) => (
                  <div
                    key={a.id}
                    className="rounded-lg border bg-white p-3 flex items-start justify-between gap-3"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <Checkbox
                        className="mt-1"
                        checked={!!a.completed}
                        onCheckedChange={(checked) => toggleAssessmentCompleted(a.id, !!checked)}
                      />
                      <div className="min-w-0">
                        <div className="font-medium truncate">{a.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {a.subject} • {String(a.type).toUpperCase()} • Due{' '}
                          {a.dueDate ? new Date(a.dueDate).toLocaleString() : ''}
                          {a.priority ? ` • ${String(a.priority).toUpperCase()}` : ''}
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteAssessment(a.id)}
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="rounded-lg border bg-white p-4 space-y-3">
              <div className="font-medium">Add assessment</div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Course</Label>
                  <Select
                    value={assessmentDraft.subject}
                    onValueChange={(v) => setAssessmentDraft((p) => ({ ...p, subject: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courseOptions.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    If a course is missing, add it in <span className="font-medium">Auto Generate → Class Timetable</span>.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={assessmentDraft.type}
                    onValueChange={(v) => setAssessmentDraft((p) => ({ ...p, type: v as AssessmentType }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="exam">Exam</SelectItem>
                      <SelectItem value="quiz">Quiz</SelectItem>
                      <SelectItem value="assignment">Assignment</SelectItem>
                      <SelectItem value="project">Project</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Date &amp; time</Label>
                  <Input
                    type="datetime-local"
                    value={assessmentDraft.dueDate}
                    onChange={(e) => setAssessmentDraft((p) => ({ ...p, dueDate: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Title (optional)</Label>
                  <Input
                    placeholder="Leave blank to auto-name"
                    value={assessmentDraft.title}
                    onChange={(e) => setAssessmentDraft((p) => ({ ...p, title: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button variant="secondary" onClick={addAssessment}>
                  <Plus className="w-4 h-4 mr-2" /> Add
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
