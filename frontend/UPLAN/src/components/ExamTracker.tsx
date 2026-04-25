import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, Plus, X, Clock, BookOpen, AlertCircle, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from './ui/dialog';
import { toast } from 'sonner@2.0.3';
import ConfirmDeleteDialog from './ConfirmDeleteDialog';

interface Exam {
  id: string;
  subject: string;
  date: string;
  time: string;
  location: string;
  priority: 'high' | 'medium' | 'low';
  notes: string;
}

export default function ExamTracker() {
  const { t } = useTranslation();

  const [exams, setExams] = useState<Exam[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Exam | null>(null);
  const [newExam, setNewExam] = useState<Exam>({
    id: '',
    subject: '',
    date: '',
    time: '',
    location: '',
    priority: 'medium',
    notes: '',
  });

  useEffect(() => {
    const savedExams = localStorage.getItem('exams');
    if (savedExams) {
      setExams(JSON.parse(savedExams));
    }
  }, []);

  useEffect(() => {
    if (exams.length > 0 || localStorage.getItem('exams')) {
      localStorage.setItem('exams', JSON.stringify(exams));
    }
  }, [exams]);

  const handleAddExam = () => {
    if (!newExam.subject || !newExam.date) {
      toast.error(t('examTracker.errors.required'));
      return;
    }

    const exam: Exam = {
      ...newExam,
      id: Date.now().toString(),
    };

    setExams([...exams, exam]);
    setNewExam({
      id: '',
      subject: '',
      date: '',
      time: '',
      location: '',
      priority: 'medium',
      notes: '',
    });
    setIsAddDialogOpen(false);
    toast.success(t('examTracker.success.added'));
  };

  const handleDeleteExam = (id: string) => {
    setExams(exams.filter(e => e.id !== id));
    toast.success(t('examTracker.success.deleted'));
  };

  const confirmDeleteExam = () => {
    if (!deleteTarget) return;
    handleDeleteExam(deleteTarget.id);
    setDeleteTarget(null);
  };

  const getDaysUntilExam = (examDate: string): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exam = new Date(examDate);
    exam.setHours(0, 0, 0, 0);
    const diffTime = exam.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const sortedExams = [...exams].sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const upcomingExams = sortedExams.filter(exam => getDaysUntilExam(exam.date) >= 0);
  const pastExams = sortedExams.filter(exam => getDaysUntilExam(exam.date) < 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1>{t('examTracker.title')}</h1>
          <p className="mt-2 text-muted-foreground">
            {t('examTracker.subtitle')}
          </p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              {t('examTracker.actions.add')}
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{t('examTracker.dialog.title')}</DialogTitle>
              <DialogDescription>
                {t('examTracker.dialog.description')}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              <div>
                <Label>{t('examTracker.fields.subject')}</Label>
                <Input
                  value={newExam.subject}
                  onChange={(e) => setNewExam({ ...newExam, subject: e.target.value })}
                  placeholder={t('examTracker.placeholders.subject')}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t('examTracker.fields.date')}</Label>
                  <Input
                    type="date"
                    value={newExam.date}
                    onChange={(e) => setNewExam({ ...newExam, date: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{t('examTracker.fields.time')}</Label>
                  <Input
                    type="time"
                    value={newExam.time}
                    onChange={(e) => setNewExam({ ...newExam, time: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label>{t('examTracker.fields.location')}</Label>
                <Input
                  value={newExam.location}
                  onChange={(e) => setNewExam({ ...newExam, location: e.target.value })}
                  placeholder={t('examTracker.placeholders.location')}
                />
              </div>

              <div>
                <Label>{t('examTracker.fields.priority')}</Label>
                <div className="flex gap-2 mt-2">
                  {['high', 'medium', 'low'].map((priority) => (
                    <Button
                      key={priority}
                      type="button"
                      variant={newExam.priority === priority ? 'default' : 'outline'}
                      onClick={() => setNewExam({ ...newExam, priority: priority as any })}
                      className="flex-1"
                    >
                      {t(`examTracker.priority.${priority}`)}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label>{t('examTracker.fields.notes')}</Label>
                <Input
                  value={newExam.notes}
                  onChange={(e) => setNewExam({ ...newExam, notes: e.target.value })}
                  placeholder={t('examTracker.placeholders.notes')}
                />
              </div>

              <Button onClick={handleAddExam} className="w-full">
                {t('examTracker.actions.add')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Upcoming Exams */}
      <div>
        <h2>{t('examTracker.upcoming')}</h2>

        {upcomingExams.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>{t('examTracker.empty.title')}</p>
              <p className="mt-2">{t('examTracker.empty.subtitle')}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {upcomingExams.map((exam) => {
              const daysUntil = getDaysUntilExam(exam.date);
              const isUrgent = daysUntil <= 7;

              return (
                <Card key={exam.id}>
                  <CardHeader>
                    <div className="flex justify-between">
                      <div>
                        <CardTitle>{exam.subject}</CardTitle>
                        <CardDescription>
                          {new Date(exam.date).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <Button onClick={() => setDeleteTarget(exam)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div>
                      {daysUntil === 0
                        ? t('examTracker.today')
                        : daysUntil === 1
                        ? t('examTracker.tomorrow')
                        : t('examTracker.daysAway', { count: daysUntil })}
                    </div>

                    <Badge className={getPriorityColor(exam.priority)}>
                      {t(`examTracker.priority.${exam.priority}`)}
                    </Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete exam"
        description={`This permanently deletes "${deleteTarget?.subject || 'this exam'}".`}
        confirmLabel={t('common.delete')}
        onConfirm={confirmDeleteExam}
      />
    </div>
  );
}
