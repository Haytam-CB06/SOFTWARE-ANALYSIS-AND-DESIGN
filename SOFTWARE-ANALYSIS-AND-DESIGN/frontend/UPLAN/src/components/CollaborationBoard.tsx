import { useState, useEffect } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Calendar, 
  User, 
  Tag, 
  Clock, 
  AlertCircle,
  CheckCircle2,
  Circle,
  Trash2,
  Edit,
  X,
  ChevronDown,
  ChevronUp,
  Flag,
  MessageSquare,
  Paperclip,
  Eye,
  BarChart3
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from './ui/dropdown-menu';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { toast } from 'sonner';

interface Member {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignee?: Member;
  dueDate?: string;
  labels: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  comments: Comment[];
  attachments: number;
}

interface Comment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: string;
}

interface CollaborationBoardProps {
  workspace: any;
  currentUser: Member;
}

const COLUMNS = [
  { id: 'todo', title: 'To Do', color: 'bg-gray-100 border-gray-300', icon: Circle },
  { id: 'in-progress', title: 'In Progress', color: 'bg-blue-100 border-blue-300', icon: Clock },
  { id: 'review', title: 'In Review', color: 'bg-yellow-100 border-yellow-300', icon: Eye },
  { id: 'done', title: 'Done', color: 'bg-green-100 border-green-300', icon: CheckCircle2 }
];

const PRIORITY_CONFIG = {
  low: { label: 'Low', color: 'bg-gray-100 text-gray-700 border-gray-300', icon: '↓' },
  medium: { label: 'Medium', color: 'bg-blue-100 text-blue-700 border-blue-300', icon: '=' },
  high: { label: 'High', color: 'bg-orange-100 text-orange-700 border-orange-300', icon: '↑' },
  urgent: { label: 'Urgent', color: 'bg-red-100 text-red-700 border-red-300', icon: '⚠' }
};

const LABEL_COLORS = [
  'bg-red-100 text-red-700 border-red-300',
  'bg-blue-100 text-blue-700 border-blue-300',
  'bg-green-100 text-green-700 border-green-300',
  'bg-yellow-100 text-yellow-700 border-yellow-300',
  'bg-purple-100 text-purple-700 border-purple-300',
  'bg-pink-100 text-pink-700 border-pink-300',
  'bg-indigo-100 text-indigo-700 border-indigo-300',
  'bg-teal-100 text-teal-700 border-teal-300'
];

