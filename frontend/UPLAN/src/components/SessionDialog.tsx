import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { courseColorForSubject } from '../utils/courseColor';

interface SessionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  initialData?: any;
  studyTypes: Array<{ value: string; label: string; color: string }>;
}

export default function SessionDialog({
  isOpen,
  onClose,
  onSave,
  initialData,
  studyTypes,
}: SessionDialogProps) {
  const { t } = useTranslation();

  const days = [
    t('days.short.Monday').replace('.', '') === t('days.short.Monday')
      ? t('sessionDialog.days.monday')
      : t('sessionDialog.days.monday'),
    t('sessionDialog.days.tuesday'),
    t('sessionDialog.days.wednesday'),
    t('sessionDialog.days.thursday'),
    t('sessionDialog.days.friday'),
    t('sessionDialog.days.saturday'),
    t('sessionDialog.days.sunday'),
  ];

  const [formData, setFormData] = useState({
    subject: '',
    startTime: '09:00',
    endTime: '10:00',
    day: 0,
    type: 'reading' as any,
    color: '#3B82F6',
    deadline: '',
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          subject: initialData.subject || '',
          startTime: initialData.startTime || '09:00',
          endTime: initialData.endTime || '10:00',
          day: initialData.day !== undefined ? initialData.day : 0,
          type: initialData.type || 'reading',
          color: initialData.color || '#3B82F6',
          deadline: initialData.deadline || '',
        });
      } else {
        setFormData({
          subject: '',
          startTime: '09:00',
          endTime: '10:00',
          day: 0,
          type: 'reading',
          color: '#3B82F6',
          deadline: '',
        });
      }
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.subject.trim()) {
      alert(t('sessionDialog.errors.subjectRequired'));
      return;
    }

    if (formData.startTime >= formData.endTime) {
      alert(t('sessionDialog.errors.endTimeAfterStart'));
      return;
    }

    if ((formData.type === 'assignment' || formData.type === 'test' || formData.type === 'exam') && !formData.deadline) {
      const confirmWithoutDeadline = window.confirm(
        t('sessionDialog.confirm.noDeadline', {
          type: t(`sessionTypes.${formData.type}`),
        })
      );
      if (!confirmWithoutDeadline) {
        return;
      }
    }

    onSave({
      ...formData,
      color: courseColorForSubject(formData.subject, formData.color),
    });
  };

  const handleTypeChange = (value: string) => {
    const selectedType = studyTypes.find(t => t.value === value);
    setFormData({
      ...formData,
      type: value,
      color: selectedType?.color || formData.color,
    });
  };

  const addOneHour = (timeString: string): string => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const newHours = (hours + 1) % 24;
    return `${String(newHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  const handleStartTimeChange = (newStartTime: string) => {
    const newEndTime = addOneHour(newStartTime);
    setFormData({
      ...formData,
      startTime: newStartTime,
      endTime: newEndTime,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {initialData ? t('sessionDialog.edit.title') : t('sessionDialog.add.title')}
          </DialogTitle>
          <DialogDescription>
            {initialData
              ? t('sessionDialog.edit.description')
              : t('sessionDialog.add.description')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="subject">{t('sessionDialog.fields.subject')}</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder={t('sessionDialog.placeholders.subject')}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="day">{t('sessionDialog.fields.day')}</Label>
            <Select
              value={formData.day.toString()}
              onValueChange={(value) => setFormData({ ...formData, day: parseInt(value) })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {days.map((day, index) => (
                  <SelectItem key={index} value={index.toString()}>
                    {day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startTime">{t('sessionDialog.fields.startTime')}</Label>
              <Input
                id="startTime"
                type="time"
                value={formData.startTime}
                onChange={(e) => handleStartTimeChange(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="endTime">{t('sessionDialog.fields.endTime')}</Label>
              <Input
                id="endTime"
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="type">{t('sessionDialog.fields.type')}</Label>
            <Select
              value={formData.type}
              onValueChange={handleTypeChange}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {studyTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: type.color }}
                      />
                      {t(`sessionTypes.${type.value}`)}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(formData.type === 'assignment' || formData.type === 'test' || formData.type === 'exam') && (
            <div>
              <Label htmlFor="deadline">{t('sessionDialog.fields.deadline')}</Label>
              <Input
                id="deadline"
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="mt-1"
                min={new Date().toISOString().split('T')[0]}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {t('sessionDialog.deadlineHelp')}
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button type="submit">
              {initialData ? t('sessionDialog.actions.update') : t('sessionDialog.actions.add')} {t('sessionDialog.actions.session')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}