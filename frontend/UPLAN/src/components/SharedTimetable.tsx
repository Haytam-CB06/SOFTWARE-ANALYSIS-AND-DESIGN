import { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Users, 
  Share2, 
  Eye, 
  EyeOff,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  Copy,
  UserPlus,
  Shield,
  User,
  Lock,
  Unlock,
  Activity,
  TrendingUp,
  BarChart3,
  Edit3
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from './ui/dropdown-menu';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from 'sonner';
import CollaborativeTimetable from './CollaborativeTimetable';

interface Member {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'member';
  avatar?: string;
}

interface Session {
  id: string;
  title: string;
  subject: string;
  day: string;
  startTime: string;
  endTime: string;
  color?: string;
  type?: string;
  location?: string;
}

interface SharedTimetable {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  ownerName: string;
  sessions: Session[];
  sharedAt: string;
  lastModified: string;
  lastModifiedBy: string;
  permissions: {
    canEdit: string[]; // Array of member IDs who can edit
    canView: string[]; // Array of member IDs who can view
    isPublic: boolean; // If true, all workspace members can view
  };
  version: number;
  history: {
    timestamp: string;
    userId: string;
    userName: string;
    action: string;
  }[];
}

interface SharedTimetableProps {
  workspace: any;
  currentUser: Member;
}

export default function SharedTimetable({ workspace, currentUser }: SharedTimetableProps) {
  const [sharedTimetables, setSharedTimetables] = useState<SharedTimetable[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTimetable, setSelectedTimetable] = useState<SharedTimetable | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isViewTimetableOpen, setIsViewTimetableOpen] = useState(false);
  const [isCollaborativeEditorOpen, setIsCollaborativeEditorOpen] = useState(false);
  const [filterPermission, setFilterPermission] = useState<'all' | 'owner' | 'editor' | 'viewer'>('all');

  const [newTimetable, setNewTimetable] = useState({
    name: '',
    description: '',
    isPublic: true,
    selectedEditors: [] as string[],
    selectedViewers: [] as string[]
  });

  useEffect(() => {
    loadSharedTimetables();
  }, [workspace.id]);

  const loadSharedTimetables = () => {
    // Load shared timetables from workspace storage
    const saved = localStorage.getItem(`shared-timetables-${workspace.id}`);
    const workspaceTimetables = saved ? JSON.parse(saved) : [];
    
    // Load personal timetables from user's personal storage
    const userEmail = localStorage.getItem('currentUserEmail');
    const userTimetablesKey = userEmail ? `timetables_${userEmail}` : 'timetables';
    const personalTimetables = JSON.parse(localStorage.getItem(userTimetablesKey) || '[]');
    
    // Convert personal timetables to SharedTimetable format
    const convertedPersonalTimetables = personalTimetables.map((pt: any) => ({
      id: pt.id,
      name: pt.name,
      description: 'Personal Timetable',
      ownerId: currentUser.id,
      ownerName: currentUser.name,
      sessions: pt.calendarSessions || [],
      sharedAt: pt.createdAt || new Date().toISOString(),
      lastModified: pt.createdAt || new Date().toISOString(),
      lastModifiedBy: currentUser.name,
      permissions: {
        canEdit: [currentUser.id],
        canView: [],
        isPublic: false // Personal timetables are private
      },
      version: 1,
      history: [{
        timestamp: pt.createdAt || new Date().toISOString(),
        userId: currentUser.id,
        userName: currentUser.name,
        action: 'Created personal timetable'
      }]
    }));
    
    // Merge workspace and personal timetables
    const allTimetables = [...workspaceTimetables, ...convertedPersonalTimetables];
    setSharedTimetables(allTimetables);
  };

  const saveToStorage = (timetables: SharedTimetable[]) => {
    setSharedTimetables(timetables);
    localStorage.setItem(`shared-timetables-${workspace.id}`, JSON.stringify(timetables));
  };

  const handleCreateTimetable = () => {
    if (!newTimetable.name.trim()) {
      toast.error('Please enter a timetable name');
      return;
    }

    const timetable: SharedTimetable = {
      id: `shared-timetable-${Date.now()}`,
      name: newTimetable.name,
      description: newTimetable.description,
      ownerId: currentUser.id,
      ownerName: currentUser.name,
      sessions: [],
      sharedAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      lastModifiedBy: currentUser.name,
      permissions: {
        canEdit: [currentUser.id, ...newTimetable.selectedEditors],
        canView: newTimetable.isPublic ? [] : newTimetable.selectedViewers,
        isPublic: newTimetable.isPublic
      },
      version: 1,
      history: [{
        timestamp: new Date().toISOString(),
        userId: currentUser.id,
        userName: currentUser.name,
        action: 'Created timetable'
      }]
    };

    saveToStorage([...sharedTimetables, timetable]);
    setIsCreateDialogOpen(false);
    setNewTimetable({
      name: '',
      description: '',
      isPublic: true,
      selectedEditors: [],
      selectedViewers: []
    });
    toast.success('Shared timetable created successfully!');
  };

  const handleImportFromPersonal = () => {
    // Get user's personal timetables
    const userEmail = localStorage.getItem('currentUserEmail');
    const userTimetablesKey = userEmail ? `timetables_${userEmail}` : 'timetables';
    const personalTimetables = JSON.parse(localStorage.getItem(userTimetablesKey) || '[]');

    if (personalTimetables.length === 0) {
      toast.error('No personal timetables found to import');
      return;
    }

    // For demo, import the first/active timetable
    const activeTimetable = personalTimetables.find((t: any) => t.isActive) || personalTimetables[0];
    
    if (!activeTimetable) {
      toast.error('No active timetable found');
      return;
    }

    // Convert personal timetable to shared timetable
    const sessions: Session[] = activeTimetable.calendarSessions || [];

    const timetable: SharedTimetable = {
      id: `shared-timetable-${Date.now()}`,
      name: `${activeTimetable.name || 'My Timetable'} (Shared)`,
      description: 'Imported from personal timetable',
      ownerId: currentUser.id,
      ownerName: currentUser.name,
      sessions: sessions,
      sharedAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      lastModifiedBy: currentUser.name,
      permissions: {
        canEdit: workspace.members.map((m: Member) => m.id), // All members can edit
        canView: [],
        isPublic: true
      },
      version: 1,
      history: [{
        timestamp: new Date().toISOString(),
        userId: currentUser.id,
        userName: currentUser.name,
        action: 'Imported from personal timetable'
      }]
    };

    saveToStorage([...sharedTimetables, timetable]);
    setIsImportDialogOpen(false);
    toast.success(`Imported timetable with ${sessions.length} sessions!`);
  };

  const handleDeleteTimetable = (timetableId: string) => {
    const timetable = sharedTimetables.find(t => t.id === timetableId);
    if (!timetable) return;

    if (timetable.ownerId !== currentUser.id && currentUser.role !== 'admin') {
      toast.error('Only the owner or admin can delete this timetable');
      return;
    }

    if (confirm(`Are you sure you want to delete "${timetable.name}"?`)) {
      saveToStorage(sharedTimetables.filter(t => t.id !== timetableId));
      toast.success('Timetable deleted successfully');
    }
  };

  const handleUpdatePermissions = (timetableId: string) => {
    const timetable = sharedTimetables.find(t => t.id === timetableId);
    if (!timetable) return;

    if (timetable.ownerId !== currentUser.id && currentUser.role !== 'admin') {
      toast.error('Only the owner or admin can change permissions');
      return;
    }

    const updatedTimetables = sharedTimetables.map(t => {
      if (t.id === timetableId) {
        return {
          ...t,
          permissions: {
            canEdit: [t.ownerId, ...newTimetable.selectedEditors],
            canView: newTimetable.isPublic ? [] : newTimetable.selectedViewers,
            isPublic: newTimetable.isPublic
          },
          lastModified: new Date().toISOString(),
          lastModifiedBy: currentUser.name,
          history: [
            ...t.history,
            {
              timestamp: new Date().toISOString(),
              userId: currentUser.id,
              userName: currentUser.name,
              action: 'Updated permissions'
            }
          ]
        };
      }
      return t;
    });

    saveToStorage(updatedTimetables);
    setIsPermissionsDialogOpen(false);
    toast.success('Permissions updated successfully');
  };

  const handleCopyToPersonal = (timetableId: string) => {
    const timetable = sharedTimetables.find(t => t.id === timetableId);
    if (!timetable) return;

    // Get user's personal timetables
    const userEmail = localStorage.getItem('currentUserEmail');
    const userTimetablesKey = userEmail ? `timetables_${userEmail}` : 'timetables';
    const personalTimetables = JSON.parse(localStorage.getItem(userTimetablesKey) || '[]');

    // Create personal timetable from shared one
    const newPersonalTimetable = {
      id: `timetable-${Date.now()}`,
      name: `${timetable.name} (Copy)`,
      createdAt: new Date().toISOString(),
      isActive: false,
      schedule: {},
      calendarSessions: timetable.sessions
    };

    personalTimetables.push(newPersonalTimetable);
    localStorage.setItem(userTimetablesKey, JSON.stringify(personalTimetables));

    toast.success('Timetable copied to your personal timetables!');
  };

  const canEdit = (timetable: SharedTimetable) => {
    // Check if workspace allows all members to edit
    const allowAllEdit = workspace.settings?.allowAllMembersToEditTimetables || false;
    
    if (allowAllEdit) {
      return true; // All members can edit
    }
    
    // Default permissions: owner, explicit editors, or admins
    return timetable.ownerId === currentUser.id || 
           timetable.permissions.canEdit.includes(currentUser.id) ||
           currentUser.role === 'admin';
  };

  const canView = (timetable: SharedTimetable) => {
    return timetable.permissions.isPublic || 
           timetable.ownerId === currentUser.id ||
           timetable.permissions.canEdit.includes(currentUser.id) ||
           timetable.permissions.canView.includes(currentUser.id) ||
           currentUser.role === 'admin';
  };

  const filteredTimetables = sharedTimetables.filter(timetable => {
    const matchesSearch = timetable.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         timetable.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         timetable.ownerName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesPermission = 
      filterPermission === 'all' ||
      (filterPermission === 'owner' && timetable.ownerId === currentUser.id) ||
      (filterPermission === 'editor' && canEdit(timetable) && timetable.ownerId !== currentUser.id) ||
      (filterPermission === 'viewer' && canView(timetable) && !canEdit(timetable));

    return matchesSearch && matchesPermission && canView(timetable);
  });

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPermissionBadge = (timetable: SharedTimetable) => {
    if (timetable.ownerId === currentUser.id) {
      return <Badge className="bg-blue-100 text-blue-700 border-blue-300">Owner</Badge>;
    } else if (canEdit(timetable)) {
      return <Badge className="bg-green-100 text-green-700 border-green-300">Can Edit</Badge>;
    } else {
      return <Badge className="bg-gray-100 text-gray-700 border-gray-300">View Only</Badge>;
    }
  };

  const stats = {
    total: sharedTimetables.filter(t => canView(t)).length,
    owned: sharedTimetables.filter(t => t.ownerId === currentUser.id).length,
    editable: sharedTimetables.filter(t => canEdit(t) && t.ownerId !== currentUser.id).length,
    viewOnly: sharedTimetables.filter(t => canView(t) && !canEdit(t)).length
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl text-gray-900 mb-1">Shared Timetables</h2>
            <p className="text-gray-600 text-sm">Collaborate on timetables with your team</p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => setIsImportDialogOpen(true)} 
              variant="outline"
              className="border-blue-300"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import My Timetable
            </Button>
            <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Create Shared Timetable
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-xs text-gray-600 mt-1">Total Accessible</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{stats.owned}</p>
                <p className="text-xs text-gray-600 mt-1">Owned by You</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{stats.editable}</p>
                <p className="text-xs text-gray-600 mt-1">Can Edit</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-600">{stats.viewOnly}</p>
                <p className="text-xs text-gray-600 mt-1">View Only</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search timetables..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterPermission} onValueChange={(value: any) => setFilterPermission(value)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Timetables</SelectItem>
              <SelectItem value="owner">Owned by Me</SelectItem>
              <SelectItem value="editor">Can Edit</SelectItem>
              <SelectItem value="viewer">View Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Timetables Grid */}
      <div className="flex-1 overflow-auto p-6">
        {filteredTimetables.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Empty - no message shown */}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTimetables.map((timetable) => (
              <Card key={timetable.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Timetable title and icon */}
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="h-5 w-5 text-blue-600" />
                        <CardTitle className="text-lg">{timetable.name}</CardTitle>
                      </div>
                      {getPermissionBadge(timetable)}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleCopyToPersonal(timetable.id)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy to Personal
                        </DropdownMenuItem>
                        {canEdit(timetable) && (
                          <>
                            <DropdownMenuItem onClick={() => {
                              setSelectedTimetable(timetable);
                              setNewTimetable({
                                name: timetable.name,
                                description: timetable.description,
                                isPublic: timetable.permissions.isPublic,
                                selectedEditors: timetable.permissions.canEdit.filter(id => id !== timetable.ownerId),
                                selectedViewers: timetable.permissions.canView
                              });
                              setIsPermissionsDialogOpen(true);
                            }}>
                              <Shield className="h-4 w-4 mr-2" />
                              Manage Permissions
                            </DropdownMenuItem>
                          </>
                        )}
                        {(timetable.ownerId === currentUser.id || currentUser.role === 'admin') && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDeleteTimetable(timetable.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <CardDescription className="line-clamp-2 min-h-[40px]">
                    {timetable.description || 'No description'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Owner Info */}
                  <div className="flex items-center gap-2 text-sm">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white text-xs">
                        {getInitials(timetable.ownerName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-gray-600">by {timetable.ownerName}</span>
                  </div>

                  {/* Sessions Count */}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>{timetable.sessions.length} sessions</span>
                  </div>

                  {/* Permissions */}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    {timetable.permissions.isPublic ? (
                      <>
                        <Unlock className="h-4 w-4 text-green-600" />
                        <span className="text-green-600">Public - All members can view</span>
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4 text-orange-600" />
                        <span className="text-orange-600">Private - Limited access</span>
                      </>
                    )}
                  </div>

                  {/* Editors Count */}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <UserPlus className="h-4 w-4" />
                    <span>{timetable.permissions.canEdit.length} editors</span>
                  </div>

                  {/* Last Modified */}
                  <div className="pt-2 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      Modified {formatDate(timetable.lastModified)}
                    </p>
                    <p className="text-xs text-gray-500">
                      by {timetable.lastModifiedBy}
                    </p>
                  </div>

                  {/* View Sessions Button */}
                  <Button 
                    variant="outline" 
                    className="w-full border-blue-300 hover:bg-blue-50"
                    onClick={() => {
                      setSelectedTimetable(timetable);
                      setIsViewTimetableOpen(true);
                      // Could open a detailed view dialog here
                      toast.info(`Viewing ${timetable.name} - ${timetable.sessions.length} sessions`);
                    }}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Sessions
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Timetable Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Shared Timetable</DialogTitle>
            <DialogDescription>
              Create a new timetable that can be edited by team members
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Timetable Name *</Label>
              <Input
                placeholder="e.g., Spring 2025 Class Schedule"
                value={newTimetable.name}
                onChange={(e) => setNewTimetable({ ...newTimetable, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                placeholder="Brief description of this timetable"
                value={newTimetable.description}
                onChange={(e) => setNewTimetable({ ...newTimetable, description: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Visibility</Label>
                <Badge variant={newTimetable.isPublic ? 'default' : 'secondary'}>
                  {newTimetable.isPublic ? 'Public' : 'Private'}
                </Badge>
              </div>
              <Select 
                value={newTimetable.isPublic ? 'public' : 'private'}
                onValueChange={(value) => setNewTimetable({ ...newTimetable, isPublic: value === 'public' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">
                    <div className="flex items-center gap-2">
                      <Unlock className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="font-medium">Public</p>
                        <p className="text-xs text-gray-500">All workspace members can view</p>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="private">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-orange-600" />
                      <div>
                        <p className="font-medium">Private</p>
                        <p className="text-xs text-gray-500">Only selected members can view</p>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Who can edit? (Select members)</Label>
              <div className="border rounded-lg p-3 max-h-40 overflow-y-auto space-y-2">
                {workspace.members
                  .filter((m: Member) => m.id !== currentUser.id)
                  .map((member: Member) => (
                    <label key={member.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                      <input
                        type="checkbox"
                        checked={newTimetable.selectedEditors.includes(member.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewTimetable({
                              ...newTimetable,
                              selectedEditors: [...newTimetable.selectedEditors, member.id]
                            });
                          } else {
                            setNewTimetable({
                              ...newTimetable,
                              selectedEditors: newTimetable.selectedEditors.filter(id => id !== member.id)
                            });
                          }
                        }}
                        className="rounded"
                      />
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white text-xs">
                          {getInitials(member.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{member.name}</span>
                      <Badge variant="outline" className="ml-auto text-xs">
                        {member.role === 'admin' ? 'Admin' : 'Member'}
                      </Badge>
                    </label>
                  ))}
              </div>
              <p className="text-xs text-gray-500">
                Selected: {newTimetable.selectedEditors.length} member(s). You (owner) can always edit.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTimetable} className="bg-blue-600 hover:bg-blue-700">
              Create Timetable
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Personal Timetable</DialogTitle>
            <DialogDescription>
              Import your current active timetable as a shared timetable
            </DialogDescription>
          </DialogHeader>

          <Alert>
            <Upload className="h-4 w-4" />
            <AlertDescription>
              This will create a new shared timetable with all sessions from your active personal timetable. All workspace members will be able to edit it by default.
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleImportFromPersonal} className="bg-blue-600 hover:bg-blue-700">
              <Upload className="h-4 w-4 mr-2" />
              Import Timetable
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permissions Dialog */}
      <Dialog open={isPermissionsDialogOpen} onOpenChange={setIsPermissionsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage Permissions</DialogTitle>
            <DialogDescription>
              Control who can view and edit this timetable
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Visibility</Label>
              <Select 
                value={newTimetable.isPublic ? 'public' : 'private'}
                onValueChange={(value) => setNewTimetable({ ...newTimetable, isPublic: value === 'public' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">
                    <div className="flex items-center gap-2">
                      <Unlock className="h-4 w-4 text-green-600" />
                      Public - All members can view
                    </div>
                  </SelectItem>
                  <SelectItem value="private">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-orange-600" />
                      Private - Only selected members
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Editors</Label>
              <div className="border rounded-lg p-3 max-h-60 overflow-y-auto space-y-2">
                {workspace.members
                  .filter((m: Member) => m.id !== selectedTimetable?.ownerId)
                  .map((member: Member) => (
                    <label key={member.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                      <input
                        type="checkbox"
                        checked={newTimetable.selectedEditors.includes(member.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewTimetable({
                              ...newTimetable,
                              selectedEditors: [...newTimetable.selectedEditors, member.id]
                            });
                          } else {
                            setNewTimetable({
                              ...newTimetable,
                              selectedEditors: newTimetable.selectedEditors.filter(id => id !== member.id)
                            });
                          }
                        }}
                        className="rounded"
                      />
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white text-xs">
                          {getInitials(member.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{member.name}</span>
                    </label>
                  ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPermissionsDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => selectedTimetable && handleUpdatePermissions(selectedTimetable.id)} 
              className="bg-blue-600 hover:bg-blue-700"
            >
              Save Permissions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Timetable Dialog */}
      <Dialog open={isViewTimetableOpen} onOpenChange={setIsViewTimetableOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>View Timetable</DialogTitle>
            <DialogDescription>
              View the sessions in this timetable
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {selectedTimetable && (
              <div className="space-y-2">
                <Label>Timetable Name</Label>
                <Input
                  placeholder="e.g., Spring 2025 Class Schedule"
                  value={selectedTimetable.name}
                  readOnly
                />
              </div>
            )}

            {selectedTimetable && (
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  placeholder="Brief description of this timetable"
                  value={selectedTimetable.description}
                  readOnly
                />
              </div>
            )}

            {selectedTimetable && (
              <div className="space-y-2">
                <Label>Sessions</Label>
                <div className="border rounded-lg p-3 max-h-60 overflow-y-auto space-y-2">
                  {selectedTimetable.sessions.map((session: Session) => (
                    <div key={session.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">{session.title}</span>
                      <span className="text-sm text-gray-500">({session.day}, {session.startTime} - {session.endTime})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewTimetableOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}