import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

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
    
    // Validation
    if (!formData.subject.trim()) {
      alert('Please enter a subject');
      return;
    }

    if (formData.startTime >= formData.endTime) {
      alert('End time must be after start time');
      return;
    }

    // Validate deadline for assignment, test, exam (optional but recommended)
    if ((formData.type === 'assignment' || formData.type === 'test' || formData.type === 'exam') && !formData.deadline) {
      const confirmWithoutDeadline = window.confirm(
        `You're creating a ${formData.type} without a deadline. Are you sure you want to continue?`
      );
      if (!confirmWithoutDeadline) {
        return;
      }
    }

    onSave(formData);
  };

  const handleTypeChange = (value: string) => {
    const selectedType = studyTypes.find(t => t.value === value);
    setFormData({
      ...formData,
      type: value,
      color: selectedType?.color || formData.color,
    });
  };

  // Helper function to add 1 hour to a time string
  const addOneHour = (timeString: string): string => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const newHours = (hours + 1) % 24;
    return `${String(newHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  const handleStartTimeChange = (newStartTime: string) => {
    // Calculate end time as 1 hour after start time
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
            {initialData ? 'Edit Session' : 'Add Study Session'}
          </DialogTitle>
          <DialogDescription>
            {initialData ? 'Update the details of your study session.' : 'Fill in the details to add a new study session to your timetable.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="e.g., Mathematics, Physics"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="day">Day</Label>
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
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={formData.startTime}
                onChange={(e) => handleStartTimeChange(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="endTime">End Time</Label>
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
            <Label htmlFor="type">Type</Label>
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
                      {type.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Deadline field - only show for assignment, test, exam */}
          {(formData.type === 'assignment' || formData.type === 'test' || formData.type === 'exam') && (
            <div>
              <Label htmlFor="deadline">Deadline Date</Label>
              <Input
                id="deadline"
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="mt-1"
                min={new Date().toISOString().split('T')[0]}
              />
              <p className="text-xs text-muted-foreground mt-1">
                This deadline will appear in your Upcoming Deadlines section
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {initialData ? 'Update' : 'Add'} Session
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}