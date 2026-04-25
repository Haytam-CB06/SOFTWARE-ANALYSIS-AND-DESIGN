import { useState, useEffect, useRef } from 'react';
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
  LayoutDashboard,
  Activity,
  ClipboardList,
  Pin,
  Send,
  Smile
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
import ConfirmDeleteDialog from './ConfirmDeleteDialog';
import { clearPermissionError } from '../utils/permissionErrors';

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

interface WorkspaceActivityItem {
  id: string;
  type: 'member' | 'task' | 'file' | 'chat' | 'schedule';
  actor: string;
  actorId?: string;
  action: string;
  detail: string;
  timestamp: string;
}

interface PublicProfile {
  id: string;
  full_name?: string | null;
  username?: string | null;
  email?: string | null;
  profile_picture_url?: string | null;
  profile_title?: string | null;
  background_theme?: string | null;
  completed_hours?: number;
  most_productive_week?: string | null;
  most_productive_week_hours?: number;
  most_productive_month?: string | null;
  most_productive_month_hours?: number;
  joined_at?: string | null;
  friendship_status?: 'self' | 'none' | 'friends' | 'pending_sent' | 'pending_received';
  friends_since?: string | null;
  last_seen_at?: string | null;
  is_online?: boolean;
}

interface FriendProfile {
  friendship_id: string;
  id: string;
  full_name?: string | null;
  username?: string | null;
  email?: string | null;
  profile_picture_url?: string | null;
  completed_hours?: number;
  status: 'pending' | 'accepted';
  friends_since?: string | null;
  requested_at?: string | null;
  direction: 'sent' | 'received';
  last_seen_at?: string | null;
  is_online?: boolean;
}

interface DirectMessage {
  id: number;
  sender_id: string;
  recipient_id: string;
  content: string;
  created_at?: string | null;
  read_at?: string | null;
}

interface DirectConversation {
  friend: FriendProfile;
  last_message?: DirectMessage | null;
  unread_count?: number;
  nickname?: string | null;
  pinned?: boolean;
}



interface WorkspaceProps {
  onNavigate?: (page: string) => void;
}

