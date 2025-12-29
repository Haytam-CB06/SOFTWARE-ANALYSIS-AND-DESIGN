import React, { useState, useEffect } from 'react';
import HelpSection from './HelpSection';
import { useNotifications } from '../src/hooks/useNotifications';
import { Bell, Menu, X, Search, Calendar, ChevronDown, User, Settings2, LogOut, LayoutDashboard, BookMarked, Users, PanelLeft, PanelLeftClose, BookOpen, FileText, Sun, Moon, Timer, Sparkles } from 'lucide-react';
import logoImage from 'figma:asset/0550e77f773f70cb0e6201f9400b3cccad8c1d9b.png';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Input } from './ui/input';
import type { Timetable, Session } from '../src/types';

interface EnhancedDashboardLayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string, settingsTab?: 'profile' | 'webapp') => void;
  onLogout: () => void;
  userName: string;
  userEmail: string;
  onShowPomodoroWidget?: () => void;
}

export default function EnhancedDashboardLayout({ 
  children, 
  currentPage, 
  onNavigate, 
  onLogout,
  userName,
  userEmail,
  onShowPomodoroWidget
}: EnhancedDashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile sidebar toggle
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // Desktop sidebar collapse
  const [searchQuery, setSearchQuery] = useState('');
  const [profilePicture, setProfilePicture] = useState<string>('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchResults, setSearchResults] = useState<{
    timetables: Timetable[];
    subjects: { name: string; timetableId: string; timetableName: string }[];
  }>({ timetables: [], subjects: [] });
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved === 'true';
  });
  
  // Use the notifications hook
  const { notifications, markAllAsRead, clearNotification, unreadCount } = useNotifications();

  // Apply dark mode class to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode.toString());
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Load sidebar state and profile picture
  useEffect(() => {
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState !== null) {
      setSidebarCollapsed(JSON.parse(savedState));
    }

    const loadProfile = async () => {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
        const userId = localStorage.getItem('currentUserId');

        // Prefer backend-stored profile pictures.
        if (API_BASE_URL && userId) {
          const res = await fetch(`${API_BASE_URL}/user/${userId}`, {
            headers: { 'X-User-Id': userId },
          });
          if (res.ok) {
            const data = await res.json();
            if (data.profile_picture_url) {
              setProfilePicture(`${API_BASE_URL}${data.profile_picture_url}?t=${Date.now()}`);
              return;
            }
          }
        }

        // Fallback: local reference (URL) if present
        const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
        const currentUserEmail = localStorage.getItem('currentUserEmail');
        const user = users.find((u: any) => u.email === currentUserEmail);
        setProfilePicture(user?.profilePicture || '');
      } catch (e) {
        console.error(e);
      }
    };

    loadProfile();
  }, []);

  // Refresh profile picture when the user changes or the picture is updated
  useEffect(() => {
    const refresh = () => {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
      const userId = localStorage.getItem('currentUserId');
      if (!API_BASE_URL || !userId) {
        setProfilePicture('');
        return;
      }
      fetch(`${API_BASE_URL}/user/${userId}`, { headers: { 'X-User-Id': userId } })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.profile_picture_url) {
            setProfilePicture(`${API_BASE_URL}${data.profile_picture_url}?t=${Date.now()}`);
          } else {
            setProfilePicture('');
          }
        })
        .catch(() => setProfilePicture(''));
    };

    window.addEventListener('userChanged', refresh);
    window.addEventListener('profilePictureUpdated', refresh as any);
    return () => {
      window.removeEventListener('userChanged', refresh);
      window.removeEventListener('profilePictureUpdated', refresh as any);
    };
  }, []);

  // Search functionality
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setShowSearchResults(false);
      setSearchResults({ timetables: [], subjects: [] });
      return;
    }

    // Get user's timetables from localStorage
    const currentUserEmail = localStorage.getItem('currentUserEmail');
    if (!currentUserEmail) return;

    const storageKey = `timetables_${currentUserEmail}`;
    const savedTimetables = localStorage.getItem(storageKey);
    
    if (!savedTimetables) {
      setShowSearchResults(false);
      return;
    }

    try {
      const timetables: Timetable[] = JSON.parse(savedTimetables);
      const query = searchQuery.toLowerCase();

      // Search timetables by name
      const matchingTimetables = timetables.filter(tt => 
        tt.name.toLowerCase().includes(query)
      );

      // Search subjects within timetables
      const matchingSubjects: { name: string; timetableId: string; timetableName: string }[] = [];
      const subjectSet = new Set<string>();

      timetables.forEach(tt => {
        // Check calendar sessions
        if (tt.calendarSessions) {
          tt.calendarSessions.forEach(session => {
            const subjectKey = `${session.subject}-${tt.id}`;
            if (session.subject.toLowerCase().includes(query) && !subjectSet.has(subjectKey)) {
              subjectSet.add(subjectKey);
              matchingSubjects.push({
                name: session.subject,
                timetableId: tt.id,
                timetableName: tt.name
              });
            }
          });
        }

        // Check schedule sessions
        tt.schedule?.forEach(day => {
          day.sessions?.forEach(session => {
            const subjectKey = `${session.subject}-${tt.id}`;
            if (session.subject.toLowerCase().includes(query) && !subjectSet.has(subjectKey)) {
              subjectSet.add(subjectKey);
              matchingSubjects.push({
                name: session.subject,
                timetableId: tt.id,
                timetableName: tt.name
              });
            }
          });
        });
      });

      setSearchResults({ timetables: matchingTimetables, subjects: matchingSubjects });
      setShowSearchResults(matchingTimetables.length > 0 || matchingSubjects.length > 0);
    } catch (error) {
      console.error('Error searching:', error);
    }
  }, [searchQuery]);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.search-container')) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Save sidebar state to localStorage
  const toggleSidebarCollapse = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', JSON.stringify(newState));
  };

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'my-timetable', icon: Calendar, label: 'My Timetable' },
    { id: 'auto-generate', icon: Sparkles, label: 'Auto Generate' },
    { id: 'assessments-deadlines', icon: FileText, label: 'Assessments & Deadlines' },
    { id: 'workspace', icon: Users, label: 'Workspace' },
    { id: 'goals-achievements', icon: BookOpen, label: 'Goals & Achievements' },
    { id: 'create-timetable', icon: BookMarked, label: 'Create Timetable' },
    { id: 'view-timetables', icon: Calendar, label: 'Saved Timetables' },
    { id: 'settings', icon: Settings2, label: 'Settings' },
  ];

  const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <nav className="bg-background border-b border-border sticky top-0 z-50 shadow-sm">
        <div className="border-b border-border">
          <div className="flex items-center justify-between h-16 px-4 lg:px-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
              
              <div 
                className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity group"
                onClick={() => onNavigate('dashboard')}
              >
                <div className="relative">
                  <img 
                    src={logoImage} 
                    alt="PLAN Logo" 
                    className="w-10 h-10 rounded-lg shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-105" 
                  />
                </div>
                <div className="hidden sm:flex flex-col">
                  <span className="text-blue-600 dark:text-blue-400 font-bold text-lg tracking-tight transition-all duration-300 group-hover:text-blue-700 dark:group-hover:text-blue-300">
                    PLAN
                  </span>
                  <span className="text-muted-foreground text-xs tracking-wide uppercase transition-all duration-300 group-hover:text-foreground">
                    Corporate Academic Service
                  </span>
                </div>
              </div>
            </div>

            {/* Search Bar - Centered */}
            <div className="hidden md:flex items-center justify-center flex-1 max-w-md mx-auto">
              <div className="relative w-full search-container">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                <Input
                  type="text"
                  placeholder="Search timetables, subjects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => {
                    if (searchQuery.trim() && (searchResults.timetables.length > 0 || searchResults.subjects.length > 0)) {
                      setShowSearchResults(true);
                    }
                  }}
                  className="pl-10 bg-accent/50 border-border focus:bg-accent"
                />
                
                {/* Search Results Dropdown */}
                {showSearchResults && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
                    {/* Timetables Section */}
                    {searchResults.timetables.length > 0 && (
                      <div className="p-2">
                        <div className="px-3 py-2 text-xs text-muted-foreground">
                          Timetables
                        </div>
                        {searchResults.timetables.map(timetable => (
                          <button
                            key={timetable.id}
                            onClick={() => {
                              onNavigate('view-timetables');
                              setSearchQuery('');
                              setShowSearchResults(false);
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors duration-200"
                          >
                            <Calendar className="h-4 w-4 text-blue-600" />
                            <div className="flex-1 text-left">
                              <p className="text-sm">{timetable.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(timetable.weekStartDate).toLocaleDateString()}
                                {timetable.isActive && (
                                  <span className="ml-2 text-green-600 dark:text-green-400">• Active</span>
                                )}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Subjects Section */}
                    {searchResults.subjects.length > 0 && (
                      <div className="p-2 border-t border-border">
                        <div className="px-3 py-2 text-xs text-muted-foreground">
                          Subjects
                        </div>
                        {searchResults.subjects.map((subject, index) => (
                          <button
                            key={`${subject.name}-${subject.timetableId}-${index}`}
                            onClick={() => {
                              onNavigate('view-timetables');
                              setSearchQuery('');
                              setShowSearchResults(false);
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors duration-200"
                          >
                            <BookOpen className="h-4 w-4 text-blue-600" />
                            <div className="flex-1 text-left">
                              <p className="text-sm">{subject.name}</p>
                              <p className="text-xs text-muted-foreground">
                                in {subject.timetableName}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* No Results */}
                    {searchResults.timetables.length === 0 && searchResults.subjects.length === 0 && searchQuery.trim() && (
                      <div className="p-6 text-center text-muted-foreground">
                        <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No results found for &quot;{searchQuery}&quot;</p>
                        <p className="text-xs mt-1">Try searching for a different timetable or subject</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Section - Notifications & Profile */}
            <div className="flex items-center gap-2">
              {/* Help Button */}
              <div className={`${sidebarOpen ? 'hidden' : ''}`}>
                <HelpSection />
              </div>
              
              {/* Dark Mode Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleDarkMode}
                className={`hover:bg-accent ${sidebarOpen ? 'hidden' : ''}`}
                title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {darkMode ? (
                  <Sun className="h-5 w-5 text-yellow-500" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </Button>
              
              {/* Pomodoro Button */}
              {onShowPomodoroWidget && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onShowPomodoroWidget}
                  className={`hover:bg-orange-50 dark:hover:bg-orange-950/30 hover:border-orange-500 ${sidebarOpen ? 'hidden' : 'flex items-center gap-2'}`}
                  title="Open Pomodoro Timer"
                >
                  <Timer className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  <span className="hidden sm:inline">Pomodoro</span>
                </Button>
              )}
              
              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className={`relative ${sidebarOpen ? 'hidden lg:flex' : ''}`}>
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white border-2 border-white text-xs">
                        {unreadCount}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel className="flex items-center justify-between">
                    <span>Notifications</span>
                    {unreadCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={markAllAsRead}
                        className="h-auto p-1 text-xs text-blue-600 hover:text-blue-700"
                      >
                        Mark all as read
                      </Button>
                    )}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-sm text-gray-500">
                      No notifications
                    </div>
                  ) : (
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.map((notification) => (
                        <DropdownMenuItem
                          key={notification.id}
                          className="flex flex-col items-start p-3 cursor-pointer"
                          onSelect={(e) => e.preventDefault()}
                        >
                          <div className="flex items-start justify-between w-full gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="text-sm">{notification.title}</p>
                                {!notification.read && (
                                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 mt-1">{notification.message}</p>
                              <p className="text-xs text-gray-400 mt-1">{notification.time}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => clearNotification(notification.id)}
                              className="h-6 w-6 p-0 hover:bg-red-50 hover:text-red-600"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className={`flex items-center gap-2 pl-2 ${sidebarOpen ? 'hidden lg:flex' : ''}`}>
                    <Avatar className="h-8 w-8">
                      {profilePicture && (
                        <AvatarImage 
                          src={profilePicture} 
                          alt={userName}
                          className="object-cover"
                        />
                      )}
                      <AvatarFallback className="bg-blue-600 text-white">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden sm:block text-left">
                      <p className="text-sm">{userName}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Student</p>
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div>
                      <p className="text-sm">{userName}</p>
                      <p className="text-xs text-gray-500">{userEmail}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onNavigate('settings', 'profile')}>
                    <User className="h-4 w-4 mr-2" />
                    Profile Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onNavigate('settings')}>
                    <Settings2 className="h-4 w-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onLogout} className="text-red-600">
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        <aside 
          className={`
            fixed lg:sticky top-16 left-0 h-[calc(100vh-4rem)] 
            bg-card border-r border-border 
            transform transition-all duration-300 ease-in-out z-40
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            ${sidebarOpen ? 'w-64' : 'w-64'}
            ${sidebarCollapsed ? 'lg:w-16' : 'lg:w-64'}
          `}
        >
          {/* Collapse Toggle Button - Desktop only */}
          <div className="hidden lg:block absolute -right-3 top-4 z-50">
            <Button
              onClick={toggleSidebarCollapse}
              variant="outline"
              size="sm"
              className="h-6 w-6 p-0 rounded-md bg-card border-2 border-border shadow-md hover:bg-accent hover:shadow-lg transition-all duration-200"
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {sidebarCollapsed ? (
                <PanelLeft className="h-3.5 w-3.5" />
              ) : (
                <PanelLeftClose className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>

          <nav className="p-4 space-y-1 h-full overflow-y-auto pb-24">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg
                    transition-all duration-200 group relative
                    ${isActive 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'text-foreground hover:bg-accent'
                    }
                    ${sidebarCollapsed ? 'justify-center' : ''}
                  `}
                  title={sidebarCollapsed ? item.label : ''}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span className={`${sidebarCollapsed ? 'hidden' : 'block'} whitespace-nowrap`}>
                    {item.label}
                  </span>
                  
                  {/* Tooltip for collapsed state */}
                  {sidebarCollapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-50">
                      {item.label}
                    </div>
                  )}
                </button>
              );
            })}
            
            {/* Logout Button in Sidebar */}
            <div className="pt-4 mt-4 border-t border-border">
              <button
                onClick={() => {
                  onLogout();
                  setSidebarOpen(false);
                }}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-lg 
                  text-red-600 dark:text-red-400 
                  hover:bg-red-50 dark:hover:bg-red-950/30 
                  transition-all duration-200 group relative
                  ${sidebarCollapsed ? 'justify-center' : ''}
                `}
                title={sidebarCollapsed ? 'Logout' : ''}
              >
                <LogOut className="h-5 w-5 flex-shrink-0" />
                <span className={`${sidebarCollapsed ? 'hidden' : 'block'}`}>Logout</span>
                
                {/* Tooltip for collapsed state */}
                {sidebarCollapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-50">
                    Logout
                  </div>
                )}
              </button>
            </div>
          </nav>

          {/* Sidebar Footer */}
          {!sidebarCollapsed && (
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-blue-50 dark:bg-blue-950/30">
              <div className="text-xs text-muted-foreground text-center">
                <p>U PLAN v1.0</p>
                <p className="text-muted-foreground/70 mt-1">Organize your learning</p>
              </div>
            </div>
          )}
        </aside>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div 
            className="fixed top-16 right-0 bottom-0 left-1/2 bg-transparent z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className={`flex-1 overflow-auto ${sidebarCollapsed ? 'lg:ml-0' : 'lg:ml-0'}`}>
          {children}
        </main>
      </div>
    </div>
  );
}