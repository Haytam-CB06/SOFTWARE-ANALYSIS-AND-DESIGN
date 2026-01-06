import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { X, BookOpen, Trash2 } from 'lucide-react';
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

const timeOfDayOptions = [
  { value: 'morning', label: 'Morning' },
  { value: 'afternoon', label: 'Afternoon' },
  { value: 'evening', label: 'Evening' },
  { value: 'any', label: 'Any' },
];

const priorityOptions = [
  { value: 'high', label: 'High', color: 'bg-red-100 text-red-700 border-red-300' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
  { value: 'low', label: 'Low', color: 'bg-green-100 text-green-700 border-green-300' },
];

export default function CourseEditDialog({ isOpen, onClose, course, onSave, onDelete }: CourseEditDialogProps) {
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
      alert('Course name is required');
      return;
    }
    if (formData.selectedDays.length === 0) {
      alert('Please select at least one study day');
      return;
    }
    onSave(formData);
    onClose();
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${formData.name}"? This will regenerate your timetable without this course.`)) {
      onDelete(formData.id);
      onClose();
    }
  };

  const getPriorityColor = (priority: string) => {
    const option = priorityOptions.find(p => p.value === priority);
    return option?.color || '';
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
                <Badge className={`mt-1 ${getPriorityColor(formData.priority)}`}>
                  {formData.priority.charAt(0).toUpperCase() + formData.priority.slice(1)} Priority
                </Badge>
              </div>
            </div>
          </div>
        </DialogHeader>

        <DialogDescription>
          Edit the details of your course to ensure your timetable is accurate and reflects your study schedule.
        </DialogDescription>

        <div className="space-y-6 mt-4">
          {/* Course Name */}
          <div>
            <Label htmlFor="courseName">Course Name</Label>
            <Input
              id="courseName"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Mathematics"
              className="mt-1"
            />
          </div>

          {/* Hours Per Week and Preferred Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="hoursPerWeek">Hours/Week</Label>
              <Input
                id="hoursPerWeek"
                type="number"
                min="1"
                max="20"
                value={formData.hoursPerWeek}
                onChange={(e) => setFormData({ ...formData, hoursPerWeek: Number(e.target.value) })}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="preferredTime">Preferred Time</Label>
              <Select
                value={formData.preferredTimeOfDay}
                onValueChange={(value: any) => setFormData({ ...formData, preferredTimeOfDay: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeOfDayOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Preferred Start Time */}
          <div>
            <Label htmlFor="startTime">Preferred Start Time</Label>
            <Input
              id="startTime"
              type="time"
              value={formData.startTime || ''}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Optional: Set specific start time
            </p>
          </div>

          {/* Session and Break Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sessionDuration">Session Duration (min)</Label>
              <Input
                id="sessionDuration"
                type="number"
                min="15"
                max="120"
                value={formData.sessionDuration}
                onChange={(e) => setFormData({ ...formData, sessionDuration: Number(e.target.value) })}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Recommended: 45-50
              </p>
            </div>

            <div>
              <Label htmlFor="breakDuration">Break Duration (min)</Label>
              <Input
                id="breakDuration"
                type="number"
                min="5"
                max="30"
                value={formData.breakDuration}
                onChange={(e) => setFormData({ ...formData, breakDuration: Number(e.target.value) })}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Recommended: 10-15
              </p>
            </div>
          </div>

          {/* Study Days */}
          <div>
            <Label>Study Days for {formData.name}</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {weekDays.map((day) => (
                <Button
                  key={day}
                  type="button"
                  variant={formData.selectedDays.includes(day) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleDayToggle(day)}
                  className={formData.selectedDays.includes(day) ? 'bg-blue-600 hover:bg-blue-700' : ''}
                >
                  {day.slice(0, 3)}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {formData.selectedDays.length} day{formData.selectedDays.length !== 1 ? 's' : ''} selected
            </p>
          </div>

          {/* Priority Selection */}
          <div>
            <Label>Priority Level</Label>
            <div className="grid grid-cols-3 gap-3 mt-2">
              {priorityOptions.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant={formData.priority === option.value ? 'default' : 'outline'}
                  onClick={() => setFormData({ ...formData, priority: option.value as any })}
                  className={formData.priority === option.value ? 'bg-blue-600 hover:bg-blue-700' : ''}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-6 border-t mt-6">
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Delete Course
          </Button>

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}