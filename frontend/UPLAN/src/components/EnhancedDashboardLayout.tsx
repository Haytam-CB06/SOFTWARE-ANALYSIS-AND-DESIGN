import React, { useMemo, useState, useEffect, useCallback } from 'react';
import HelpSection from './HelpSection';
import { useNotifications } from '../src/hooks/useNotifications';
import {
  Bell,
  Menu,
  X,
  Search,
  Calendar,
  ChevronDown,
  User,
  Settings2,
  LogOut,
  LayoutDashboard,
  BookMarked,
  Users,
  BookOpen,
  FileText,
  Sun,
  Moon,
  Timer,
  Sparkles,
  Shield,
  NotebookPen,
  Trophy,
  Save,
  Brain,
} from 'lucide-react';
import logoImage from 'figma:asset/0550e77f773f70cb0e6201f9400b3cccad8c1d9b.png';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
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
import type { Timetable } from '../src/types';
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
  isGlobalAdmin,
}: EnhancedDashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [highlightIndex, setHighlightIndex] = useState<number>(-1);
  const [profilePicture, setProfilePicture] = useState<string>('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchItem[]>([]);
  const [workspaceUnreadCount, setWorkspaceUnreadCount] = useState(0);
  const { t } = useTranslation();

  type SearchItem =
    | { kind: 'page'; label: string; page: string }
    | { kind: 'timetable'; label: string; timetableId: string; weekStartDate?: string; isActive?: boolean }
    | { kind: 'subject'; label: string; timetableId: string; timetableName: string };

  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved === 'true';
  });

  const { notifications, markAllAsRead, clearNotification, unreadCount } = useNotifications();

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

  useEffect(() => {
    const handleStorageChange = () => {
      const count = parseInt(localStorage.getItem('workspaceUnreadCount') || '0', 10);
      setWorkspaceUnreadCount(count);
    };

    handleStorageChange();

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('workspaceUnreadCountChanged', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('workspaceUnreadCountChanged', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState !== null) {
      setSidebarCollapsed(JSON.parse(savedState));
    }

    const loadProfile = async () => {
      try {
        const userId = localStorage.getItem('currentUserId');

        if (userId) {
          const data = await apiJsonAuthed<any>(`/user/${encodeURIComponent(userId)}`, 'GET');
          if (data?.profile_picture_url) {
            setProfilePicture(`${API_BASE_URL}${data.profile_picture_url}?t=${Date.now()}`);
            return;
          }
        }

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

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(searchQuery), 200);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  const levenshtein = useCallback((a: string, b: string) => {
    const s = a || '';
    const target = b || '';
    const n = s.length;
    const m = target.length;
    if (n === 0) return m;
    if (m === 0) return n;

    const dp = new Array(m + 1);
    for (let j = 0; j <= m; j++) dp[j] = j;

    for (let i = 1; i <= n; i++) {
      let prev = dp[0];
      dp[0] = i;
      for (let j = 1; j <= m; j++) {
        const tmp = dp[j];
        const cost = s[i - 1] === target[j - 1] ? 0 : 1;
        dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + cost);
        prev = tmp;
      }
    }

    return dp[m];
  }, []);

  const scoreMatch = useCallback(
    (queryRaw: string, candidateRaw: string) => {
      const q = queryRaw.trim().toLowerCase();
      const c = candidateRaw.trim().toLowerCase();

      if (!q || !c) return 0;
      if (c.includes(q)) return 1;

      const tokens = c.split(/\s+/).filter(Boolean);
      let best = 0;
      const candidates = [c, c.replace(/\s+/g, ''), ...tokens];

      for (const cand of candidates) {
        const dist = levenshtein(q, cand);
        const denom = Math.max(q.length, cand.length) || 1;
        const sim = 1 - dist / denom;
        if (sim > best) best = sim;
      }

      if (q.length <= 2) return 0;
      if (q.length <= 4) return best >= 0.65 ? best : 0;
      return best >= 0.55 ? best : 0;
    },
    [levenshtein]
  );

  const pageCandidates = useMemo(() => {
    const pages = [
      { label: t('dashboard.pages.dashboard'), page: 'dashboard' },
      { label: t('dashboard.pages.academicTimetable'), page: 'my-timetable' },
      { label: t('dashboard.pages.scheduleGenerator'), page: 'auto-generate' },
      { label: t('dashboard.pages.assessments'), page: 'assessments-deadlines' },
      { label: t('dashboard.pages.studyNotes'), page: 'notebook' },
      { label: t('dashboard.pages.collaboration'), page: 'workspace' },
      { label: t('dashboard.pages.performance'), page: 'goals-achievements' },
      { label: t('dashboard.pages.createSchedule'), page: 'create-timetable' },
      { label: t('dashboard.pages.savedSchedules'), page: 'view-timetables' },
      { label: t('common.settings'), page: 'settings' },
    ];

    if (isGlobalAdmin) {
      pages.splice(pages.length - 1, 0, { label: t('common.admin'), page: 'admin' });
    }

    return pages;
  }, [isGlobalAdmin, t]);

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

    const ranked: Array<{ item: SearchItem; score: number }> = [];

    for (const p of pageCandidates) {
      const s = scoreMatch(q, p.label);
      if (s > 0) ranked.push({ item: { kind: 'page', label: p.label, page: p.page }, score: s });
    }

    try {
      if (savedTimetables) {
        const timetables: Timetable[] = JSON.parse(savedTimetables);

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

        const subjectSet = new Set<string>();

        for (const tt of timetables) {
          const pushSubject = (subj: string) => {
            const key = `${subj}::${tt.id}`;
            if (subjectSet.has(key)) return;

            const s = scoreMatch(q, subj);
            if (s <= 0) return;

            subjectSet.add(key);
            ranked.push({
              item: {
                kind: 'subject',
                label: subj,
                timetableId: tt.id,
                timetableName: tt.name,
              },
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
    const top = ranked.slice(0, 10).map((r) => r.item);
    setSuggestions(top);
    setShowSearchResults(true);
    setHighlightIndex(-1);
  }, [debouncedQuery, pageCandidates, scoreMatch]);

  const selectSuggestion = useCallback(
    (item: SearchItem) => {
      setShowSearchResults(false);
      setSearchQuery('');
      setDebouncedQuery('');
      setHighlightIndex(-1);

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
    },
    [onNavigate]
  );

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

  const toggleSidebarCollapse = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', JSON.stringify(newState));
  };

  const menuSections = useMemo(() => {
    return [
      {
        title: t('dashboard.sections.planning'),
        items: [
          { id: 'dashboard', icon: LayoutDashboard, label: t('dashboard.pages.dashboard') },
          { id: 'my-timetable', icon: Calendar, label: t('dashboard.pages.academicTimetable') },
          { id: 'auto-generate', icon: Sparkles, label: t('dashboard.pages.scheduleGenerator') },
          { id: 'view-timetables', icon: Save, label: t('dashboard.pages.savedSchedules') },
          { id: 'create-timetable', icon: BookMarked, label: t('dashboard.pages.createSchedule') },
        ],
      },
      {
        title: t('dashboard.sections.academicWork'),
        items: [
          { id: 'assessments-deadlines', icon: FileText, label: t('dashboard.pages.assessments') },
          { id: 'notebook', icon: NotebookPen, label: t('dashboard.pages.studyNotes') },
          { id: 'workspace', icon: Users, label: t('dashboard.pages.collaboration') },
        ],
      },
      {
        title: t('dashboard.sections.performance'),
        items: [{ id: 'goals-achievements', icon: Trophy, label: t('dashboard.pages.performance') }],
      },
      {
        title: t('dashboard.sections.system'),
        items: [
          ...(isGlobalAdmin ? [{ id: 'admin', icon: Shield, label: t('common.admin') }] : []),
          { id: 'settings', icon: Settings2, label: t('common.settings') },
        ],
      },
    ];
  }, [isGlobalAdmin, t]);

  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  const mobilePrimaryItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: t('common.home') },
    { id: 'my-timetable', icon: Calendar, label: t('common.timetable') },
    { id: 'workspace', icon: Users, label: t('common.workspace') },
    { id: 'view-timetables', icon: BookMarked, label: t('common.saved') },
    { id: 'settings', icon: Settings2, label: t('common.settings') },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/85">
        <div className="flex h-14 items-center justify-between px-3 sm:px-4 lg:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 lg:hidden dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            <button
              onClick={() => onNavigate('dashboard')}
              className="flex min-w-0 items-center gap-3 rounded-2xl transition-opacity hover:opacity-90"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
                <img src={logoImage} alt="U PLAN" className="h-7 w-7 object-contain" />
              </div>

              <div className="hidden min-w-0 text-left sm:block">
                <p className="truncate text-base font-semibold tracking-[-0.02em] text-slate-900 dark:text-white">
                  U PLAN
                </p>
                <p className="truncate text-[11px] font-medium uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                  {t('dashboard.user.planner')}
                </p>
              </div>
            </button>
          </div>

          <div className="mx-4 hidden max-w-[520px] flex-1 md:flex">
            <div className="search-container relative w-full">
              <Search className="absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <Input
                type="text"
                placeholder={t('dashboard.search.placeholder')}
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
                className="h-11 rounded-2xl border border-slate-200 bg-white pl-10 text-sm shadow-sm placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
              />

              {showSearchResults && (
                <div className="absolute left-0 right-0 top-full z-50 mt-3 max-h-96 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
                  {suggestions.length > 0 && (
                    <div className="p-1">
                      {suggestions.map((item, idx) => {
                        const isActive = idx === highlightIndex;
                        const commonClass = `w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                          isActive ? 'bg-blue-50 dark:bg-slate-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800/80'
                        }`;

                        if (item.kind === 'page') {
                          return (
                            <button
                              key={`page-${item.page}`}
                              onMouseEnter={() => setHighlightIndex(idx)}
                              onClick={() => selectSuggestion(item)}
                              className={commonClass}
                            >
                              <LayoutDashboard className="h-4 w-4 text-blue-700 dark:text-blue-400" />
                              <div className="flex-1">
                                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{item.label}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{t('dashboard.search.page')}</p>
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
                              <Calendar className="h-4 w-4 text-blue-700 dark:text-blue-400" />
                              <div className="flex-1">
                                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{item.label}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  {item.weekStartDate
                                    ? new Date(item.weekStartDate).toLocaleDateString()
                                    : t('dashboard.search.savedTimetable')}
                                  {item.isActive && (
                                    <span className="ml-2 text-emerald-600 dark:text-emerald-400">
                                      • {t('common.active')}
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
                            <BookOpen className="h-4 w-4 text-blue-700 dark:text-blue-400" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{item.label}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {t('dashboard.search.inTimetable', { name: item.timetableName })}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {suggestions.length === 0 && searchQuery.trim() && (
                    <div className="p-6 text-center text-slate-500 dark:text-slate-400">
                      <Search className="mx-auto mb-2 h-8 w-8 opacity-50" />
                      <p className="text-sm">{t('dashboard.search.noResultsWithQuery', { query: searchQuery })}</p>
                      <p className="mt-1 text-xs">{t('dashboard.search.tryDifferent')}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="hidden sm:block">
              <HelpSection />
            </div>

            <div className="hidden sm:block">
              <LanguageSwitcher />
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={toggleDarkMode}
              title={darkMode ? t('dashboard.actions.lightMode') : t('dashboard.actions.darkMode')}
              className="h-9 w-9 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              {darkMode ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4" />}
            </Button>

            {onShowPomodoroWidget && (
              <Button
                variant="outline"
                size="sm"
                data-tour="pomodoro-button"
                onClick={onShowPomodoroWidget}
                className="h-9 w-9 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                title={t('dashboard.actions.pomodoro')}
              >
                <Timer className="h-4 w-4 text-blue-700 dark:text-blue-400" />
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="relative h-9 w-9 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <Badge className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full border-2 border-white bg-red-500 px-1 text-[10px] font-semibold text-white dark:border-slate-900">
                      {unreadCount}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-80 rounded-2xl border-slate-200 dark:border-slate-800">
                <DropdownMenuLabel className="flex items-center justify-between">
                  <span>{t('dashboard.notifications.title')}</span>
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={markAllAsRead}
                      className="h-auto p-1 text-xs text-blue-700 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      {t('dashboard.notifications.markAll')}
                    </Button>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-sm text-slate-500 dark:text-slate-400">
                    {t('dashboard.notifications.empty')}
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
                              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                                {notification.title}
                              </p>
                              {!notification.read && (
                                <div className="h-2 w-2 rounded-full bg-blue-700 dark:bg-blue-400" />
                              )}
                            </div>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                              {notification.message}
                            </p>
                            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{notification.time}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => clearNotification(notification.id)}
                            className="h-7 w-7 p-0 text-slate-500 hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                          >
                            <X className="h-3.5 w-3.5" />
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
                  className="flex h-10 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-2.5 pr-3 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
                >
                  <Avatar className="h-8 w-8">
                    {profilePicture && <AvatarImage src={profilePicture} alt={userName} className="object-cover" />}
                    <AvatarFallback className="bg-blue-700 text-white">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="hidden text-left lg:block">
                    <p className="max-w-[120px] truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                      {userName}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{t('dashboard.user.student')}</p>
                  </div>
                  <ChevronDown className="hidden h-4 w-4 text-slate-400 md:block" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-60 rounded-2xl border-slate-200 dark:border-slate-800">
                <DropdownMenuLabel>
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{userName}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{userEmail}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onNavigate('settings', 'profile')}>
                  <User className="mr-2 h-4 w-4" />
                  {t('dashboard.user.profile')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onNavigate('settings')}>
                  <Settings2 className="mr-2 h-4 w-4" />
                  {t('common.settings')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout} className="text-red-600 dark:text-red-400">
                  <LogOut className="mr-2 h-4 w-4" />
                  {t('common.logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="border-t border-slate-200 px-3 py-2 md:hidden dark:border-slate-800">
          <div className="search-container relative">
            <Search className="absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <Input
              type="text"
              placeholder={t('dashboard.search.short')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (searchQuery.trim()) setShowSearchResults(true);
              }}
              className="h-11 rounded-2xl border border-slate-200 bg-white pl-10 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-900"
            />

            {showSearchResults && (
              <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-80 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-800 dark:bg-slate-900">
                {suggestions.length > 0 ? (
                  <div className="space-y-1">
                    {suggestions.map((item, idx) => (
                      <button
                        key={`${item.kind}-${idx}`}
                        onClick={() => selectSuggestion(item)}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        {item.kind === 'page' && <LayoutDashboard className="h-4 w-4 text-blue-700 dark:text-blue-400" />}
                        {item.kind === 'timetable' && <Calendar className="h-4 w-4 text-blue-700 dark:text-blue-400" />}
                        {item.kind === 'subject' && <BookOpen className="h-4 w-4 text-blue-700 dark:text-blue-400" />}
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{item.label}</p>
                          <p className="text-xs capitalize text-slate-500 dark:text-slate-400">{item.kind}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  searchQuery.trim() && (
                    <div className="p-4 text-center text-sm text-slate-500 dark:text-slate-400">
                      {t('dashboard.search.noResults')}
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="flex min-h-[calc(100vh-3.5rem)]">
        <aside
          className={`hidden lg:fixed lg:bottom-0 lg:left-0 lg:top-14 lg:flex lg:flex-col border-r border-slate-200 bg-white/95 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/95 transition-all duration-300 z-40 ${
            sidebarCollapsed ? 'lg:w-20' : 'lg:w-80'
          }`}
        >
          <div className="flex h-full flex-col">
            <div className="border-b border-slate-200 px-3 py-3 dark:border-slate-800">
              <button
                onClick={toggleSidebarCollapse}
                className={`group flex w-full items-center rounded-2xl transition-all duration-200 hover:bg-slate-50 dark:hover:bg-slate-900 ${
                  sidebarCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-3'
                }`}
                title={sidebarCollapsed ? t('dashboard.sidebar.expand') : t('dashboard.sidebar.collapse')}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
                  <img
                    src={logoImage}
                    alt="U PLAN"
                    className="h-7 w-7 object-contain transition-transform duration-200 group-hover:scale-[1.03]"
                  />
                </div>

                {!sidebarCollapsed && (
                  <div className="min-w-0 text-left">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                      {t('dashboard.sidebar.portal')}
                    </p>
                    <h2 className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                      U PLAN
                    </h2>
                  </div>
                )}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-4">
              <nav className="space-y-5">
                {menuSections.map((section) => (
                  <div key={section.title}>
                    {!sidebarCollapsed && (
                      <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                        {section.title}
                      </p>
                    )}

                    <div className="space-y-1.5">
                      {section.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = currentPage === item.id;

                        return (
                          <button
                            key={item.id}
                            data-tour={`sidebar-${item.id}`}
                            onClick={() => onNavigate(item.id)}
                            className={`group relative flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-all duration-200 ${
                              isActive
                                ? 'bg-blue-50 text-blue-700 dark:bg-slate-900 dark:text-blue-400'
                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white'
                            } ${sidebarCollapsed ? 'justify-center px-2' : ''}`}
                            title={sidebarCollapsed ? item.label : ''}
                          >
                            {isActive && !sidebarCollapsed && (
                              <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-blue-700 dark:bg-blue-400" />
                            )}

                            <Icon
                              className={`h-5 w-5 flex-shrink-0 ${
                                isActive
                                  ? 'text-blue-700 dark:text-blue-400'
                                  : 'text-slate-400 group-hover:text-slate-700 dark:text-slate-500 dark:group-hover:text-slate-200'
                              }`}
                            />

                            {!sidebarCollapsed && (
                              <span className="flex min-w-0 flex-1 items-center gap-2">
                                <span className="truncate text-[14px] font-medium tracking-[-0.01em]">
                                  {item.label}
                                </span>

                                {item.id === 'workspace' && workspaceUnreadCount > 0 && (
                                  <span className="ml-auto inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-semibold text-white">
                                    {workspaceUnreadCount > 9 ? '9+' : workspaceUnreadCount}
                                  </span>
                                )}
                              </span>
                            )}

                            {sidebarCollapsed && item.id === 'workspace' && workspaceUnreadCount > 0 && (
                              <span className="absolute right-1 top-1 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-semibold text-white">
                                {workspaceUnreadCount > 9 ? '9+' : workspaceUnreadCount}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </nav>
            </div>

            <div className="border-t border-slate-200 px-3 py-3 dark:border-slate-800">
              <button
                onClick={onLogout}
                className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30 ${
                  sidebarCollapsed ? 'justify-center px-2' : ''
                }`}
                title={sidebarCollapsed ? t('common.logout') : ''}
              >
                <LogOut className="h-5 w-5 flex-shrink-0" />
                {!sidebarCollapsed && <span className="text-sm font-medium">{t('common.logout')}</span>}
              </button>

              {!sidebarCollapsed && (
                <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <p className="font-semibold text-slate-800 dark:text-slate-100">AI Study Planner</p>
                  </div>
                  <p className="mt-1">v1.0 • {t('dashboard.footer')}</p>
                </div>
              )}
            </div>
          </div>
        </aside>

        {sidebarOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-[1px] lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <aside className="fixed inset-y-0 left-0 z-50 flex w-[86vw] max-w-[320px] flex-col border-r border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950 lg:hidden">
              <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4 dark:border-slate-800">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
                    <img src={logoImage} alt="U PLAN" className="h-7 w-7 object-contain" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">AI Study Planner</p>
                    <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                      {t('dashboard.user.planner')}
                    </p>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(false)}
                  className="h-9 w-9 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800 sm:hidden">
                <div className="flex items-center gap-2">
                  <LanguageSwitcher />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleDarkMode}
                    title={darkMode ? t('dashboard.actions.lightMode') : t('dashboard.actions.darkMode')}
                    className="h-9 w-9 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                  >
                    {darkMode ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <nav className="flex-1 space-y-1 overflow-y-auto p-3">
                {menuSections.flatMap((section) => section.items).map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPage === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onNavigate(item.id);
                        setSidebarOpen(false);
                      }}
                      className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-all ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 dark:bg-slate-900 dark:text-blue-400'
                          : 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-900'
                      }`}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      <span className="truncate text-sm font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </nav>

              <div className="border-t border-slate-200 p-3 dark:border-slate-800">
                <Button
                  variant="ghost"
                  onClick={() => {
                    onLogout();
                    setSidebarOpen(false);
                  }}
                  className="flex w-full items-center justify-start gap-3 rounded-2xl px-3 py-3 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                >
                  <LogOut className="h-5 w-5" />
                  {t('common.logout')}
                </Button>
              </div>
            </aside>
          </>
        )}

        <main
          className={`min-w-0 flex-1 overflow-x-hidden transition-[margin] duration-300 ${
            sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-80'
          }`}
        >
          <div className="mx-auto w-full max-w-[1560px] px-3 pb-24 pt-4 sm:px-4 md:px-5 lg:px-8 lg:pb-8 lg:pt-5">
            {children}
          </div>
        </main>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-xl lg:hidden dark:border-slate-800 dark:bg-slate-950/95">
        <div className="grid grid-cols-5">
          {mobilePrimaryItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex min-h-[64px] flex-col items-center justify-center gap-1 px-1 py-2 text-[11px] transition-all ${
                  isActive ? 'text-blue-700 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'scale-110' : ''}`} />
                <span className="max-w-[60px] truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}