export default function Workspace({ onNavigate }: WorkspaceProps) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const currentWorkspaceIdRef = useRef<string | null>(null);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isDeleteWorkspaceOpen, setIsDeleteWorkspaceOpen] = useState(false);
  const [memberDeleteTarget, setMemberDeleteTarget] = useState<Member | null>(null);
  const [isDisableShareLinkOpen, setIsDisableShareLinkOpen] = useState(false);
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
  const [unreadActivityCount, setUnreadActivityCount] = useState(0);
  const [workspaceActivity, setWorkspaceActivity] = useState<WorkspaceActivityItem[]>([]);
  const [isActivityLoading, setIsActivityLoading] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<PublicProfile | null>(null);
  const [friends, setFriends] = useState<FriendProfile[]>([]);
  const [friendLink, setFriendLink] = useState('');
  const [conversationOpen, setConversationOpen] = useState(false);
  const [conversationTarget, setConversationTarget] = useState<PublicProfile | FriendProfile | null>(null);
  const [directMessages, setDirectMessages] = useState<DirectMessage[]>([]);
  const [directMessageText, setDirectMessageText] = useState('');
  const [directLoading, setDirectLoading] = useState(false);
  const [directConversations, setDirectConversations] = useState<DirectConversation[]>([]);
  const [conversationsLoading, setConversationsLoading] = useState(false);
  const [nicknameDraft, setNicknameDraft] = useState('');
  const unreadDirectCount = directConversations.reduce((sum, conversation) => sum + Number(conversation.unread_count || 0), 0);
  const quickEmojis = ['👍', '😊', '🔥', '📚', '✅', '🙏', '💪', '✨'];
  const profileBackgroundThemes: Record<string, string> = {
    aurora: 'bg-[linear-gradient(135deg,#0f172a_0%,#155e75_48%,#16a34a_100%)]',
    focus: 'bg-[linear-gradient(135deg,#111827_0%,#2563eb_52%,#f8fafc_100%)]',
    sunrise: 'bg-[linear-gradient(135deg,#7c2d12_0%,#eab308_48%,#f8fafc_100%)]',
    graphite: 'bg-[linear-gradient(135deg,#020617_0%,#475569_55%,#e2e8f0_100%)]',
    forest: 'bg-[linear-gradient(135deg,#052e16_0%,#15803d_50%,#d9f99d_100%)]',
  };
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

  const mapWorkspaceMember = (m: any): Member => ({
    id: String(m.user_id || m.id),
    name: m.name || m.username || m.email || 'Member',
    email: m.email || '',
    role: migrateRole(m.role || 'member'),
    joinedAt: m.joined_at || m.joinedAt || new Date().toISOString(),
    inviteStatus: 'accepted',
    lastActive: m.last_seen_at || m.lastSeenAt || m.last_active || m.lastActive,
    isOnline: Boolean(m.is_online ?? m.isOnline),
  });
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
    let messagesUnread = unreadDirectCount;
    if (selectedTab !== 'messages' && directConversations.length === 0) {
      try {
        const stored = JSON.parse(localStorage.getItem('workspaceNotificationCounts') || '{}');
        messagesUnread = Number(stored?.messages || 0);
      } catch {
        // ignore
      }
    }
    const totalUnread = unreadChatCount + unreadBoardCount + unreadActivityCount + messagesUnread;
    const counts = {
      chat: unreadChatCount,
      board: unreadBoardCount,
      activity: unreadActivityCount,
      messages: messagesUnread,
      total: totalUnread,
    };

    localStorage.setItem('workspaceUnreadCount', totalUnread.toString());
    localStorage.setItem('workspaceNotificationCounts', JSON.stringify(counts));
    window.dispatchEvent(new Event('workspaceUnreadCountChanged'));
  }, [unreadChatCount, unreadBoardCount, unreadActivityCount, unreadDirectCount, selectedTab, directConversations.length]);

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
  const getActivityLastSeenKey = (workspaceId: string) =>
    `workspace:${workspaceId}:activityLastSeen:${currentUser.id}`;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('friend_token');
    if (!token || !currentUser.id) return;

    (async () => {
      try {
        await apiJsonAuthed(
          `/user/${encodeURIComponent(currentUser.id)}/friend-link/${encodeURIComponent(token)}`,
          'POST'
        );
        toast.success('Friend added');
        params.delete('friend_token');
        const next = `${window.location.pathname}?${params.toString()}`;
        window.history.replaceState({}, document.title, next.endsWith('?') ? window.location.pathname : next);
        await loadFriends();
      } catch (e: any) {
        toast.error(e?.message || 'Could not accept friend link');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser.id]);

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

  const findKnownWorkspace = (workspaceId: string | null) => {
    if (!workspaceId) return null;

    const nestedSubworkspaces = Object.values(subworkspacesByParent).flat();
    return (
      workspaces.find((w) => String(w.id) === String(workspaceId)) ||
      subworkspaces.find((w) => String(w.id) === String(workspaceId)) ||
      nestedSubworkspaces.find((w) => String(w.id) === String(workspaceId)) ||
      null
    );
  };

  const syncWorkspaceUrl = (workspaceId: string, mode: 'push' | 'replace' = 'push') => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('page', 'workspace');
      url.searchParams.set('workspaceId', workspaceId);

      if (mode === 'replace') {
        window.history.replaceState({}, document.title, url.toString());
      } else {
        window.history.pushState({}, document.title, url.toString());
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (!currentWorkspaceId) return;
    const current = findKnownWorkspace(currentWorkspaceId);
    if (current) setWorkspace(current);
  }, [currentWorkspaceId, workspaces, subworkspaces, subworkspacesByParent]);

  useEffect(() => {
    currentWorkspaceIdRef.current = workspace?.id ? String(workspace.id) : null;
  }, [workspace?.id]);

  useEffect(() => {
    if (!workspace?.id) return;

    setSearchQuery('');
    setUnreadChatCount(0);
    setUnreadBoardCount(0);
    setUnreadActivityCount(0);
    setWorkspaceActivity([]);
    setIsActivityLoading(selectedTab === 'activity');
  }, [workspace?.id]);

  useEffect(() => {
    const handleWorkspacePopState = () => {
      const params = new URLSearchParams(window.location.search);
      if (params.get('page') !== 'workspace') return;

      const workspaceId = params.get('workspaceId');
      if (!workspaceId || workspaceId === currentWorkspaceId) return;

      const nextWorkspace = findKnownWorkspace(workspaceId);
      if (!nextWorkspace) return;

      setCurrentWorkspaceId(workspaceId);
      setWorkspace(nextWorkspace);
      localStorage.setItem('currentWorkspaceId', workspaceId);
    };

    window.addEventListener('popstate', handleWorkspacePopState);
    return () => window.removeEventListener('popstate', handleWorkspacePopState);
  }, [currentWorkspaceId, workspaces, subworkspaces, subworkspacesByParent]);

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
      }, 15000);

      return () => window.clearInterval(id);
    }, [workspace?.id, currentUser.id, selectedTab]);

    useEffect(() => {
      if (!workspace?.id) return;

      loadUnreadBoardCount();

      const id = window.setInterval(() => {
        loadUnreadBoardCount();
      }, 15000);

      return () => window.clearInterval(id);
    }, [workspace?.id, currentUser.id, selectedTab]);

    // 2) Load pending requests ONLY when workspace changes (not when workspaces changes)

    const loadUnreadBoardCount = async () => {
  if (!workspace?.id || selectedTab === 'board') return;
  const workspaceId = String(workspace.id);

  try {
    const res = await fetch(
      `${API_BASE_URL}/workspaces/${workspaceId}/board/tasks`,
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
    if (currentWorkspaceIdRef.current !== workspaceId) {
      if (!silent) setIsActivityLoading(false);
      return;
    }

    const lastSeen = localStorage.getItem(getBoardLastSeenKey(workspaceId));
    const lastSeenTime = lastSeen ? new Date(lastSeen).getTime() : 0;

    const unseen = (Array.isArray(data) ? data : []).filter((task: any) => {
      const createdByOtherUser =
        String(task.created_by ?? task.createdBy ?? '') !== String(currentUser.id);

      const updatedAt = task.updated_at ?? task.updatedAt ?? task.created_at ?? task.createdAt;
      const updatedTime = updatedAt ? new Date(updatedAt).getTime() : 0;

      return createdByOtherUser && updatedTime > lastSeenTime;
    }).length;

    if (currentWorkspaceIdRef.current === workspaceId) setUnreadBoardCount(unseen);
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
            members = mJson.map(mapWorkspaceMember);
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
      // 1) Fetch workspaces and members in one request. This avoids an N+1
      // request pattern on the workspace page.
      let backendWorkspaces: any[] = [];
      try {
        backendWorkspaces = await apiJsonAuthed<any[]>(`/workspaces/overview`, 'GET');
      } catch {
        backendWorkspaces = await apiJsonAuthed<any[]>(`/workspaces`, 'GET');
      }

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

      // 3) Map the overview payload. Fall back to per-workspace member fetch
      // only for older backends that do not include members.
      const mapped: Workspace[] = await Promise.all(
        (backendWorkspaces || []).map(async (w: any) => {
          const wid = String(w.id);
          let rawMembers = Array.isArray(w.members) ? w.members : [];
          if (!rawMembers.length) {
            try {
              rawMembers = await apiJsonAuthed<any[]>(`/workspaces/${wid}/members`, 'GET');
            } catch {
              rawMembers = [];
            }
          }

          const members: Member[] = (rawMembers || []).map(mapWorkspaceMember);

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
      const urlWorkspaceId = new URLSearchParams(window.location.search).get('workspaceId');
      const savedCurrentId = urlWorkspaceId || localStorage.getItem('currentWorkspaceId');
      if (savedCurrentId && mapped.find((x) => x.id === savedCurrentId)) {
        setCurrentWorkspaceId(savedCurrentId);
        localStorage.setItem('currentWorkspaceId', savedCurrentId);
        syncWorkspaceUrl(savedCurrentId, 'replace');
      } else if (mapped.length > 0) {
        setCurrentWorkspaceId(mapped[0].id);
        localStorage.setItem('currentWorkspaceId', mapped[0].id);
        syncWorkspaceUrl(mapped[0].id, 'replace');
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
  setSubworkspaces((prev) =>
    prev.map((w) => (w.id === updatedWorkspace.id ? updatedWorkspace : w))
  );
  setSubworkspacesByParent((prev) =>
    Object.fromEntries(
      Object.entries(prev).map(([parentId, children]) => [
        parentId,
        children.map((w) => (w.id === updatedWorkspace.id ? updatedWorkspace : w)),
      ]),
    )
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
            members = mJson.map(mapWorkspaceMember);
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

  const refreshWorkspaceMembers = async (workspaceId: string) => {
    const target = findKnownWorkspace(workspaceId);
    if (!target) return;

    try {
      const freshMembers = await apiJsonAuthed<any[]>(
        `/workspaces/${encodeURIComponent(workspaceId)}/members`,
        'GET'
      );
      if (currentWorkspaceIdRef.current !== workspaceId) return;

      const updatedWorkspace: Workspace = {
        ...target,
        members: Array.isArray(freshMembers) ? freshMembers.map(mapWorkspaceMember) : target.members,
      };
      updateWorkspaceState(updatedWorkspace);
    } catch (e) {
      console.warn('[Workspace] refresh members failed:', e);
    }
  };

  useEffect(() => {
    if (!workspace?.id) return;
    refreshWorkspaceMembers(String(workspace.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace?.id]);

  useEffect(() => {
    if (!workspace?.id) return;
    const workspaceId = String(workspace.id);
    let cancelled = false;

    const touchPresence = async () => {
      try {
        const presence = await apiJsonAuthed<any>(
          `/workspaces/${encodeURIComponent(workspaceId)}/presence`,
          'POST'
        );
        if (cancelled || currentWorkspaceIdRef.current !== workspaceId) return;

        setWorkspace((prev) =>
          prev && String(prev.id) === workspaceId
            ? {
                ...prev,
                members: prev.members.map((member) =>
                  member.id === currentUser.id
                    ? {
                        ...member,
                        lastActive: presence?.last_seen_at || new Date().toISOString(),
                        isOnline: true,
                      }
                    : member
                ),
              }
            : prev
        );
        refreshWorkspaceMembers(workspaceId);
      } catch (e) {
        console.warn('[Workspace] presence update failed:', e);
      }
    };

    touchPresence();
    const id = window.setInterval(touchPresence, 45000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace?.id, currentUser.id]);

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
    const switched = findKnownWorkspace(workspaceId);

    setCurrentWorkspaceId(workspaceId);
    if (switched) setWorkspace(switched);
    localStorage.setItem('currentWorkspaceId', workspaceId);
    syncWorkspaceUrl(workspaceId);
    try {
      sessionStorage.setItem('uplanRefreshReason', 'workspace-switch');
      document.documentElement.classList.add('uplan-refreshing');
    } catch {
      // ignore
    }
    window.location.reload();
  };


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
          
          throw new Error(clearPermissionError(res.status, err.detail, 'add-member'));
        }

        setIsAddMemberOpen(false);
        setNewMember({ name: '', email: '', role: 'member' });
        setEmailValidationError('');
        toast.success(err.message || 'Member added successfully');
        await loadWorkspaces();
      } catch (e: any) {
        console.error('[Workspace] add member failed:', e);
        toast.error(e.message || 'Only workspace admins can add members to this workspace.');
      }
    })();
  };

  const handleRemoveMember = (memberId: string) => {
      if (!workspace) return;

      const member = workspace.members.find(m => m.id === memberId);
      if (!member) return;

    setMemberDeleteTarget(member);
  };

  const confirmRemoveMember = async () => {
      if (!workspace || !memberDeleteTarget) return;
      const member = memberDeleteTarget;
      (async () => {
        try {
          const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
          const res = await fetch(`${API_BASE_URL}/workspaces/${workspace.id}/members/${member.id}`, {
            method: 'DELETE',
            headers: { 'X-User-Id': currentUser.id },
          });
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(clearPermissionError(res.status, err.detail, 'remove-member'));
          }
          toast.success(t("workspace.success.memberRemoved", { name: member.name }));
          setMemberDeleteTarget(null);
          await loadWorkspaces();
        } catch (e: any) {
          console.error('[Workspace] remove member failed:', e);
          toast.error(e.message || 'Only workspace admins can remove members from this workspace.');
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
        toast.error(clearPermissionError(response.status, data?.detail, 'change-role'));
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
    const workspaceId = String(workspace.id);

    try {
      const res = await fetch(
        `${API_BASE_URL}/chat/workspaces/${workspaceId}/messages?limit=50`,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-User-Id': currentUser.id,
          },
        }
      );

      if (!res.ok) return;

      const data = await res.json();
      if (currentWorkspaceIdRef.current !== workspaceId) return;

      const unread = (data || []).filter((m: any) => {
        const isOwnMessage = String(m.user_id) === String(currentUser.id);

        const readByCurrentUser = Array.isArray(m.read_by)
          ? m.read_by.some((r: any) => String(r.user_id) === String(currentUser.id))
          : false;

        return !isOwnMessage && !readByCurrentUser;
      }).length;

      if (currentWorkspaceIdRef.current === workspaceId) setUnreadChatCount(unread);
    } catch (e) {
      console.error('[Workspace] loadUnreadChatCount error:', e);
    }
  };

  const getMemberName = (memberId?: string, fallback?: string) => {
    if (fallback && fallback !== 'Unknown') return fallback;
    if (!memberId) return 'Someone';
    return workspace?.members.find((m) => String(m.id) === String(memberId))?.name || 'Someone';
  };

  const formatActivityTime = (timestamp: string) => {
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return '';

    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const loadWorkspaceActivity = async ({ silent = false }: { silent?: boolean } = {}) => {
    if (!workspace?.id) return;
    const workspaceId = String(workspace.id);

    if (!silent) setIsActivityLoading(true);
    const items: WorkspaceActivityItem[] = [];

    try {
      const activityKey = `workspace_${workspaceId}_activities`;
      const storedTeamActivities = JSON.parse(localStorage.getItem(activityKey) || '[]');
      if (Array.isArray(storedTeamActivities)) {
        storedTeamActivities.forEach((item: any) => {
          items.push({
            id: `team-${item.id}`,
            type: 'schedule',
            actorId: item.memberId ? String(item.memberId) : undefined,
            actor: item.memberName || getMemberName(item.memberId),
            action: 'updated team progress',
            detail: item.description || 'Team activity changed',
            timestamp: item.timestamp || new Date().toISOString(),
          });
        });
      }
    } catch {
      // ignore malformed local activity cache
    }

    try {
      const res = await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/board/tasks`, {
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUser.id,
        },
        cache: 'no-store',
      });

      if (res.ok) {
        const data = await res.json();
        (Array.isArray(data) ? data : []).forEach((task: any) => {
          const createdAt = task.created_at ?? task.createdAt ?? new Date().toISOString();
          const updatedAt = task.updated_at ?? task.updatedAt ?? createdAt;
          const createdBy = String(task.created_by ?? task.createdBy ?? '');
          const actor = getMemberName(createdBy, task.created_by_name ?? task.createdByName);
          const title = task.title || 'Untitled task';
          const status = String(task.status || 'todo').replace('-', ' ');
          const wasUpdated = new Date(updatedAt).getTime() > new Date(createdAt).getTime() + 1000;

          items.push({
            id: `task-${task.id}-${updatedAt}`,
            type: 'task',
            actorId: createdBy || undefined,
            actor,
            action: wasUpdated ? `updated a task to ${status}` : 'created a task',
            detail: title,
            timestamp: updatedAt,
          });
        });
      }
    } catch (e) {
      console.error('[Workspace] activity board load failed:', e);
    }

    try {
      const res = await fetch(`${API_BASE_URL}/chat/workspaces/${workspaceId}/messages?limit=25`, {
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUser.id,
        },
      });

      if (res.ok) {
        const data = await res.json();
        (Array.isArray(data) ? data : []).forEach((message: any) => {
          const content = String(message.content || '');
          const actor = getMemberName(message.user_id ? String(message.user_id) : undefined, message.username);
          const isFile = /shared a file:/i.test(content);
          const cleaned = content.replace(/^.*shared a file:\s*/i, '').trim();

          items.push({
            id: `${isFile ? 'file' : 'chat'}-${message.id}`,
            type: isFile ? 'file' : 'chat',
            actorId: message.user_id ? String(message.user_id) : undefined,
            actor,
            action: isFile ? 'shared a new file' : message.edited ? 'edited a chat message' : 'sent a chat message',
            detail: isFile ? cleaned : content,
            timestamp: message.created_at || new Date().toISOString(),
          });
        });
      }
    } catch (e) {
      console.error('[Workspace] activity chat load failed:', e);
    }

    workspace.members.forEach((member) => {
      items.push({
        id: `member-${member.id}-${member.joinedAt}`,
        type: 'member',
        actorId: member.id,
        actor: member.name,
        action: 'joined the workspace',
        detail: member.email,
        timestamp: member.joinedAt || workspace.createdAt,
      });
    });

    const sorted = items
      .filter((item) => item.timestamp)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 60);

    if (currentWorkspaceIdRef.current !== workspaceId) return;

    setWorkspaceActivity(sorted);
    const savedLastSeen = localStorage.getItem(getActivityLastSeenKey(workspaceId));
    const lastSeenTime = savedLastSeen
      ? new Date(savedLastSeen).getTime()
      : Date.now() - 24 * 60 * 60 * 1000;
    const unreadActivity = sorted.filter((item) => {
      const timestamp = new Date(item.timestamp).getTime();
      const isOwnActivity = item.actor === currentUser.name;
      return !Number.isNaN(timestamp) && timestamp > lastSeenTime && !isOwnActivity;
    }).length;

    if (selectedTab === 'activity') {
      localStorage.setItem(getActivityLastSeenKey(workspaceId), new Date().toISOString());
      setUnreadActivityCount(0);
    } else {
      setUnreadActivityCount(unreadActivity);
    }

    if (!silent) setIsActivityLoading(false);
  };

  useEffect(() => {
    if (!workspace?.id) return;
    loadWorkspaceActivity({ silent: selectedTab !== 'activity' });
    const refreshActivity = () => loadWorkspaceActivity({ silent: selectedTab !== 'activity' });
    const id = window.setInterval(refreshActivity, 30000);
    window.addEventListener('workspaceActivityChanged', refreshActivity);
    return () => {
      window.clearInterval(id);
      window.removeEventListener('workspaceActivityChanged', refreshActivity);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace?.id, currentUser.id, selectedTab]);
  const loadPendingRequests = async (workspaceId: string) => {
    // Only admins should fetch pending requests
    const ws = findKnownWorkspace(workspaceId) || workspace;
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
      setSubworkspaces(prev =>
        prev.map(w =>
          w.id === workspaceId ? { ...w, pendingRequests: mapped } : w
        )
      );
      setSubworkspacesByParent(prev =>
        Object.fromEntries(
          Object.entries(prev).map(([parentId, children]) => [
            parentId,
            children.map((w) => (w.id === workspaceId ? { ...w, pendingRequests: mapped } : w)),
          ]),
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
      toast.error(clearPermissionError(response.status, data?.detail, 'delete-workspace'));
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
    
    
    if (diffMins < 1) return t("workspace.presence.justNow");
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return t("workspace.presence.yesterday");
    if (diffDays < 7) return `${diffDays}d ago`;
    return lastActiveDate.toLocaleDateString();
  };

  const getMemberPresence = (memberId?: string, memberName?: string) => {
    const found = workspace?.members.find((m) =>
      String(m.id) === String(memberId) || (!!memberName && m.name === memberName)
    );
    return {
      isOnline: Boolean(found?.isOnline),
      label: getLastSeenText(found?.lastActive, found?.isOnline),
    };
  };

  const getProfileImageUrl = (profile?: { id?: string; profile_picture_url?: string | null }) => {
    if (!profile?.id) return '';
    if (profile.profile_picture_url) return `${API_BASE_URL}${profile.profile_picture_url}`;
    return `${API_BASE_URL}/user/${profile.id}/profile-picture`;
  };

  const getBaseFriendName = (friend?: PublicProfile | FriendProfile | null) =>
    friend?.full_name || friend?.username || friend?.email || 'Friend';

  const getConversationFor = (friendId?: string | null) =>
    friendId ? directConversations.find((conversation) => conversation.friend.id === friendId) : undefined;

  const getConversationDisplayName = (friend?: PublicProfile | FriendProfile | null) => {
    const conversation = getConversationFor(friend?.id);
    return conversation?.nickname || getBaseFriendName(friend);
  };

  const extractFirstUrl = (content: string) => {
    const match = content.match(/https?:\/\/[^\s<>"']+/i);
    return match?.[0] || null;
  };

  const renderDirectMessageContent = (content: string, isOwn: boolean) => {
    const url = extractFirstUrl(content);
    const parts = url ? content.split(url) : [content];

    return (
      <div className="space-y-2">
        <p className="whitespace-pre-wrap break-words">
          {url ? (
            <>
              {parts[0]}
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className={`break-all underline underline-offset-2 ${isOwn ? 'text-white' : 'text-blue-700 dark:text-blue-300'}`}
              >
                {url}
              </a>
              {parts.slice(1).join(url)}
            </>
          ) : (
            content
          )}
        </p>
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className={`block rounded-xl border p-3 transition ${
              isOwn
                ? 'border-white/20 bg-white/10 hover:bg-white/15'
                : 'border-neutral-200 bg-neutral-50 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:bg-neutral-800'
            }`}
          >
            <span className={`text-[11px] font-semibold uppercase tracking-wide ${isOwn ? 'text-white/65' : 'text-neutral-500 dark:text-neutral-400'}`}>
              Link shared
            </span>
            <span className="mt-1 block truncate text-sm font-semibold">{url.replace(/^https?:\/\//, '')}</span>
          </a>
        )}
      </div>
    );
  };

  const loadFriends = async () => {
    try {
      const data = await apiJsonAuthed<FriendProfile[]>(`/user/${encodeURIComponent(currentUser.id)}/friends`, 'GET');
      setFriends(Array.isArray(data) ? data : []);
    } catch (e) {
      console.warn('[Workspace] friends load failed:', e);
    }
  };

  const loadDirectConversations = async () => {
    setConversationsLoading(true);
    try {
      const data = await apiJsonAuthed<DirectConversation[]>(
        `/user/${encodeURIComponent(currentUser.id)}/conversations`,
        'GET'
      );
      setDirectConversations(Array.isArray(data) ? data : []);
    } catch (e: any) {
      console.warn('[Workspace] conversations load failed:', e);
    } finally {
      setConversationsLoading(false);
    }
  };

  const openProfile = async (userId: string) => {
    if (!userId || userId === 'system') return;
    setProfileDialogOpen(true);
    setProfileLoading(true);
    setSelectedProfile(null);
    try {
      const profile = await apiJsonAuthed<PublicProfile>(
        `/user/${encodeURIComponent(userId)}/public-profile`,
        'GET'
      );
      setSelectedProfile(profile);
      await loadFriends();
    } catch (e: any) {
      toast.error(e?.message || 'Could not load profile');
      setProfileDialogOpen(false);
    } finally {
      setProfileLoading(false);
    }
  };

  const createFriendLink = async () => {
    try {
      const data = await apiJsonAuthed<{ token: string }>(
        `/user/${encodeURIComponent(currentUser.id)}/friend-link`,
        'POST'
      );
      const url = `${window.location.origin}${window.location.pathname}?page=messages&friend_token=${encodeURIComponent(data.token)}`;
      setFriendLink(url);
      await navigator.clipboard.writeText(url);
      toast.success('Friend link copied');
    } catch (e: any) {
      toast.error(e?.message || 'Could not create friend link');
    }
  };

  const sendFriendRequest = async (targetUserId: string) => {
    try {
      await apiJsonAuthed(
        `/user/${encodeURIComponent(currentUser.id)}/friends/${encodeURIComponent(targetUserId)}`,
        'POST'
      );
      await openProfile(targetUserId);
      toast.success('Friend request sent');
    } catch (e: any) {
      toast.error(e?.message || 'Could not send friend request');
    }
  };

  const acceptFriendRequest = async (targetUserId: string) => {
    try {
      await apiJsonAuthed(
        `/user/${encodeURIComponent(currentUser.id)}/friends/${encodeURIComponent(targetUserId)}/accept`,
        'POST'
      );
      await openProfile(targetUserId);
      toast.success('Friend request accepted');
    } catch (e: any) {
      toast.error(e?.message || 'Could not accept friend request');
    }
  };

  const loadDirectMessages = async (targetUserId: string) => {
    setDirectLoading(true);
    try {
      const data = await apiJsonAuthed<DirectMessage[]>(
        `/user/${encodeURIComponent(currentUser.id)}/conversations/${encodeURIComponent(targetUserId)}/messages`,
        'GET'
      );
      setDirectMessages(Array.isArray(data) ? data : []);
    } catch (e: any) {
      toast.error(e?.message || 'Could not load conversation');
    } finally {
      setDirectLoading(false);
    }
  };

  const openConversation = async (target: PublicProfile | FriendProfile, mode: 'dialog' | 'inline' = 'dialog') => {
    if (!target?.id || target.id === currentUser.id) return;
    setConversationTarget(target);
    setNicknameDraft(getConversationFor(target.id)?.nickname || '');
    setConversationOpen(mode === 'dialog');
    setDirectMessageText('');
    await loadDirectMessages(target.id);
    if (mode === 'inline') {
      setDirectConversations((prev) =>
        prev.map((conversation) =>
          conversation.friend.id === target.id ? { ...conversation, unread_count: 0 } : conversation
        )
      );
    }
  };

  const sendDirectMessage = async (event?: React.FormEvent) => {
    event?.preventDefault();
    const content = directMessageText.trim();
    if (!content || !conversationTarget) return;

    try {
      const message = await apiJsonAuthed<DirectMessage>(
        `/user/${encodeURIComponent(currentUser.id)}/conversations/${encodeURIComponent(conversationTarget.id)}/messages`,
        'POST',
        { content }
      );
      setDirectMessages((prev) => [...prev, message]);
      setDirectMessageText('');
      loadDirectConversations();
    } catch (e: any) {
      toast.error(e?.message || 'Could not send message');
    }
  };

  const updateConversationPreference = async (targetId: string, updates: { nickname?: string | null; pinned?: boolean }) => {
    try {
      const updated = await apiJsonAuthed<DirectConversation>(
        `/user/${encodeURIComponent(currentUser.id)}/conversations/${encodeURIComponent(targetId)}/preferences`,
        'PATCH',
        updates
      );
      setDirectConversations((prev) => {
        const exists = prev.some((conversation) => conversation.friend.id === targetId);
        const next = exists
          ? prev.map((conversation) => (conversation.friend.id === targetId ? { ...conversation, ...updated } : conversation))
          : [updated, ...prev];
        return [...next].sort((a, b) => {
          if (Boolean(a.pinned) !== Boolean(b.pinned)) return a.pinned ? -1 : 1;
          const aTime = a.last_message?.created_at || a.friend.friends_since || a.friend.requested_at || '';
          const bTime = b.last_message?.created_at || b.friend.friends_since || b.friend.requested_at || '';
          return bTime.localeCompare(aTime);
        });
      });
      if (updates.nickname !== undefined) {
        setNicknameDraft(updated.nickname || '');
        toast.success(updated.nickname ? 'Nickname saved' : 'Nickname removed');
      }
    } catch (e: any) {
      toast.error(e?.message || 'Could not update conversation');
    }
  };

  useEffect(() => {
    if (!conversationOpen || !conversationTarget?.id) return;
    const interval = window.setInterval(() => {
      loadDirectMessages(conversationTarget.id);
    }, 6000);
    return () => window.clearInterval(interval);
  }, [conversationOpen, conversationTarget?.id]);

  useEffect(() => {
    if (selectedTab !== 'messages' || !conversationTarget?.id) return;
    const interval = window.setInterval(() => {
      loadDirectMessages(conversationTarget.id);
    }, 6000);
    return () => window.clearInterval(interval);
  }, [selectedTab, conversationTarget?.id]);

  useEffect(() => {
    if (selectedTab !== 'messages') return;
    loadDirectConversations();
    const interval = window.setInterval(loadDirectConversations, 15000);
    return () => window.clearInterval(interval);
  }, [selectedTab, currentUser.id]);

  useEffect(() => {
    if (selectedTab !== 'messages' || conversationTarget || directConversations.length === 0) return;
    const first = directConversations.find((conversation) => conversation.friend.status === 'accepted');
    if (first) openConversation(first.friend, 'inline');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTab, directConversations.length]);
  
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
          throw new Error(clearPermissionError(response.status, data?.detail, 'workspace-image'));
        }

        const updatedWorkspace = {
          ...workspace,
          image_url: data.image_url,
        };

        updateWorkspaceState(updatedWorkspace);
        toast.success(t("workspace.success.avatarUpdated"));
      } catch (error: any) {
        toast.error(error.message || 'Only workspace admins can update the workspace image.');
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
          throw new Error(clearPermissionError(response.status, data?.detail, 'workspace-image'));
        }

        const updatedWorkspace = {
          ...workspace,
          image_url: null,
        };

        updateWorkspaceState(updatedWorkspace);
        toast.success(t("workspace.success.avatarRemoved"));
      } catch (error: any) {
        toast.error(error.message || 'Only workspace admins can update the workspace image.');
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
      toast.error(clearPermissionError(response.status, data?.detail, 'share-link'));
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
        toast.error(clearPermissionError(res.status, data?.detail, 'disable-share-link'));
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

  const shouldHideChrome = false;
  const parentWorkspaces = workspaces.filter((w) => !w.parentId);
  const hasUnreadChat = unreadChatCount > 0 && selectedTab !== 'chat';
  const hasUnreadBoard = unreadBoardCount > 0 && selectedTab !== 'board';
  const hasUnreadActivity = unreadActivityCount > 0 && selectedTab !== 'activity';
  const hasUnreadDirect = unreadDirectCount > 0 && selectedTab !== 'messages';

  const getTabClass = (hasUnread: boolean) =>
  [
    "relative shrink-0 rounded-2xl px-3 py-2 text-sm font-medium transition-colors",
    "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/[0.06]",
    "data-[state=active]:bg-slate-950 data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-slate-950",
    hasUnread ? "font-semibold" : "",
  ].join(" ");

  const getActivityIcon = (type: WorkspaceActivityItem['type']) => {
    switch (type) {
      case 'task':
        return <ClipboardList className="h-4 w-4" />;
      case 'file':
        return <Upload className="h-4 w-4" />;
      case 'chat':
        return <MessageSquare className="h-4 w-4" />;
      case 'member':
        return <Users className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };
    
  return (
    <section className="min-h-screen bg-slate-50 px-3 py-4 text-slate-900 dark:bg-black dark:text-white sm:px-5 sm:py-6 lg:px-8">
      <div className="mx-auto w-full min-w-0 max-w-7xl overflow-hidden rounded-[40px] border border-slate-200 bg-white shadow-[0_20px_70px_rgba(15,23,42,0.09)] dark:border-white/10 dark:bg-[#0b0f17]">
        {!shouldHideChrome && (
        <>
<div
  className="border-b border-slate-200 bg-transparent dark:border-white/10"
  data-tour="workspace-header-region"
>
  <div className="mx-auto w-full px-4 py-4 sm:px-6 lg:px-8">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-11 w-full justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 text-slate-900 shadow-sm hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:hover:bg-white/[0.07] sm:w-[300px]"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900">
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
        className="h-11 rounded-2xl bg-slate-950 px-4 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
      >
        <Plus className="mr-2 h-4 w-4" />
        {t("workspace.createNew")}
      </Button>
    </div>
  </div>
</div>

      {/* Header */}
      <div className="border-b border-slate-200 bg-transparent px-3 py-3 dark:border-white/10 sm:px-6 lg:px-8">
        <div className="rounded-[28px] border border-slate-200 bg-slate-50/80 px-3 py-3 shadow-sm dark:border-white/10 dark:bg-white/[0.035] sm:px-4">
          <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={isAdmin ? triggerAvatarUpload : undefined}
                disabled={!isAdmin}
                className={[
                  "group relative flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] border border-slate-200 bg-white shadow-sm transition dark:border-white/10 dark:bg-slate-950 sm:h-14 sm:w-14",
                  isAdmin
                    ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    : "cursor-default",
                ].join(" ")}
                title={isAdmin ? "Upload workspace image" : workspace.name}
              >
                <Avatar className="h-full w-full rounded-[18px]">
                  <AvatarImage
                    src={workspace.image_url || undefined}
                    alt={workspace.name}
                    draggable={false}
                    className="select-none object-cover"
                  />
                  <AvatarFallback
                    className={`rounded-[18px] text-sm font-semibold text-white sm:text-base ${getWorkspaceColor(workspace.name)}`}
                  >
                    {getWorkspaceInitials(workspace.name)}
                  </AvatarFallback>
                </Avatar>

                {isAdmin && (
                  <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border border-white bg-slate-950 text-white shadow-sm transition group-hover:scale-105 dark:border-slate-950 dark:bg-white dark:text-slate-950">
                    <Upload className="h-3 w-3" />
                  </span>
                )}
              </button>

              <input
                id="workspace-avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />

              <div className="min-w-0">
                <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                  <h1 className="min-w-0 truncate text-lg font-semibold tracking-tight text-slate-950 dark:text-white sm:text-xl">
                    {workspace.name}
                  </h1>
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Active
                  </span>
                  {isAdmin && (
                    <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300">
                      Admin
                    </span>
                  )}
                </div>

                <p className="mt-0.5 max-w-3xl truncate text-sm text-slate-600 dark:text-slate-300">
                  {workspace.description || "No description provided."}
                </p>

                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                  <span>{workspace.members.length} {workspace.members.length === 1 ? 'member' : 'members'}</span>
                  <span className="hidden h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-600 sm:inline-block" />
                  <span>{stats.admins} {stats.admins === 1 ? 'admin' : 'admins'}</span>
                  <span className="hidden h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-600 sm:inline-block" />
                  <span>Created {new Date(workspace.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {isAdmin && (
              <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto lg:flex-nowrap lg:justify-end">
                <Button
                  variant="outline"
                  onClick={openEditWorkspace}
                  className="h-9 flex-1 rounded-2xl border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm hover:bg-slate-50 dark:border-white/10 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-white/[0.07] sm:flex-none"
                >
                  <Pencil className="mr-2 h-3.5 w-3.5" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsShareDialogOpen(true)}
                  className="h-9 flex-1 rounded-2xl border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm hover:bg-slate-50 dark:border-white/10 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-white/[0.07] sm:flex-none"
                >
                  <Link2 className="mr-2 h-3.5 w-3.5" />
                  {workspace?.sharing?.enabled
                    ? t("workspace.actions.manageLink")
                    : t("workspace.actions.share")}
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setIsDeleteWorkspaceOpen(true)}
                  className="h-9 flex-1 rounded-2xl px-3 text-sm shadow-sm sm:flex-none"
                >
                  <Trash2 className="mr-2 h-3.5 w-3.5" />
                  Delete
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

        </>
      )}

      {/* Tabs */}
      <div className="min-w-0 flex-1 overflow-hidden">
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
            if (v === 'activity' && workspace?.id) {
              localStorage.setItem(
                getActivityLastSeenKey(String(workspace.id)),
                new Date().toISOString()
              );
              setUnreadActivityCount(0);
            }
          }} className="h-full flex flex-col">
          {!shouldHideChrome && (
          <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-white/10 dark:bg-[#0b0f17]/95" data-tour="workspace-header-tabs">
            <div className="mx-auto w-full px-3 py-2 sm:px-6 lg:px-8">
              <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50 p-1 [scrollbar-width:none] dark:border-white/10 dark:bg-white/[0.04] [&::-webkit-scrollbar]:hidden">
              <TabsTrigger 
                value="members" 
              className={getTabClass(false)}              >
                
                {t("workspace.tabs.members")}
              </TabsTrigger>
              <TabsTrigger 
                value="timetable" 
                className={getTabClass(false)}               >
                
               {t("workspace.tabs.schedule")}
              </TabsTrigger>
              {isAdmin && (
                <TabsTrigger
                  value="auto-generate"
                  className={getTabClass(false)}                 >
                  
                 {t("workspace.tabs.generate")}
                </TabsTrigger>
              )}
              <TabsTrigger 
                value="progress" 
                className={getTabClass(false)}              >
                
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
                value="activity"
                className={getTabClass(hasUnreadActivity)}
              >
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  <span>Activity</span>
                  {hasUnreadActivity && (
                    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-700 px-1 text-xs font-bold text-white">
                      {unreadActivityCount > 9 ? '9+' : unreadActivityCount}
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
                      <div className="rounded-[22px] border border-neutral-200 bg-white px-4 py-4 dark:border-neutral-800 dark:bg-neutral-900">
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
                      <div className="rounded-[22px] border border-neutral-200 bg-white px-4 py-4 dark:border-neutral-800 dark:bg-neutral-900">
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
                      <div className="rounded-[22px] border border-neutral-200 bg-white px-4 py-4">
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
                            className="relative h-10 w-full rounded-2xl border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800 sm:w-auto"
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
                          className="h-10 rounded-2xl border-neutral-200 bg-white pl-10 text-sm placeholder:text-neutral-400 focus-visible:ring-0 focus-visible:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus-visible:border-neutral-700"
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
                                className="rounded-[22px] border border-b border-neutral-200 bg-white p-4 transition-shadow dark:border-neutral-800 dark:bg-neutral-900 sm:flex sm:items-center sm:justify-between sm:gap-4"
                              >
                                <div className="flex min-w-0 items-start gap-3 sm:gap-4">
                                  <div className="relative">
                                      <Avatar className="h-11 w-11 border border-neutral-200 dark:border-neutral-700">
                                      <AvatarImage src={`${API_BASE_URL}/user/${member.id}/profile-picture`} alt={member.name} />
                                      <AvatarFallback className="bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
                                        {getInitials(member.name)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span
                                      className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-neutral-900 ${
                                        member.isOnline ? 'bg-emerald-500' : 'bg-neutral-300 dark:bg-neutral-600'
                                      }`}
                                      title={getLastSeenText(member.lastActive, member.isOnline)}
                                    />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                      <button
                                        type="button"
                                        onClick={() => openProfile(member.id)}
                                        className="truncate text-left text-sm font-medium text-neutral-900 underline-offset-4 hover:underline dark:text-neutral-100"
                                      >

                                        {member.name}
                                        {isCurrentUser && (
                                          <Badge variant="outline" className="ml-2 text-xs">{t("common.you")}</Badge>
                                        )}
                                      </button>
                                      <span
                                        className={`inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                                          member.isOnline
                                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300'
                                            : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'
                                        }`}
                                      >
                                        <span
                                          className={`h-1.5 w-1.5 rounded-full ${
                                            member.isOnline ? 'bg-emerald-500' : 'bg-neutral-400'
                                          }`}
                                        />
                                        {getLastSeenText(member.lastActive, member.isOnline)}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Mail className="h-3 w-3 text-gray-400" />
                                      <p className="truncate text-sm text-neutral-500 dark:text-neutral-400">{member.email}</p>
                                    </div>
                                  </div>
                                </div>

                                <div className="mt-3 flex flex-col gap-2 sm:mt-0 sm:flex-row sm:items-center sm:gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openProfile(member.id)}
                                    className="h-10 rounded-2xl border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950"
                                  >
                                    <User className="mr-2 h-4 w-4" />
                                    Profile
                                  </Button>
                                  {/* Role Badge/Selector */}
                                  <Select
                                    value={member.role}
                                    onValueChange={(value) => handleChangeRole(member.id, value as Member['role'])}
                                    disabled={isCurrentUser}
                                  >
                                    <SelectTrigger className={`h-10 w-full rounded-2xl border sm:w-32 ${roleConf.color}`}>
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

                  <Card className="gap-0 overflow-hidden rounded-2xl border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
                    <div className="border-b border-neutral-100 px-4 py-3 dark:border-neutral-800">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="inline-flex items-center gap-2 rounded-md border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-[11px] font-semibold uppercase leading-none tracking-[0.12em] text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">
                            <ClipboardList className="h-3.5 w-3.5 shrink-0" />
                            <span>Workspace governance</span>
                          </div>
                          <h2 className="mt-2 text-lg font-semibold tracking-tight text-neutral-950 dark:text-white">
                            Workspace rules
                          </h2>
                          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                            Admin, member, timetable, progress, board, and invite rules.
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0 sm:items-center">
                          <Badge variant="outline" className="justify-center rounded-md border-neutral-200 bg-neutral-50 text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">
                            {stats.admins} admins
                          </Badge>
                          <Badge variant="outline" className="justify-center rounded-md border-neutral-200 bg-neutral-50 text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">
                            {stats.members} members
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <CardContent className="p-3">
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                          {[
                            {
                              icon: Shield,
                              title: 'Admins manage the workspace',
                              body: 'Edit details, members, roles, links, and deletion.',
                            },
                            {
                              icon: Users,
                              title: 'Members collaborate inside the workspace',
                              body: 'View content, chat, work on tasks, and follow schedules.',
                            },
                            {
                              icon: Calendar,
                              title: 'Workspace timetable is admin-controlled',
                              body: 'Only admins generate, import, or edit shared schedules.',
                            },
                            {
                              icon: Activity,
                              title: 'Progress belongs to the institution view',
                              body: 'Track completion, study hours, goals, and risk.',
                            },
                            {
                              icon: ClipboardList,
                              title: 'Board tasks are shared project work',
                              body: 'Use stages, assignees, priorities, labels, and comments.',
                            },
                            {
                              icon: Link2,
                              title: 'Invites and links are controlled',
                              body: 'Admins control invites, requests, and share links.',
                            },
                          ].map((rule, index) => {
                            const Icon = rule.icon;
                            return (
                              <div key={rule.title} className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-900/70">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-700 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200">
                                    <Icon className="h-4 w-4" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[11px] font-semibold text-neutral-400 dark:text-neutral-500">
                                        0{index + 1}
                                      </span>
                                      <p className="truncate text-sm font-semibold text-neutral-950 dark:text-white">
                                        {rule.title}
                                      </p>
                                    </div>
                                    <p className="mt-1 text-xs leading-5 text-neutral-500 dark:text-neutral-400">
                                      {rule.body}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
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
                            <div key={key} className="rounded-[22px] border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
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
                        <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-900">
                          View-only: only workspace admins can edit this timetable.
                        </div>
                      )}
                      <CalendarView
                        key={`calendar-${workspace.id}`}
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
                    <div className="rounded-2xl border border-blue-200 bg-neutral-50 p-3 text-sm text-blue-900 dark:bg-neutral-800/70">
                      Workspace auto-generate is stored separately from your personal Auto Generate page.
                    </div>

                    <AutoGenerateTimetable
                      key={`auto-generate-${workspace.id}`}
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
                    key={`progress-${workspace.id}`}
                    workspaceId={String(workspace.id)}
                    members={workspace.members}
                    currentUser={currentUser}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="board" className="h-full mt-0 overflow-auto">
              <CollaborationBoard
                key={`board-${workspace.id}`}
                workspace={workspace}
                currentUser={currentUser}
                onUnseenCountChange={setUnreadBoardCount}
              />
            </TabsContent>

            <TabsContent value="activity" className="h-full mt-0 overflow-auto">
              <div className="p-3 pb-24 sm:p-4 sm:pb-24 lg:p-6 lg:pb-6">
                <div className="mx-auto w-full max-w-5xl space-y-4">
                  <div className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Activity className="h-5 w-5 text-blue-700 dark:text-blue-400" />
                        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Workspace activity</h2>
                      </div>
                      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                        Who did what, task updates, new files, and chat activity.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => loadWorkspaceActivity()}
                      className="h-10 rounded-2xl border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950"
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Refresh
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                      { label: 'Tasks', value: workspaceActivity.filter((item) => item.type === 'task').length },
                      { label: 'Files', value: workspaceActivity.filter((item) => item.type === 'file').length },
                      { label: 'Chat', value: workspaceActivity.filter((item) => item.type === 'chat').length },
                      { label: 'People', value: workspaceActivity.filter((item) => item.type === 'member').length },
                    ].map((stat) => (
                      <div key={stat.label} className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
                        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">{stat.label}</p>
                        <p className="mt-2 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">{stat.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
                    {isActivityLoading && workspaceActivity.length === 0 ? (
                      <div className="p-8 text-center text-sm text-neutral-500 dark:text-neutral-400">Loading activity...</div>
                    ) : workspaceActivity.length === 0 ? (
                      <div className="p-8 text-center">
                        <Activity className="mx-auto h-10 w-10 text-neutral-300 dark:text-neutral-700" />
                        <p className="mt-3 text-sm font-medium text-neutral-900 dark:text-neutral-100">No activity yet</p>
                        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Task, file, and chat updates will appear here.</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                        {workspaceActivity.map((item) => {
                          const presence = getMemberPresence(item.actorId, item.actor);
                          return (
                            <div key={item.id} className="flex gap-3 p-4">
                              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
                                {getActivityIcon(item.type)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                  <p className="min-w-0 text-sm text-neutral-900 dark:text-neutral-100">
                                    <button
                                      type="button"
                                      onClick={() => item.actorId && openProfile(item.actorId)}
                                      className="font-semibold underline-offset-4 hover:underline"
                                    >
                                      {item.actor}
                                    </button>{' '}
                                    <span
                                      className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                                        presence.isOnline
                                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300'
                                          : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'
                                      }`}
                                    >
                                      <span className={`h-1.5 w-1.5 rounded-full ${presence.isOnline ? 'bg-emerald-500' : 'bg-neutral-400'}`} />
                                      {presence.label}
                                    </span>{' '}
                                    <span className="text-neutral-600 dark:text-neutral-300">{item.action}</span>
                                  </p>
                                  <span className="shrink-0 text-xs text-neutral-400 dark:text-neutral-500">
                                    {formatActivityTime(item.timestamp)}
                                  </span>
                                </div>
                                {item.detail && (
                                  <p className="mt-1 line-clamp-2 break-words text-sm text-neutral-500 dark:text-neutral-400">
                                    {item.detail}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="messages" className="h-full min-h-0 mt-0 overflow-hidden">
              <div className="grid h-full min-h-0 bg-white dark:bg-[#050505] lg:grid-cols-[320px_minmax(0,1fr)]">
                <aside className="min-h-0 border-b border-neutral-200 bg-neutral-50/80 dark:border-neutral-800 dark:bg-neutral-950 lg:border-b-0 lg:border-r">
                  <div className="border-b border-neutral-200 p-4 dark:border-neutral-800">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-semibold text-neutral-950 dark:text-neutral-50">Messages</h2>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">Private conversations with friends.</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={loadDirectConversations}
                        className="rounded-xl border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="max-h-[320px] space-y-1 overflow-y-auto p-2 lg:max-h-none lg:h-[calc(100%-81px)]">
                    {conversationsLoading && directConversations.length === 0 ? (
                      <div className="p-4 text-sm text-neutral-500 dark:text-neutral-400">Loading conversations...</div>
                    ) : directConversations.length === 0 ? (
                      <div className="m-2 rounded-2xl border border-dashed border-neutral-200 bg-white p-5 text-sm text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
                        Add friends from member profiles, then your conversations will appear here.
                      </div>
                    ) : (
                      directConversations.map((conversation) => {
                        const friend = conversation.friend;
                        const selected = conversationTarget?.id === friend.id;
                        const displayName = conversation.nickname || getBaseFriendName(friend);
                        return (
                          <button
                            key={friend.id}
                            type="button"
                            onClick={() => openConversation(friend, 'inline')}
                            className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left transition ${
                              selected
                                ? 'bg-neutral-950 text-white dark:bg-white dark:text-neutral-950'
                                : 'text-neutral-900 hover:bg-white dark:text-neutral-100 dark:hover:bg-neutral-900'
                            }`}
                          >
                            <Avatar className="h-11 w-11">
                              <AvatarImage src={getProfileImageUrl(friend)} alt={displayName} />
                              <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
                            </Avatar>
                            <span className="min-w-0 flex-1">
                              <span className="flex items-center justify-between gap-2">
                                <span className="flex min-w-0 items-center gap-1.5">
                                  {conversation.pinned && <Pin className="h-3.5 w-3.5 shrink-0 text-amber-500" />}
                                  <span className="truncate text-sm font-semibold">{displayName}</span>
                                </span>
                                <span className="flex shrink-0 items-center gap-1">
                                  {!!conversation.unread_count && (
                                    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                                      {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
                                    </span>
                                  )}
                                </span>
                              </span>
                              {conversation.nickname && (
                                <span className={`mt-0.5 block truncate text-[11px] ${selected ? 'text-white/55 dark:text-neutral-600' : 'text-neutral-400 dark:text-neutral-500'}`}>
                                  {getBaseFriendName(friend)}
                                </span>
                              )}
                              <span className={`mt-0.5 block truncate text-xs ${selected ? 'text-white/70 dark:text-neutral-700' : 'text-neutral-500 dark:text-neutral-400'}`}>
                                {conversation.last_message?.content || getLastSeenText(friend.last_seen_at || undefined, friend.is_online)}
                              </span>
                            </span>
                            <span className={`h-2.5 w-2.5 rounded-full ${friend.is_online ? 'bg-emerald-500' : 'bg-neutral-400'}`} />
                          </button>
                        );
                      })
                    )}
                  </div>
                </aside>

                <section className="flex min-h-[520px] min-w-0 flex-col bg-white dark:bg-neutral-950">
                  {conversationTarget ? (
                    <>
                      <div className="flex items-center justify-between gap-3 border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
                        <button type="button" onClick={() => openProfile(conversationTarget.id)} className="flex min-w-0 items-center gap-3 text-left">
                          <Avatar className="h-11 w-11">
                            <AvatarImage src={getProfileImageUrl(conversationTarget)} alt={conversationTarget.full_name || conversationTarget.email || 'Friend'} />
                            <AvatarFallback>{getInitials(conversationTarget.full_name || conversationTarget.username || conversationTarget.email || 'F')}</AvatarFallback>
                          </Avatar>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold text-neutral-950 dark:text-neutral-50">
                              {getConversationDisplayName(conversationTarget)}
                            </span>
                            {getConversationFor(conversationTarget.id)?.nickname && (
                              <span className="block truncate text-[11px] text-neutral-400 dark:text-neutral-500">
                                {getBaseFriendName(conversationTarget)}
                              </span>
                            )}
                            <span className="mt-0.5 flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                              <span className={`h-2 w-2 rounded-full ${conversationTarget.is_online ? 'bg-emerald-500' : 'bg-neutral-400'}`} />
                              {getLastSeenText(conversationTarget.last_seen_at || undefined, conversationTarget.is_online)}
                            </span>
                          </span>
                        </button>
                        <div className="flex shrink-0 items-center gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => updateConversationPreference(conversationTarget.id, { pinned: !getConversationFor(conversationTarget.id)?.pinned })}
                            className={`rounded-xl border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100 ${
                              getConversationFor(conversationTarget.id)?.pinned ? 'text-amber-700 dark:text-amber-300' : ''
                            }`}
                          >
                            <Pin className="mr-2 h-4 w-4" />
                            {getConversationFor(conversationTarget.id)?.pinned ? 'Pinned' : 'Pin'}
                          </Button>
                        </div>
                      </div>

                      <div className="border-b border-neutral-200 bg-white px-4 py-2 dark:border-neutral-800 dark:bg-neutral-950">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                          <Input
                            value={nicknameDraft}
                            onChange={(event) => setNicknameDraft(event.target.value)}
                            placeholder="Add a nickname for this friend"
                            className="h-9 rounded-xl border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900"
                          />
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => updateConversationPreference(conversationTarget.id, { nickname: nicknameDraft })}
                            className="h-9 rounded-xl bg-neutral-950 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200"
                          >
                            Save nickname
                          </Button>
                        </div>
                      </div>

                      <div className="flex-1 space-y-3 overflow-y-auto bg-neutral-50 p-4 dark:bg-[#070707]">
                        {directLoading && directMessages.length === 0 ? (
                          <div className="text-center text-sm text-neutral-500 dark:text-neutral-400">Loading conversation...</div>
                        ) : directMessages.length === 0 ? (
                          <div className="mx-auto mt-16 max-w-sm rounded-2xl border border-dashed border-neutral-200 bg-white p-6 text-center text-sm text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
                            Send the first private message.
                          </div>
                        ) : (
                          directMessages.map((message) => {
                            const isOwn = String(message.sender_id) === String(currentUser.id);
                            return (
                              <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[82%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                                  isOwn
                                    ? 'bg-blue-700 text-white'
                                    : 'border border-neutral-200 bg-white text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100'
                                }`}>
                                  {renderDirectMessageContent(message.content, isOwn)}
                                  <p className={`mt-1 text-[11px] ${isOwn ? 'text-white/70' : 'text-neutral-500 dark:text-neutral-400'}`}>
                                    {message.created_at ? new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Sending'}
                                  </p>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      <form onSubmit={sendDirectMessage} className="border-t border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950">
                        <div className="mb-2 flex flex-wrap items-center gap-1">
                          <span className="mr-1 inline-flex items-center gap-1 text-xs font-medium text-neutral-500 dark:text-neutral-400">
                            <Smile className="h-3.5 w-3.5" />
                            Quick reactions
                          </span>
                          {quickEmojis.map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => setDirectMessageText((prev) => `${prev}${emoji}`)}
                              className="flex h-8 w-8 items-center justify-center rounded-xl border border-neutral-200 bg-white text-base transition hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-800"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                        <div className="flex items-end gap-2 rounded-2xl border border-neutral-200 bg-neutral-50 p-2 dark:border-neutral-800 dark:bg-neutral-900">
                          <Textarea
                            value={directMessageText}
                            onChange={(event) => setDirectMessageText(event.target.value)}
                            placeholder="Message your friend..."
                            className="min-h-[44px] flex-1 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0"
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' && !event.shiftKey) {
                                event.preventDefault();
                                sendDirectMessage();
                              }
                            }}
                          />
                          <Button type="submit" disabled={!directMessageText.trim()} className="h-10 rounded-xl bg-blue-700 px-3 text-white hover:bg-blue-800">
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </form>
                    </>
                  ) : (
                    <div className="flex h-full min-h-[520px] items-center justify-center p-6">
                      <div className="max-w-sm text-center">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100 dark:bg-neutral-900">
                          <MessageSquare className="h-6 w-6 text-neutral-500 dark:text-neutral-400" />
                        </div>
                        <h3 className="mt-4 text-lg font-semibold text-neutral-950 dark:text-neutral-50">Choose a conversation</h3>
                        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                          Messages from accepted friends are available here for quick access.
                        </p>
                      </div>
                    </div>
                  )}
                </section>
              </div>
            </TabsContent>

            <TabsContent value="chat" className="h-full min-h-0 mt-0">
              <div className="h-full min-h-0">
              <WorkspaceChat 
                key={`chat-${workspace.id}`}
                workspace={workspace} 
                currentUser={currentUser}
                onUnreadCountChange={setUnreadChatCount}
                onViewProfile={openProfile}
              />
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
        <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
          <DialogContent className="max-h-[90vh] w-[95vw] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>User profile</DialogTitle>
              <DialogDescription>
                View study profile, connection status, and friends.
              </DialogDescription>
            </DialogHeader>

            {profileLoading ? (
              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-6 text-center text-sm text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
                Loading profile...
              </div>
            ) : selectedProfile ? (
              <div className="space-y-4">
                <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
                  <div className={`${profileBackgroundThemes[selectedProfile.background_theme || 'aurora'] || profileBackgroundThemes.aurora} px-5 py-6 text-white`}>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                      <div className="flex min-w-0 items-center gap-4">
                        <Avatar className="h-20 w-20 border-2 border-white/40 shadow-lg">
                          <AvatarImage src={getProfileImageUrl(selectedProfile)} alt={selectedProfile.full_name || selectedProfile.email || 'User'} />
                          <AvatarFallback className="bg-white/15 text-lg font-semibold text-white">
                            {getInitials(selectedProfile.full_name || selectedProfile.username || selectedProfile.email || 'U')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate text-2xl font-semibold">
                            {selectedProfile.full_name || selectedProfile.username || selectedProfile.email}
                          </p>
                          <p className="mt-1 truncate text-sm text-white/75">
                            @{selectedProfile.username || String(selectedProfile.email || '').split('@')[0] || 'uplan-user'}
                          </p>
                          <p className="mt-1 truncate text-sm font-medium text-white/85">
                            {selectedProfile.profile_title || 'Senior Developer'}
                          </p>
                          <p className="mt-1 truncate text-sm text-white/75">{selectedProfile.email}</p>
                        </div>
                      </div>

                      <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-left backdrop-blur">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/65">Joined UPLAN</p>
                        <p className="mt-1 text-sm font-semibold">
                          {selectedProfile.joined_at ? new Date(selectedProfile.joined_at).toLocaleDateString() : 'Recently'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-900">
                      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Hours completed</p>
                      <p className="mt-1 text-xl font-semibold text-neutral-900 dark:text-neutral-100">{Number(selectedProfile.completed_hours || 0).toFixed(1)}h</p>
                    </div>
                    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-900">
                      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Most productive week</p>
                      <p className="mt-1 text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        {selectedProfile.most_productive_week || 'No completed sessions'}
                      </p>
                      <p className="text-xs text-neutral-500">{Number(selectedProfile.most_productive_week_hours || 0).toFixed(1)}h</p>
                    </div>
                    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-900">
                      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Most productive month</p>
                      <p className="mt-1 text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        {selectedProfile.most_productive_month || 'No completed sessions'}
                      </p>
                      <p className="text-xs text-neutral-500">{Number(selectedProfile.most_productive_month_hours || 0).toFixed(1)}h</p>
                    </div>
                    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-900">
                      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Connection</p>
                      <p className="mt-1 text-sm font-medium capitalize text-neutral-900 dark:text-neutral-100">
                        {(selectedProfile.friendship_status || 'none').replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {selectedProfile.id !== currentUser.id && selectedProfile.friendship_status === 'none' && (
                    <Button onClick={() => sendFriendRequest(selectedProfile.id)} className="rounded-2xl bg-blue-700 hover:bg-blue-800">
                      <UserPlus className="mr-2 h-4 w-4" />
                      Add friend
                    </Button>
                  )}
                  {selectedProfile.id !== currentUser.id && selectedProfile.friendship_status === 'pending_received' && (
                    <Button onClick={() => acceptFriendRequest(selectedProfile.id)} className="rounded-2xl bg-emerald-600 hover:bg-emerald-700">
                      <Check className="mr-2 h-4 w-4" />
                      Accept request
                    </Button>
                  )}
                  {selectedProfile.id !== currentUser.id && selectedProfile.friendship_status === 'friends' && (
                    <Button onClick={() => openConversation(selectedProfile)} className="rounded-xl border border-blue-600 bg-blue-700 text-white shadow-sm hover:bg-blue-800 dark:border-blue-500/70 dark:bg-blue-600 dark:text-white dark:hover:bg-blue-500">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Message
                    </Button>
                  )}
                  {selectedProfile.id === currentUser.id && (
                    <Button onClick={createFriendLink} className="rounded-2xl bg-blue-700 hover:bg-blue-800">
                      <Link2 className="mr-2 h-4 w-4" />
                      Copy friend link
                    </Button>
                  )}
                  {friendLink && selectedProfile.id === currentUser.id && (
                    <Button variant="outline" onClick={() => navigator.clipboard.writeText(friendLink)} className="rounded-2xl">
                      <Copy className="mr-2 h-4 w-4" />
                      Copy again
                    </Button>
                  )}
                </div>

                <Card className="rounded-2xl border-neutral-200 dark:border-neutral-800">
                  <CardHeader>
                    <CardTitle>Friends</CardTitle>
                    <CardDescription>Accepted friends and pending requests connected to this account.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {selectedProfile.id !== currentUser.id ? (
                      <div className="text-sm text-neutral-500 dark:text-neutral-400">
                        Open your own profile to manage your full friends section.
                      </div>
                    ) : friends.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-neutral-200 p-5 text-center text-sm text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
                        No friends yet. Copy your friend link and share it like a workspace link.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {friends.map((friend) => (
                          <div key={friend.friendship_id} className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-900">
                            <div className="flex min-w-0 items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={getProfileImageUrl(friend)} alt={friend.full_name || friend.email || 'Friend'} />
                                <AvatarFallback>{getInitials(friend.full_name || friend.username || friend.email || 'F')}</AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                                  {friend.full_name || friend.username || friend.email}
                                </p>
                                <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">
                                  {friend.status === 'accepted'
                                    ? `Friends since ${friend.friends_since ? new Date(friend.friends_since).toLocaleDateString() : 'recently'}`
                                    : `${friend.direction === 'sent' ? 'Request sent' : 'Request received'}`}
                                </p>
                                <div className="mt-1 flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                                  <span className={`h-2 w-2 rounded-full ${friend.is_online ? 'bg-emerald-500' : 'bg-neutral-400'}`} />
                                  <span>{getLastSeenText(friend.last_seen_at || undefined, friend.is_online)}</span>
                                </div>
                              </div>
                            </div>
                            {friend.status === 'pending' && friend.direction === 'received' ? (
                              <Button size="sm" onClick={() => acceptFriendRequest(friend.id)} className="rounded-xl bg-emerald-600 hover:bg-emerald-700">
                                Accept
                              </Button>
                            ) : friend.status === 'accepted' ? (
                              <Button size="sm" onClick={() => openConversation(friend)} className="rounded-xl border border-blue-600 bg-blue-700 text-white hover:bg-blue-800 dark:border-blue-500/70 dark:bg-blue-600 dark:hover:bg-blue-500">
                                <MessageSquare className="mr-2 h-4 w-4" />
                                Message
                              </Button>
                            ) : (
                              <Badge variant="outline" className="capitalize">{friend.status}</Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>

        <Dialog open={conversationOpen} onOpenChange={setConversationOpen}>
          <DialogContent className="flex max-h-[90vh] w-[95vw] flex-col overflow-hidden sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                {conversationTarget ? (
                  <>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={getProfileImageUrl(conversationTarget)} alt={conversationTarget.full_name || conversationTarget.email || 'Friend'} />
                      <AvatarFallback>{getInitials(conversationTarget.full_name || conversationTarget.username || conversationTarget.email || 'F')}</AvatarFallback>
                    </Avatar>
                    <span className="min-w-0">
                      <span className="block truncate">{getConversationDisplayName(conversationTarget)}</span>
                      {getConversationFor(conversationTarget.id)?.nickname && (
                        <span className="block truncate text-[11px] font-normal text-neutral-400">
                          {getBaseFriendName(conversationTarget)}
                        </span>
                      )}
                      <span className="mt-0.5 flex items-center gap-1.5 text-xs font-normal text-neutral-500 dark:text-neutral-400">
                        <span className={`h-2 w-2 rounded-full ${conversationTarget.is_online ? 'bg-emerald-500' : 'bg-neutral-400'}`} />
                        {getLastSeenText(conversationTarget.last_seen_at || undefined, conversationTarget.is_online)}
                      </span>
                    </span>
                  </>
                ) : (
                  'Conversation'
                )}
              </DialogTitle>
              <DialogDescription>Private messages between accepted friends.</DialogDescription>
            </DialogHeader>

            <div className="min-h-[320px] flex-1 space-y-3 overflow-y-auto rounded-2xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-950">
              {directLoading && directMessages.length === 0 ? (
                <div className="text-center text-sm text-neutral-500 dark:text-neutral-400">Loading conversation...</div>
              ) : directMessages.length === 0 ? (
                <div className="rounded-xl border border-dashed border-neutral-200 bg-white p-5 text-center text-sm text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
                  No messages yet. Start the conversation with a clear note.
                </div>
              ) : (
                directMessages.map((message) => {
                  const isOwn = String(message.sender_id) === String(currentUser.id);
                  return (
                    <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[82%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                        isOwn
                          ? 'bg-blue-700 text-white'
                          : 'border border-neutral-200 bg-white text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100'
                      }`}>
                        {renderDirectMessageContent(message.content, isOwn)}
                        <p className={`mt-1 text-[11px] ${isOwn ? 'text-white/70' : 'text-neutral-500 dark:text-neutral-400'}`}>
                          {message.created_at ? new Date(message.created_at).toLocaleString() : 'Sending'}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <form onSubmit={sendDirectMessage} className="mt-3 space-y-2">
              <div className="flex flex-wrap items-center gap-1">
                {quickEmojis.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setDirectMessageText((prev) => `${prev}${emoji}`)}
                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-neutral-200 bg-white text-base transition hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-800"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              <div className="flex items-end gap-2">
                <Textarea
                  value={directMessageText}
                  onChange={(event) => setDirectMessageText(event.target.value)}
                  placeholder="Write a private message..."
                  className="min-h-[48px] flex-1 resize-none rounded-2xl"
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      sendDirectMessage();
                    }
                  }}
                />
                <Button type="submit" disabled={!directMessageText.trim() || !conversationTarget} className="rounded-2xl bg-blue-700 hover:bg-blue-800">
                  Send
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

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
                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-blue-700">
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
                <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-neutral-50 p-4 text-center dark:bg-neutral-800">
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
                  <div className="rounded-2xl border border-blue-200 bg-neutral-50 p-3 dark:bg-neutral-800/70">
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
                      onClick={() => setIsDisableShareLinkOpen(true)}
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

      <ConfirmDeleteDialog
        open={isDeleteWorkspaceOpen}
        onOpenChange={setIsDeleteWorkspaceOpen}
        title="Delete workspace"
        description={
          workspaces.length === 1
            ? 'This is your last workspace. Create another workspace first if you want to delete this one.'
            : `This permanently deletes "${workspace.name}", removes ${workspace.members.length} members, deletes chat messages, and removes workspace data.`
        }
        confirmLabel="Delete workspace"
        onConfirm={handleDeleteWorkspace}
      />
      <ConfirmDeleteDialog
        open={!!memberDeleteTarget}
        onOpenChange={(open) => !open && setMemberDeleteTarget(null)}
        title="Remove member"
        description={`This removes "${memberDeleteTarget?.name || 'this member'}" from the workspace.`}
        confirmLabel="Remove member"
        onConfirm={confirmRemoveMember}
      />
      <ConfirmDeleteDialog
        open={isDisableShareLinkOpen}
        onOpenChange={setIsDisableShareLinkOpen}
        title="Disable share link"
        description="This disables the current workspace share link. People with the old link will no longer be able to use it."
        confirmLabel="Disable link"
        onConfirm={async () => {
          await disableShareLink();
          setIsDisableShareLinkOpen(false);
        }}
      />

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
              <div className="rounded-[24px] border-2 border-dashed border-gray-300 bg-neutral-50 p-8 text-center dark:border-gray-700 dark:bg-gray-900">
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
                <div className="rounded-[24px] border-2 border-blue-200 bg-neutral-50 p-4 dark:border-blue-800 dark:bg-blue-950/30">
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
                              <div className="mt-2 rounded-2xl border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-800">
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
    </section>
  );
}
