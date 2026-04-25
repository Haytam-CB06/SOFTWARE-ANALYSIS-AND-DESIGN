import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
import ConfirmDeleteDialog from './ConfirmDeleteDialog';

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
    canEdit: string[];
    canView: string[];
    isPublic: boolean;
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
  const { t, i18n } = useTranslation();

  const [sharedTimetables, setSharedTimetables] = useState<SharedTimetable[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<SharedTimetable | null>(null);
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
    const saved = localStorage.getItem(`shared-timetables-${workspace.id}`);
    const workspaceTimetables = saved ? JSON.parse(saved) : [];
    
    const userEmail = localStorage.getItem('currentUserEmail');
    const userTimetablesKey = userEmail ? `timetables_${userEmail}` : 'timetables';
    const personalTimetables = JSON.parse(localStorage.getItem(userTimetablesKey) || '[]');
    
    const convertedPersonalTimetables = personalTimetables.map((pt: any) => ({
      id: pt.id,
      name: pt.name,
      description: t('sharedTimetable.personal.description'),
      ownerId: currentUser.id,
      ownerName: currentUser.name,
      sessions: pt.calendarSessions || [],
      sharedAt: pt.createdAt || new Date().toISOString(),
      lastModified: pt.createdAt || new Date().toISOString(),
      lastModifiedBy: currentUser.name,
      permissions: {
        canEdit: [currentUser.id],
        canView: [],
        isPublic: false
      },
      version: 1,
      history: [{
        timestamp: pt.createdAt || new Date().toISOString(),
        userId: currentUser.id,
        userName: currentUser.name,
        action: t('sharedTimetable.history.createdPersonal')
      }]
    }));
    
    const allTimetables = [...workspaceTimetables, ...convertedPersonalTimetables];
    setSharedTimetables(allTimetables);
  };

  const saveToStorage = (timetables: SharedTimetable[]) => {
    setSharedTimetables(timetables);
    localStorage.setItem(`shared-timetables-${workspace.id}`, JSON.stringify(timetables));
  };

  const handleCreateTimetable = () => {
    if (!newTimetable.name.trim()) {
      toast.error(t('sharedTimetable.errors.enterName'));
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
        action: t('sharedTimetable.history.created')
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
    toast.success(t('sharedTimetable.success.created'));
  };

  const handleImportFromPersonal = () => {
    const userEmail = localStorage.getItem('currentUserEmail');
    const userTimetablesKey = userEmail ? `timetables_${userEmail}` : 'timetables';
    const personalTimetables = JSON.parse(localStorage.getItem(userTimetablesKey) || '[]');

    if (personalTimetables.length === 0) {
      toast.error(t('sharedTimetable.errors.noPersonalToImport'));
      return;
    }

    const activeTimetable = personalTimetables.find((t: any) => t.isActive) || personalTimetables[0];
    
    if (!activeTimetable) {
      toast.error(t('sharedTimetable.errors.noActiveFound'));
      return;
    }

    const sessions: Session[] = activeTimetable.calendarSessions || [];

    const timetable: SharedTimetable = {
      id: `shared-timetable-${Date.now()}`,
      name: `${activeTimetable.name || t('sharedTimetable.personal.defaultName')} (${t('sharedTimetable.personal.sharedSuffix')})`,
      description: t('sharedTimetable.personal.importedDescription'),
      ownerId: currentUser.id,
      ownerName: currentUser.name,
      sessions: sessions,
      sharedAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      lastModifiedBy: currentUser.name,
      permissions: {
        canEdit: workspace.members.map((m: Member) => m.id),
        canView: [],
        isPublic: true
      },
      version: 1,
      history: [{
        timestamp: new Date().toISOString(),
        userId: currentUser.id,
        userName: currentUser.name,
        action: t('sharedTimetable.history.importedFromPersonal')
      }]
    };

    saveToStorage([...sharedTimetables, timetable]);
    setIsImportDialogOpen(false);
    toast.success(t('sharedTimetable.success.importedWithCount', { count: sessions.length }));
  };

  const handleDeleteTimetable = (timetableId: string) => {
    const timetable = sharedTimetables.find(t => t.id === timetableId);
    if (!timetable) return;

    if (timetable.ownerId !== currentUser.id && currentUser.role !== 'admin') {
      toast.error(t('sharedTimetable.errors.deletePermission'));
      return;
    }

    setDeleteTarget(timetable);
  };

  const confirmDeleteTimetable = () => {
    if (!deleteTarget) return;
    saveToStorage(sharedTimetables.filter(t => t.id !== deleteTarget.id));
    toast.success(t('sharedTimetable.success.deleted'));
    setDeleteTarget(null);
  };

  const handleUpdatePermissions = (timetableId: string) => {
    const timetable = sharedTimetables.find(t => t.id === timetableId);
    if (!timetable) return;

    if (timetable.ownerId !== currentUser.id && currentUser.role !== 'admin') {
      toast.error(t('sharedTimetable.errors.permissionsPermission'));
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
              action: t('sharedTimetable.history.updatedPermissions')
            }
          ]
        };
      }
      return t;
    });

    saveToStorage(updatedTimetables);
    setIsPermissionsDialogOpen(false);
    toast.success(t('sharedTimetable.success.permissionsUpdated'));
  };

  const handleCopyToPersonal = (timetableId: string) => {
    const timetable = sharedTimetables.find(t => t.id === timetableId);
    if (!timetable) return;

    const userEmail = localStorage.getItem('currentUserEmail');
    const userTimetablesKey = userEmail ? `timetables_${userEmail}` : 'timetables';
    const personalTimetables = JSON.parse(localStorage.getItem(userTimetablesKey) || '[]');

    const newPersonalTimetable = {
      id: `timetable-${Date.now()}`,
      name: `${timetable.name} (${t('sharedTimetable.personal.copySuffix')})`,
      createdAt: new Date().toISOString(),
      isActive: false,
      schedule: {},
      calendarSessions: timetable.sessions
    };

    personalTimetables.push(newPersonalTimetable);
    localStorage.setItem(userTimetablesKey, JSON.stringify(personalTimetables));

    toast.success(t('sharedTimetable.success.copiedToPersonal'));
  };

  const isAdmin = currentUser.role === 'admin';
  const canEdit = (_timetable: SharedTimetable) => isAdmin;
  const canView = (_timetable: SharedTimetable) => true;

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
    return new Date(dateString).toLocaleDateString(i18n.language || 'en', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPermissionBadge = (timetable: SharedTimetable) => {
    if (timetable.ownerId === currentUser.id) {
      return <Badge className="bg-blue-100 text-blue-700 border-blue-300">{t('sharedTimetable.badges.owner')}</Badge>;
    } else if (canEdit(timetable)) {
      return <Badge className="bg-green-100 text-green-700 border-green-300">{t('sharedTimetable.badges.canEdit')}</Badge>;
    } else {
      return <Badge className="bg-gray-100 text-gray-700 border-gray-300">{t('sharedTimetable.badges.viewOnly')}</Badge>;
    }
  };

  const stats = {
    total: sharedTimetables.filter(t => canView(t)).length,
    owned: sharedTimetables.filter(t => t.ownerId === currentUser.id).length,
    editable: sharedTimetables.filter(t => canEdit(t) && t.ownerId !== currentUser.id).length,
    viewOnly: sharedTimetables.filter(t => canView(t) && !canEdit(t)).length
  };

  if (isCollaborativeEditorOpen && selectedTimetable) {
    return (
      <CollaborativeTimetable
        workspace={workspace}
        currentUser={currentUser}
        timetableId={selectedTimetable.id}
        onClose={() => setIsCollaborativeEditorOpen(false)}
      />
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl text-gray-900 mb-1">{t('sharedTimetable.title')}</h2>
            <p className="text-gray-600 text-sm">{t('sharedTimetable.subtitle')}</p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => setIsImportDialogOpen(true)} 
              variant="outline"
              className="border-blue-300"
            >
              <Upload className="h-4 w-4 mr-2" />
              {t('sharedTimetable.actions.importMyTimetable')}
            </Button>
            {isAdmin && (
              <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-blue-700 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                {t('sharedTimetable.actions.createShared')}
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-xs text-gray-600 mt-1">{t('sharedTimetable.stats.total')}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-700">{stats.owned}</p>
                <p className="text-xs text-gray-600 mt-1">{t('sharedTimetable.stats.owned')}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{stats.editable}</p>
                <p className="text-xs text-gray-600 mt-1">{t('sharedTimetable.stats.editable')}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-600">{stats.viewOnly}</p>
                <p className="text-xs text-gray-600 mt-1">{t('sharedTimetable.stats.viewOnly')}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={t('sharedTimetable.searchPlaceholder')}
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
              <SelectItem value="all">{t('sharedTimetable.filters.all')}</SelectItem>
              <SelectItem value="owner">{t('sharedTimetable.filters.owner')}</SelectItem>
              <SelectItem value="editor">{t('sharedTimetable.filters.editor')}</SelectItem>
              <SelectItem value="viewer">{t('sharedTimetable.filters.viewer')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {filteredTimetables.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTimetables.map((timetable) => (
              <Card key={timetable.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="h-5 w-5 text-blue-700" />
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
                          {t('sharedTimetable.actions.copyToPersonal')}
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
                              {t('sharedTimetable.actions.managePermissions')}
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
                              {t('common.delete')}
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <CardDescription className="line-clamp-2 min-h-[40px]">
                    {timetable.description || t('sharedTimetable.noDescription')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="bg-blue-700-to-br from-blue-500 to-indigo-500 text-white text-xs">
                        {getInitials(timetable.ownerName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-gray-600">{t('sharedTimetable.byOwner', { name: timetable.ownerName })}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>{t('sharedTimetable.sessionsCount', { count: timetable.sessions.length })}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    {timetable.permissions.isPublic ? (
                      <>
                        <Unlock className="h-4 w-4 text-green-600" />
                        <span className="text-green-600">{t('sharedTimetable.visibility.publicDescription')}</span>
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4 text-orange-600" />
                        <span className="text-orange-600">{t('sharedTimetable.visibility.privateDescription')}</span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <UserPlus className="h-4 w-4" />
                    <span>{t('sharedTimetable.editorsCount', { count: timetable.permissions.canEdit.length })}</span>
                  </div>

                  <div className="pt-2 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      {t('sharedTimetable.modifiedAt', { date: formatDate(timetable.lastModified) })}
                    </p>
                    <p className="text-xs text-gray-500">
                      {t('sharedTimetable.modifiedBy', { name: timetable.lastModifiedBy })}
                    </p>
                  </div>

                  <Button 
                    variant="outline" 
                    className="w-full border-blue-300 hover:bg-blue-50"
                    onClick={() => {
                      setSelectedTimetable(timetable);
                      setIsCollaborativeEditorOpen(true);
                      toast.info(t('sharedTimetable.info.viewingWithCount', { name: timetable.name, count: timetable.sessions.length }));
                    }}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    {t('sharedTimetable.actions.viewSessions')}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('sharedTimetable.createDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('sharedTimetable.createDialog.description')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('sharedTimetable.fields.name')} *</Label>
              <Input
                placeholder={t('sharedTimetable.placeholders.name')}
                value={newTimetable.name}
                onChange={(e) => setNewTimetable({ ...newTimetable, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('sharedTimetable.fields.description')}</Label>
              <Input
                placeholder={t('sharedTimetable.placeholders.description')}
                value={newTimetable.description}
                onChange={(e) => setNewTimetable({ ...newTimetable, description: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{t('sharedTimetable.fields.visibility')}</Label>
                <Badge variant={newTimetable.isPublic ? 'default' : 'secondary'}>
                  {newTimetable.isPublic ? t('sharedTimetable.visibility.public') : t('sharedTimetable.visibility.private')}
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
                        <p className="font-medium">{t('sharedTimetable.visibility.public')}</p>
                        <p className="text-xs text-gray-500">{t('sharedTimetable.visibility.publicHelp')}</p>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="private">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-orange-600" />
                      <div>
                        <p className="font-medium">{t('sharedTimetable.visibility.private')}</p>
                        <p className="text-xs text-gray-500">{t('sharedTimetable.visibility.privateHelp')}</p>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('sharedTimetable.fields.editors')}</Label>
              <div className="max-h-40 space-y-2 overflow-y-auto rounded-2xl border p-3">
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
                        <AvatarFallback className="bg-blue-700-to-br from-blue-500 to-indigo-500 text-white text-xs">
                          {getInitials(member.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{member.name}</span>
                      <Badge variant="outline" className="ml-auto text-xs">
                        {member.role === 'admin' ? t('sharedTimetable.roles.admin') : t('sharedTimetable.roles.member')}
                      </Badge>
                    </label>
                  ))}
              </div>
              <p className="text-xs text-gray-500">
                {t('sharedTimetable.selectedEditorsInfo', { count: newTimetable.selectedEditors.length })}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleCreateTimetable} className="bg-blue-700 hover:bg-blue-700">
              {t('sharedTimetable.actions.createTimetable')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('sharedTimetable.importDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('sharedTimetable.importDialog.description')}
            </DialogDescription>
          </DialogHeader>

          <Alert>
            <Upload className="h-4 w-4" />
            <AlertDescription>
              {t('sharedTimetable.importDialog.alert')}
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleImportFromPersonal} className="bg-blue-700 hover:bg-blue-700">
              <Upload className="h-4 w-4 mr-2" />
              {t('sharedTimetable.actions.importTimetable')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPermissionsDialogOpen} onOpenChange={setIsPermissionsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('sharedTimetable.permissionsDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('sharedTimetable.permissionsDialog.description')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('sharedTimetable.fields.visibility')}</Label>
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
                      {t('sharedTimetable.visibility.publicDialog')}
                    </div>
                  </SelectItem>
                  <SelectItem value="private">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-orange-600" />
                      {t('sharedTimetable.visibility.privateDialog')}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('sharedTimetable.fields.editorsSimple')}</Label>
              <div className="max-h-60 space-y-2 overflow-y-auto rounded-2xl border p-3">
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
                        <AvatarFallback className="bg-blue-700-to-br from-blue-500 to-indigo-500 text-white text-xs">
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
              {t('common.cancel')}
            </Button>
            <Button 
              onClick={() => selectedTimetable && handleUpdatePermissions(selectedTimetable.id)} 
              className="bg-blue-700 hover:bg-blue-700"
            >
              {t('sharedTimetable.actions.savePermissions')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isViewTimetableOpen} onOpenChange={setIsViewTimetableOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('sharedTimetable.viewDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('sharedTimetable.viewDialog.description')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {selectedTimetable && (
              <div className="space-y-2">
                <Label>{t('sharedTimetable.fields.name')}</Label>
                <Input
                  placeholder={t('sharedTimetable.placeholders.name')}
                  value={selectedTimetable.name}
                  readOnly
                />
              </div>
            )}

            {selectedTimetable && (
              <div className="space-y-2">
                <Label>{t('sharedTimetable.fields.description')}</Label>
                <Input
                  placeholder={t('sharedTimetable.placeholders.description')}
                  value={selectedTimetable.description}
                  readOnly
                />
              </div>
            )}

            {selectedTimetable && (
              <div className="space-y-2">
                <Label>{t('sharedTimetable.fields.sessions')}</Label>
                <div className="max-h-60 space-y-2 overflow-y-auto rounded-2xl border p-3">
                  {selectedTimetable.sessions.map((session: Session) => (
                    <div key={session.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                      <Calendar className="h-4 w-4 text-blue-700" />
                      <span className="text-sm">{session.title}</span>
                      <span className="text-sm text-gray-500">
                        ({session.day}, {session.startTime} - {session.endTime})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewTimetableOpen(false)}>
              {t('common.close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={t('sharedTimetable.confirmDelete.title')}
        description={t('sharedTimetable.confirmDelete.description', { name: deleteTarget?.name || t('sharedTimetable.confirmDelete.fallbackName') })}
        confirmLabel={t('common.delete')}
        onConfirm={confirmDeleteTimetable}
      />
    </div>
  );
}
