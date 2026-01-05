import React, { useMemo, useState, useEffect, useCallback } from 'react';
import HelpSection from './HelpSection';
import { useNotifications } from '../src/hooks/useNotifications';
import { Bell, Menu, X, Search, Calendar, ChevronDown, User, Settings2, LogOut, LayoutDashboard, BookMarked, Users, PanelLeft, PanelLeftClose, BookOpen, FileText, Sun, Moon, Timer, Sparkles, Shield } from 'lucide-react';
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
import { apiJsonAuthed, API_BASE_URL } from '../lib/api';

interface EnhancedDashboardLayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string, settingsTab?: 'profile' | 'webapp') => void;
  onLogout: () => void;
  userName: string;
  userEmail: string;
  onShowPomodoroWidget?: () => void;
  isGlobalAdmin?: boolean;
}

export default function EnhancedDashboardLayout({ 
  children, 
  currentPage, 
  onNavigate, 
  onLogout,
  userName,
  userEmail,
  onShowPomodoroWidget,
  isGlobalAdmin
}: EnhancedDashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile sidebar toggle
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // Desktop sidebar collapse
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [highlightIndex, setHighlightIndex] = useState<number>(-1);
  const [profilePicture, setProfilePicture] = useState<string>('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  type SearchItem =
    | { kind: 'page'; label: string; page: string }
    | { kind: 'timetable'; label: string; timetableId: string; weekStartDate?: string; isActive?: boolean }
    | { kind: 'subject'; label: string; timetableId: string; timetableName: string };

  const [suggestions, setSuggestions] = useState<SearchItem[]>([]);
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
        const userId = localStorage.getItem('currentUserId');

        // Prefer backend-stored profile pictures.
        if (userId) {
          const data = await apiJsonAuthed<any>(`/user/${encodeURIComponent(userId)}`, 'GET');
          if (data?.profile_picture_url) {
            setProfilePicture(`${API_BASE_URL}${data.profile_picture_url}?t=${Date.now()}`);
            return;
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
      const userId = localStorage.getItem('currentUserId');
      if (!userId) {
        setProfilePicture('');
        return;
      }

      apiJsonAuthed<any>(`/user/${encodeURIComponent(userId)}`, 'GET')
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

  // Debounce typing for suggestions (Google-like)
  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQuery(searchQuery), 200);
    return () => window.clearTimeout(t);
  }, [searchQuery]);

  // Minimal Levenshtein (submission-safe, no deps)
  const levenshtein = useCallback((a: string, b: string) => {
    const s = a || '';
    const t = b || '';
    const n = s.length;
    const m = t.length;
    if (n === 0) return m;
    if (m === 0) return n;
    const dp = new Array(m + 1);
    for (let j = 0; j <= m; j++) dp[j] = j;
    for (let i = 1; i <= n; i++) {
      let prev = dp[0];
      dp[0] = i;
      for (let j = 1; j <= m; j++) {
        const tmp = dp[j];
        const cost = s[i - 1] === t[j - 1] ? 0 : 1;
        dp[j] = Math.min(
          dp[j] + 1,      // deletion
          dp[j - 1] + 1,  // insertion
          prev + cost     // substitution
        );
        prev = tmp;
      }
    }
    return dp[m];
  }, []);

  const scoreMatch = useCallback((queryRaw: string, candidateRaw: string) => {
    const q = queryRaw.trim().toLowerCase();
    const c = candidateRaw.trim().toLowerCase();
    if (!q || !c) return 0;
    if (c.includes(q)) return 1;

    // Prefer matching against tokens too
    const tokens = c.split(/\s+/).filter(Boolean);
    let best = 0;
    const candidates = [c, c.replace(/\s+/g, ''), ...tokens];
    for (const cand of candidates) {
      const dist = levenshtein(q, cand);
      const denom = Math.max(q.length, cand.length) || 1;
      const sim = 1 - dist / denom;
      if (sim > best) best = sim;
    }

    // Guard: very short queries should not trigger fuzzy spam
    if (q.length <= 2) return 0;
    if (q.length <= 4) return best >= 0.65 ? best : 0;
    return best >= 0.55 ? best : 0;
  }, [levenshtein]);

  const pageCandidates = useMemo(() => {
    const pages = [
      { label: 'Dashboard', page: 'dashboard' },
      { label: 'My Timetable', page: 'my-timetable' },
      { label: 'Auto Generate', page: 'auto-generate' },
      { label: 'Assessments', page: 'assessments-deadlines' },
      { label: 'Workspace', page: 'workspace' },
      { label: 'Goals & Achievements', page: 'goals-achievements' },
      { label: 'Create Timetable', page: 'create-timetable' },
      { label: 'Saved Timetables', page: 'view-timetables' },
      { label: 'Settings', page: 'settings' },
    ];

    if (isGlobalAdmin) {
      pages.splice(pages.length - 1, 0, { label: 'Admin', page: 'admin' });
    }

    return pages;
  }, [isGlobalAdmin]);

  // Build suggestions from pages + saved timetables + subjects
  useEffect(() => {
    const q = debouncedQuery.trim();
    if (!q) {
      setShowSearchResults(false);
      setSuggestions([]);
      setHighlightIndex(-1);
      return;
    }

    const currentUserEmail = localStorage.getItem('currentUserEmail');
    const storageKey = currentUserEmail ? `timetables_${currentUserEmail}` : null;
    const savedTimetables = storageKey ? localStorage.getItem(storageKey) : null;

    const ranked: Array<{ item: SearchItem; score: number }>
      = [];

    // Pages
    for (const p of pageCandidates) {
      const s = scoreMatch(q, p.label);
      if (s > 0) ranked.push({ item: { kind: 'page', label: p.label, page: p.page }, score: s });
    }

    try {
      if (savedTimetables) {
        const timetables: Timetable[] = JSON.parse(savedTimetables);

        // Timetables
        for (const tt of timetables) {
          const s = scoreMatch(q, tt.name);
          if (s > 0) {
            ranked.push({
              item: {
                kind: 'timetable',
                label: tt.name,
                timetableId: tt.id,
                weekStartDate: (tt as any).weekStartDate,
                isActive: (tt as any).isActive,
              },
              score: s,
            });
          }
        }

        // Subjects
        const subjectSet = new Set<string>();
        for (const tt of timetables) {
          const pushSubject = (subj: string) => {
            const key = `${subj}::${tt.id}`;
            if (subjectSet.has(key)) return;
            const s = scoreMatch(q, subj);
            if (s <= 0) return;
            subjectSet.add(key);
            ranked.push({
              item: { kind: 'subject', label: subj, timetableId: tt.id, timetableName: tt.name },
              score: s,
            });
          };

          if ((tt as any).calendarSessions) {
            (tt as any).calendarSessions.forEach((session: any) => {
              if (session?.subject) pushSubject(session.subject);
            });
          }
          (tt as any).schedule?.forEach((day: any) => {
            day?.sessions?.forEach((session: any) => {
              if (session?.subject) pushSubject(session.subject);
            });
          });
        }
      }
    } catch (e) {
      console.error('Error building suggestions:', e);
    }

    ranked.sort((a, b) => b.score - a.score);
    const top = ranked.slice(0, 10).map(r => r.item);
    setSuggestions(top);
    setShowSearchResults(true);
    setHighlightIndex(-1);
  }, [debouncedQuery, pageCandidates, scoreMatch]);

  const selectSuggestion = useCallback((item: SearchItem) => {
    // Clear UI first
    setShowSearchResults(false);
    setSearchQuery('');
    setDebouncedQuery('');
    setHighlightIndex(-1);

    // Context handoff via localStorage (simple + reliable)
    localStorage.removeItem('searchOpenTimetableId');
    localStorage.removeItem('searchFocusSubject');

    if (item.kind === 'timetable') {
      localStorage.setItem('searchOpenTimetableId', item.timetableId);
      onNavigate('view-timetables');
      return;
    }

    if (item.kind === 'subject') {
      localStorage.setItem('searchOpenTimetableId', item.timetableId);
      localStorage.setItem('searchFocusSubject', item.label);
      onNavigate('view-timetables');
      return;
    }

    onNavigate(item.page);
  }, [onNavigate]);

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

  const menuItems = useMemo(() => {
    const items = [
      { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { id: 'my-timetable', icon: Calendar, label: 'My Timetable' },
      { id: 'auto-generate', icon: Sparkles, label: 'Auto Generate' },
      { id: 'assessments-deadlines', icon: FileText, label: 'Assessments' },
      { id: 'workspace', icon: Users, label: 'Workspace' },
      { id: 'goals-achievements', icon: BookOpen, label: 'Goals & Achievements' },
      { id: 'create-timetable', icon: BookMarked, label: 'Create Timetable' },
      { id: 'view-timetables', icon: Calendar, label: 'Saved Timetables' },
    ];

    if (isGlobalAdmin) {
      items.push({ id: 'admin', icon: Shield, label: 'Admin' });
    }

    items.push({ id: 'settings', icon: Settings2, label: 'Settings' });
    return items;
  }, [isGlobalAdmin]);

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
                  data-tour="global-search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (!showSearchResults && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
                      setShowSearchResults(true);
                    }

                    if (e.key === 'Escape') {
                      setShowSearchResults(false);
                      setHighlightIndex(-1);
                      return;
                    }

                    if (!showSearchResults) return;

                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      if (suggestions.length === 0) return;
                      setHighlightIndex((i) => (i + 1) % suggestions.length);
                      return;
                    }
                    if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      if (suggestions.length === 0) return;
                      setHighlightIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
                      return;
                    }
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (suggestions.length === 0) return;
                      const idx = highlightIndex >= 0 ? highlightIndex : 0;
                      const item = suggestions[idx];
                      if (item) selectSuggestion(item);
                    }
                  }}
                  onFocus={() => {
                    if (searchQuery.trim()) setShowSearchResults(true);
                  }}
                  className="pl-10 bg-accent/50 border-border focus:bg-accent"
                />
                
                {/* Search Results Dropdown */}
                {showSearchResults && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
                    {/* Suggestions */}
                    {suggestions.length > 0 && (
                      <div className="p-2">
                        {suggestions.map((item, idx) => {
                          const isActive = idx === highlightIndex;
                          const commonClass = `w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors duration-150 ${isActive ? 'bg-accent' : 'hover:bg-accent'}`;

                          if (item.kind === 'page') {
                            return (
                              <button
                                key={`page-${item.page}`}
                                onMouseEnter={() => setHighlightIndex(idx)}
                                onClick={() => selectSuggestion(item)}
                                className={commonClass}
                              >
                                <LayoutDashboard className="h-4 w-4 text-blue-600" />
                                <div className="flex-1 text-left">
                                  <p className="text-sm">{item.label}</p>
                                  <p className="text-xs text-muted-foreground">Page</p>
                                </div>
                              </button>
                            );
                          }

                          if (item.kind === 'timetable') {
                            return (
                              <button
                                key={`tt-${item.timetableId}`}
                                onMouseEnter={() => setHighlightIndex(idx)}
                                onClick={() => selectSuggestion(item)}
                                className={commonClass}
                              >
                                <Calendar className="h-4 w-4 text-blue-600" />
                                <div className="flex-1 text-left">
                                  <p className="text-sm">{item.label}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {item.weekStartDate ? new Date(item.weekStartDate).toLocaleDateString() : 'Saved timetable'}
                                    {item.isActive && (
                                      <span className="ml-2 text-green-600 dark:text-green-400">• Active</span>
                                    )}
                                  </p>
                                </div>
                              </button>
                            );
                          }

                          return (
                            <button
                              key={`sub-${item.timetableId}-${item.label}-${idx}`}
                              onMouseEnter={() => setHighlightIndex(idx)}
                              onClick={() => selectSuggestion(item)}
                              className={commonClass}
                            >
                              <BookOpen className="h-4 w-4 text-blue-600" />
                              <div className="flex-1 text-left">
                                <p className="text-sm">{item.label}</p>
                                <p className="text-xs text-muted-foreground">in {item.timetableName}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* No Results */}
                    {suggestions.length === 0 && searchQuery.trim() && (
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
                  data-tour="pomodoro-button"
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
                  <Button
                    variant="ghost"
                    data-tour="profile-dropdown"
                    className={`flex items-center gap-2 pl-2 ${sidebarOpen ? 'hidden lg:flex' : ''}`}
                  >
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
                  data-tour={`sidebar-${item.id}`}
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