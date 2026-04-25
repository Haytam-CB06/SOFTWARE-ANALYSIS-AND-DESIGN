import { useState, useEffect, useMemo } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { useTranslation } from "react-i18next";
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Calendar, 
  User, 
  Clock, 
  CheckCircle2,
  Circle,
  Trash2,
  Edit,
  X,
  ChevronDown,
  ChevronUp,
  Flag,
  MessageSquare,
  Eye,
  BarChart3,
  AlertTriangle,
  Shield
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
import { API_BASE_URL } from '../lib/api';


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
  onUnseenCountChange?: (count: number) => void;
}

const COLUMNS = [
  { id: 'todo', key: 'todo', icon: Circle },
  { id: 'in-progress', key: 'inProgress', icon: Clock },
  { id: 'review', key: 'review', icon: Eye },
  { id: 'done', key: 'done', icon: CheckCircle2 },
];

const PRIORITY_CONFIG = {
  low: {
    labelKey: 'low',
    className:
      'border-neutral-200 bg-neutral-100 text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300',
    icon: '↓',
  },
  medium: {
    labelKey: 'medium',
    className:
      'border-neutral-200 bg-white text-neutral-700 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200',
    icon: '=',
  },
  high: {
    labelKey: 'high',
    className:
      'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300',
    icon: '↑',
  },
  urgent: {
    labelKey: 'urgent',
    className:
      'border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300',
    icon: '⚠',
  },
};

const LABEL_COLORS = [
  'border-neutral-200 bg-neutral-100 text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300',
  'border-neutral-200 bg-neutral-50 text-neutral-600 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-400',
  'border-stone-200 bg-stone-100 text-stone-700 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300',
  'border-zinc-200 bg-zinc-100 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300',
];

const DELETE_CONFIRMATION_TEXT = 'UPLAN DELETE';

const isTaskDeadlineLocked = (task?: { dueDate?: string; status?: string } | null) => {
  if (!task?.dueDate) return false;
  const dueTime = new Date(task.dueDate).getTime();
  if (Number.isNaN(dueTime)) return false;
  return dueTime >= Date.now() && task.status !== 'done';
};

