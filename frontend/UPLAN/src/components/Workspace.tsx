import { useState, useEffect } from 'react';
import { useTranslation } from "react-i18next";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from './ui/dropdown-menu';
import { 
  Pencil,
  Plus, 
  Settings, 
  Users, 
  Trash2, 
  MoreVertical, 
  ChevronDown,
  MessageSquare,
  AlertTriangle,
  Shield,
  Crown,
  User,
  Upload,
  CheckCircle2,
  Search,
  Mail,
  Clock,
  Calendar,
  Link2,
  Copy,
  Globe,
  Building2,
  RefreshCw,
  UserPlus,
  X,
  Check,
  Sparkles,
  LayoutDashboard
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from 'sonner';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import WorkspaceChat from './WorkspaceChat';
import TeamCollaboration from './TeamCollaboration';
import CalendarView from './CalendarView';
import AutoGenerateTimetable from './AutoGenerateTimetable';
import JoinWorkspaceDialog from './JoinWorkspaceDialog';
import { apiJsonAuthed, ApiError, API_BASE_URL } from '../lib/api';
import CollaborationBoard from './CollaborationBoard';

interface Member {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'member';
  joinedAt: string;
  avatar?: string;
  inviteStatus?: 'pending' | 'accepted';
  lastActive?: string;
  isOnline?: boolean;
}

interface SharedSchedule {
  id: string;
  name: string;
  ownerId: string;
  ownerName: string;
  sharedAt: string;
  sessions: any[];
  visibility: 'all' | 'admins';
}

interface TeamProgress {
  memberId: string;
  memberName: string;
  totalSessions: number;
  completedSessions: number;
  upcomingSessions: number;
  lastUpdated: string;
}

interface PendingRequest {
  id: string;
  name: string;
  email: string;
  requestedAt: string;
  message?: string;
}

interface Workspace {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  members: Member[];
  parentId?: string | null;
  image_url?: string | null;
  sharedSchedules?: SharedSchedule[];
  teamProgress?: TeamProgress[];
  pendingRequests?: PendingRequest[];
  settings?: {
    allowAllMembersToEditTimetables?: boolean;
  };
  sharing?: {
    enabled: boolean;
    linkId: string;
    accessType: 'open' | 'domain-restricted';
    allowedDomain?: string;
    createdAt: string;
    createdBy: string;
  };
}



interface WorkspaceProps {
  onNavigate?: (page: string) => void;
}

export default function Workspace({ onNavigate }: WorkspaceProps) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isDeleteWorkspaceOpen, setIsDeleteWorkspaceOpen] = useState(false);
  const [isEditWorkspaceOpen, setIsEditWorkspaceOpen] = useState(false);
  const [isCreateWorkspaceOpen, setIsCreateWorkspaceOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isPendingRequestsOpen, setIsPendingRequestsOpen] = useState(false);
  const [joinLinkId, setJoinLinkId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('members');
  const [workspaceChromeCollapsed, setWorkspaceChromeCollapsed] = useState(false);
  const { t } = useTranslation();

  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    role: 'member' as Member['role']
  });
  const [expandedWorkspaceId, setExpandedWorkspaceId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [createSubworkspaceParentId, setCreateSubworkspaceParentId] = useState<string | null>(null);
  const [subworkspacesByParent, setSubworkspacesByParent] = useState<Record<string, Workspace[]>>({});
  const [loadingSubsFor, setLoadingSubsFor] = useState<Record<string, boolean>>({});
  const [workspaceName, setWorkspaceName] = useState('');
  const [workspaceDescription, setWorkspaceDescription] = useState('');
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newWorkspaceDescription, setNewWorkspaceDescription] = useState('');
  const [emailValidationError, setEmailValidationError] = useState<string>('');
  const [subworkspaces, setSubworkspaces] = useState<Workspace[]>([]);
  const [isCreateSubworkspaceOpen, setIsCreateSubworkspaceOpen] = useState(false);
  const [newSubworkspaceName, setNewSubworkspaceName] = useState('');
  const [newSubworkspaceDescription, setNewSubworkspaceDescription] = useState('');
  const [isLoadingSubworkspaces, setIsLoadingSubworkspaces] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [unreadBoardCount, setUnreadBoardCount] = useState(0);
  const roleConfig = {
  admin: {
    label: t("workspace.roles.admin.label"),
    icon: Shield,
    color: 'border-neutral-200 bg-neutral-100 text-neutral-800 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100',
    description: t("workspace.roles.admin.description"),
    permissions: ['manage_members', 'delete_workspace', 'edit_workspace', 'manage_roles', 'chat']
  },
  member: {
    label: t("workspace.roles.member.label"),
    icon: User,
    color: 'border-neutral-200 bg-white text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300',
    description: t("workspace.roles.member.description"),
    permissions: ['edit_content', 'chat']
  }
};
  const getWorkspaceColor = (name: string) => {
    const colors = [
      "bg-red-500",
      "bg-orange-500",
      "bg-amber-500",
      "bg-yellow-500",
      "bg-lime-500",
      "bg-green-500",
      "bg-emerald-500",
      "bg-teal-500",
      "bg-cyan-500",
      "bg-sky-500",
      "bg-neutral-50 dark:bg-neutral-800/700",
      "bg-indigo-500",
      "bg-violet-500",
      "bg-purple-500",
      "bg-fuchsia-500",
      "bg-pink-500"
    ];

    let hash = 0;

    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
  };
  const getWorkspaceInitials = (name: string) => {
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };
  // Allow other pages (eg, My Timetable import) to deep-link to a specific workspace tab.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token') || params.get('invite_token') || params.get('join_token');

    if (token) {
      setJoinLinkId(token);

      // optional clean URL
      params.delete('token');
      params.delete('invite_token');
      params.delete('join_token');
      const next = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState({}, '', next.endsWith('?') ? window.location.pathname : next);
    }
  }, []);

  // Save unread counts to localStorage for dashboard badge
  useEffect(() => {
    const totalUnread = unreadChatCount + unreadBoardCount;
    localStorage.setItem('workspaceUnreadCount', totalUnread.toString());
  }, [unreadChatCount, unreadBoardCount]);

  useEffect(() => {
    try {
      const initialTab = localStorage.getItem('workspaceInitialTab');
      if (initialTab) {
        localStorage.removeItem('workspaceInitialTab');
        setSelectedTab(initialTab);
      }
    } catch {
      // ignore
    }
  }, []);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  // Get current logged-in user data from localStorage
  const getCurrentUser = (): Member => {
    const currentUserEmail = localStorage.getItem('currentUserEmail') || 'guest@example.com';
    const currentUserId = localStorage.getItem('currentUserId') || currentUserEmail;
    const currentUserName = localStorage.getItem('currentUserName') || 'You';

    return {
      id: currentUserId,
      name: currentUserName,
      email: currentUserEmail,
      role: 'admin',
      joinedAt: new Date().toISOString(),
    };
  };
  
  const [currentUser] = useState<Member>(getCurrentUser());
  const getBoardLastSeenKey = (workspaceId: string) =>
    `workspace:${workspaceId}:boardLastSeen:${currentUser.id}`;

  // One-shot: allow other pages (like Auto Generate) to request opening a specific tab
  useEffect(() => {
    try {
      const tab = localStorage.getItem('workspaceOpenTab');
      if (tab) {
        setSelectedTab(tab);
        localStorage.removeItem('workspaceOpenTab');
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadWorkspaces();
  }, []);

  useEffect(() => {
    if (!currentWorkspaceId) return;
    const current = workspaces.find(w => w.id === currentWorkspaceId) || null;
    setWorkspace(current);
  }, [currentWorkspaceId, workspaces]);

  // Fetch pending requests ONLY when workspace id changes
  useEffect(() => {
    if (!currentWorkspaceId) return;
    loadPendingRequests(currentWorkspaceId);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWorkspaceId]);
  useEffect(() => {
      if (!workspace?.id) return;

      loadUnreadChatCount();

      const id = window.setInterval(() => {
        loadUnreadChatCount();
      }, 3000);

      return () => window.clearInterval(id);
    }, [workspace?.id, currentUser.id, selectedTab]);

    useEffect(() => {
      if (!workspace?.id) return;

      loadUnreadBoardCount();

      const id = window.setInterval(() => {
        loadUnreadBoardCount();
      }, 3000);

      return () => window.clearInterval(id);
    }, [workspace?.id, currentUser.id, selectedTab]);

    // 2) Load pending requests ONLY when workspace changes (not when workspaces changes)

    const loadUnreadBoardCount = async () => {
  if (!workspace?.id || selectedTab === 'board') return;

  try {
    const res = await fetch(
      `${API_BASE_URL}/workspaces/${workspace.id}/board/tasks`,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUser.id,
        },
        cache: 'no-store',
      }
    );

    if (!res.ok) return;

    const data = await res.json();
    const lastSeen = localStorage.getItem(getBoardLastSeenKey(String(workspace.id)));
    const lastSeenTime = lastSeen ? new Date(lastSeen).getTime() : 0;

    const unseen = (Array.isArray(data) ? data : []).filter((task: any) => {
      const createdByOtherUser =
        String(task.created_by ?? task.createdBy ?? '') !== String(currentUser.id);

      const updatedAt = task.updated_at ?? task.updatedAt ?? task.created_at ?? task.createdAt;
      const updatedTime = updatedAt ? new Date(updatedAt).getTime() : 0;

      return createdByOtherUser && updatedTime > lastSeenTime;
    }).length;

    setUnreadBoardCount(unseen);
  } catch (e) {
    console.error('[Workspace] loadUnreadBoardCount error:', e);
  }
};
  // Migrate old roles to new roles
  const migrateRole = (role: string): Member['role'] => {
    if (role === 'owner') return 'admin';
    if (role === 'viewer') return 'member';
    if (role === 'admin' || role === 'member') return role as Member['role'];
    return 'member'; // default fallback
  };

  // Safe role config access with fallback
  const getRoleConfig = (role: string) => {
    const migratedRole = migrateRole(role);
    return roleConfig[migratedRole] || roleConfig.member;
  };
  const isSubworkspace = !!workspace?.parentId;

  const getParentWorkspace = (): Workspace | null => {
    if (!workspace) return null;

    const parentId = workspace.parentId ? String(workspace.parentId) : null;
    if (!parentId) return null;

    return workspaces.find((w) => String(w.id) === parentId) || null;
  };

  const isEmailInParentWorkspace = (email: string): boolean => {
    const parent = getParentWorkspace();
    if (!parent) return true; // if no parent, allow (normal workspace)
    return parent.members.some((m) => (m.email || '').toLowerCase() === email.toLowerCase());
  };

  const ensureSubworkspacesLoaded = async (parentId: string) => {
  if (subworkspacesByParent[parentId]) return;

  try {
    setLoadingSubsFor(prev => ({ ...prev, [parentId]: true }));

    const children = await apiJsonAuthed<any[]>(
      `/workspaces/${encodeURIComponent(parentId)}/subworkspaces`,
      'GET'
    );

    const mappedWithMembership = await Promise.all(
      (children || []).map(async (w: any) => {
        const wid = String(w.id);

        let members: Member[] = [];
        try {
          const mJson = await apiJsonAuthed<any[]>(`/workspaces/${wid}/members`, 'GET');
          if (Array.isArray(mJson)) {
            members = mJson.map((m: any) => ({
              id: String(m.user_id || m.id),
              name: m.name || m.username || m.email || 'Member',
              email: m.email || '',
              role: migrateRole(m.role || 'member'),
              joinedAt: m.joined_at || new Date().toISOString(),
              inviteStatus: 'accepted',
            }));
          }
        } catch {}

        const isCurrentUserMember = members.some(
          (m) => String(m.id) === String(currentUser.id)
        );

        return isCurrentUserMember
          ? ({
              id: wid,
              name: w.name,
              description: w.description || '',
              createdAt: w.created_at || new Date().toISOString(),
              members,
              parentId: w.parent_id ?? w.parent_workspace_id ?? parentId,
              image_url: w.image_url ?? null,
              pendingRequests: [],
            } as Workspace)
          : null;
      })
    );

    const filtered = mappedWithMembership.filter(Boolean) as Workspace[];
    setSubworkspacesByParent(prev => ({ ...prev, [parentId]: filtered }));
  } catch {
    setSubworkspacesByParent(prev => ({ ...prev, [parentId]: [] }));
  } finally {
    setLoadingSubsFor(prev => ({ ...prev, [parentId]: false }));
  }
};

  const loadWorkspaces = async () => {
    const userId = currentUser.id;

    if (!userId) {
      toast.error(t("workspace.errors.missingUser"));
      return;
    }

    try {
      // 1) Fetch workspaces the backend says this user belongs to
      const backendWorkspaces = await apiJsonAuthed<any[]>(`/workspaces`, 'GET');

      // 2) If none exist, create a default workspace for the user (safe start)
      if (!Array.isArray(backendWorkspaces) || backendWorkspaces.length === 0) {
        await apiJsonAuthed<any>(`/workspaces`, 'POST', {
         name: t("workspace.defaults.name"),
        description: t("workspace.defaults.description"),
        });
        // Re-fetch
        const againJson = await apiJsonAuthed<any[]>(`/workspaces`, 'GET');
        backendWorkspaces.splice(0, backendWorkspaces.length, ...(againJson || []));
      }

      // 3) For each workspace, fetch its member list (so both accounts see the same members)
      const mapped: Workspace[] = await Promise.all(
        (backendWorkspaces || []).map(async (w: any) => {
          const wid = String(w.id);
          let members: Member[] = [];
          try {
            const mJson = await apiJsonAuthed<any[]>(`/workspaces/${wid}/members`, 'GET');
            if (Array.isArray(mJson)) {
              members = (mJson || []).map((m: any) => ({
                id: String(m.user_id || m.id),
                name: m.name || m.username || m.email || 'Member',
                email: m.email || '',
                role: migrateRole(m.role || 'member'),
                joinedAt: m.joined_at || new Date().toISOString(),
                inviteStatus: 'accepted',
              }));
            }
          } catch {
            // ignore
          }

          // Ensure current user exists in member list (UI safety)
          

          return {
            id: wid,
            name: w.name,
            description: w.description || '',
            createdAt: (w.created_at || new Date().toISOString()),
            members,
            parentId: w.parent_id ?? w.parent_workspace_id ?? null,
            image_url: w.image_url ?? null,
            pendingRequests: [],
          } as Workspace;
        })
      );

      setWorkspaces(mapped);

      // 4) Preserve user's last selected workspace if still available
      const savedCurrentId = localStorage.getItem('currentWorkspaceId');
      if (savedCurrentId && mapped.find((x) => x.id === savedCurrentId)) {
        setCurrentWorkspaceId(savedCurrentId);
      } else if (mapped.length > 0) {
        setCurrentWorkspaceId(mapped[0].id);
        localStorage.setItem('currentWorkspaceId', mapped[0].id);
      }
    } catch (e: any) {
      console.error('[Workspace] loadWorkspaces failed:', e);
      const msg = e instanceof ApiError ? e.message : (e?.message || t("workspace.errors.loadFailed"));
      toast.error(msg);
    }
  };


