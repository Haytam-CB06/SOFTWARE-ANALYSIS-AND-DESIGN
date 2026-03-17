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
      { label: 'Notebook', page: 'notebook' },
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
      { id: 'notebook', icon: BookOpen, label: 'Notebook' },
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
const mobilePrimaryItems = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Home' },
  { id: 'my-timetable', icon: Calendar, label: 'Timetable' },
  { id: 'workspace', icon: Users, label: 'Workspace' },
  { id: 'view-timetables', icon: BookMarked, label: 'Saved' },
  { id: 'settings', icon: Settings2, label: 'Settings' },
];

return (
  <div className="min-h-screen bg-background">
    {/* Top Navigation */}
    <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex h-14 items-center justify-between px-3 md:h-16 md:px-6">
        <div className="flex items-center gap-2 md:gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <button
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2 transition-opacity hover:opacity-80"
          >
            <img
              src={logoImage}
              alt="PLAN Logo"
              className="h-9 w-9 rounded-lg shadow-sm md:h-10 md:w-10"
            />
            <div className="hidden sm:block text-left">
              <p className="text-sm font-bold tracking-tight text-blue-600 dark:text-blue-400 md:text-lg">
                U PLAN
              </p>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground md:text-xs">
                Smart Study Planner
              </p>
            </div>
          </button>
        </div>

        {/* Desktop Search */}
        <div className="mx-6 hidden max-w-md flex-1 md:flex">
          <div className="search-container relative w-full">
            <Search className="absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search timetables, pages, subjects..."
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
              className="pl-10"
            />

            {showSearchResults && (
              <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-96 overflow-y-auto rounded-lg border border-border bg-card shadow-lg">
                {suggestions.length > 0 && (
                  <div className="p-2">
                    {suggestions.map((item, idx) => {
                      const isActive = idx === highlightIndex;
                      const commonClass = `w-full flex items-center gap-3 rounded-md px-3 py-2 text-left transition-colors ${
                        isActive ? 'bg-accent' : 'hover:bg-accent'
                      }`;

                      if (item.kind === 'page') {
                        return (
                          <button
                            key={`page-${item.page}`}
                            onMouseEnter={() => setHighlightIndex(idx)}
                            onClick={() => selectSuggestion(item)}
                            className={commonClass}
                          >
                            <LayoutDashboard className="h-4 w-4 text-blue-600" />
                            <div className="flex-1">
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
                            <div className="flex-1">
                              <p className="text-sm">{item.label}</p>
                              <p className="text-xs text-muted-foreground">
                                {item.weekStartDate
                                  ? new Date(item.weekStartDate).toLocaleDateString()
                                  : 'Saved timetable'}
                                {item.isActive && (
                                  <span className="ml-2 text-green-600 dark:text-green-400">
                                    • Active
                                  </span>
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
                          <div className="flex-1">
                            <p className="text-sm">{item.label}</p>
                            <p className="text-xs text-muted-foreground">
                              in {item.timetableName}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {suggestions.length === 0 && searchQuery.trim() && (
                  <div className="p-6 text-center text-muted-foreground">
                    <Search className="mx-auto mb-2 h-8 w-8 opacity-50" />
                    <p className="text-sm">No results found for &quot;{searchQuery}&quot;</p>
                    <p className="mt-1 text-xs">Try a different timetable or subject</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-1 md:gap-2">
          <div className="hidden md:block">
            <HelpSection />
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={toggleDarkMode}
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode ? (
              <Sun className="h-5 w-5 text-yellow-500" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>

          {onShowPomodoroWidget && (
            <Button
              variant="outline"
              size="sm"
              data-tour="pomodoro-button"
              onClick={onShowPomodoroWidget}
              className="hidden items-center gap-2 md:flex"
              title="Open Pomodoro Timer"
            >
              <Timer className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              <span className="hidden lg:inline">Pomodoro</span>
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="relative hidden md:flex">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-red-500 p-0 text-xs text-white">
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
                      className="flex cursor-pointer flex-col items-start p-3"
                      onSelect={(e) => e.preventDefault()}
                    >
                      <div className="flex w-full items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm">{notification.title}</p>
                            {!notification.read && (
                              <div className="h-2 w-2 rounded-full bg-blue-600"></div>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-gray-500">
                            {notification.message}
                          </p>
                          <p className="mt-1 text-xs text-gray-400">
                            {notification.time}
                          </p>
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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                data-tour="profile-dropdown"
                className="flex items-center gap-2 pl-2"
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
                <div className="hidden text-left lg:block">
                  <p className="text-sm">{userName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Student</p>
                </div>
                <ChevronDown className="hidden h-4 w-4 text-gray-500 md:block" />
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
                <User className="mr-2 h-4 w-4" />
                Profile Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onNavigate('settings')}>
                <Settings2 className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onLogout} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Search */}
      <div className="border-t border-border px-3 py-2 lg:hidden">
        <div className="search-container relative">
          <Search className="absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => {
              if (searchQuery.trim()) setShowSearchResults(true);
            }}
            className="pl-10"
          />

          {showSearchResults && (
            <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-80 overflow-y-auto rounded-lg border border-border bg-card shadow-lg">
              {suggestions.length > 0 ? (
                <div className="p-2">
                  {suggestions.map((item, idx) => (
                    <button
                      key={`${item.kind}-${idx}`}
                      onClick={() => selectSuggestion(item)}
                      className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left hover:bg-accent"
                    >
                      {item.kind === 'page' && (
                        <LayoutDashboard className="h-4 w-4 text-blue-600" />
                      )}
                      {item.kind === 'timetable' && (
                        <Calendar className="h-4 w-4 text-blue-600" />
                      )}
                      {item.kind === 'subject' && (
                        <BookOpen className="h-4 w-4 text-blue-600" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm">{item.label}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {item.kind}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                searchQuery.trim() && (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No results found
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </nav>

    <div className="flex min-h-[calc(100vh-3.5rem)] md:min-h-[calc(100vh-4rem)]">
      {/* Desktop Sidebar */}
      <aside
          className={`hidden lg:fixed lg:left-0 lg:top-14 lg:bottom-0 lg:flex lg:flex-col overflow-visible border-r border-border bg-card z-40 ${
            sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'
          } transition-all duration-300`}
        >
        <div className="relative flex-1 h-full overflow-y-auto p-5">
          <div className="absolute right-5 top-3 z-50 hidden lg:block">
            <Button
              onClick={toggleSidebarCollapse}
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-md border-border bg-background shadow-sm hover:bg-accent"
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed ? (
                <PanelLeft className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </Button>
          </div>

          <nav className="mt-10 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;

              return (
                <button
                  key={item.id}
                  data-tour={`sidebar-${item.id}`}
                  onClick={() => onNavigate(item.id)}
                  className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-foreground hover:bg-accent'
                  } ${sidebarCollapsed ? 'justify-center' : ''}`}
                  title={sidebarCollapsed ? item.label : ''}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span className={sidebarCollapsed ? 'hidden' : 'block'}>
                    {item.label}
                  </span>

                  
                </button>
              );
            })}

            <div className="mt-4 border-t border-border pt-4">
              <button
                onClick={onLogout}
                className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-red-600 transition-all hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30 ${
                  sidebarCollapsed ? 'justify-center' : ''
                }`}
                title={sidebarCollapsed ? 'Logout' : ''}
              >
                <LogOut className="h-5 w-5 flex-shrink-0" />
                <span className={sidebarCollapsed ? 'hidden' : 'block'}>Logout</span>

                
              </button>
            </div>
          </nav>
        </div>

        {!sidebarCollapsed && (
          <div className="border-t border-border bg-blue-50 p-4 dark:bg-blue-900/30">
            <div className="text-center text-xs text-muted-foreground">
              <p>U PLAN v1.0</p>
              <p className="mt-1 text-muted-foreground/70">Organize your learning</p>
            </div>
          </div>
        )}
      </aside>

      {/* Mobile Drawer */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border bg-card shadow-xl lg:hidden">
            
            <div className="flex h-14 items-center justify-between border-b border-border px-4">
              <div className="flex items-center gap-2">
                <img
                  src={logoImage}
                  alt="PLAN Logo"
                  className="h-8 w-8 rounded-lg"
                />
                <div>
                  <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
                    U PLAN
                  </p>
                  <p className="text-[10px] text-muted-foreground">Student Planner</p>
                </div>
              </div>

              <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto p-3">
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
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-foreground hover:bg-accent'
                    }`}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="border-t border-border p-3">
              <Button
                variant="ghost"
                onClick={() => {
                  onLogout();
                  setSidebarOpen(false);
                }}
                className="w-full justify-start text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
              >
                <LogOut className="mr-2 h-5 w-5" />
                Logout
              </Button>
            </div>
          </aside>
        </>
      )}

      {/* Main Content */}
      <main
          className={`min-w-0 flex-1 overflow-x-hidden transition-all ${
            sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
          }`}
        >
        <div className="w-full min-w-0 px-3 pb-10 pt-3 lg:px-6 lg:pb-6 lg:pt-6">
          {children}
        </div>
      </main>
    </div>

    {/* Mobile Bottom Nav */}
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur lg:hidden">
      <div className="grid grid-cols-5">
        {mobilePrimaryItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center justify-center gap-1 px-2 py-3 text-[11px] transition-colors ${
                isActive ? 'text-blue-600' : 'text-muted-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  </div>
);
};
