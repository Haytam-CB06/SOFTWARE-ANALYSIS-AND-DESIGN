import { useState, useEffect } from 'react';
import { Target, Plus, Check, X, TrendingUp, Calendar, Clock, Award, Trash2, Edit2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from 'sonner@2.0.3';

interface Goal {
  id: string;
  title: string;
  description: string;
  targetHours: number;
  completedHours: number;
  deadline: string;
  category: string;
  status: 'active' | 'completed' | 'overdue';
}

interface Task {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
  notes: string;
}

interface StudySession {
  id: string;
  subject: string;
  duration: number; // in minutes
  date: string;
  notes: string;
}

export default function ProgressTracking() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [isAddGoalDialogOpen, setIsAddGoalDialogOpen] = useState(false);
  const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState(false);
  const [isAddSessionDialogOpen, setIsAddSessionDialogOpen] = useState(false);

  const [newGoal, setNewGoal] = useState<Partial<Goal>>({
    title: '',
    description: '',
    targetHours: 0,
    completedHours: 0,
    deadline: '',
    category: '',
  });

  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: '',
    subject: '',
    dueDate: '',
    priority: 'medium',
    notes: '',
  });

  const [newSession, setNewSession] = useState<Partial<StudySession>>({
    subject: '',
    duration: 30,
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  // Load data from localStorage
  useEffect(() => {
    const savedGoals = localStorage.getItem('studyGoals');
    const savedTasks = localStorage.getItem('studyTasks');
    const savedSessions = localStorage.getItem('studySessions');

    if (savedGoals) setGoals(JSON.parse(savedGoals));
    if (savedTasks) setTasks(JSON.parse(savedTasks));
    if (savedSessions) setStudySessions(JSON.parse(savedSessions));
  }, []);

  // Save data to localStorage
  useEffect(() => {
    if (goals.length > 0 || localStorage.getItem('studyGoals')) {
      localStorage.setItem('studyGoals', JSON.stringify(goals));
    }
  }, [goals]);

  useEffect(() => {
    if (tasks.length > 0 || localStorage.getItem('studyTasks')) {
      localStorage.setItem('studyTasks', JSON.stringify(tasks));
    }
  }, [tasks]);

  useEffect(() => {
    if (studySessions.length > 0 || localStorage.getItem('studySessions')) {
      localStorage.setItem('studySessions', JSON.stringify(studySessions));
    }
  }, [studySessions]);

  // Handle adding a goal
  const handleAddGoal = () => {
    if (!newGoal.title || !newGoal.targetHours || !newGoal.deadline) {
      toast.error('Please fill in all required fields');
      return;
    }

    const goal: Goal = {
      id: Date.now().toString(),
      title: newGoal.title,
      description: newGoal.description || '',
      targetHours: newGoal.targetHours,
      completedHours: 0,
      deadline: newGoal.deadline,
      category: newGoal.category || 'General',
      status: 'active',
    };

    setGoals([...goals, goal]);
    setNewGoal({ title: '', description: '', targetHours: 0, completedHours: 0, deadline: '', category: '' });
    setIsAddGoalDialogOpen(false);
    toast.success('Goal added successfully!');
  };

  // Handle adding a task
  const handleAddTask = () => {
    if (!newTask.title || !newTask.subject) {
      toast.error('Please fill in title and subject');
      return;
    }

    const task: Task = {
      id: Date.now().toString(),
      title: newTask.title,
      subject: newTask.subject,
      dueDate: newTask.dueDate || '',
      priority: newTask.priority || 'medium',
      completed: false,
      notes: newTask.notes || '',
    };

    setTasks([...tasks, task]);
    setNewTask({ title: '', subject: '', dueDate: '', priority: 'medium', notes: '' });
    setIsAddTaskDialogOpen(false);
    toast.success('Task added successfully!');
  };

  // Handle adding a study session
  const handleAddSession = () => {
    if (!newSession.subject || !newSession.duration) {
      toast.error('Please fill in subject and duration');
      return;
    }

    const session: StudySession = {
      id: Date.now().toString(),
      subject: newSession.subject,
      duration: newSession.duration,
      date: newSession.date || new Date().toISOString().split('T')[0],
      notes: newSession.notes || '',
    };

    setStudySessions([...studySessions, session]);
    
    // Update goal progress
    updateGoalProgress(session.subject, session.duration / 60);
    
    setNewSession({ subject: '', duration: 30, date: new Date().toISOString().split('T')[0], notes: '' });
    setIsAddSessionDialogOpen(false);
    toast.success('Study session logged!');
  };

  // Update goal progress
  const updateGoalProgress = (category: string, hours: number) => {
    setGoals(goals.map(goal => {
      if (goal.category.toLowerCase() === category.toLowerCase() && goal.status === 'active') {
        const newCompletedHours = goal.completedHours + hours;
        const newStatus = newCompletedHours >= goal.targetHours ? 'completed' : 'active';
        
        if (newStatus === 'completed') {
          toast.success(`🎉 Congratulations! You've completed your "${goal.title}" goal!`);
        }
        
        return {
          ...goal,
          completedHours: newCompletedHours,
          status: newStatus,
        };
      }
      return goal;
    }));
  };

  // Toggle task completion
  const toggleTaskCompletion = (id: string) => {
    setTasks(tasks.map(task => {
      if (task.id === id) {
        const newCompleted = !task.completed;
        if (newCompleted) {
          toast.success('Task completed! 🎉');
        }
        return { ...task, completed: newCompleted };
      }
      return task;
    }));
  };

  // Delete functions
  const deleteGoal = (id: string) => {
    setGoals(goals.filter(g => g.id !== id));
    toast.success('Goal deleted');
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
    toast.success('Task deleted');
  };

  // Calculate statistics
  const totalStudyHours = studySessions.reduce((sum, session) => sum + session.duration / 60, 0);
  const completedTasks = tasks.filter(t => t.completed).length;
  const totalTasks = tasks.length;
  const completedGoals = goals.filter(g => g.status === 'completed').length;
  const activeGoals = goals.filter(g => g.status === 'active');

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-blue-600 dark:text-blue-400">Progress Tracking</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Track your study goals, tasks, and overall progress
        </p>
      </div>

      {/* Statistics Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400">Total Study Hours</p>
                <h3 className="mt-2 text-blue-600 dark:text-blue-400">{totalStudyHours.toFixed(1)}h</h3>
              </div>
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400">Tasks Completed</p>
                <h3 className="mt-2 text-green-600 dark:text-green-400">{completedTasks}/{totalTasks}</h3>
              </div>
              <Check className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400">Goals Achieved</p>
                <h3 className="mt-2 text-purple-600 dark:text-purple-400">{completedGoals}</h3>
              </div>
              <Award className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400">Active Goals</p>
                <h3 className="mt-2 text-orange-600 dark:text-orange-400">{activeGoals.length}</h3>
              </div>
              <Target className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content with Tabs */}
      <Tabs defaultValue="goals" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="goals">Study Goals</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="sessions">Study Log</TabsTrigger>
        </TabsList>

        {/* Goals Tab */}
        <TabsContent value="goals" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isAddGoalDialogOpen} onOpenChange={setIsAddGoalDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Goal
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Study Goal</DialogTitle>
                  <DialogDescription>
                    Set a new study goal to track your progress and stay motivated.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="goalTitle">Goal Title *</Label>
                    <Input
                      id="goalTitle"
                      value={newGoal.title}
                      onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                      placeholder="e.g., Master Calculus"
                    />
                  </div>
                  <div>
                    <Label htmlFor="goalDescription">Description</Label>
                    <Input
                      id="goalDescription"
                      value={newGoal.description}
                      onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                      placeholder="Additional details..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="goalCategory">Category/Subject *</Label>
                    <Input
                      id="goalCategory"
                      value={newGoal.category}
                      onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value })}
                      placeholder="e.g., Mathematics"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="targetHours">Target Hours *</Label>
                      <Input
                        id="targetHours"
                        type="number"
                        value={newGoal.targetHours}
                        onChange={(e) => setNewGoal({ ...newGoal, targetHours: parseFloat(e.target.value) })}
                        min="1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="deadline">Deadline *</Label>
                      <Input
                        id="deadline"
                        type="date"
                        value={newGoal.deadline}
                        onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
                      />
                    </div>
                  </div>
                  <Button onClick={handleAddGoal} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                    Create Goal
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {goals.length === 0 ? (
              <Card className="md:col-span-2">
                <CardContent className="p-12 text-center">
                  <Target className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">No study goals yet</p>
                  <p className="text-gray-400 mt-2">Create your first goal to start tracking progress</p>
                </CardContent>
              </Card>
            ) : (
              goals.map((goal) => {
                const progress = Math.min((goal.completedHours / goal.targetHours) * 100, 100);
                const daysLeft = Math.ceil((new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                
                return (
                  <Card key={goal.id} className={goal.status === 'completed' ? 'border-green-300 bg-green-50/50 dark:bg-green-950/20' : ''}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-gray-900 dark:text-gray-100">{goal.title}</CardTitle>
                          <CardDescription className="mt-1">{goal.category}</CardDescription>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteGoal(goal.id)}
                          className="text-gray-400 hover:text-red-600 -mt-2 -mr-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {goal.description && (
                        <p className="text-gray-600 dark:text-gray-400">{goal.description}</p>
                      )}
                      
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-gray-700 dark:text-gray-300">
                            {goal.completedHours.toFixed(1)}h / {goal.targetHours}h
                          </span>
                          <span className="text-gray-600 dark:text-gray-400">{progress.toFixed(0)}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {daysLeft > 0 ? `${daysLeft} days left` : daysLeft === 0 ? 'Due today' : 'Overdue'}
                          </span>
                        </div>
                        {goal.status === 'completed' && (
                          <Badge className="bg-green-100 text-green-800 border-green-300">
                            <Check className="w-3 h-3 mr-1" />
                            Completed
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isAddTaskDialogOpen} onOpenChange={setIsAddTaskDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Task
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Task</DialogTitle>
                  <DialogDescription>
                    Create a new task to help organize and track your study activities.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="taskTitle">Task Title *</Label>
                    <Input
                      id="taskTitle"
                      value={newTask.title}
                      onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                      placeholder="e.g., Complete Chapter 5 exercises"
                    />
                  </div>
                  <div>
                    <Label htmlFor="taskSubject">Subject *</Label>
                    <Input
                      id="taskSubject"
                      value={newTask.subject}
                      onChange={(e) => setNewTask({ ...newTask, subject: e.target.value })}
                      placeholder="e.g., Mathematics"
                    />
                  </div>
                  <div>
                    <Label htmlFor="taskDueDate">Due Date</Label>
                    <Input
                      id="taskDueDate"
                      type="date"
                      value={newTask.dueDate}
                      onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Priority</Label>
                    <div className="flex gap-2 mt-2">
                      {['high', 'medium', 'low'].map((priority) => (
                        <Button
                          key={priority}
                          type="button"
                          variant={newTask.priority === priority ? 'default' : 'outline'}
                          onClick={() => setNewTask({ ...newTask, priority: priority as 'high' | 'medium' | 'low' })}
                          className="flex-1"
                        >
                          {priority.charAt(0).toUpperCase() + priority.slice(1)}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="taskNotes">Notes</Label>
                    <Input
                      id="taskNotes"
                      value={newTask.notes}
                      onChange={(e) => setNewTask({ ...newTask, notes: e.target.value })}
                      placeholder="Additional notes..."
                    />
                  </div>
                  <Button onClick={handleAddTask} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                    Add Task
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-2">
            {tasks.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Check className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">No tasks yet</p>
                  <p className="text-gray-400 mt-2">Add tasks to keep track of your work</p>
                </CardContent>
              </Card>
            ) : (
              tasks.map((task) => (
                <Card key={task.id} className={task.completed ? 'opacity-60' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleTaskCompletion(task.id)}
                        className={`p-0 h-6 w-6 rounded-full border-2 ${
                          task.completed 
                            ? 'bg-green-500 border-green-500' 
                            : 'border-gray-300 hover:border-blue-500'
                        }`}
                      >
                        {task.completed && <Check className="w-4 h-4 text-white" />}
                      </Button>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className={`text-gray-900 dark:text-gray-100 ${task.completed ? 'line-through' : ''}`}>
                            {task.title}
                          </h3>
                          <Badge variant="outline" className="text-blue-600 border-blue-300">
                            {task.subject}
                          </Badge>
                          {task.priority === 'high' && (
                            <Badge className="bg-red-100 text-red-800 border-red-300">High</Badge>
                          )}
                        </div>
                        {task.dueDate && (
                          <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Due: {new Date(task.dueDate).toLocaleDateString()}
                          </p>
                        )}
                        {task.notes && (
                          <p className="text-gray-500 dark:text-gray-400 mt-1">{task.notes}</p>
                        )}
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteTask(task.id)}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Study Sessions Tab */}
        <TabsContent value="sessions" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isAddSessionDialogOpen} onOpenChange={setIsAddSessionDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Log Session
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Log Study Session</DialogTitle>
                  <DialogDescription>
                    Record your completed study session to track your progress.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="sessionSubject">Subject *</Label>
                    <Input
                      id="sessionSubject"
                      value={newSession.subject}
                      onChange={(e) => setNewSession({ ...newSession, subject: e.target.value })}
                      placeholder="e.g., Mathematics"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="sessionDuration">Duration (minutes) *</Label>
                      <Input
                        id="sessionDuration"
                        type="number"
                        value={newSession.duration}
                        onChange={(e) => setNewSession({ ...newSession, duration: parseInt(e.target.value) })}
                        min="1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="sessionDate">Date</Label>
                      <Input
                        id="sessionDate"
                        type="date"
                        value={newSession.date}
                        onChange={(e) => setNewSession({ ...newSession, date: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="sessionNotes">Notes</Label>
                    <Input
                      id="sessionNotes"
                      value={newSession.notes}
                      onChange={(e) => setNewSession({ ...newSession, notes: e.target.value })}
                      placeholder="What did you study?"
                    />
                  </div>
                  <Button onClick={handleAddSession} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                    Log Session
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-2">
            {studySessions.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Clock className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">No study sessions logged yet</p>
                  <p className="text-gray-400 mt-2">Start logging your study sessions to track progress</p>
                </CardContent>
              </Card>
            ) : (
              [...studySessions]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((session) => (
                  <Card key={session.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-gray-900 dark:text-gray-100">{session.subject}</h3>
                            <Badge className="bg-blue-100 text-blue-800 border-blue-300">
                              {session.duration} min
                            </Badge>
                          </div>
                          <p className="text-gray-600 dark:text-gray-400 mt-1">
                            {new Date(session.date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </p>
                          {session.notes && (
                            <p className="text-gray-500 dark:text-gray-400 mt-1">{session.notes}</p>
                          )}
                        </div>
                        <Clock className="w-5 h-5 text-blue-500" />
                      </div>
                    </CardContent>
                  </Card>
                ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