useEffect(() => {
  if (!workspace?.id) return;

  const parentId = workspace.parentId ? String(workspace.parentId) : String(workspace.id);
  loadSubworkspaces(parentId);
}, [workspace?.id, workspace?.parentId]);
const updateWorkspaceState = (updatedWorkspace: Workspace) => {
  setWorkspaces((prev) =>
    prev.map((w) => (w.id === updatedWorkspace.id ? updatedWorkspace : w))
  );
  setWorkspace(updatedWorkspace);
};

const persistWorkspaceDetails = async (updatedWorkspace: Workspace) => {
  const userId =
    localStorage.getItem("currentUserId") ||
    localStorage.getItem("userId") ||
    localStorage.getItem("user_id");

  const response = await fetch(
    `${API_BASE_URL}/workspaces/${updatedWorkspace.id}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-User-Id": userId || "",
      },
      body: JSON.stringify({
        name: updatedWorkspace.name,
        description: updatedWorkspace.description,
      }),
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.detail || "Failed to update workspace");
  }

  return data;
};
const handleCreateSubworkspace = async () => {
  const parentId = createSubworkspaceParentId || workspace?.id;
  if (!parentId) return;

  if (!newSubworkspaceName.trim()) {
    toast.error(t("workspace.errors.subworkspaceNameRequired"));
    return;
  }

  try {
    const created = await apiJsonAuthed<any>(
      `/workspaces/${encodeURIComponent(String(parentId))}/subworkspaces`,
      'POST',
      {
        name: newSubworkspaceName.trim(),
        description: newSubworkspaceDescription.trim(),
      }
    );

    toast.success(t("workspace.success.subworkspaceCreated"));
    setIsCreateSubworkspaceOpen(false);
    setNewSubworkspaceName('');
    setNewSubworkspaceDescription('');
    setCreateSubworkspaceParentId(null);

    // refresh that parent’s cache so it appears immediately in the submenu
    setSubworkspacesByParent((prev) => {
      const copy = { ...prev };
      delete copy[String(parentId)];
      return copy;
    });
    await ensureSubworkspacesLoaded(String(parentId));

    // optional: update workspaces list + auto switch
    await loadWorkspaces();
    const newId = String(created?.id);
    if (newId) handleSwitchWorkspace(newId);
  } catch (e: any) {
    console.error('Create subworkspace failed:', e);
    toast.error(e?.message || t("workspace.errors.createSubworkspace"));
  }
};


  const loadSubworkspaces = async (parentWorkspaceId: string) => {
  try {
    setIsLoadingSubworkspaces(true);

    const children = await apiJsonAuthed<any[]>(
      `/workspaces/${encodeURIComponent(parentWorkspaceId)}/subworkspaces`,
      'GET'
    );

    const mappedWithMembership = await Promise.all(
      (children || []).map(async (w: any) => {
        const wid = String(w.id);

        let members: Member[] = [];
        try {
          const mJson = await apiJsonAuthed<any[]>(`/workspaces/${wid}/members`, 'GET');
          if (Array.isArray(mJson)) {
            members = mJson.map((m: any) => ({
              id: String(m.user_id || m.id),
              name: m.name || m.username || m.email || 'Member',
              email: m.email || '',
              role: migrateRole(m.role || 'member'),
              joinedAt: m.joined_at || new Date().toISOString(),
              inviteStatus: 'accepted',
            }));
          }
        } catch {}

        const isCurrentUserMember = members.some(
          (m) => String(m.id) === String(currentUser.id)
        );

        return isCurrentUserMember
          ? ({
              id: wid,
              name: w.name,
              description: w.description || '',
              createdAt: w.created_at || new Date().toISOString(),
              parentId: w.parent_id ?? w.parent_workspace_id ?? parentWorkspaceId,
              members,
              image_url: w.image_url ?? null,
              pendingRequests: [],
            } as Workspace)
          : null;
      })
    );

    setSubworkspaces(
      mappedWithMembership.filter(Boolean) as Workspace[]
    );
  } catch (e: any) {
    console.warn('[Workspace] loadSubworkspaces failed:', e?.message || e);
    setSubworkspaces([]);
  } finally {
    setIsLoadingSubworkspaces(false);
  }
};
  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) {
      toast.error(t("workspace.errors.workspaceNameRequired"));
      return;
    }


    try {
      await apiJsonAuthed<any>(`/workspaces`, 'POST', {
        name: newWorkspaceName.trim(),
        description: newWorkspaceDescription.trim(),
      });

      setIsCreateWorkspaceOpen(false);
      setNewWorkspaceName('');
      setNewWorkspaceDescription('');
      toast.success(t("workspace.success.workspaceCreated"));
      await loadWorkspaces();
    } catch (e: any) {
      console.error('[Workspace] create failed:', e);
      const msg = e instanceof ApiError ? e.message : (e?.message || t("workspace.errors.createWorkspace"));
      toast.error(msg);
    }
  };

  const handleSwitchWorkspace = (workspaceId: string) => {
    setCurrentWorkspaceId(workspaceId);
    localStorage.setItem('currentWorkspaceId', workspaceId);

    const switched = workspaces.find(w => w.id === workspaceId);
    if (switched) toast.success(t("workspace.success.switched", { name: switched.name }));  };


  const handleAddMember = () => {
    if (!workspace) return;
    
    // Clear previous errors
    setEmailValidationError('');
    
    if (!newMember.name.trim() || !newMember.email.trim()) {
      setEmailValidationError(t("workspace.errors.fillFields"));
      toast.error(t("workspace.errors.fillFields"));
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newMember.email)) {
      setEmailValidationError('Please enter a valid email address (e.g., user@example.com)');
      toast.error('Please enter a valid email address');
      return;
    }

    // Check if email already exists
    if (workspace.members.some(m => m.email === newMember.email)) {
      setEmailValidationError('A member with this email already exists in this workspace');
      toast.error('A member with this email already exists');
      return;
    }

    // Check admin limit when adding new admin
    if (newMember.role === 'admin') {
      const currentAdminCount = workspace.members.filter(m => m.role === 'admin').length;
      if (currentAdminCount >= 2) {
        setEmailValidationError('Maximum 2 admins allowed per workspace. Please select Member role instead.');
        toast.error('Maximum 2 admins allowed per workspace');
        return;
      }
        }
    // Subworkspace rule: must already be in parent workspace
    if (workspace.parentId) {
      const parent = getParentWorkspace();
      if (!parent) {
        toast.error('Parent workspace not found. Please refresh and try again.');
        return;
      }

      const inParent = isEmailInParentWorkspace(newMember.email.trim());
      if (!inParent) {
        toast.error(
          `This user must be added to the parent workspace (“${parent.name}”) before they can be added to this subworkspace.`
        );
        return;
      }
    }
    (async () => {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
        const res = await fetch(`${API_BASE_URL}/workspaces/${workspace.id}/members`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-User-Id': currentUser.id,
          },
          body: JSON.stringify({
            email: newMember.email,
            role: newMember.role,
          }),
        });
        const err = await res.json().catch(() => ({}));
        if (!res.ok) {
          
          throw new Error(err.detail || `Failed to add member (${res.status})`);
        }

        setIsAddMemberOpen(false);
        setNewMember({ name: '', email: '', role: 'member' });
        setEmailValidationError('');
        toast.success(err.message || 'Member added successfully');
        await loadWorkspaces();
      } catch (e: any) {
        console.error('[Workspace] add member failed:', e);
        toast.error(e.message || 'Failed to add member');
      }
    })();
  };

  const handleRemoveMember = (memberId: string) => {
      if (!workspace) return;

      const member = workspace.members.find(m => m.id === memberId);
      if (!member) return;

    if (!confirm(t("workspace.confirm.removeMember", { name: member.name }))) return;
      (async () => {
        try {
          const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
          const res = await fetch(`${API_BASE_URL}/workspaces/${workspace.id}/members/${member.id}`, {
            method: 'DELETE',
            headers: { 'X-User-Id': currentUser.id },
          });
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.detail || `Failed to remove member (${res.status})`);
          }
          toast.success(t("workspace.success.memberRemoved", { name: member.name }));
          await loadWorkspaces();
        } catch (e: any) {
          console.error('[Workspace] remove member failed:', e);
          toast.error(e.message || t("workspace.errors.removeMember"));
        }
      })();
  };

    const handleChangeRole = async (
    memberId: string,
    newRole: Member["role"]
   ) => {
    if (!workspace) return;

    const member = workspace.members.find((m) => m.id === memberId);
    if (!member) return;

    // Client-side admin limit check (UX only)
    if (newRole === "admin") {
      const currentAdminCount = workspace.members.filter(
        (m) => m.role === "admin"
      ).length;

      if (currentAdminCount >= 2 && member.role !== "admin") {
        toast.error(t("workspace.errors.maxAdmins"));
        return;
      }
    }

    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
      const currentUserId = localStorage.getItem("currentUserId");

      if (!currentUserId) {
        toast.error(t("workspace.errors.notAuthenticated"));
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/workspaces/${workspace.id}/members/${memberId}/role`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "X-User-Id": currentUserId,
          },
          body: JSON.stringify({ role: newRole }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        toast.error( t("workspace.errors.updateRole"));
        return;
      }

      // Backend succeeded → update local state
      const updatedWorkspace = {
        ...workspace,
        members: workspace.members.map((m) =>
          m.id === memberId ? { ...m, role: newRole } : m
        ),
      };

      updateWorkspaceState(updatedWorkspace);

      toast.success(
        t("workspace.success.roleUpdated", {
          name: member.name,
          role: getRoleConfig(newRole).label,
        })
      );

    } catch (err: any) {
      console.error("Change role error:", err);
      toast.error(t("workspace.errors.updateRoleUnexpected"));
    }
  };

  const loadUnreadChatCount = async () => {
    if (!workspace?.id || selectedTab === 'chat') return;

    try {
      const res = await fetch(
        `${API_BASE_URL}/chat/workspaces/${workspace.id}/messages?limit=200&_t=${Date.now()}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-User-Id': currentUser.id,
          },
          cache: 'no-store',
        }
      );

      if (!res.ok) return;

      const data = await res.json();

      const unread = (data || []).filter((m: any) => {
        const isOwnMessage = String(m.user_id) === String(currentUser.id);

        const readByCurrentUser = Array.isArray(m.read_by)
          ? m.read_by.some((r: any) => String(r.user_id) === String(currentUser.id))
          : false;

        return !isOwnMessage && !readByCurrentUser;
      }).length;

      setUnreadChatCount(unread);
    } catch (e) {
      console.error('[Workspace] loadUnreadChatCount error:', e);
    }
  };
  const loadPendingRequests = async (workspaceId: string) => {
    // Only admins should fetch pending requests
    const ws = workspaces.find(w => w.id === workspaceId) || workspace;
    const myRole = ws?.members.find(m => m.id === currentUser.id)?.role;
    if (myRole !== 'admin') return;

    try {
      const requests = await apiJsonAuthed<any[]>(
        `/workspaces/${encodeURIComponent(workspaceId)}/join-requests?status=pending`,
        'GET'
      );
      if (!Array.isArray(requests)) return;

      const mapped: PendingRequest[] = requests.map((r: any) => ({
        id: String(r.id),
        name: r.name || r.email || 'Unknown',
        email: r.email || '',
        requestedAt: r.requested_at || new Date().toISOString(),
        message: r.message || undefined,
      }));

      setWorkspaces(prev =>
        prev.map(w =>
          w.id === workspaceId ? { ...w, pendingRequests: mapped } : w
        )
      );
    } catch {
      // Non-admins will get 403 — silently ignore
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    if (!workspace) return;
    const request = workspace.pendingRequests?.find(r => r.id === requestId);
    if (!request) return;

    try {
      await apiJsonAuthed(
        `/workspaces/${workspace.id}/join-requests/${requestId}/approve`,
        'POST'
      );
      toast.success(t("workspace.success.requestApproved", { name: request.name }));
      // refresh members and pending requests
      await loadWorkspaces();
      await loadPendingRequests(workspace.id);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to approve request');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    if (!workspace) return;
    const request = workspace.pendingRequests?.find(r => r.id === requestId);
    if (!request) return;

    try {
      await apiJsonAuthed(
        `/workspaces/${workspace.id}/join-requests/${requestId}`,
        'DELETE'
      );
      toast.success(t("workspace.success.requestRejected", { name: request.name }));
      await loadPendingRequests(workspace.id);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to reject request');
    }
  };

  const handleDeleteWorkspace = async () => {
  if (!workspace) return;

  if (workspaces.length === 1) {
    toast.error(t("workspace.errors.cannotDeleteLast"));
    return;
  }



  try {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const currentUserId = localStorage.getItem("currentUserId");

    if (!currentUserId) {
      toast.error("User not authenticated");
      return;
    }

    const response = await fetch(
      `${API_BASE_URL}/workspaces/${workspace.id}`,
      {
        method: "DELETE",
        headers: {
          "X-User-Id": currentUserId,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      toast.error(data.detail || "Failed to delete workspace");
      return;
    }

    // Backend delete succeeded — now update UI state
    const updatedWorkspaces = workspaces.filter(
      (w) => w.id !== workspace.id
    );

    setWorkspaces(updatedWorkspaces);
    localStorage.setItem("workspaces", JSON.stringify(updatedWorkspaces));

    if (updatedWorkspaces.length > 0) {
      setCurrentWorkspaceId(updatedWorkspaces[0].id);
      localStorage.setItem(
        "currentWorkspaceId",
        updatedWorkspaces[0].id
      );
    }

    setIsDeleteWorkspaceOpen(false);
    toast.success(t("workspace.success.deleted"));

    setTimeout(() => {
      loadWorkspaces();
    }, 500);

    } catch (err: any) {
    console.error("Delete workspace error:", err);
    toast.error("Something went wrong while deleting the workspace");
    };
  };


const handleEditWorkspace = async () => {
  if (!workspace) return;

  if (!workspaceName.trim()) {
    toast.error(t("workspace.errors.workspaceNameRequired"));
    return;
  }

  const updatedWorkspace: Workspace = {
    ...workspace,
    name: workspaceName,
    description: workspaceDescription,
  };

  try {
    await persistWorkspaceDetails(updatedWorkspace);
    updateWorkspaceState(updatedWorkspace);
    setIsEditWorkspaceOpen(false);
    toast.success(t("workspace.success.updated"));
  } catch (e: any) {
    toast.error(e?.message || 'Failed to update workspace');
  }
};

  const openEditWorkspace = () => {
    if (workspace) {
      setWorkspaceName(workspace.name);
      setWorkspaceDescription(workspace.description);
      setIsEditWorkspaceOpen(true);
    }
  };

  const filteredMembers = workspace?.members.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    getRoleConfig(member.role).label.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getLastSeenText = (lastActive?: string, isOnline?: boolean) => {
    if (isOnline) return t("workspace.presence.online");
    if (!lastActive) return t("workspace.presence.never");

    
    const now = new Date();
    const lastActiveDate = new Date(lastActive);
    const diffMs = now.getTime() - lastActiveDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffMins < 1) return t("workspace.presence.justNow");
    if (diffDays === 1) return t("workspace.presence.yesterday");
    if (diffDays < 7) return `${diffDays}d ago`;
    return lastActiveDate.toLocaleDateString();
  };
  
  const getRoleStats = () => {
    if (!workspace) return { admins: 0, members: 0 };
    return {
      admins: workspace.members.filter(m => m.role === 'admin').length,
      members: workspace.members.filter(m => m.role === 'member').length,
    };
  };

  // Handle workspace avatar upload
  const handleAvatarUpload = async (
      event: React.ChangeEvent<HTMLInputElement>
    ) => {
      const file = event.target.files?.[0];
      if (!file || !workspace) return;

      if (file.size > 5 * 1024 * 1024) {
        toast.error(t("workspace.errors.imageSize"));
        return;
      }

      if (!file.type.startsWith("image/")) {
        toast.error(t("workspace.errors.imageType"));
        return;
      }

      try {
        const formData = new FormData();
        formData.append("image", file);

        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/workspaces/${workspace.id}/image`,
          {
            method: "POST",
            body: formData,
            headers: {
              "X-User-Id": localStorage.getItem("currentUserId") || "",
            },
          }
        );

        const text = await response.text();
        console.log("Raw response:", text);

        let data : any = {};
        if (text) {
          data = JSON.parse(text);
        }
        if (!response.ok) {
          throw new Error(data.detail || t("workspace.errors.uploadAvatar"));
        }

        const updatedWorkspace = {
          ...workspace,
          image_url: data.image_url,
        };

        updateWorkspaceState(updatedWorkspace);
        toast.success(t("workspace.success.avatarUpdated"));
      } catch (error: any) {
        toast.error(error.message || "Upload failed");
      } finally {
        event.target.value = "";
      }
    };

    const triggerAvatarUpload = () => {
      document.getElementById("workspace-avatar-upload")?.click();
    };

    const handleRemoveAvatar = async () => {
      if (!workspace) return;

      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/workspaces/${workspace.id}/image`,
          {
            method: "DELETE",
            headers: {
              "X-User-Id": localStorage.getItem("currentUserId") || "",
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.detail || "Failed to remove workspace image");
        }

        const updatedWorkspace = {
          ...workspace,
          image_url: null,
        };

        updateWorkspaceState(updatedWorkspace);
        toast.success(t("workspace.success.avatarRemoved"));
      } catch (error: any) {
        toast.error(error.message || "Remove failed");
      }
  };
  // Sharing Link Functions
  const generateShareLink = async () => {
    if (!workspace) return;

    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
      const currentUserId = localStorage.getItem("currentUserId");
    if (!currentUserId) {
      toast.error(t("workspace.errors.notAuthenticated"));
      return;
    }

    const response = await fetch(
      `${API_BASE_URL}/workspaces/${workspace.id}/share-link`,
      {
        method: "POST",
        headers: {
          "X-User-Id": currentUserId,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      toast.error(data.detail || "Failed to generate share link");
      return;
    }

    const updatedWorkspace = {
      ...workspace,
      sharing: {
        enabled: true,
        linkId: data.link_id, // backend-issued token
        accessType: "open" as const,
        createdAt: new Date().toISOString(),
        createdBy: currentUser.id,
      },
    };

    updateWorkspaceState(updatedWorkspace);
    toast.success(t("workspace.success.shareCreated"));

    } catch (err: any) {
    console.error("Generate share link error:", err);
    toast.error("Something went wrong while generating the link");
    }
  };

  const disableShareLink = async () => {
    if (!workspace) return;

    if (!confirm(t("workspace.confirm.disableShareLink"))) return;
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
      const currentUserId = localStorage.getItem("currentUserId");

      if (!currentUserId) {
        toast.error("User not authenticated");
        return;
      }

      const res = await fetch(`${API_BASE_URL}/workspaces/${workspace.id}/share-link/disable`, {
        method: "POST",
        headers: { "X-User-Id": currentUserId },
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        toast.error(data?.detail || "Failed to disable share link");
        return;
      }

      const updatedWorkspace = { ...workspace, sharing: undefined };
      updateWorkspaceState(updatedWorkspace);
      toast.success(t("workspace.success.shareDisabled"));

    } catch (e) {
      console.error("Disable share link error:", e);
      toast.error("Failed to disable share link");
    }
  };

  const copyShareLink = () => {
    if (!workspace?.sharing) return;
    const shareUrl = `${window.location.origin}/?page=workspace&join_token=${encodeURIComponent(workspace.sharing.linkId)}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      toast.success(t("workspace.success.linkCopied"));
    }).catch(() => {
      toast.error('Failed to copy link');
    });
  };

  const toggleAccessType = (type: 'open' | 'domain-restricted') => {
    if (!workspace?.sharing) return;
    
    const updatedWorkspace = {
      ...workspace,
      sharing: {
        ...workspace.sharing,
        accessType: type,
        allowedDomain: type === 'domain-restricted' ? workspace.sharing.allowedDomain || '' : undefined
      }
    };
    
    updateWorkspaceState(updatedWorkspace);
    toast.success(
      t(
        type === "open"
          ? "workspace.success.accessOpen"
          : "workspace.success.accessRestricted"
      )
    );
  };

  const updateAllowedDomain = (domain: string) => {
    if (!workspace?.sharing) return;
    
    const updatedWorkspace = {
      ...workspace,
      sharing: {
        ...workspace.sharing,
        allowedDomain: domain
      }
    };
    
    updateWorkspaceState(updatedWorkspace);
  };

  if (!workspace) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Users className="mx-auto mb-4 h-16 w-16 text-neutral-300 dark:text-neutral-700" />
          <p className="text-neutral-500 dark:text-neutral-400">{t("workspace.loading")}</p>
        </div>
      </div>
    );
  }

  const stats = getRoleStats();
  
  // Check if current user is an admin
  const isAdmin = workspace?.members.find(m => m.id === currentUser.id)?.role === 'admin';

  const handleWorkspaceNavigate = (page: string) => {
    if (page === 'auto-generate') {
      if (!isAdmin) {
        toast.error('Only workspace admins can auto-generate');
        return;
      }
      // Keep workspace auto-generate isolated inside the Workspace UI.
      setWorkspaceChromeCollapsed(false);
      setSelectedTab('auto-generate');
      return;
    }
    onNavigate?.(page);
  };

  const shouldHideChrome = selectedTab === 'timetable' && workspaceChromeCollapsed;
  const parentWorkspaces = workspaces.filter((w) => !w.parentId);
  const hasUnreadChat = unreadChatCount > 0 && selectedTab !== 'chat';
  const hasUnreadBoard = unreadBoardCount > 0 && selectedTab !== 'board';

  const getTabClass = (hasUnread: boolean) =>
  [
    "relative shrink-0 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
    "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-[#171717]",
    "data-[state=active]:bg-blue-700 data-[state=active]:text-white",
    hasUnread ? "font-semibold" : "",
  ].join(" ");
    
  return (
      <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-black dark:text-white">
        {!shouldHideChrome && (
        <>
      {/* Workspace Selector Bar */}
        {/* Workspace Selector Bar */}
<div
  className="border-b border-slate-200 bg-white/95 backdrop-blur dark:border-white/10 dark:bg-[#0b0b0b]/95"
  data-tour="workspace-header-region"
>
  <div className="mx-auto w-full max-w-6xl px-4 py-3 sm:px-6">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-12 w-full justify-between rounded-2xl border border-slate-200 bg-white px-3 text-slate-900 hover:bg-slate-50 dark:border-white/10 dark:bg-[#111] dark:text-white dark:hover:bg-[#171717] sm:w-[290px]"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-white/10 dark:bg-slate-900">
                  {workspace.image_url ? (
                    <img
                      src={workspace.image_url}
                      alt={workspace.name}
                      className="h-full w-full object-cover"
                      draggable={false}
                    />
                  ) : (
                    <Users className="h-4 w-4 text-slate-500 dark:text-slate-300" />
                  )}
                </div>

                <div className="min-w-0 text-left">
                  <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
                    {t("workspace.switch")}
                  </p>
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                    {workspace.name}
                  </p>
                </div>
              </div>

              <ChevronDown className="h-4 w-4 text-slate-400 dark:text-slate-500" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="start"
            sideOffset={10}
            className="w-[94vw] max-w-[380px] rounded-2xl border border-slate-200 bg-white p-0 shadow-lg dark:border-white/10 dark:bg-[#0b0b0b] sm:w-80"
          >
            <div className="border-b border-slate-200 px-4 py-3 dark:border-white/10">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                {t("workspace.switch")}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {t("workspace.choose")}
              </p>
            </div>

            <div className="max-h-[65vh] overflow-y-auto p-2">
              {parentWorkspaces.map((ws) => {
                const isCurrent = currentWorkspaceId === ws.id;
                const kids = subworkspacesByParent[ws.id] || [];
                const isLoadingKids = !!loadingSubsFor[ws.id];
                const isExpanded = expandedWorkspaceId === ws.id;

                return (
                  <div
                    key={ws.id}
                    className={`mb-2 overflow-hidden rounded-2xl border transition-all ${
                      isCurrent
                        ? "border-blue-200 bg-blue-50/50 dark:border-blue-900/30 dark:bg-blue-950/10"
                        : "border-slate-200 bg-white dark:border-white/10 dark:bg-[#111]"
                    }`}
                  >
                    <div className="flex items-center gap-2 p-2">
                      <button
                        type="button"
                        onClick={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          await ensureSubworkspacesLoaded(ws.id);
                          setExpandedWorkspaceId((prev) => (prev === ws.id ? null : ws.id));
                        }}
                        onMouseEnter={() => {
                          if (!isMobile) ensureSubworkspacesLoaded(ws.id);
                        }}
                        className="flex min-w-0 flex-1 items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-slate-50 dark:hover:bg-white/[0.04]"
                      >
                        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-white/10 dark:bg-slate-900 shadow-sm">
                          {ws.image_url ? (
                            <img
                              src={ws.image_url}
                              alt={ws.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Users className="h-4 w-4 text-slate-500 dark:text-slate-300" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                            {ws.name}
                          </p>

                          <div className="mt-0.5 flex items-center gap-2">
                            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                              {t("workspace.memberCount", { count: ws.members.length })}
                            </p>

                            {kids.length > 0 && !isLoadingKids && (
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-white/10 dark:text-slate-300">
                                {t("workspace.subworkspaceCount", { count: kids.length })}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {isCurrent && (
                            <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-blue-700 dark:text-blue-400" />
                          )}

                          <ChevronDown
                            className={`h-4 w-4 flex-shrink-0 text-slate-400 transition-transform duration-200 dark:text-slate-500 ${
                              isExpanded ? "rotate-180" : ""
                            }`}
                          />
                        </div>
                      </button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleSwitchWorkspace(ws.id);
                        }}
                        className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-[#0b0b0b] dark:text-slate-200 dark:hover:bg-[#171717]"
                      >
                        {t("common.open")}
                      </Button>
                    </div>

                    <div
                      className={`grid transition-all duration-300 ${
                        isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                      }`}
                    >
                      <div className="overflow-hidden">
                        <div className="border-t border-slate-100 bg-slate-50/70 px-2 py-2 dark:border-white/10 dark:bg-white/[0.03]">
                          <div className="mb-2 px-2">
                            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                              {t("workspace.subworkspaces")}
                            </p>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500">
                              {t("workspace.under", { name: ws.name })}
                            </p>
                          </div>

                          {isLoadingKids ? (
                            <div className="px-2 py-3 text-sm text-slate-500 dark:text-slate-400">
                              {t("workspace.loadingSubworkspaces")}
                            </div>
                          ) : kids.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-slate-200 bg-white px-3 py-3 text-sm text-slate-500 dark:border-white/10 dark:bg-[#111] dark:text-slate-400">
                              {t("workspace.noSub")}
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {kids.map((sw) => (
                                <button
                                  key={sw.id}
                                  onClick={() => handleSwitchWorkspace(sw.id)}
                                  className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition ${
                                    currentWorkspaceId === sw.id
                                      ? "border-blue-200 bg-blue-50/50 dark:border-blue-900/30 dark:bg-blue-950/10"
                                      : "border-slate-200 bg-white dark:border-white/10 dark:bg-[#111] hover:bg-slate-50 dark:hover:bg-[#171717]"
                                  }`}
                                >
                                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-900 shadow-sm dark:border-white/10">
                                    {sw.image_url ? (
                                      <img
                                        src={sw.image_url}
                                        alt={sw.name}
                                        className="h-full w-full object-cover"
                                      />
                                    ) : (
                                      <Building2 className="h-5 w-5 text-white" />
                                    )}
                                  </div>

                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                                      {sw.name}
                                    </p>
                                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                                      {sw.members.length} {sw.members.length === 1 ? "member" : "members"}
                                    </p>
                                  </div>

                                  {currentWorkspaceId === sw.id && (
                                    <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-blue-700 dark:text-blue-400" />
                                  )}
                                </button>
                              ))}
                            </div>
                          )}

                          {isAdmin && (
                            <Button
                              variant="outline"
                              onClick={() => {
                                setCreateSubworkspaceParentId(ws.id);
                                setNewSubworkspaceName("");
                                setNewSubworkspaceDescription("");
                                setIsCreateSubworkspaceOpen(true);
                              }}
                              className="mt-3 h-11 w-full rounded-xl border border-dashed border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-[#111] dark:text-slate-200 dark:hover:bg-[#171717]"
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              {t("workspace.createSub")}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="sticky bottom-0 border-t border-slate-100 bg-white/95 p-2 backdrop-blur dark:border-white/10 dark:bg-[#0b0b0b]/95">
              <DropdownMenuItem
                onClick={() => setIsCreateWorkspaceOpen(true)}
                className="flex h-11 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-[#111] dark:text-slate-200 dark:hover:bg-[#171717]"
              >
                <Plus className="mr-2 h-4 w-4" />
                {t("workspace.createNew")}
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Button
        onClick={() => setIsCreateWorkspaceOpen(true)}
        size="sm"
        className="rounded-2xl bg-blue-700 text-white hover:bg-blue-700"
      >
        <Plus className="mr-2 h-4 w-4" />
        {t("workspace.createNew")}
      </Button>
    </div>
  </div>
</div>

      {/* Header */}
      <Card className="rounded-2xl border border-neutral-200/80 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <CardContent className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-6">

            {/* LEFT SIDE */}
            <div className="flex items-start gap-4 min-w-0">

              {/* LOGO */}
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={isAdmin ? triggerAvatarUpload : undefined}
                  disabled={!isAdmin}
                  className={[
                    "group relative block rounded-2xl transition-all",
                    isAdmin
                      ? "cursor-pointer hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                      : "cursor-default",
                  ].join(" ")}
                  title={isAdmin ? "Upload workspace image" : workspace.name}
                >
                  <Avatar className="h-20 w-20 rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <AvatarImage
                      src={workspace.image_url || undefined}
                      alt={workspace.name}
                      draggable={false}
                      className="select-none object-cover"
                    />
                    <AvatarFallback
                      className={`rounded-2xl text-lg font-semibold text-white ${getWorkspaceColor(workspace.name)}`}
                    >
                      {getWorkspaceInitials(workspace.name)}
                    </AvatarFallback>
                  </Avatar>

                  {isAdmin && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/0 transition group-hover:bg-black/35">
                      <div className="opacity-0 transition group-hover:opacity-100 flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-medium text-neutral-900 shadow">
                        <Upload className="h-3.5 w-3.5" />
                        Change
                      </div>
                    </div>
                  )}
                </button>

                <input
                  id="workspace-avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </div>

              {/* TEXT CONTENT */}
              <div className="min-w-0">
                {/* NAME */}
                <h1 className="text-xl sm:text-2xl font-semibold text-neutral-900 dark:text-white">
                  {workspace.name}
                </h1>

                {/* DESCRIPTION */}
                <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400 max-w-xl">
                  {workspace.description || "No description provided."}
                </p>

                {/* CREATION DATE */}
                <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-500 flex items-center gap-1">
                  Created on{" "}
                  {new Date(workspace.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* RIGHT SIDE (ACTIONS) */}
            {isAdmin && (
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  onClick={openEditWorkspace}
                  className="rounded-lg"
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsShareDialogOpen(true)}
                  className="rounded-lg flex items-center gap-2 border-neutral-200 bg-white hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-neutral-800"
                >
                  <Link2 className="h-4 w-4" />
                  {workspace?.sharing?.enabled
                    ? t("workspace.actions.manageLink")
                    : t("workspace.actions.share")}
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setIsDeleteWorkspaceOpen(true)}
                  className="rounded-lg"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

        </>
      )}

      {/* Tabs */}
      <div className="flex-1 overflow-hidden ">
        <Tabs value={selectedTab} onValueChange={(v) => {
            setSelectedTab(v);
            if (v !== 'timetable') setWorkspaceChromeCollapsed(false);
            // Clear unread badge when user enters chat or board tab
            if (v === 'chat') setUnreadChatCount(0);
            if (v === 'board' && workspace?.id) {
              localStorage.setItem(
                `workspace:${workspace.id}:boardLastSeen:${currentUser.id}`,
                new Date().toISOString()
              );
              setUnreadBoardCount(0);
            }
          }} className="h-full flex flex-col">
          {!shouldHideChrome && (
          <div className="bg-white border-b border-neutral-200 dark:border-neutral-800" data-tour="workspace-header-tabs">
            <div className="mx-auto w-full max-w-6xl px-3 sm:px-4 lg:px-6">
              <TabsList className="h-auto w-full justify-start gap-2 overflow-x-auto bg-transparent py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <TabsTrigger 
                value="members" 
              className="shrink-0 rounded-md px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100 data-[state=active]:bg-neutral-100 data-[state=active]:text-neutral-900"              >
                
                {t("workspace.tabs.members")}
              </TabsTrigger>
              <TabsTrigger 
                value="timetable" 
                className="shrink-0 rounded-md px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100 data-[state=active]:bg-neutral-100 data-[state=active]:text-neutral-900"               >
                
               {t("workspace.tabs.schedule")}
              </TabsTrigger>
              {isAdmin && (
                <TabsTrigger
                  value="auto-generate"
                  className="shrink-0 rounded-md px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100 data-[state=active]:bg-neutral-100 data-[state=active]:text-neutral-900"                 >
                  
                 {t("workspace.tabs.generate")}
                </TabsTrigger>
              )}
              <TabsTrigger 
                value="progress" 
                className="shrink-0 rounded-md px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100 data-[state=active]:bg-neutral-100 data-[state=active]:text-neutral-900"              >
                
               {t("workspace.tabs.progress")}
              </TabsTrigger>
              <TabsTrigger
                value="board"
                className={getTabClass(hasUnreadBoard)}
              >
                <div className="flex items-center gap-2">
                  <span>{hasUnreadBoard ? t("common.new") : t("workspace.tabs.collab")}</span>
                  {unreadBoardCount > 0 && (
                    <span className="inline-flex items-center justify-center h-5 min-w-5 px-1 rounded-full bg-red-500 text-xs font-bold text-white">
                      {unreadBoardCount > 9 ? '9+' : unreadBoardCount}
                    </span>
                  )}
                </div>
              </TabsTrigger>
              <TabsTrigger
                  value="chat"
                  className={getTabClass(hasUnreadChat)}
                >
                  <div className="flex items-center gap-2">
                    <span>{hasUnreadChat ? t("common.new") : t("workspace.tabs.chat")}</span>
                    {unreadChatCount > 0 && (
                      <span className="inline-flex items-center justify-center h-5 min-w-5 px-1 rounded-full bg-red-500 text-xs font-bold text-white">
                        {unreadChatCount > 9 ? '9+' : unreadChatCount}
                      </span>
                    )}
                  </div>
                </TabsTrigger>
              </TabsList>
            </div>
          </div>
          )}

          <div className="flex-1 overflow-hidden">
            <TabsContent value="members" className="h-full mt-0 overflow-auto">
              <div className="p-3 pb-24 sm:p-4 sm:pb-24 lg:p-6 lg:pb-6">
                <div className="mx-auto w-full max-w-6xl space-y-6">
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    <Card>
                      <div className="rounded-xl border border-neutral-200 bg-white px-4 py-4 dark:border-neutral-800 dark:bg-neutral-900">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                              {t("workspace.stats.total")}
                            </p>
                            <p className="mt-2 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
                              {workspace.members.length}
                            </p>
                          </div>
                          <Users className="h-5 w-5 text-black dark:text-neutral-400" />
                        </div>
                      </div>
                    </Card>
                    <Card>
                      <div className="rounded-xl border border-neutral-200 bg-white px-4 py-4 dark:border-neutral-800 dark:bg-neutral-900">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                              {t("workspace.stats.admins")}
                            </p>
                            <p className="mt-2 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
                              {stats.admins}
                            </p>
                          </div>
                          <Shield className="h-5 w-5 text-neutral-500 dark:text-neutral-400" />
                        </div>
                      </div>
                    </Card>
                    <Card>
                      <div className="rounded-xl border border-neutral-200 bg-white px-4 py-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                            {t("workspace.stats.members")}
                            </p>
                            <p className="mt-2 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
                              {stats.members}
                              </p>
                          </div>
                          <User className="h-5 w-5 text-neutral-500 dark:text-neutral-400" />
                        </div>
                      </div>
                    </Card>
                  </div>

                  {/* Members Section */}
                  <Card>
                    <CardHeader>
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <CardTitle className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                            {t("workspace.members.title")}
                          </CardTitle>
                          <CardDescription className="text-sm text-neutral-500 dark:text-neutral-400">
                            {t("workspace.members.description")}
                          </CardDescription>
                        </div>
                      <div className="flex w-full flex-wrap items-center gap-2 md:w-auto md:justify-end">
                        {isAdmin && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsPendingRequestsOpen(true)}
                            className="relative h-10 w-full rounded-lg border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800 sm:w-auto"
                          >
                            <UserPlus className="h-4 w-4 mr-2" />
                            {t("workspace.members.pendingRequests")}
                            {(workspace.pendingRequests?.length ?? 0) > 0 && (
                              <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-orange-500 text-white text-xs font-bold">
                                {workspace.pendingRequests!.length}
                              </span>
                            )}
                          </Button>
                        )}
                        
                      </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Search */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400 dark:text-neutral-500" />                        <Input
                          placeholder={t("workspace.members.searchPlaceholder")}
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="h-10 rounded-lg border-neutral-200 bg-white pl-10 text-sm placeholder:text-neutral-400 focus-visible:ring-0 focus-visible:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus-visible:border-neutral-700"
                        />
                      </div>

                      {/* Members List */}
                      <div className="space-y-2">
                        {filteredMembers.length === 0 ? (
                          <div className="text-center py-12 text-neutral-500 dark:text-neutral-400">
                            <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                            <p>{t("workspace.members.none")}</p>
                          </div>
                        ) : (
                          filteredMembers.map((member) => {
                            const roleConf = getRoleConfig(member.role);
                            const RoleIcon = roleConf.icon;
                            const isCurrentUser = member.id === currentUser.id;

                            return (
                              <div
                                key={member.id}
                                className="rounded-xl rounded-xl border border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 p-4 transition-shadow  sm:flex sm:items-center sm:justify-between sm:gap-4"
                              >
                                <div className="flex min-w-0 items-start gap-3 sm:gap-4">
                                  <div className="relative">
                                      <Avatar className="h-11 w-11 border border-neutral-200 dark:border-neutral-700">
                                      <AvatarFallback className="bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
                                        {getInitials(member.name)}
                                      </AvatarFallback>
                                    </Avatar>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                      <p className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">

                                        {member.name}
                                        {isCurrentUser && (
                                          <Badge variant="outline" className="ml-2 text-xs">{t("common.you")}</Badge>
                                        )}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Mail className="h-3 w-3 text-gray-400" />
                                      <p className="truncate text-sm text-neutral-500 dark:text-neutral-400">{member.email}</p>
                                    </div>
                                  </div>
                                </div>

                                <div className="mt-3 flex flex-col gap-2 sm:mt-0 sm:flex-row sm:items-center sm:gap-2">
                                  {/* Role Badge/Selector */}
                                  <Select
                                    value={member.role}
                                    onValueChange={(value) => handleChangeRole(member.id, value as Member['role'])}
                                    disabled={isCurrentUser}
                                  >
                                    <SelectTrigger className={`h-10 w-full rounded-lg border sm:w-32 ${roleConf.color}`}>
                                      <div className="flex min-w-0 items-center gap-3">
                                        <RoleIcon className="h-4 w-4" />
                                        <span>{roleConf.label}</span>
                                      </div>
                                    </SelectTrigger>
                                    <SelectContent>
                                      {Object.entries(roleConfig).map(([value, config]) => {
                                        const Icon = config.icon;
                                        return (
                                          <SelectItem key={value} value={value}>
                                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                              <Icon className="h-4 w-4" />
                                              {config.label}
                                            </div>
                                          </SelectItem>
                                        );
                                      })}
                                    </SelectContent>
                                  </Select>

                                  {/* Remove Member Button */}
                                  {!isCurrentUser && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleRemoveMember(member.id)}
                                      className="w-full text-red-600 hover:bg-red-50 hover:text-red-700 sm:w-auto"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Roles Guide */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-neutral-700 dark:text-neutral-200" />
                        {t("workspace.rolesGuide.title")}
                      </CardTitle>
                      <CardDescription>{t("workspace.rolesGuide.description")}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                        {Object.entries(roleConfig).map(([key, config]) => {
                          const Icon = config.icon;
                          return (
                            <div key={key} className="rounded-xl border border-neutral-200 bg-white p-5">
                              <div className="flex items-center gap-2 mb-2">
                                <Icon className="h-5 w-5" />
                                <span className="font-medium">{config.label}</span>
                              </div>
                              <p className="text-sm mb-3">{config.description}</p>
                              <div className="space-y-1">
                                {config.permissions.map((permission) => (
                                  <div key={permission} className="text-xs flex items-center gap-1">
                                    <div className="w-1 h-1 rounded-full bg-current" />
                                    {t(`workspace.permissions.${permission}`)}
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="timetable" className="h-full mt-0 overflow-auto">
              <div className="p-3 pb-24 sm:p-4 sm:pb-24 lg:p-6 lg:pb-6">
                <div className="mx-auto w-full max-w-6xl min-w-0">
                  <div className="space-y-3">
                      {!isAdmin && (
                        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-900">
                          View-only: only workspace admins can edit this timetable.
                        </div>
                      )}
                      <CalendarView
                        readOnly={!isAdmin}
                        weekKeyFn={(weekId) => `workspace_${workspace.id}_calendarSessions_${weekId}`}
                        storageEventName={`workspaceCalendarSessionsUpdated_${workspace.id}`}
                        backendPaths={{
                          get: (weekId) => `/workspaces/${encodeURIComponent(String(workspace.id))}/sessions?week_id=${encodeURIComponent(weekId)}`,
                          put: (weekId) => `/workspaces/${encodeURIComponent(String(workspace.id))}/sessions?week_id=${encodeURIComponent(weekId)}`,
                        }}
                        workspaceStatus={{
                          get: (weekId) => `/workspaces/${encodeURIComponent(String(workspace.id))}/session-status?week_id=${encodeURIComponent(weekId)}`,
                          put: (weekId) => `/workspaces/${encodeURIComponent(String(workspace.id))}/session-status?week_id=${encodeURIComponent(weekId)}`,
                          canEdit: isAdmin,
                        }}
                        onNavigate={handleWorkspaceNavigate}
                        onOuterCollapseChange={(collapsed) => setWorkspaceChromeCollapsed(collapsed)}
                      />
                    </div>
                </div>
              </div>
            </TabsContent>

            {isAdmin && (
              <TabsContent value="auto-generate" className="h-full mt-0 overflow-auto">
                <div className="p-3 pb-24 sm:p-4 sm:pb-24 lg:p-6 lg:pb-6">
                  <div className="mx-auto w-full max-w-6xl space-y-3">
                    <div className="rounded-lg border border-blue-200 bg-neutral-50 dark:bg-neutral-800/70 p-3 text-sm text-blue-900">
                      Workspace auto-generate is stored separately from your personal Auto Generate page.
                    </div>

                    <AutoGenerateTimetable
                      scope="workspace"
                      workspaceId={String(workspace.id)}
                      embedded
                      onWorkspaceDone={() => setSelectedTab('timetable')}
                    />
                  </div>
                </div>
              </TabsContent>
            )}

            <TabsContent value="progress" className="h-full mt-0 overflow-auto">
              <div className="p-3 pb-24 sm:p-4 sm:pb-24 lg:p-6 lg:pb-6">
                <div className="mx-auto w-full max-w-6xl min-w-0">
                  <TeamCollaboration
                    workspaceId={String(workspace.id)}
                    members={workspace.members}
                    currentUser={currentUser}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="board" className="h-full mt-0 overflow-auto">
              <CollaborationBoard workspace={workspace} currentUser={currentUser} onUnseenCountChange={setUnreadBoardCount}/>
            </TabsContent>

            <TabsContent value="chat" className="h-full min-h-0 mt-0">
              <div className="h-full min-h-0">
              <WorkspaceChat 
                workspace={workspace} 
                currentUser={currentUser}
                onUnreadCountChange={setUnreadChatCount}
              />
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
        {/* Create Subworkspace Dialog */}
          <Dialog
            open={isCreateSubworkspaceOpen}
            onOpenChange={(open) => {
              setIsCreateSubworkspaceOpen(open);
              if (!open) {
                setCreateSubworkspaceParentId(null);
                setNewSubworkspaceName('');
                setNewSubworkspaceDescription('');
              }
            }}
          >
            <DialogContent className="max-h-[90vh] w-[95vw] overflow-y-auto sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Create Subworkspace</DialogTitle>
                <DialogDescription>
                  This will be created under{" "}
                  <strong>
                    {workspaces.find(w => w.id === createSubworkspaceParentId)?.name || 'selected workspace'}
                  </strong>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Subworkspace Name *</Label>
                  <Input
                    value={newSubworkspaceName}
                    onChange={(e) => setNewSubworkspaceName(e.target.value)}
                    placeholder="e.g. Algebra Group"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    value={newSubworkspaceDescription}
                    onChange={(e) => setNewSubworkspaceDescription(e.target.value)}
                    placeholder="Optional"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateSubworkspaceOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateSubworkspace}
                  className="bg-blue-700 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
                
      {/* Add Member Dialog */}
      <Dialog open={isAddMemberOpen} onOpenChange={(open) => {
        setIsAddMemberOpen(open);
        if (!open) {
          setEmailValidationError('');
          setNewMember({ name: '', email: '', role: 'member' });
        }
      }}>
        <DialogContent className="max-h-[90vh] w-[95vw] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>
              Invite someone to join your workspace
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {emailValidationError && (
              <Alert className="bg-red-50 border-red-200">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <strong>Invalid Email:</strong> {emailValidationError}
                </AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={newMember.name}
                onChange={(e) => {
                  setNewMember({ ...newMember, name: e.target.value });
                  setEmailValidationError('');
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={newMember.email}
                onChange={(e) => {
                  setNewMember({ ...newMember, email: e.target.value });
                  setEmailValidationError('');
                }}
                className={emailValidationError ? 'border-red-300 focus:border-red-500' : ''}
              />
              {/* Email Requirements */}
              <div className="text-xs text-neutral-500 dark:text-neutral-400 space-y-1 pt-1">
                <p className="font-medium text-gray-600">Email requirements:</p>
                <div className="flex items-start gap-1.5">
                  <div className="w-1 h-1 rounded-full bg-gray-400 mt-1.5 flex-shrink-0" />
                  <span>Must contain an @ symbol</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <div className="w-1 h-1 rounded-full bg-gray-400 mt-1.5 flex-shrink-0" />
                  <span>Must include a domain (e.g., example.com)</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <div className="w-1 h-1 rounded-full bg-gray-400 mt-1.5 flex-shrink-0" />
                  <span>Valid format: user@example.com</span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={newMember.role}
                onValueChange={(value) => setNewMember({ ...newMember, role: value as Member['role'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(roleConfig).map(([value, config]) => {
                    const Icon = config.icon;
                    return (
                      <SelectItem key={value} value={value}>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                          <Icon className="h-4 w-4" />
                          <div>
                            <div>{config.label}</div>
                            <div className="text-xs text-neutral-500 dark:text-neutral-400">{config.description}</div>
                          </div>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddMemberOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddMember}
              className="bg-blue-700 hover:bg-blue-700"
            >
              Add Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Workspace Dialog */}
      <Dialog open={isEditWorkspaceOpen} onOpenChange={setIsEditWorkspaceOpen}>
        <DialogContent className="flex max-h-[90vh] w-[95vw] flex-col overflow-hidden sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Workspace</DialogTitle>
            <DialogDescription>
              Update your workspace details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 overflow-y-auto pr-2">
            {/* Workspace Avatar Section */}
            <div className="space-y-2">
              <Label>Workspace Avatar</Label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-700 rounded-lg flex items-center justify-center overflow-hidden">
                  {workspace?.image_url ? (
                  <img
                    src={workspace.image_url}
                    alt="Workspace avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Users className="h-8 w-8 text-white" />
                )}
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    type="file"
                    id="workspace-avatar-settings-upload"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('workspace-avatar-settings-upload')?.click()}
                    className="border-blue-300"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {workspace?.image_url ? 'Change Avatar' : 'Upload Avatar'}
                  </Button>
                  {workspace?.image_url && (
                     <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveAvatar}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Upload a square image (max 2MB). JPG, PNG, or GIF.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="workspaceName">Workspace Name</Label>
              <Input
                id="workspaceName"
                placeholder="My Study Workspace"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="workspaceDescription">Description</Label>
              <Input
                id="workspaceDescription"
                placeholder="Collaborative study planning"
                value={workspaceDescription}
                onChange={(e) => setWorkspaceDescription(e.target.value)}
              />
            </div>
            
           

            {/* Workspace Sharing Link */}
            <div className="space-y-3 pt-2 border-t">
              <div>
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Link2 className="h-4 w-4" />
                  Workspace Sharing Link
                </Label>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Generate a link for others to join this workspace</p>
              </div>
              
              {!workspace?.sharing ? (
                // No sharing link generated yet
                <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg bg-neutral-50 dark:bg-neutral-800 text-center">
                  <Link2 className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600 mb-3">No sharing link created yet</p>
                  <Button 
                    onClick={generateShareLink}
                    size="sm"
                    className="bg-blue-700 hover:bg-blue-700"
                  >
                    <Link2 className="h-4 w-4 mr-2" />
                    Generate Sharing Link
                  </Button>
                </div>
              ) : (
                // Sharing link exists
                <div className="space-y-3">
                  {/* Share Link Display */}
                  <div className="p-3 border rounded-lg bg-neutral-50 dark:bg-neutral-800/70 border-blue-200">
                    <Label className="text-xs text-blue-700 mb-2 block">Share Link</Label>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <Input 
                        value={`${window.location.origin}/workspaces/join?token=${workspace.sharing.linkId}`}
                        readOnly
                        className="bg-white border-blue-300 text-sm"
                      />
                      <Button
                        size="sm"
                        onClick={copyShareLink}
                        className="bg-blue-700 hover:bg-blue-700 flex-shrink-0"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-neutral-700 dark:text-neutral-200 mt-2">Anyone with this link can request to join</p>
                  </div>

                  {/* Link Actions */}
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={generateShareLink}
                      className="flex-1 border-blue-300 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:bg-neutral-800/70"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Regenerate Link
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={disableShareLink}
                      className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Disable Link
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditWorkspaceOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditWorkspace}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Workspace Dialog */}
      <Dialog open={isCreateWorkspaceOpen} onOpenChange={setIsCreateWorkspaceOpen}>
        <DialogContent className="max-h-[90vh] w-[95vw] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Workspace</DialogTitle>
            <DialogDescription>
              Set up a new workspace for your team collaboration
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newWorkspaceName">Workspace Name *</Label>
              <Input
                id="newWorkspaceName"
                placeholder="e.g., Mathematics Study Group"
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newWorkspaceDescription">Description</Label>
              <Input
                id="newWorkspaceDescription"
                placeholder="e.g., Collaborative learning and exam prep"
                value={newWorkspaceDescription}
                onChange={(e) => setNewWorkspaceDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsCreateWorkspaceOpen(false);
              setNewWorkspaceName('');
              setNewWorkspaceDescription('');
            }}>
              Cancel
            </Button>
            <Button onClick={handleCreateWorkspace} className="bg-blue-700 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Create Workspace
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Workspace Dialog */}
      <Dialog open={isDeleteWorkspaceOpen} onOpenChange={setIsDeleteWorkspaceOpen}>
        <DialogContent className="max-h-[90vh] w-[95vw] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-black">
              <AlertTriangle className="h-5 w-5" />
              Delete Workspace
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <Alert className="bg-red-50 border-red-200">
            <AlertTriangle className="h-4 w-4 text-blue-300" />
            <AlertDescription className="text-black">
              <strong>Warning:</strong> Deleting this workspace will:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Remove all {workspace.members.length} members</li>
                <li>Delete all chat messages</li>
                <li>Remove all workspace data</li>
              </ul>
              {workspaces.length > 1 && (
                <p className="mt-2 text-sm">
                  You will be switched to another workspace after deletion.
                </p>
              )}
            </AlertDescription>
          </Alert>
          {workspaces.length === 1 && (
            <Alert className="bg-yellow-50 border-yellow-200">
              <AlertDescription className="text-yellow-800">
                This is your last workspace. You cannot delete it. Create another workspace first if you want to delete this one.
              </AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteWorkspaceOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleDeleteWorkspace}
              className="bg-red-600 hover:bg-red-900"
              disabled={workspaces.length === 1}
            >
              Delete Workspace
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Workspace Dialog */}
      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent className="max-h-[90vh] w-[95vw] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5 text-neutral-700 dark:text-neutral-200 dark:text-blue-400" />
              Share Workspace
            </DialogTitle>
            <DialogDescription>
              Invite others to join this workspace via a shareable link
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {!workspace?.sharing ? (
              // No sharing link exists
              <div className="p-8 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg bg-neutral-50 dark:bg-neutral-800 dark:bg-gray-900 text-center">
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
                    <Link2 className="h-8 w-8 text-neutral-700 dark:text-neutral-200 dark:text-blue-400" />
                  </div>
                  <h3 className="font-medium text-foreground mb-2">No Sharing Link Created</h3>
                  <p className="text-sm text-muted-foreground mb-4 max-w-md">
                    Generate a unique link to invite others to join this workspace. You can control access and manage permissions.
                  </p>
                  <Button 
                    onClick={() => {
                      setIsShareDialogOpen(false);
                      openEditWorkspace();
                    }}
                    className="bg-blue-700 hover:bg-blue-700"
                  >
                    <Link2 className="h-4 w-4 mr-2" />
                    Create Sharing Link
                  </Button>
                </div>
              </div>
            ) : (
              // Sharing link exists - simplified view
              <div className="space-y-4">
                {/* Share Link Display */}
                <div className="p-4 border-2 border-blue-200 dark:border-blue-800 rounded-lg bg-neutral-50 dark:bg-neutral-800/70 dark:bg-blue-950/30">
                  <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <Label className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-1 block">Active Share Link</Label>
                      <p className="text-xs text-blue-700 dark:text-blue-400">
                        {workspace.sharing.accessType === 'open' 
                          ? 'Anyone with this link can join' 
                          : 'Only specific domain users can join'}
                      </p>
                    </div>
                    <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  </div>
                  
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Input 
                      value={`${window.location.origin}/workspaces/join?token=${workspace.sharing.linkId}`}
                      readOnly
                      className="bg-white dark:bg-gray-900 border-blue-300 dark:border-blue-700 text-sm font-mono"
                    />
                    <Button
                      size="sm"
                      onClick={copyShareLink}
                      className="bg-blue-700 hover:bg-blue-700 flex-shrink-0"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  
                </div>

                {/* Expiration Notice */}
                <Alert className="bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800">
                  <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  <AlertDescription className="text-sm text-orange-800 dark:text-orange-300">
                    <strong>Note:</strong> This sharing link expires in 10 minutes for security purposes.
                  </AlertDescription>
                </Alert>

                {/* Tip Box */}
                <Alert className="bg-neutral-50 dark:bg-neutral-800/70 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
                  <AlertDescription className="text-sm text-blue-800 dark:text-blue-300">
                    <strong>Tip:</strong> Share this link with anyone you want to invite to your workspace. 
                    You can manage access settings in Workspace Settings.
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </div>

          <DialogFooter>
            {workspace?.sharing && (
              <Button
                variant="outline"
                onClick={() => {
                  setIsShareDialogOpen(false);
                  openEditWorkspace();
                }}
              >
                <Settings className="h-4 w-4 mr-2" />
                Manage Settings
              </Button>
            )}
            <Button onClick={() => setIsShareDialogOpen(false)} className="bg-blue-700 hover:bg-blue-700">
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pending Requests Dialog */}
      <Dialog open={isPendingRequestsOpen} onOpenChange={setIsPendingRequestsOpen}>
        <DialogContent className="flex max-h-[90vh] w-[95vw] flex-col overflow-hidden sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-neutral-700 dark:text-neutral-200" />
              Pending Join Requests
            </DialogTitle>
            <DialogDescription>
              Review and manage users who have requested to join this workspace
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto py-4">
            {!workspace?.pendingRequests || workspace.pendingRequests.length === 0 ? (
              <div className="p-8 text-center">
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <UserPlus className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="font-medium text-neutral-900 dark:text-neutral-100 mb-2">No Pending Requests</h3>
                  <p className="text-sm text-gray-600 max-w-md">
                    There are no pending requests at this time. When users request to join your workspace, they will appear here.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {workspace.pendingRequests.map((request) => (
                  <Card key={request.id} className="hover:border-blue-200 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <Avatar className="h-10 w-10 border-2 border-neutral-200 dark:border-neutral-800">
                            <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold">
                              {request.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-neutral-900 dark:text-neutral-100">{request.name}</h4>
                              <Badge variant="outline" className="text-xs border-orange-300 text-orange-700 bg-orange-50">
                                Pending
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{request.email}</p>
                            
                            {request.message && (
                              <div className="mt-2 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-md border border-neutral-200 dark:border-neutral-800">
                                <p className="text-xs font-medium text-gray-700 mb-1">Message:</p>
                                <p className="text-sm text-gray-600">{request.message}</p>
                              </div>
                            )}
                            
                            <div className="flex items-center gap-1 mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                              <Clock className="h-3 w-3" />
                              Requested {new Date(request.requestedAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex w-full flex-col gap-2 lg:ml-4 lg:w-auto lg:flex-row">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleApproveRequest(request.id)}
                            className="border-green-300 text-green-700 hover:bg-green-50 hover:border-green-400"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRejectRequest(request.id)}
                            className="border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => setIsPendingRequestsOpen(false)} className="bg-blue-700 hover:bg-blue-700">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Join Workspace Dialog */}
      <JoinWorkspaceDialog
        linkId={joinLinkId}
        onClose={() => setJoinLinkId(null)}
        onJoinSuccess={() => {
          loadWorkspaces();
        }}
      />
    </div>
  );
}