const TaskCard = ({ task, onEdit, onDelete, moveTask,currentUser, isAdmin }: any) => {
  const isAssignedToMe = task.assignee?.id === currentUser?.id;
  const { t } = useTranslation();
  const canArchiveTask = isAdmin || String(task.createdBy) === String(currentUser?.id);
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
    
    if (diffDays === 0) return t("board.dates.today");
    if (diffDays === 1) return t("board.dates.tomorrow");;
    if (diffDays === -1) return t("board.dates.yesterday");;
    if (diffDays < 0) return t("board.dates.overdue");;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div
  ref={drag}
        className={`mb-2 rounded-xl border border-neutral-200 bg-white p-3 shadow-sm transition-all hover:border-neutral-300 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-neutral-700 ${
          isDragging ? 'opacity-50' : ''
        }`}
      >
        
      <div className="flex items-start justify-between mb-2">
        <h4 className="flex-1 pr-2 text-sm font-medium leading-5 text-neutral-900 break-all dark:text-neutral-100 [overflow-wrap:anywhere]"> {task.title}</h4>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <MoreVertical className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(task)}>
              <Edit className="h-4 w-4 mr-2" />
              {t("board.actions.editTask")}
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {task.status !== 'todo' && (
              <DropdownMenuItem onClick={() => moveTask(task.id, 'todo')}>
                {t("board.columns.todo")}
              </DropdownMenuItem>
            )}
            {task.status !== 'in-progress' && (
              <DropdownMenuItem onClick={() => moveTask(task.id, 'in-progress')}>
                {t("board.columns.inProgress")}
              </DropdownMenuItem>
            )}
            {task.status !== 'review' && (
              <DropdownMenuItem onClick={() => moveTask(task.id, 'review')}>
                {t("board.columns.review")}
              </DropdownMenuItem>
            )}
            {task.status !== 'done' && (
              <DropdownMenuItem onClick={() => moveTask(task.id, 'done')}>
                {t("board.columns.done")}
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />

            {canArchiveTask && (
              <DropdownMenuItem onClick={() => onDelete(task.id)} className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                {t("board.actions.archive")}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {task.description && (
        <p className="mb-3 text-xs leading-5 text-neutral-500 line-clamp-3 break-words dark:text-neutral-400 [overflow-wrap:anywhere]">{task.description}</p>
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
      <div className="mt-3 flex items-center justify-between border-t border-neutral-200 pt-3 dark:border-neutral-800">

        {/* LEFT: priority + due date */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className={`text-xs ${priorityConfig.className}`}>
            <span className="mr-1">{priorityConfig.icon}</span>
            {t(`board.priority.${task.priority}`)}
          </Badge>

          {task.dueDate && (
            <Badge
              variant="outline"
              className={`text-xs flex items-center gap-1 ${
                isOverdue
                  ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300'
                  : 'border-neutral-200 bg-neutral-50 text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300'
              }`}
            >
              <Calendar className="h-3 w-3" />
              {formatDate(task.dueDate)}
            </Badge>
          )}
          {isTaskDeadlineLocked(task) && (
            <Badge variant="outline" className="text-xs border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-300">
              {t("board.task.deadlineLocked")}
            </Badge>
          )}
        </div>

        {/* RIGHT: ASSIGNEE */}
        {task.assignee && (
          <div className="flex items-center gap-2">

            {isAssignedToMe ? (
              <span className="text-xs font-medium px-2 py-1 rounded-md bg-neutral-900 text-white dark:bg-white dark:text-neutral-900">
                {t("board.task.you")}
              </span>
            ) : (
              <Avatar className="h-7 w-7 border border-neutral-200 dark:border-neutral-700">
                {task.assignee.avatar ? (
                  <img
                    src={task.assignee.avatar}
                    alt={task.assignee.name}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  <AvatarFallback className="text-[10px] font-medium bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
                    {getInitials(task.assignee.name)}
                  </AvatarFallback>
                )}
              </Avatar>
            )}

          </div>
        )}

      </div>
    </div>
  );
};

const Column = ({ column, tasks, onAddTask, onEdit, onDelete, moveTask,currentUser, isAdmin }: any) => {
  const { t } = useTranslation();
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
          className={`w-[280px] sm:w-[320px] xl:w-auto rounded-2xl border border-neutral-200 bg-neutral-100/70 p-3 sm:p-4 min-h-[420px] xl:min-h-[500px] transition-all dark:border-neutral-800 dark:bg-neutral-900/40 ${
            isOver ? 'ring-2 ring-neutral-300 dark:ring-neutral-700' : ''
          }`}
        >
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <ColumnIcon className="h-5 w-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900"> {t(`board.columns.${column.key}`)}</h3>
          <Badge variant="outline" className="border-neutral-200 bg-neutral-50 text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">
            {tasks.length}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onAddTask(column.id)}
          className="h-7 w-7 p-0 hover:bg-neutral-200 dark:hover:bg-neutral-800"
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
            currentUser={currentUser}
            isAdmin={isAdmin}
            onDelete={onDelete}
            moveTask={moveTask}
          />
        ))}
        {tasks.length === 0 && (
            <div className="rounded-xl border border-dashed border-neutral-200 bg-white/70 py-10 text-center dark:border-neutral-800 dark:bg-neutral-950/60">
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-300">{t("board.task.noTasks")}</p>
              <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">{t("board.task.addHint")}</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default function CollaborationBoard({ workspace, currentUser, onUnseenCountChange }: CollaborationBoardProps) {
  const { t } = useTranslation();
  const BOARD_RULES = [
    {
      icon: User,
      title: t("board.rules.ownership.title"),
      label: t("board.rules.ownership.label"),
      body: t("board.rules.ownership.body"),
    },
    {
      icon: CheckCircle2,
      title: t("board.rules.workflow.title"),
      label: t("board.rules.workflow.label"),
      body: t("board.rules.workflow.body"),
    },
    {
      icon: Trash2,
      title: t("board.rules.archive.title"),
      label: t("board.rules.archive.label"),
      body: t("board.rules.archive.body"),
    },
    {
      icon: Shield,
      title: t("board.rules.admin.title"),
      label: t("board.rules.admin.label"),
      body: t("board.rules.admin.body"),
    },
  ];
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterAssignee, setFilterAssignee] = useState<string>('all');
  const isAdmin = workspace?.members.find(m => m.id === currentUser.id)?.role === 'admin';
  const [archivedTasks, setArchivedTasks] = useState<Task[]>([]);
  const [showDetails, setShowDetails] = useState(() => {
    const saved = localStorage.getItem(`board-show-details-${workspace?.id}`);
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

  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    confirmLabel: string;
    isDanger?: boolean;
    action: null | (() => Promise<void>);
  }>({
    open: false,
    title: '',
    description: '',
    confirmLabel: '',
    isDanger: true,
    action: null,
  });
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('');
  const [isDeleteSubmitting, setIsDeleteSubmitting] = useState(false);

  const isDeletePhraseValid = deleteConfirmationInput.trim() === DELETE_CONFIRMATION_TEXT;

  const closeDeleteDialog = () => {
    if (isDeleteSubmitting) return;
    setDeleteDialog((prev) => ({ ...prev, open: false, action: null }));
    setDeleteConfirmationInput('');
  };

  const openDeleteDialog = ({
    title,
    description,
    confirmLabel,
    action,
    isDanger = true,
  }: {
    title: string;
    description: string;
    confirmLabel: string;
    action: () => Promise<void>;
    isDanger?: boolean;
  }) => {
    setDeleteConfirmationInput('');
    setDeleteDialog({
      open: true,
      title,
      description,
      confirmLabel,
      isDanger,
      action,
    });
  };

  const handleConfirmDeleteDialog = async () => {
    if (!deleteDialog.action || !isDeletePhraseValid) return;

    try {
      setIsDeleteSubmitting(true);
      await deleteDialog.action();
      setDeleteDialog((prev) => ({ ...prev, open: false, action: null }));
      setDeleteConfirmationInput('');
    } finally {
      setIsDeleteSubmitting(false);
    }
  };

  const handleArchiveTask = (taskId: string) => {
    const task = tasks.find((item) => item.id === taskId);
    if (!task) return;
    if (isTaskDeadlineLocked(task)) {
      toast.error(t("board.messages.errorDeadlineLocked"));
      return;
    }
    if (!isAdmin && String(task.createdBy) !== String(currentUser.id)) {
      toast.error(t("board.messages.errorDeletePermission"));
      return;
    }
    openDeleteDialog({
      title: t("board.dialogs.archiveTaskTitle"),
      description: t("board.dialogs.archiveTaskDescription", { phrase: DELETE_CONFIRMATION_TEXT }),
      confirmLabel: t("board.actions.archive"),
      action: async () => {
        try {
          await apiFetch(`/workspaces/${workspace.id}/board/tasks/${taskId}/archive`, {
            method: 'PATCH',
          });

          setTasks(prev => prev.filter(t => t.id !== taskId));
          loadArchivedTasks();
          toast.success(t("board.archive.archived"));
        } catch (e) {
          console.error(e);
          toast.error(t("board.messages.errorMove"));
          throw e;
        }
      },
    });
  };
  // --- Backend helpers (ONLY linking logic) ---
  const apiFetch = async (path: string, init: RequestInit = {}) => {
    const token = localStorage.getItem('access_token');

    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        // your backend expects this header
        'X-User-Id': String(currentUser?.id ?? ''),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init.headers || {}),
      },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(text || `Request failed: ${res.status}`);
    }

    // 204 no content
    if (res.status === 204) return null;
    return res.json();
  };

 const restoreTask = async (taskId: string) => {
    try {
      const restored = await apiFetch(
        `/workspaces/${workspace.id}/board/tasks/${taskId}/restore`,
        { method: 'PATCH' }
      );

      setTasks(prev => [normalizeTask(restored), ...prev]);
      setArchivedTasks(prev => prev.filter(t => t.id !== taskId));

      toast.success(t("board.archive.restored"));
    } catch (e) {
      console.error(e);
      toast.error(t("board.messages.errorRestore"));
    }
  };
  const loadArchivedTasks = async () => {
      try {
        const data = await apiFetch(`/workspaces/${workspace.id}/board/tasks/archived`);
        const normalized = Array.isArray(data) ? data.map(normalizeTask) : [];
        setArchivedTasks(normalized);
      } catch (e) {
        console.error(e);
      }
  };
  const deleteAllTasks = () => {
    if (!isAdmin) {
      toast.error(t("board.messages.errorAdminOnly"));
      return;
    }
    openDeleteDialog({
      title: t("board.dialogs.deleteAllActiveTitle"),
      description: t("board.dialogs.deleteAllActiveDescription", { phrase: DELETE_CONFIRMATION_TEXT }),
      confirmLabel: t("board.archive.deleteAllActive"),
      action: async () => {
        try {
          await apiFetch(`/workspaces/${workspace.id}/board/tasks`, {
            method: 'DELETE',
          });

          setTasks([]);
          toast.success(t("board.archive.allActiveDeleted"));
        } catch (e) {
          console.error(e);
          toast.error(t("board.messages.errorDelete"));
          throw e;
        }
      },
    });
  };
  const deleteArchivedTask = (taskId: string) => {
    const task = archivedTasks.find((item) => item.id === taskId);
    if (!task) return;
    if (isTaskDeadlineLocked(task)) {
      toast.error(t("board.messages.errorDeadlineLocked"));
      return;
    }
    if (!isAdmin && String(task.createdBy) !== String(currentUser.id)) {
      toast.error(t("board.messages.errorDeletePermission"));
      return;
    }
    openDeleteDialog({
      title: t("board.dialogs.deleteArchivedTitle"),
      description: t("board.dialogs.deleteArchivedDescription", { phrase: DELETE_CONFIRMATION_TEXT }),
      confirmLabel: t("board.actions.deletePermanent"),
      action: async () => {
        try {
          await apiFetch(`/workspaces/${workspace.id}/board/tasks/${taskId}`, {
            method: 'DELETE',
          });

          setArchivedTasks(prev => prev.filter(t => t.id !== taskId));
          toast.success(t("board.archive.deleted"));
        } catch (e) {
          console.error(e);
          toast.error(t("board.messages.errorDelete"));
          throw e;
        }
      },
    });
  };
  const archiveAllTasks = () => {
    if (!isAdmin) {
      toast.error(t("board.messages.errorAdminOnly"));
      return;
    }
    openDeleteDialog({
      title: t("board.dialogs.archiveAllTitle"),
      description: t("board.dialogs.archiveAllDescription", { phrase: DELETE_CONFIRMATION_TEXT }),
      confirmLabel: t("board.archive.archiveAll"),
      action: async () => {
        try {
          await apiFetch(`/workspaces/${workspace.id}/board/tasks/archive-all`, {
            method: 'POST',
          });

          setTasks([]);
          loadArchivedTasks();
          toast.success(t("board.archive.allArchived"));
        } catch (e) {
          console.error(e);
          toast.error(t("board.messages.errorArchiveAll"));
          throw e;
        }
      },
    });
  };

  const deleteAllArchivedTasks = () => {
    if (!isAdmin) {
      toast.error(t("board.messages.errorAdminOnly"));
      return;
    }
    openDeleteDialog({
      title: t("board.dialogs.deleteAllArchivedTitle"),
      description: t("board.dialogs.deleteAllArchivedDescription", { phrase: DELETE_CONFIRMATION_TEXT }),
      confirmLabel: t("board.archive.deleteAll"),
      action: async () => {
        try {
          await apiFetch(`/workspaces/${workspace.id}/board/tasks/archived`, {
            method: 'DELETE',
          });

          setArchivedTasks([]);
          loadArchivedTasks();
          toast.success(t("board.archive.allDeleted"));
        } catch (e: any) {
          console.error(e);
          toast.error(e.message || t("board.messages.errorDeleteAllArchived"));
          throw e;
        }
      },
    });
  };
  
  const normalizeTask = (t: any): Task => {
    return {
      id: String(t.id),
      title: t.title ?? '',
      description: t.description ?? '',
      status: (t.status ?? 'todo') as Task['status'],
      priority: (t.priority ?? 'medium') as Task['priority'],
      assignee: t.assignee
        ? {
            id: String(t.assignee.id),
            name: t.assignee.name,
            email: t.assignee.email,
            avatar: t.assignee.avatar,
          }
        : undefined,
      // backend doesn't send due date in your current models; keep if you add later
      dueDate: t.due_date ?? t.dueDate ?? undefined,
      labels: t.labels ?? [],
      createdAt: t.created_at ?? t.createdAt ?? new Date().toISOString(),
      updatedAt: t.updated_at ?? t.updatedAt ?? new Date().toISOString(),
      createdBy: String(t.created_by ?? t.createdBy ?? ''),
      comments: (t.comments ?? []).map((c: any) => ({
        id: String(c.id),
        userId: String(c.user_id ?? c.userId ?? ''),
        userName: c.user_name ?? c.userName ?? '',
        text: c.text ?? '',
        createdAt: c.created_at ?? c.createdAt ?? new Date().toISOString(),
      })),
      attachments: t.attachments_count ?? t.attachments ?? 0,
    };
  };

  const toTaskCreatePayload = () => {
    return {
      title: newTask.title,
      description: newTask.description,
      status: newTask.status,
      priority: newTask.priority,
      assigneeId: newTask.assignee?.id ?? null, // ✅ FIX
      dueDate: newTask.dueDate || null,
      labels: newTask.labels ?? [],
    };
  };
  
  const toTaskUpdatePayload = () => {
    // your backend TaskUpdate does NOT support status (it has a separate /move route)
    return {
      title: newTask.title,
      description: newTask.description,
      priority: newTask.priority,
      assigneeId: newTask.assignee?.id ?? null,
      dueDate: newTask.dueDate || null,
    };
  };
  // --- End helpers ---
  useEffect(() => {
    if (!workspace?.id) return;

    localStorage.setItem(
      `workspace:${workspace.id}:boardLastSeen:${currentUser.id}`,
      new Date().toISOString()
    );

    onUnseenCountChange?.(0);
  }, [workspace?.id, currentUser.id, onUnseenCountChange]);
  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiFetch(`/workspaces/${workspace.id}/board/tasks`);

          const normalized = Array.isArray(data)
            ? data.map((t: any) => normalizeTask(t))
            : [];
          setTasks(normalized);
      } catch (e: any) {
        console.error(e);
        toast.error(t("board.messages.errorLoad"));
      }
    };

    if (workspace?.id) {
      load();
      loadArchivedTasks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace.id]);

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

  const handleSaveTask = async () => {
    if (!newTask.title.trim()) {
      toast.error(t("board.messages.errorCreate"));
      return;
    }

    try {
      if (editingTask) {
        // Update fields (title/description/priority/assignee)
        const updated = await apiFetch(
          `/workspaces/${workspace.id}/board/tasks/${editingTask.id}`,
          {
            method: 'PATCH',
            body: JSON.stringify(toTaskUpdatePayload()),
          }
        );

        let normalized = normalizeTask(updated);

        // If status changed, use the move endpoint
        if (newTask.status !== editingTask.status) {
          const moved = await apiFetch(
            `/workspaces/${workspace.id}/board/tasks/${editingTask.id}/move`,
            {
              method: 'PATCH',
              body: JSON.stringify({ status: newTask.status }),
            }
          );
          normalized = normalizeTask(moved);
        }

        setTasks((prev) => prev.map((t) => (t.id === normalized.id ? normalized : t)));
        
        toast.success(t("board.messages.updated"));
      } else {
        // Create new task
        const created = await apiFetch(
          `/workspaces/${workspace.id}/board/tasks`,
          {
            method: 'POST',
            body: JSON.stringify(toTaskCreatePayload()),
          }
        );

        const normalized = normalizeTask(created);
        setTasks((prev) => [normalized, ...prev]);
        toast.success(t("board.messages.created"));
      }

      setIsTaskDialogOpen(false);
    } catch (e: any) {
      console.error(e);
      toast.error(
        editingTask
          ? t("board.messages.errorUpdate")
          : t("board.messages.errorCreate")
      );
    }
  };

  const handleDeleteTask = (taskId: string) => {
    const task = tasks.find((item) => item.id === taskId);
    if (isTaskDeadlineLocked(task)) {
      toast.error(t("board.messages.errorDeadlineLocked"));
      return;
    }
    openDeleteDialog({
      title: 'Delete task permanently',
      description: `This permanently deletes the task and cannot be undone. Type ${DELETE_CONFIRMATION_TEXT} to continue.`,
      confirmLabel: t("board.actions.deletePermanent"),
      action: async () => {
        try {
          await apiFetch(`/workspaces/${workspace.id}/board/tasks/${taskId}`, {
            method: 'DELETE',
          });

          setTasks((prev) => prev.filter((t) => t.id !== taskId));
          loadArchivedTasks();
          toast.success(t("board.messages.deleted"));
        } catch (e: any) {
          console.error(e);
          toast.error(t("board.messages.errorDeletePermission"));
          throw e;
        }
      },
    });
  };

  const moveTask = async (taskId: string, newStatus: Task['status']) => {
    // optimistic UI
    const prev = tasks;
    setTasks((cur) =>
      cur.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );

    try {
      // correct backend route
      const updated = await apiFetch(
        `/workspaces/${workspace.id}/board/tasks/${taskId}/move`,
        {
          method: 'PATCH',
          body: JSON.stringify({ status: newStatus }),
        }
      );
      const normalized = normalizeTask(updated);
      setTasks((cur) => cur.map((t) => (t.id === normalized.id ? normalized : t)));
      toast.success(t("board.messages.moved"));
    } catch (e: any) {
      console.error(e);
      setTasks(prev); // rollback
      toast.error(t("board.messages.errorMove"));
    }
  };

  // (Optional) comment API helper – not used by UI right now, but ready.
  const addCommentToTask = async (taskId: string, text: string) => {
    const created = await apiFetch(
      `/workspaces/${workspace.id}/board/tasks/${taskId}/comments`,
      {
        method: 'POST',
        body: JSON.stringify({ text }),
      }
    );

    const newComment: Comment = {
      id: String(created.id),
      userId: String(created.userId ?? created.user_id ?? ''),
      userName: created.userName ?? created.user_name ?? 'User',
      text: created.text ?? '',
      createdAt: created.createdAt ?? created.created_at ?? new Date().toISOString(),
    };

    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, comments: [...(t.comments ?? []), newComment] }
          : t
      )
    );
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
  };


  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex h-full min-h-0 flex-col bg-neutral-50 dark:bg-neutral-950">
        {/* Header */}
          <div className="sticky top-0 z-10 border-b border-neutral-200 bg-white/95 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/95">
          <div className={`px-3 sm:px-4 lg:px-6 transition-all duration-200 ${showDetails ? 'py-4' : 'py-2'}`}>
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <h2 className={`font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 transition-all duration-200 ${showDetails ? 'text-2xl mb-1' : 'text-lg mb-0'}`}>
                    {t("board.title")}
                  </h2>
                  {!showDetails && (
                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                      <Badge variant="secondary" className="text-xs">
                        {t("board.stats.totalCount", { count: stats.total })}
                      </Badge>
                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                        {t("board.stats.inProgressCount", { count: stats.inProgress })}
                      </Badge>
                      
                    </div>
                  )}
                </div>
                {showDetails && (
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    {t("board.description")}
                  </p>                )}
              </div>
              <div className="flex w-full flex-wrap items-center gap-1 sm:gap-2 sm:w-auto">
                {!showDetails && (
                  <div className="flex w-full items-center gap-2 xl:mr-2 xl:w-auto">
                    <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                    <Input
                      placeholder={t("board.filters.search")}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  </div>
                )}
                  
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowDetails(!showDetails)}
                      className="h-9 w-full justify-between rounded-2xl text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-900 dark:hover:text-neutral-100 sm:w-auto"
                    >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  {showDetails ? t("board.view.compact") : t("board.view.detailed")}
                  {showDetails ? (
                    <ChevronUp className="h-4 w-4 ml-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4 ml-4" />
                  )}
                </Button>
                <Button
                  onClick={() => handleAddTask()}
                 className="w-full rounded-2xl bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:text-neutral-900 dark:hover:bg-neutral-200-200 sm:w-auto"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {t("board.actions.newTask")}
                </Button>
                <Button
                  variant="outline"
                  onClick={archiveAllTasks}
                  disabled={!isAdmin}
                  className="w-full sm:w-auto"
                >
                  {t("board.archive.archiveAll")}
                </Button>
              </div>
            </div>
          </div>

          {/* Collapsible Analytics & Filters Section */}
          <Collapsible open={showDetails} className="border-t border-gray-100">
            <CollapsibleContent className="space-y-4 px-3 py-4 sm:px-4 lg:px-6 animate-in slide-in-from-top-2 duration-200">
              {/* Stats */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className="h-4 w-4 text-gray-500" />
                  <h3 className="text-sm font-medium text-gray-700">
                    {t("board.sections.analytics")}
                    </h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    <Card className="group rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-blue-900/60">
                      <div className="flex items-center justify-between">
                        
                        <div>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400">
                            {t("board.stats.total")}
                          </p>
                          <p className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
                            {stats.total}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-blue-50 p-2 dark:bg-blue-950/30">
                          <BarChart3 className="h-4 w-4 text-blue-700 dark:text-blue-400" />
                        </div>

                      </div>
                    </Card>
                    <Card className="group rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-blue-900/60">
                      <div className="flex items-center justify-between">
                        
                        <div>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400">
                            {t("board.stats.todo")}
                          </p>
                          <p className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
                            {stats.todo}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-blue-50 p-2 dark:bg-blue-950/30">
                          <Circle className="h-4 w-4 text-blue-700 dark:text-blue-400" />
                        </div>

                      </div>
                    </Card>
                    <Card className="group rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-blue-900/60">
                      <div className="flex items-center justify-between">
                        
                        <div>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400">
                            {t("board.stats.inProgress")}
                          </p>
                          <p className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
                            {stats.inProgress}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-blue-50 p-2 dark:bg-blue-950/30">
                          <Clock className="h-4 w-4 text-blue-700 dark:text-blue-400" /> 
                        </div>

                      </div>
                    </Card>
                    <Card className="group rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-blue-900/60">
                      <div className="flex items-center justify-between">
                        
                        <div>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400">
                            {t("board.stats.review")}
                          </p>
                          <p className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
                            {stats.review}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-blue-50 p-2 dark:bg-blue-950/30">
                          <Eye className="h-4 w-4 text-blue-700 dark:text-blue-400" />
                        </div>

                      </div>
                    </Card>
                    <Card className="group rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-blue-900/60">
                    <div className="flex items-center justify-between">
                      
                      <div>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          {t("board.stats.done")}
                        </p>
                        <p className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
                          {stats.done}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-blue-50 p-2 dark:bg-blue-950/30">
                        <CheckCircle2 className="h-4 w-4 text-blue-700 dark:text-blue-400" />
                      </div>

                    </div>
                  </Card>
                    
                </div>
              </div>

              {/* Filters */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <h3 className="text-sm font-medium text-gray-700">{t("board.sections.filters")}</h3>
                </div>
                <div className="min-w-0">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500 dark:text-blue-400" />
                    <Input
                      placeholder={t("board.filters.search")}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-12 rounded-xl border-neutral-200 bg-white pl-10 shadow-sm focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/20 dark:border-neutral-800 dark:bg-neutral-950 dark:focus-visible:border-blue-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <Select value={filterPriority} onValueChange={setFilterPriority}>
                    <SelectTrigger className="h-11 rounded-xl border-neutral-200 bg-white shadow-sm focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-800 dark:bg-neutral-950">
                      <Flag className="h-4 w-4 mr-2 text-blue-500 dark:text-blue-400" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("board.filters.allPriorities")}</SelectItem>
                      <SelectItem value="low">{t("board.priority.low")}</SelectItem>
                      <SelectItem value="medium">{t("board.priority.medium")}</SelectItem>
                      <SelectItem value="high">{t("board.priority.high")}</SelectItem>
                      <SelectItem value="urgent">{t("board.priority.urgent")}</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterAssignee} onValueChange={setFilterAssignee}>
                    <SelectTrigger className="h-11 rounded-xl border-neutral-200 bg-white shadow-sm focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-800 dark:bg-neutral-950">
                      <User className="h-4 w-4 mr-2 text-blue-500 dark:text-blue-400" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("board.filters.allMembers")}</SelectItem>
                      <SelectItem value="unassigned">{t("board.filters.unassigned")}</SelectItem>
                      {workspace.members.map((member: Member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
                <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <div className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Board governance
                      </div>
                      <h3 className="mt-3 text-base font-semibold tracking-tight text-slate-950 dark:text-white">
                        Collaboration board rules
                      </h3>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {t("board.rules.description")}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
                      <Badge variant="outline" className="justify-center rounded-md border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                        {stats.total} tasks
                      </Badge>
                      <Badge variant="outline" className="justify-center rounded-md border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300">
                        {t("board.stats.doneCount", { count: stats.done })}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 p-3 sm:grid-cols-2 xl:grid-cols-4">
                  {BOARD_RULES.map((rule, index) => {
                    const Icon = rule.icon;
                    return (
                      <div key={rule.title} className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/70">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                                0{index + 1}
                              </span>
                              <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">
                                {rule.title}
                              </p>
                            </div>
                            <p className="truncate text-xs font-medium text-slate-500 dark:text-slate-400">
                              {rule.label}
                            </p>
                          </div>
                        </div>
                        <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                          {rule.body}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </section>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Board */}
        <div className="flex-1 min-h-0 overflow-x-auto overflow-y-auto p-3 sm:p-4 lg:p-6">
          <div className="grid min-w-[1100px] grid-cols-4 gap-4 xl:min-w-0">
            {COLUMNS.map((column) => (
              <Column
                key={column.id}
                column={column}
                tasks={tasksByStatus[column.id] || []}
                onAddTask={handleAddTask}
                onEdit={handleEditTask}
                onDelete={handleArchiveTask}
                moveTask={moveTask}
                currentUser={currentUser}
                isAdmin={isAdmin}
              />
            ))}
            </div>
        </div>
          <Card className="m-4 rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t("board.archive.title")}</CardTitle>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={archiveAllTasks}
              >
                {t("board.archive.archiveAll")}
              </Button>

              
            {isAdmin && (
              <Button
                size="sm"
                variant="destructive"
                onClick={deleteAllArchivedTasks}
                disabled={archivedTasks.length === 0}
              >
                {t("board.archive.deleteAll")}
              </Button>
            )}
              
            </div>
          </CardHeader>

          <CardContent className="space-y-2">
            {archivedTasks.length === 0 && (
              <p className="text-sm text-neutral-500">
                {t("board.archive.empty")}
              </p>
            )}

            {archivedTasks.map(task => (
              <div
                key={task.id}
                className="flex items-center justify-between rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm transition hover:border-blue-200 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-blue-900/60"              >
                <div>
                  <p className="text-sm font-medium">{task.title}</p>
                  <p className="text-xs text-neutral-500">{task.description}</p>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => restoreTask(task.id)}>
                    {t("board.actions.restore")}
                  </Button>
                  {(isAdmin || String(task.createdBy) === String(currentUser.id)) && (
                    <Button size="sm" variant="destructive" onClick={() => deleteArchivedTask(task.id)}>
                      {t("board.actions.deletePermanent")}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
            
        {/* Task Dialog */}
        <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
          <DialogContent className="max-h-[90vh] w-[calc(100vw-1rem)] max-w-2xl overflow-y-auto rounded-xl sm:w-full">
            <DialogHeader>
              <DialogTitle>{editingTask ? t("board.actions.editTask") : t("board.actions.createTask")}</DialogTitle>
              <DialogDescription>
                {editingTask ? t("board.actions.updateTask") : t("board.task.addHint")}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 sm:py-4">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">{t("board.task.title")} *</Label>
                <Input
                  id="title"
                  placeholder={t("board.task.title")}
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">{t("board.task.description")} *</Label>
                <Textarea
                  id="description"
                  placeholder={t("board.task.description")}
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  rows={4}
                />
              </div>

              {/* Status and Priority */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="status">{t("board.task.status")}</Label>
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
                          {t(`board.columns.${column.key}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">{t("board.task.priority")}</Label>
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
                            {t(`board.priority.${key}`)}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Assignee and Due Date */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="assignee">{t("board.task.assignee")}</Label>
                  <Select
                    value={newTask.assignee?.id || 'unassigned'}
                    onValueChange={(value) => {
                      const member = workspace.members.find((m: Member) => m.id === value);
                      setNewTask({ ...newTask, assignee: member });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("board.task.selectAssignee")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">{t("board.filters.unassigned")}</SelectItem>
                      {workspace.members.map((member: Member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dueDate">{t("board.task.dueDate")}</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="flex-col gap-2 sm:flex-row">
              <Button variant="outline" 
              onClick={() => setIsTaskDialogOpen(false)}
               className="w-full sm:w-auto">
                {t("board.actions.cancel")}
              </Button>
              <Button
              onClick={handleSaveTask}
              className="w-full rounded-2xl bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white  dark:text-neutral-900 dark:hover:bg-neutral-200 sm:w-auto"
            >
              {editingTask ? t("board.actions.updateTask") : t("board.actions.createTask")}
            </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={deleteDialog.open} onOpenChange={(open) => !open && closeDeleteDialog()}>
          <DialogContent className="max-w-md rounded-2xl border border-neutral-200 bg-white p-0 shadow-2xl dark:border-neutral-800 dark:bg-neutral-950">
            <div className="border-b border-neutral-200 p-6 dark:border-neutral-800">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <DialogHeader className="space-y-2 text-left">
                <DialogTitle className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                  {deleteDialog.title}
                </DialogTitle>
                <DialogDescription className="text-sm leading-6 text-neutral-500 dark:text-neutral-400">
                  {deleteDialog.description}
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="space-y-4 p-6">
              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/60">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500 dark:text-neutral-400">
                  {t("board.delete.confirmationPhrase")}
                </p>
                <p className="mt-2 text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  {DELETE_CONFIRMATION_TEXT}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="delete-confirmation-input">{t("board.delete.typePhraseToContinue")}</Label>
                <Input
                  id="delete-confirmation-input"
                  value={deleteConfirmationInput}
                  onChange={(e) => setDeleteConfirmationInput(e.target.value)}
                  placeholder={DELETE_CONFIRMATION_TEXT}
                  autoComplete="off"
                  className="h-11 rounded-xl border-neutral-200 dark:border-neutral-800"
                />
              </div>
            </div>

            <DialogFooter className="flex-col gap-2 border-t border-neutral-200 px-6 py-4 dark:border-neutral-800 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={closeDeleteDialog}
                disabled={isDeleteSubmitting}
                className="w-full sm:w-auto"
              >
                {t("board.actions.cancel")}
              </Button>
              <Button
                type="button"
                variant={deleteDialog.isDanger ? "destructive" : "default"}
                onClick={handleConfirmDeleteDialog}
                disabled={!isDeletePhraseValid || isDeleteSubmitting}
                className="w-full sm:w-auto"
              >
                {isDeleteSubmitting ? t("board.actions.processing") : deleteDialog.confirmLabel}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </DndProvider>
  );
}
