import { useState, useEffect } from 'react';
import { 
  Plus, 
  Settings, 
  Users, 
  Trash2, 
  MoreVertical, 
  ChevronDown,
  LayoutDashboard,
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
  Check
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from 'sonner';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import WorkspaceChat from './WorkspaceChat';
import TeamCollaboration from './TeamCollaboration';
import CollaborationBoard from './CollaborationBoard';
import SharedTimetable from './SharedTimetable';
import JoinWorkspaceDialog from './JoinWorkspaceDialog';

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
  avatar?: string;
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

const roleConfig = {
  admin: {
    label: 'Admin',
    icon: Shield,
    color: 'text-blue-600 bg-blue-50 border-blue-200',
    description: 'Can manage members and settings',
    permissions: ['manage_members', 'delete_workspace', 'edit_workspace', 'manage_roles', 'chat']
  },
  member: {
    label: 'Member',
    icon: User,
    color: 'text-gray-600 bg-gray-50 border-gray-200',
    description: 'Can view and edit content',
    permissions: ['edit_content', 'chat']
  }
};

export default function Workspace() {
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
  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    role: 'member' as Member['role']
  });
  const [workspaceName, setWorkspaceName] = useState('');
  const [workspaceDescription, setWorkspaceDescription] = useState('');
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newWorkspaceDescription, setNewWorkspaceDescription] = useState('');
  const [emailValidationError, setEmailValidationError] = useState<string>('');
  
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

  useEffect(() => {
    loadWorkspaces();
  }, []);

  useEffect(() => {
    if (currentWorkspaceId) {
      const current = workspaces.find(w => w.id === currentWorkspaceId);
      setWorkspace(current || null);
    }
  }, [currentWorkspaceId, workspaces]);

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

  const loadWorkspaces = async () => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const userId = currentUser.id;

    if (!userId) {
      toast.error('Missing user_id. Please log in again.');
      return;
    }

    try {
      // 1) Fetch workspaces the backend says this user belongs to
      const res = await fetch(`${API_BASE_URL}/workspaces`, {
        headers: { 'X-User-Id': userId },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Failed to load workspaces (${res.status})`);
      }
      const backendWorkspaces = await res.json();

      // 2) If none exist, create a default workspace for the user (safe start)
      if (!Array.isArray(backendWorkspaces) || backendWorkspaces.length === 0) {
        const createRes = await fetch(`${API_BASE_URL}/workspaces`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
          body: JSON.stringify({
            name: 'My Study Workspace',
            description: 'Collaborative study planning and scheduling',
          }),
        });
        if (!createRes.ok) {
          const err = await createRes.json().catch(() => ({}));
          throw new Error(err.detail || `Failed to create default workspace (${createRes.status})`);
        }
        // Re-fetch
        const again = await fetch(`${API_BASE_URL}/workspaces`, { headers: { 'X-User-Id': userId } });
        const againJson = await again.json();
        backendWorkspaces.splice(0, backendWorkspaces.length, ...(againJson || []));
      }

      // 3) For each workspace, fetch its member list (so both accounts see the same members)
      const mapped: Workspace[] = await Promise.all(
        (backendWorkspaces || []).map(async (w: any) => {
          const wid = String(w.id);
          let members: Member[] = [];
          try {
            const mRes = await fetch(`${API_BASE_URL}/workspaces/${wid}/members`, {
              headers: { 'X-User-Id': userId },
            });
            if (mRes.ok) {
              const mJson = await mRes.json();
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
          if (!members.some((m) => m.id === currentUser.id)) {
            members = [...members, currentUser];
          }

          return {
            id: wid,
            name: w.name,
            description: w.description || '',
            createdAt: (w.created_at || new Date().toISOString()),
            members,
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
      toast.error(e.message || 'Failed to load workspaces');
    }
  };

  const saveWorkspace = (updatedWorkspace: Workspace) => {
    const updatedWorkspaces = workspaces.map(w => 
      w.id === updatedWorkspace.id ? updatedWorkspace : w
    );
    setWorkspaces(updatedWorkspaces);
    setWorkspace(updatedWorkspace);
  };

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) {
      toast.error('Please enter a workspace name');
      return;
    }

    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
      const res = await fetch(`${API_BASE_URL}/workspaces`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUser.id,
        },
        body: JSON.stringify({
          name: newWorkspaceName.trim(),
          description: newWorkspaceDescription.trim(),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Failed to create workspace (${res.status})`);
      }

      setIsCreateWorkspaceOpen(false);
      setNewWorkspaceName('');
      setNewWorkspaceDescription('');
      toast.success('Workspace created');
      await loadWorkspaces();
    } catch (e: any) {
      console.error('[Workspace] create failed:', e);
      toast.error(e.message || 'Failed to create workspace');
    }
  };

  const handleSwitchWorkspace = (workspaceId: string) => {
    setCurrentWorkspaceId(workspaceId);
    localStorage.setItem('currentWorkspaceId', workspaceId);
    const switchedWorkspace = workspaces.find(w => w.id === workspaceId);
    if (switchedWorkspace) {
      toast.success(`Switched to "${switchedWorkspace.name}"`);
    }
  };

  const handleAddMember = () => {
    if (!workspace) return;
    
    // Clear previous errors
    setEmailValidationError('');
    
    if (!newMember.name.trim() || !newMember.email.trim()) {
      setEmailValidationError('Please fill in all fields');
      toast.error('Please fill in all fields');
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

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || `Failed to add member (${res.status})`);
        }

        setIsAddMemberOpen(false);
        setNewMember({ name: '', email: '', role: 'member' });
        setEmailValidationError('');
        toast.success('Member added');
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

      if (!confirm(`Are you sure you want to remove ${member.name} from the workspace?`)) return;

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
          toast.success(`${member.name} has been removed from the workspace`);
          await loadWorkspaces();
        } catch (e: any) {
          console.error('[Workspace] remove member failed:', e);
          toast.error(e.message || 'Failed to remove member');
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
        toast.error("Maximum 2 admins allowed per workspace");
        return;
      }
    }

    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
      const currentUserId = localStorage.getItem("currentUserId");

      if (!currentUserId) {
        toast.error("User not authenticated");
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
        toast.error(data.detail || "Failed to update member role");
        return;
      }

      // Backend succeeded → update local state
      const updatedWorkspace = {
        ...workspace,
        members: workspace.members.map((m) =>
          m.id === memberId ? { ...m, role: newRole } : m
        ),
      };

      saveWorkspace(updatedWorkspace);

      toast.success(
        `${member.name}'s role has been updated to ${
          getRoleConfig(newRole).label
        }`
      );

    } catch (err: any) {
      console.error("Change role error:", err);
      toast.error("Something went wrong while updating the role");
    }
  };


  const handleApproveRequest = (requestId: string) => {
    if (!workspace) return;

    const request = workspace.pendingRequests?.find(r => r.id === requestId);
    if (!request) return;

    // Check if email already exists in members
    if (workspace.members.some(m => m.email === request.email)) {
      toast.error('A member with this email already exists in this workspace');
      return;
    }

    // Add as member
    const newMember: Member = {
      id: `member-${Date.now()}`,
      name: request.name,
      email: request.email,
      role: 'member',
      joinedAt: new Date().toISOString()
    };

    const updatedWorkspace = {
      ...workspace,
      members: [...workspace.members, newMember],
      pendingRequests: workspace.pendingRequests?.filter(r => r.id !== requestId) || []
    };

    saveWorkspace(updatedWorkspace);
    toast.success(`${request.name} has been approved and added to the workspace`);
  };

  const handleRejectRequest = (requestId: string) => {
    if (!workspace) return;

    const request = workspace.pendingRequests?.find(r => r.id === requestId);
    if (!request) return;

    const updatedWorkspace = {
      ...workspace,
      pendingRequests: workspace.pendingRequests?.filter(r => r.id !== requestId) || []
    };

    saveWorkspace(updatedWorkspace);
    toast.success(`Request from ${request.name} has been rejected`);
  };

  const handleDeleteWorkspace = async () => {
  if (!workspace) return;

  if (workspaces.length === 1) {
    toast.error("Cannot delete the last workspace");
    return;
  }

  const confirmed = confirm(
    "⚠️ Are you sure you want to delete this workspace? This action cannot be undone and will remove all members and data."
  );

  if (!confirmed) return;

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

    // ✅ Backend delete succeeded — now update UI state
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
    toast.success("Workspace has been deleted");

    setTimeout(() => {
      loadWorkspaces();
    }, 500);

    } catch (err: any) {
    console.error("Delete workspace error:", err);
    toast.error("Something went wrong while deleting the workspace");
    };
  };


  const handleEditWorkspace = () => {
    if (!workspace) return;

    if (!workspaceName.trim()) {
      toast.error('Workspace name is required');
      return;
    }

    const updatedWorkspace = {
      ...workspace,
      name: workspaceName,
      description: workspaceDescription
    };

    saveWorkspace(updatedWorkspace);
    setIsEditWorkspaceOpen(false);
    toast.success('Workspace updated successfully');
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
    if (isOnline) return 'Online';
    if (!lastActive) return 'Never';
    
    const now = new Date();
    const lastActiveDate = new Date(lastActive);
    const diffMs = now.getTime() - lastActiveDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
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
  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size must be less than 2MB');
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      
      if (workspace) {
        const updatedWorkspace = {
          ...workspace,
          avatar: base64String
        };
        saveWorkspace(updatedWorkspace);
        toast.success('Workspace avatar updated successfully!');
      }
    };
    reader.readAsDataURL(file);
  };

  const triggerAvatarUpload = () => {
    document.getElementById('workspace-avatar-upload')?.click();
  };

  const handleRemoveAvatar = () => {
    if (workspace) {
      const updatedWorkspace = {
        ...workspace,
        avatar: undefined
      };
      saveWorkspace(updatedWorkspace);
      toast.success('Workspace avatar removed successfully!');
    }
  };

  // Sharing Link Functions
  const generateShareLink = async () => {
    if (!workspace) return;

    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
      const currentUserId = localStorage.getItem("currentUserId");
    if (!currentUserId) {
      toast.error("User not authenticated");
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
        linkId: data.link_id, // ✅ backend-issued token
        accessType: "open" as const,
        createdAt: new Date().toISOString(),
        createdBy: currentUser.id,
      },
    };

    saveWorkspace(updatedWorkspace);
    toast.success("Sharing link generated successfully!");

    } catch (err: any) {
    console.error("Generate share link error:", err);
    toast.error("Something went wrong while generating the link");
    }
  };

  const disableShareLink = () => {
    if (!workspace) return;
    
    if (confirm('Are you sure you want to disable the sharing link? No one will be able to use it to join.')) {
      const updatedWorkspace = {
        ...workspace,
        sharing: undefined
      };
      
      saveWorkspace(updatedWorkspace);
      toast.success('Sharing link disabled');
    }
  };

  const copyShareLink = () => {
    if (!workspace?.sharing) return;
    
    const shareUrl = `${window.location.origin}/join/${workspace.sharing.linkId}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      toast.success('Link copied to clipboard!');
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
    
    saveWorkspace(updatedWorkspace);
    toast.success(`Access type updated to ${type === 'open' ? 'Open to everyone' : 'Domain-restricted'}`);
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
    
    saveWorkspace(updatedWorkspace);
  };

  if (!workspace) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Loading workspace...</p>
        </div>
      </div>
    );
  }

  const stats = getRoleStats();
  
  // Check if current user is an admin
  const isAdmin = workspace?.members.find(m => m.id === currentUser.id)?.role === 'admin';

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Workspace Selector Bar */}
      <div className="bg-blue-600 px-6 py-3 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Enhanced Workspace Selector Button */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="text-white hover:bg-white/20 gap-2 px-4 py-2 h-auto border border-white/30 rounded-lg transition-all hover:border-white/50 hover:shadow-lg"
                >
                  <Users className="h-5 w-5" />
                  <div className="flex flex-col items-start">
                    <span className="text-xs text-white/70 uppercase tracking-wide">Workspace</span>
                    <span className="font-semibold text-sm">{workspace.name}</span>
                  </div>
                  <ChevronDown className="h-4 w-4 ml-2 text-white/70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-72">
                <div className="px-3 py-2 border-b">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Switch Workspace</p>
                  <p className="text-xs text-gray-400 mt-0.5">Select or create a workspace</p>
                </div>
                {workspaces.map((ws) => (
                  <DropdownMenuItem
                    key={ws.id}
                    onClick={() => handleSwitchWorkspace(ws.id)}
                    className={`m-1 rounded-md ${currentWorkspaceId === ws.id ? 'bg-blue-50 border border-blue-200' : 'border border-transparent'}`}
                  >
                    <div className="flex items-center gap-3 flex-1 py-1">
                      <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                        {ws.avatar ? (
                          <img src={ws.avatar} alt={ws.name} className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <Users className="h-5 w-5 text-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate text-gray-900">{ws.name}</p>
                        <p className="text-xs text-gray-500 truncate">{ws.members.length} {ws.members.length === 1 ? 'member' : 'members'}</p>
                      </div>
                      {currentWorkspaceId === ws.id && (
                        <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0" />
                      )}
                    </div>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => setIsCreateWorkspaceOpen(true)}
                  className="m-1 rounded-md bg-blue-50 hover:bg-blue-100 border border-blue-200"
                >
                  <Plus className="h-4 w-4 mr-2 text-blue-600" />
                  <span className="text-blue-600 font-medium">Create New Workspace</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Workspace member count badge */}
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30 hover:bg-white/30">
              {workspace.members.length} {workspace.members.length === 1 ? 'Member' : 'Members'}
            </Badge>
          </div>
          
          <Button
            onClick={() => setIsCreateWorkspaceOpen(true)}
            size="sm"
            className="bg-white text-blue-600 hover:bg-white/90 font-medium shadow-sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Workspace
          </Button>
        </div>
      </div>

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Workspace Avatar with Upload Button */}
            <div className="relative group">
              <input
                type="file"
                id="workspace-avatar-upload"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center overflow-hidden relative">
                {workspace.avatar ? (
                  <img src={workspace.avatar} alt={workspace.name} className="w-full h-full object-cover" />
                ) : (
                  <Users className="h-6 w-6 text-white" />
                )}
              </div>
              {/* Upload Button Overlay */}
              <button
                onClick={triggerAvatarUpload}
                className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                title="Upload workspace avatar"
              >
                <Upload className="h-5 w-5 text-white" />
              </button>
            </div>
            <div>
              <h1 className="text-gray-900 mb-1">{workspace.name}</h1>
              <p className="text-gray-500 text-sm">{workspace.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsShareDialogOpen(true)}
              className="border-gray-300"
            >
              <Link2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPendingRequestsOpen(true)}
                className="border-gray-300 relative"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Requests
                {workspace.pendingRequests && workspace.pendingRequests.length > 0 && (
                  <Badge className="ml-2 bg-red-600 text-white hover:bg-red-700">
                    {workspace.pendingRequests.length}
                  </Badge>
                )}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={openEditWorkspace}
              className="border-gray-300"
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={openEditWorkspace}>
                  <Settings className="h-4 w-4 mr-2" />
                  Edit Workspace
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => setIsDeleteWorkspaceOpen(true)}
                  className="text-red-600"
                  disabled={workspaces.length === 1}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Workspace
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="h-full flex flex-col">
          <div className="bg-white border-b border-gray-200 px-6">
            <TabsList className="bg-transparent p-0 h-auto gap-2">
              <TabsTrigger 
                value="members" 
                className="gap-2 bg-transparent border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-950/30 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:border-blue-300 dark:data-[state=active]:border-blue-700 transition-colors px-4 py-2 rounded-lg"
              >
                <Users className="h-4 w-4" />
                Members
                <Badge variant="secondary" className="ml-1">{workspace.members.length}</Badge>
              </TabsTrigger>
              <TabsTrigger 
                value="board" 
                className="gap-2 bg-transparent border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-950/30 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:border-blue-300 dark:data-[state=active]:border-blue-700 transition-colors px-4 py-2 rounded-lg"
              >
                <LayoutDashboard className="h-4 w-4" />
                Board
              </TabsTrigger>
              <TabsTrigger 
                value="chat" 
                className="gap-2 bg-transparent border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-950/30 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:border-blue-300 dark:data-[state=active]:border-blue-700 transition-colors px-4 py-2 rounded-lg"
              >
                <MessageSquare className="h-4 w-4" />
                Chat
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-hidden">
            <TabsContent value="members" className="h-full mt-0 overflow-auto">
              <div className="p-6">
                <div className="max-w-6xl mx-auto space-y-6">
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">Total Members</p>
                            <p className="text-2xl mt-1">{workspace.members.length}</p>
                          </div>
                          <Users className="h-8 w-8 text-blue-600" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">Admins</p>
                            <p className="text-2xl mt-1">{stats.admins}</p>
                          </div>
                          <Shield className="h-8 w-8 text-blue-600" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">Members</p>
                            <p className="text-2xl mt-1">{stats.members}</p>
                          </div>
                          <User className="h-8 w-8 text-gray-600" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Members Section */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Team Members</CardTitle>
                          <CardDescription>Manage who has access to this workspace</CardDescription>
                        </div>
                        <Button 
                          onClick={() => setIsAddMemberOpen(true)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Member
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Search */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search members by name, email, or role..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>

                      {/* Members List */}
                      <div className="space-y-2">
                        {filteredMembers.length === 0 ? (
                          <div className="text-center py-12 text-gray-500">
                            <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                            <p>No members found</p>
                          </div>
                        ) : (
                          filteredMembers.map((member) => {
                            const roleConf = getRoleConfig(member.role);
                            const RoleIcon = roleConf.icon;
                            const isCurrentUser = member.id === currentUser.id;

                            return (
                              <div
                                key={member.id}
                                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow bg-white"
                              >
                                <div className="flex items-center gap-4 flex-1">
                                  <div className="relative">
                                    <Avatar className="h-12 w-12 border-2 border-gray-200">
                                      <AvatarFallback className="bg-blue-600 text-white">
                                        {getInitials(member.name)}
                                      </AvatarFallback>
                                    </Avatar>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <p className="text-gray-900 truncate">
                                        {member.name}
                                        {isCurrentUser && (
                                          <Badge variant="outline" className="ml-2 text-xs">You</Badge>
                                        )}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Mail className="h-3 w-3 text-gray-400" />
                                      <p className="text-sm text-gray-500 truncate">{member.email}</p>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3">
                                  {/* Role Badge/Selector */}
                                  <Select
                                    value={member.role}
                                    onValueChange={(value) => handleChangeRole(member.id, value as Member['role'])}
                                    disabled={isCurrentUser}
                                  >
                                    <SelectTrigger className={`w-32 border ${roleConf.color}`}>
                                      <div className="flex items-center gap-2">
                                        <RoleIcon className="h-4 w-4" />
                                        <span>{roleConf.label}</span>
                                      </div>
                                    </SelectTrigger>
                                    <SelectContent>
                                      {Object.entries(roleConfig).map(([value, config]) => {
                                        const Icon = config.icon;
                                        return (
                                          <SelectItem key={value} value={value}>
                                            <div className="flex items-center gap-2">
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
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
                        <Shield className="h-5 w-5 text-blue-600" />
                        Roles & Permissions
                      </CardTitle>
                      <CardDescription>Understanding workspace roles</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(roleConfig).map(([key, config]) => {
                          const Icon = config.icon;
                          return (
                            <div key={key} className={`p-4 border rounded-lg ${config.color}`}>
                              <div className="flex items-center gap-2 mb-2">
                                <Icon className="h-5 w-5" />
                                <span className="font-medium">{config.label}</span>
                              </div>
                              <p className="text-sm mb-3">{config.description}</p>
                              <div className="space-y-1">
                                {config.permissions.map((permission) => (
                                  <div key={permission} className="text-xs flex items-center gap-1">
                                    <div className="w-1 h-1 rounded-full bg-current" />
                                    {permission.replace(/_/g, ' ').charAt(0).toUpperCase() + permission.replace(/_/g, ' ').slice(1)}
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

            <TabsContent value="board" className="h-full mt-0">
              <CollaborationBoard workspace={workspace} currentUser={currentUser} />
            </TabsContent>

            <TabsContent value="chat" className="h-full mt-0">
              <WorkspaceChat workspace={workspace} currentUser={currentUser} />
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Add Member Dialog */}
      <Dialog open={isAddMemberOpen} onOpenChange={(open) => {
        setIsAddMemberOpen(open);
        if (!open) {
          setEmailValidationError('');
          setNewMember({ name: '', email: '', role: 'member' });
        }
      }}>
        <DialogContent>
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
              <div className="text-xs text-gray-500 space-y-1 pt-1">
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
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <div>
                            <div>{config.label}</div>
                            <div className="text-xs text-gray-500">{config.description}</div>
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
              className="bg-blue-600 hover:bg-blue-700"
            >
              Add Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Workspace Dialog */}
      <Dialog open={isEditWorkspaceOpen} onOpenChange={setIsEditWorkspaceOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
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
                <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center overflow-hidden">
                  {workspace?.avatar ? (
                    <img src={workspace.avatar} alt={workspace.name} className="w-full h-full object-cover" />
                  ) : (
                    <Users className="h-8 w-8 text-white" />
                  )}
                </div>
                <div className="flex gap-2">
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
                    {workspace?.avatar ? 'Change Avatar' : 'Upload Avatar'}
                  </Button>
                  {workspace?.avatar && (
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
              <p className="text-xs text-gray-500">Upload a square image (max 2MB). JPG, PNG, or GIF.</p>
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
            
            {/* Timetable Permissions */}
            <div className="space-y-3 pt-2 border-t">
              <div>
                <Label className="text-sm font-medium">Timetable Permissions</Label>
                <p className="text-xs text-gray-500 mt-1">Control who can edit shared timetables</p>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Allow all members to edit timetables</p>
                  <p className="text-xs text-gray-500 mt-0.5">When enabled, all workspace members can edit any shared timetable</p>
                </div>
                <Switch
                  checked={workspace?.settings?.allowAllMembersToEditTimetables || false}
                  onCheckedChange={(checked) => {
                    if (workspace) {
                      const updatedWorkspace = {
                        ...workspace,
                        settings: {
                          ...workspace.settings,
                          allowAllMembersToEditTimetables: checked
                        }
                      };
                      saveWorkspace(updatedWorkspace);
                      toast.success(checked ? 'All members can now edit timetables' : 'Timetable editing restricted to owners and admins');
                    }
                  }}
                />
              </div>
            </div>

            {/* Workspace Sharing Link */}
            <div className="space-y-3 pt-2 border-t">
              <div>
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Link2 className="h-4 w-4" />
                  Workspace Sharing Link
                </Label>
                <p className="text-xs text-gray-500 mt-1">Generate a link for others to join this workspace</p>
              </div>
              
              {!workspace?.sharing ? (
                // No sharing link generated yet
                <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 text-center">
                  <Link2 className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600 mb-3">No sharing link created yet</p>
                  <Button 
                    onClick={generateShareLink}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Link2 className="h-4 w-4 mr-2" />
                    Generate Sharing Link
                  </Button>
                </div>
              ) : (
                // Sharing link exists
                <div className="space-y-3">
                  {/* Share Link Display */}
                  <div className="p-3 border rounded-lg bg-blue-50 border-blue-200">
                    <Label className="text-xs text-blue-700 mb-2 block">Share Link</Label>
                    <div className="flex items-center gap-2">
                      <Input 
                        value={`${window.location.origin}/join/${workspace.sharing.linkId}`}
                        readOnly
                        className="bg-white border-blue-300 text-sm"
                      />
                      <Button
                        size="sm"
                        onClick={copyShareLink}
                        className="bg-blue-600 hover:bg-blue-700 flex-shrink-0"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-blue-600 mt-2">Anyone with this link can request to join</p>
                  </div>

                  {/* Link Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={generateShareLink}
                      className="flex-1 border-blue-300 text-blue-600 hover:bg-blue-50"
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
        <DialogContent>
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
            <Button onClick={handleCreateWorkspace} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Create Workspace
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Workspace Dialog */}
      <Dialog open={isDeleteWorkspaceOpen} onOpenChange={setIsDeleteWorkspaceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Delete Workspace
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <Alert className="bg-red-50 border-red-200">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
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
              className="bg-red-600 hover:bg-red-700"
              disabled={workspaces.length === 1}
            >
              Delete Workspace
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Workspace Dialog */}
      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Share Workspace
            </DialogTitle>
            <DialogDescription>
              Invite others to join this workspace via a shareable link
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {!workspace?.sharing ? (
              // No sharing link exists
              <div className="p-8 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-center">
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
                    <Link2 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
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
                    className="bg-blue-600 hover:bg-blue-700"
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
                <div className="p-4 border-2 border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50 dark:bg-blue-950/30">
                  <div className="flex items-start justify-between mb-3">
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
                  
                  <div className="flex items-center gap-2">
                    <Input 
                      value={`${window.location.origin}/join/${workspace.sharing.linkId}`}
                      readOnly
                      className="bg-white dark:bg-gray-900 border-blue-300 dark:border-blue-700 text-sm font-mono"
                    />
                    <Button
                      size="sm"
                      onClick={copyShareLink}
                      className="bg-blue-600 hover:bg-blue-700 flex-shrink-0"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setJoinLinkId(workspace.sharing.linkId)}
                    variant="outline"
                    className="border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 mt-2"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    send link via email
                  </Button>
                </div>

                {/* Expiration Notice */}
                <Alert className="bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800">
                  <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  <AlertDescription className="text-sm text-orange-800 dark:text-orange-300">
                    <strong>Note:</strong> This sharing link expires in 10 minutes for security purposes.
                  </AlertDescription>
                </Alert>

                {/* Tip Box */}
                <Alert className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
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
            <Button onClick={() => setIsShareDialogOpen(false)} className="bg-blue-600 hover:bg-blue-700">
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pending Requests Dialog */}
      <Dialog open={isPendingRequestsOpen} onOpenChange={setIsPendingRequestsOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-blue-600" />
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
                  <h3 className="font-medium text-gray-900 mb-2">No Pending Requests</h3>
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
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <Avatar className="h-10 w-10 border-2 border-gray-200">
                            <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold">
                              {request.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-gray-900">{request.name}</h4>
                              <Badge variant="outline" className="text-xs border-orange-300 text-orange-700 bg-orange-50">
                                Pending
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{request.email}</p>
                            
                            {request.message && (
                              <div className="mt-2 p-3 bg-gray-50 rounded-md border border-gray-200">
                                <p className="text-xs font-medium text-gray-700 mb-1">Message:</p>
                                <p className="text-sm text-gray-600">{request.message}</p>
                              </div>
                            )}
                            
                            <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
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
                        
                        <div className="flex items-center gap-2 ml-4">
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
            <Button onClick={() => setIsPendingRequestsOpen(false)} className="bg-blue-600 hover:bg-blue-700">
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