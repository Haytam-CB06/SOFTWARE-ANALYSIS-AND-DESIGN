import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { BookOpen, Trash2 } from 'lucide-react';
import { Badge } from './ui/badge';

interface Subject {
  id: string;
  name: string;
  color: string;
  priority: 'high' | 'medium' | 'low';
  hoursPerWeek: number;
  preferredTimeOfDay: 'morning' | 'afternoon' | 'evening' | 'any';
  selectedDays: string[];
  sessionDuration: number;
  breakDuration: number;
  startTime?: string;
}

interface CourseEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  course: Subject | null;
  onSave: (updatedCourse: Subject) => void;
  onDelete: (courseId: string) => void;
}

const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function CourseEditDialog({ isOpen, onClose, course, onSave, onDelete }: CourseEditDialogProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<Subject | null>(null);

  useEffect(() => {
    if (course) {
      setFormData({ ...course });
    }
  }, [course]);

  if (!formData) return null;

  const handleDayToggle = (day: string) => {
    const newDays = formData.selectedDays.includes(day)
      ? formData.selectedDays.filter(d => d !== day)
      : [...formData.selectedDays, day];
    setFormData({ ...formData, selectedDays: newDays });
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      alert(t('courseEdit.errors.nameRequired'));
      return;
    }
    if (formData.selectedDays.length === 0) {
      alert(t('courseEdit.errors.selectDay'));
      return;
    }
    onSave(formData);
    onClose();
  };

  const handleDelete = () => {
    if (
      window.confirm(
        t('courseEdit.confirmDelete', { name: formData.name })
      )
    ) {
      onDelete(formData.id);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${formData.color} rounded-lg flex items-center justify-center`}>
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl">{formData.name}</DialogTitle>
                <Badge className="mt-1">
                  {t(`courseEdit.priority.${formData.priority}`)}
                </Badge>
              </div>
            </div>
          </div>
        </DialogHeader>

        <DialogDescription>
          {t('courseEdit.description')}
        </DialogDescription>

        <div className="space-y-6 mt-4">
          {/* Course Name */}
          <div>
            <Label htmlFor="courseName">{t('courseEdit.fields.name')}</Label>
            <Input
              id="courseName"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={t('courseEdit.placeholders.name')}
              className="mt-1"
            />
          </div>

          {/* Hours + Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{t('courseEdit.fields.hours')}</Label>
              <Input
                type="number"
                min="1"
                max="20"
                value={formData.hoursPerWeek}
                onChange={(e) => setFormData({ ...formData, hoursPerWeek: Number(e.target.value) })}
              />
            </div>

            <div>
              <Label>{t('courseEdit.fields.preferredTime')}</Label>
              <Select
                value={formData.preferredTimeOfDay}
                onValueChange={(value: any) =>
                  setFormData({ ...formData, preferredTimeOfDay: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">{t('courseEdit.time.morning')}</SelectItem>
                  <SelectItem value="afternoon">{t('courseEdit.time.afternoon')}</SelectItem>
                  <SelectItem value="evening">{t('courseEdit.time.evening')}</SelectItem>
                  <SelectItem value="any">{t('courseEdit.time.any')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Start Time */}
          <div>
            <Label>{t('courseEdit.fields.startTime')}</Label>
            <Input
              type="time"
              value={formData.startTime || ''}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {t('courseEdit.hints.startTime')}
            </p>
          </div>

          {/* Durations */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{t('courseEdit.fields.sessionDuration')}</Label>
              <Input
                type="number"
                value={formData.sessionDuration}
                onChange={(e) => setFormData({ ...formData, sessionDuration: Number(e.target.value) })}
              />
              <p className="text-xs text-muted-foreground">
                {t('courseEdit.hints.session')}
              </p>
            </div>

            <div>
              <Label>{t('courseEdit.fields.breakDuration')}</Label>
              <Input
                type="number"
                value={formData.breakDuration}
                onChange={(e) => setFormData({ ...formData, breakDuration: Number(e.target.value) })}
              />
              <p className="text-xs text-muted-foreground">
                {t('courseEdit.hints.break')}
              </p>
            </div>
          </div>

          {/* Days */}
          <div>
            <Label>
              {t('courseEdit.fields.studyDays', { name: formData.name })}
            </Label>

            <div className="flex flex-wrap gap-2 mt-2">
              {weekDays.map((day) => (
                <Button
                  key={day}
                  type="button"
                  variant={formData.selectedDays.includes(day) ? 'default' : 'outline'}
                  onClick={() => handleDayToggle(day)}
                >
                  {t(`days.short.${day}`)}
                </Button>
              ))}
            </div>

            <p className="text-xs text-muted-foreground mt-2">
              {t('courseEdit.selectedDays', { count: formData.selectedDays.length })}
            </p>
          </div>

          {/* Priority */}
          <div>
            <Label>{t('courseEdit.fields.priority')}</Label>
            <div className="grid grid-cols-3 gap-3 mt-2">
              {['high', 'medium', 'low'].map((p) => (
                <Button
                  key={p}
                  variant={formData.priority === p ? 'default' : 'outline'}
                  onClick={() => setFormData({ ...formData, priority: p as any })}
                >
                  {t(`courseEdit.priority.${p}`)}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between pt-6 border-t mt-6">
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
            {t('courseEdit.actions.delete')}
          </Button>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              {t('courseEdit.actions.cancel')}
            </Button>
            <Button onClick={handleSave}>
              {t('courseEdit.actions.save')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}