import { useState, useEffect } from 'react';
import { Calendar, Plus, X, Clock, BookOpen, AlertCircle, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from './ui/dialog';
import { toast } from 'sonner@2.0.3';

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
  const [exams, setExams] = useState<Exam[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newExam, setNewExam] = useState<Exam>({
    id: '',
    subject: '',
    date: '',
    time: '',
    location: '',
    priority: 'medium',
    notes: '',
  });

  // Load exams from localStorage
  useEffect(() => {
    const savedExams = localStorage.getItem('exams');
    if (savedExams) {
      setExams(JSON.parse(savedExams));
    }
  }, []);

  // Save exams to localStorage
  useEffect(() => {
    if (exams.length > 0 || localStorage.getItem('exams')) {
      localStorage.setItem('exams', JSON.stringify(exams));
    }
  }, [exams]);

  const handleAddExam = () => {
    if (!newExam.subject || !newExam.date) {
      toast.error('Please fill in subject and date');
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
    toast.success('Exam added successfully!');
  };

  const handleDeleteExam = (id: string) => {
    setExams(exams.filter(e => e.id !== id));
    toast.success('Exam deleted');
  };

  const getDaysUntilExam = (examDate: string): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exam = new Date(examDate);
    exam.setHours(0, 0, 0, 0);
    const diffTime = exam.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
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
          <h1 className="text-blue-600 dark:text-blue-400">Exam Tracker</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Track your upcoming exams and prepare accordingly
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Add Exam
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Exam</DialogTitle>
              <DialogDescription>
                Schedule a new exam or test session for your study timetable.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  value={newExam.subject}
                  onChange={(e) => setNewExam({ ...newExam, subject: e.target.value })}
                  placeholder="e.g., Mathematics"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={newExam.date}
                    onChange={(e) => setNewExam({ ...newExam, date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="time">Time</Label>
                  <Input
                    id="time"
                    type="time"
                    value={newExam.time}
                    onChange={(e) => setNewExam({ ...newExam, time: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={newExam.location}
                  onChange={(e) => setNewExam({ ...newExam, location: e.target.value })}
                  placeholder="e.g., Room 301"
                />
              </div>
              <div>
                <Label>Priority</Label>
                <div className="flex gap-2 mt-2">
                  {['high', 'medium', 'low'].map((priority) => (
                    <Button
                      key={priority}
                      type="button"
                      variant={newExam.priority === priority ? 'default' : 'outline'}
                      onClick={() => setNewExam({ ...newExam, priority: priority as 'high' | 'medium' | 'low' })}
                      className="flex-1"
                    >
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  value={newExam.notes}
                  onChange={(e) => setNewExam({ ...newExam, notes: e.target.value })}
                  placeholder="Additional notes..."
                />
              </div>
              <Button 
                onClick={handleAddExam}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                Add Exam
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Upcoming Exams */}
      <div>
        <h2 className="mb-4 text-gray-900 dark:text-gray-100">Upcoming Exams</h2>
        {upcomingExams.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">No upcoming exams scheduled</p>
              <p className="text-gray-400 mt-2">Add your exam dates to start tracking</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {upcomingExams.map((exam) => {
              const daysUntil = getDaysUntilExam(exam.date);
              const isUrgent = daysUntil <= 7;
              
              return (
                <Card key={exam.id} className={`relative ${isUrgent ? 'border-red-300 bg-red-50/50 dark:bg-red-950/20' : ''}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-gray-900 dark:text-gray-100">{exam.subject}</CardTitle>
                        <CardDescription className="mt-1">
                          {new Date(exam.date).toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteExam(exam.id)}
                        className="text-gray-400 hover:text-red-600 -mt-2 -mr-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Countdown */}
                    <div className={`flex items-center gap-2 p-3 rounded-lg ${
                      isUrgent 
                        ? 'bg-red-100 dark:bg-red-900/30' 
                        : 'bg-blue-50 dark:bg-blue-900/20'
                    }`}>
                      <Clock className={`w-4 h-4 ${isUrgent ? 'text-red-600' : 'text-blue-600'}`} />
                      <span className={isUrgent ? 'text-red-700 dark:text-red-400' : 'text-blue-700 dark:text-blue-400'}>
                        {daysUntil === 0 ? 'Today!' : 
                         daysUntil === 1 ? 'Tomorrow!' :
                         `${daysUntil} days away`}
                      </span>
                    </div>

                    {/* Details */}
                    {exam.time && (
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Clock className="w-4 h-4" />
                        <span>{exam.time}</span>
                      </div>
                    )}
                    {exam.location && (
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <BookOpen className="w-4 h-4" />
                        <span>{exam.location}</span>
                      </div>
                    )}
                    
                    {/* Priority Badge */}
                    <div className="flex items-center gap-2">
                      <Badge className={getPriorityColor(exam.priority)}>
                        {exam.priority.charAt(0).toUpperCase() + exam.priority.slice(1)} Priority
                      </Badge>
                    </div>

                    {exam.notes && (
                      <p className="text-gray-600 dark:text-gray-400 pt-2 border-t">{exam.notes}</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Past Exams */}
      {pastExams.length > 0 && (
        <div>
          <h2 className="mb-4 text-gray-900 dark:text-gray-100">Past Exams</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pastExams.map((exam) => (
              <Card key={exam.id} className="opacity-60">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-gray-900 dark:text-gray-100">{exam.subject}</CardTitle>
                      <CardDescription className="mt-1">
                        {new Date(exam.date).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteExam(exam.id)}
                      className="text-gray-400 hover:text-red-600 -mt-2 -mr-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Badge variant="outline" className="bg-gray-100 text-gray-600">
                    Completed
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