const TaskCard = ({ task, onEdit, onDelete, moveTask }: any) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'TASK',
    item: { id: task.id, status: task.status },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  });

  const priorityConfig = PRIORITY_CONFIG[task.priority];
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays < 0) return 'Overdue';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div
      ref={drag}
      className={`bg-white border border-gray-200 rounded-lg p-3 mb-2 cursor-move hover:shadow-md transition-shadow ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="text-sm font-medium text-gray-900 flex-1 pr-2">{task.title}</h4>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <MoreVertical className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(task)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Task
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onDelete(task.id)} className="text-red-600">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Task
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {task.description && (
        <p className="text-xs text-gray-600 mb-3 line-clamp-2">{task.description}</p>
      )}

      {/* Labels */}
      {task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.labels.map((label: string, index: number) => (
            <Badge 
              key={index} 
              variant="outline" 
              className={`text-xs ${LABEL_COLORS[index % LABEL_COLORS.length]}`}
            >
              {label}
            </Badge>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-2">
          {/* Priority */}
          <Badge variant="outline" className={`text-xs ${priorityConfig.color}`}>
            <span className="mr-1">{priorityConfig.icon}</span>
            {priorityConfig.label}
          </Badge>

          {/* Due Date */}
          {task.dueDate && (
            <Badge 
              variant="outline" 
              className={`text-xs flex items-center gap-1 ${
                isOverdue ? 'bg-red-100 text-red-700 border-red-300' : 'bg-gray-100 text-gray-700 border-gray-300'
              }`}
            >
              <Calendar className="h-3 w-3" />
              {formatDate(task.dueDate)}
            </Badge>
          )}

          {/* Comments */}
          {task.comments.length > 0 && (
            <Badge variant="outline" className="text-xs flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {task.comments.length}
            </Badge>
          )}
        </div>

        {/* Assignee */}
        {task.assignee && (
          <Avatar className="h-6 w-6 border border-gray-200">
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white text-xs">
              {getInitials(task.assignee.name)}
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    </div>
  );
};

const Column = ({ column, tasks, onAddTask, onEdit, onDelete, moveTask }: any) => {
  const [{ isOver }, drop] = useDrop({
    accept: 'TASK',
    drop: (item: any) => {
      if (item.status !== column.id) {
        moveTask(item.id, column.id);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver()
    })
  });

  const ColumnIcon = column.icon;

  return (
    <div 
      ref={drop}
      className={`bg-gray-50 rounded-lg p-4 min-h-[500px] transition-colors ${
        isOver ? 'bg-blue-50 ring-2 ring-blue-300' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ColumnIcon className="h-5 w-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">{column.title}</h3>
          <Badge variant="secondary" className="ml-1">
            {tasks.length}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onAddTask(column.id)}
          className="h-7 w-7 p-0 hover:bg-blue-100"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2">
        {tasks.map((task: Task) => (
          <TaskCard
            key={task.id}
            task={task}
            onEdit={onEdit}
            onDelete={onDelete}
            moveTask={moveTask}
          />
        ))}
        {tasks.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <Circle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No tasks</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default function CollaborationBoard({ workspace, currentUser }: CollaborationBoardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterAssignee, setFilterAssignee] = useState<string>('all');
  const [showDetails, setShowDetails] = useState(() => {
    const saved = localStorage.getItem(`board-show-details-${workspace.id}`);
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    status: 'todo' as Task['status'],
    priority: 'medium' as Task['priority'],
    assignee: undefined as Member | undefined,
    dueDate: '',
    labels: [] as string[],
    newLabel: ''
  });

  useEffect(() => {
    loadTasks();
  }, [workspace.id]);

  useEffect(() => {
    localStorage.setItem(`board-show-details-${workspace.id}`, JSON.stringify(showDetails));
  }, [showDetails, workspace.id]);

  const loadTasks = () => {
    const savedTasks = localStorage.getItem(`board-tasks-${workspace.id}`);
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    }
  };

  const saveTasks = (updatedTasks: Task[]) => {
    setTasks(updatedTasks);
    localStorage.setItem(`board-tasks-${workspace.id}`, JSON.stringify(updatedTasks));
  };

  const handleAddTask = (status?: Task['status']) => {
    setEditingTask(null);
    setNewTask({
      title: '',
      description: '',
      status: status || 'todo',
      priority: 'medium',
      assignee: undefined,
      dueDate: '',
      labels: [],
      newLabel: ''
    });
    setIsTaskDialogOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setNewTask({
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      assignee: task.assignee,
      dueDate: task.dueDate || '',
      labels: task.labels,
      newLabel: ''
    });
    setIsTaskDialogOpen(true);
  };

  const handleSaveTask = () => {
    if (!newTask.title.trim()) {
      toast.error('Please enter a task title');
      return;
    }

    if (editingTask) {
      // Update existing task
      const updatedTasks = tasks.map(t =>
        t.id === editingTask.id
          ? {
              ...t,
              title: newTask.title,
              description: newTask.description,
              status: newTask.status,
              priority: newTask.priority,
              assignee: newTask.assignee,
              dueDate: newTask.dueDate || undefined,
              labels: newTask.labels,
              updatedAt: new Date().toISOString()
            }
          : t
      );
      saveTasks(updatedTasks);
      toast.success('Task updated successfully');
    } else {
      // Create new task
      const task: Task = {
        id: `task-${Date.now()}`,
        title: newTask.title,
        description: newTask.description,
        status: newTask.status,
        priority: newTask.priority,
        assignee: newTask.assignee,
        dueDate: newTask.dueDate || undefined,
        labels: newTask.labels,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: currentUser.id,
        comments: [],
        attachments: 0
      };
      saveTasks([...tasks, task]);
      toast.success('Task created successfully');
    }

    setIsTaskDialogOpen(false);
  };

  const handleDeleteTask = (taskId: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      const updatedTasks = tasks.filter(t => t.id !== taskId);
      saveTasks(updatedTasks);
      toast.success('Task deleted successfully');
    }
  };

  const moveTask = (taskId: string, newStatus: Task['status']) => {
    const updatedTasks = tasks.map(t =>
      t.id === taskId
        ? { ...t, status: newStatus, updatedAt: new Date().toISOString() }
        : t
    );
    saveTasks(updatedTasks);
    toast.success('Task moved successfully');
  };

  const addLabel = () => {
    if (newTask.newLabel.trim() && !newTask.labels.includes(newTask.newLabel.trim())) {
      setNewTask({
        ...newTask,
        labels: [...newTask.labels, newTask.newLabel.trim()],
        newLabel: ''
      });
    }
  };

  const removeLabel = (label: string) => {
    setNewTask({
      ...newTask,
      labels: newTask.labels.filter(l => l !== label)
    });
  };

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
    const matchesAssignee = filterAssignee === 'all' || 
                           (filterAssignee === 'unassigned' && !task.assignee) ||
                           task.assignee?.id === filterAssignee;
    return matchesSearch && matchesPriority && matchesAssignee;
  });

  // Group tasks by status
  const tasksByStatus = COLUMNS.reduce((acc, column) => {
    acc[column.id] = filteredTasks.filter(task => task.status === column.id);
    return acc;
  }, {} as Record<string, Task[]>);

  // Stats
  const stats = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === 'todo').length,
    inProgress: tasks.filter(t => t.status === 'in-progress').length,
    review: tasks.filter(t => t.status === 'review').length,
    done: tasks.filter(t => t.status === 'done').length,
    overdue: tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done').length
  };

  const [filtersExpanded, setFiltersExpanded] = useState(false);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-full overflow-auto bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className={`px-6 transition-all duration-200 ${showDetails ? 'py-4' : 'py-2'}`}>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h2 className={`text-gray-900 transition-all duration-200 ${showDetails ? 'text-2xl mb-1' : 'text-lg mb-0'}`}>
                    Collaboration Board
                  </h2>
                  {!showDetails && (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {stats.total} tasks
                      </Badge>
                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                        {stats.inProgress} active
                      </Badge>
                      {stats.overdue > 0 && (
                        <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                          {stats.overdue} overdue
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
                {showDetails && (
                  <p className="text-gray-600 text-sm">Manage tasks and track progress with your team</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {!showDetails && (
                  <div className="flex items-center gap-2 mr-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                      <Input
                        placeholder="Quick search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 h-8 w-48 text-sm border-gray-300"
                      />
                    </div>
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetails(!showDetails)}
                  className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors h-8"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  {showDetails ? 'Compact' : 'Detailed'}
                  {showDetails ? (
                    <ChevronUp className="h-4 w-4 ml-2" />
                  ) : (
                    <ChevronDown className="h-4 w-4 ml-2" />
                  )}
                </Button>
                <Button onClick={() => handleAddTask()} className="bg-blue-600 hover:bg-blue-800 dark:hover:bg-blue-900 shadow-sm h-8">
                  <Plus className="h-4 w-4 mr-2" />
                  New Task
                </Button>
              </div>
            </div>
          </div>

          {/* Collapsible Analytics & Filters Section */}
          <Collapsible open={showDetails} className="border-t border-gray-100">
            <CollapsibleContent className="px-6 py-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
              {/* Stats */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className="h-4 w-4 text-gray-500" />
                  <h3 className="text-sm font-medium text-gray-700">Task Analytics</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="pt-4 pb-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                        <p className="text-xs text-gray-500 mt-1">Total Tasks</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="pt-4 pb-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-700">{stats.todo}</p>
                        <p className="text-xs text-gray-500 mt-1">To Do</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-blue-200 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="pt-4 pb-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
                        <p className="text-xs text-gray-500 mt-1">In Progress</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-yellow-200 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="pt-4 pb-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-yellow-600">{stats.review}</p>
                        <p className="text-xs text-gray-500 mt-1">In Review</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-green-200 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="pt-4 pb-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">{stats.done}</p>
                        <p className="text-xs text-gray-500 mt-1">Done</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-red-200 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="pt-4 pb-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
                        <p className="text-xs text-gray-500 mt-1">Overdue</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Filters */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <h3 className="text-sm font-medium text-gray-700">Filters</h3>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search tasks..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  
                  <Select value={filterPriority} onValueChange={setFilterPriority}>
                    <SelectTrigger className="w-[160px] border-gray-300">
                      <Flag className="h-4 w-4 mr-2 text-gray-500" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priorities</SelectItem>
                      <SelectItem value="low">Low Priority</SelectItem>
                      <SelectItem value="medium">Medium Priority</SelectItem>
                      <SelectItem value="high">High Priority</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterAssignee} onValueChange={setFilterAssignee}>
                    <SelectTrigger className="w-[160px] border-gray-300">
                      <User className="h-4 w-4 mr-2 text-gray-500" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Members</SelectItem>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {workspace.members.map((member: Member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Board */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 min-w-[900px]">
            {COLUMNS.map((column) => (
              <Column
                key={column.id}
                column={column}
                tasks={tasksByStatus[column.id] || []}
                onAddTask={handleAddTask}
                onEdit={handleEditTask}
                onDelete={handleDeleteTask}
                moveTask={moveTask}
              />
            ))}
          </div>
        </div>

        {/* Task Dialog */}
        <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingTask ? 'Edit Task' : 'Create New Task'}</DialogTitle>
              <DialogDescription>
                {editingTask ? 'Update task details' : 'Add a new task to the board'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter task title..."
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Add a detailed description..."
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  rows={4}
                />
              </div>

              {/* Status and Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={newTask.status}
                    onValueChange={(value) => setNewTask({ ...newTask, status: value as Task['status'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COLUMNS.map((column) => (
                        <SelectItem key={column.id} value={column.id}>
                          {column.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={newTask.priority}
                    onValueChange={(value) => setNewTask({ ...newTask, priority: value as Task['priority'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          <span className="flex items-center gap-2">
                            <span>{config.icon}</span>
                            {config.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Assignee and Due Date */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="assignee">Assignee</Label>
                  <Select
                    value={newTask.assignee?.id || 'unassigned'}
                    onValueChange={(value) => {
                      const member = workspace.members.find((m: Member) => m.id === value);
                      setNewTask({ ...newTask, assignee: member });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select assignee..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {workspace.members.map((member: Member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                  />
                </div>
              </div>

              {/* Labels */}
              <div className="space-y-2">
                <Label>Labels</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a label..."
                    value={newTask.newLabel}
                    onChange={(e) => setNewTask({ ...newTask, newLabel: e.target.value })}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addLabel();
                      }
                    }}
                  />
                  <Button type="button" onClick={addLabel} variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {newTask.labels.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {newTask.labels.map((label, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className={`${LABEL_COLORS[index % LABEL_COLORS.length]} flex items-center gap-1`}
                      >
                        {label}
                        <X
                          className="h-3 w-3 cursor-pointer hover:opacity-70"
                          onClick={() => removeLabel(label)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsTaskDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveTask} className="bg-blue-600 hover:bg-blue-800 dark:hover:bg-blue-900">
                {editingTask ? 'Update Task' : 'Create Task'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DndProvider>
  );
}