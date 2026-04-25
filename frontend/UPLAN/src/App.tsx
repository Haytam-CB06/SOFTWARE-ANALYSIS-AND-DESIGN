import { lazy, Suspense, useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Toaster, toast } from './components/ui/sonner';
import Navigation from './components/Navigation';
import EnhancedDashboardLayout from './components/EnhancedDashboardLayout';
import { PublicPages } from './src/pages/PublicPages';
import { DashboardPages } from './src/pages/DashboardPages';
import { useAuth } from './src/hooks/useAuth';
import { useTimetables } from './src/hooks/useTimetables';
import { useDarkMode } from './src/hooks/useDarkMode';
import { PageType, SettingsSection, TimetableData } from './src/types';
import UnsavedTimetableDialog from './components/UnsavedTimetableDialog';
import { PomodoroProvider } from './contexts/PomodoroContext';
import { TourProvider } from './contexts/TourContext';
import TourOverlay, { TOUR_STEPS } from './components/tour/TourOverlay';
import WelcomeOverlay from './components/tour/WelcomeOverlay';
import SubscriptionPrompt, { SubscriptionPlan } from './components/SubscriptionPrompt';
import PostSignupQuestionnaire from './components/PostSignupQuestionnaire';
import welcomeImg from './assets/welcome.jpg';
import logoImage from 'figma:asset/0550e77f773f70cb0e6201f9400b3cccad8c1d9b.png';
import { registerServiceWorker, handleInstallPrompt } from './utils/registerServiceWorker';
import { GoogleSuccess } from './src/pages/GoogleSuccess';
import { apiJsonAuthed } from './lib/api';
import { setupFormDraftPersistence } from './utils/persistFormDrafts';
import { getUserItem, setUserItem } from './utils/userStorage';
import GlobalTextLocalizer from './components/GlobalTextLocalizer';

const PomodoroWidget = lazy(() => import('./components/PomodoroWidget'));
const SUBSCRIPTION_PROMPT_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;

export default function App() {
  const { t } = useTranslation();
  
  const { isAuthenticated, authReady, user, login, logout, updateUserName } = useAuth();
  const onboardingTotalSteps = TOUR_STEPS.length + 1; // +1 for Welcome screen
  // Register service worker for PWA support
  
  useEffect(() => {
    if (!import.meta.env.DEV) {
      registerServiceWorker();
      handleInstallPrompt();
    }
  }, []);
  
  // Custom hooks for state management

  // Handle Google OAuth redirect back from backend (/callback -> FRONTEND_ORIGIN)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauth = params.get('oauth');
    if (oauth === 'google') {
      const email = params.get('email') || '';
      const name = params.get('name') || email;
      const userId = params.get('user_id') || '';
      if (email) localStorage.setItem('currentUserEmail', email);
      if (name) localStorage.setItem('currentUserName', name);
      if (userId) localStorage.setItem('currentUserId', userId);

      // Log the user into the app state
      login(name, email);

      // Clean up URL (remove query params)
      window.history.replaceState({}, document.title, window.location.pathname);
      toast.success(t('app.toasts.signedInWithGoogle', 'Signed in with Google'));
    }
  }, [login]);
  const {
    timetables,
    saveTimetable,
    deleteTimetable,
    setActiveTimetable,
    renameTimetable,
    duplicateTimetable,
    applyTimetableToWeek,
    saveCalendarTimetable,
  } = useTimetables();
  const { darkMode, toggleDarkMode } = useDarkMode();

  const [isGlobalAdmin, setIsGlobalAdmin] = useState(false);
useEffect(() => {
  const checkGlobalAdmin = async () => {
    const currentUserId = localStorage.getItem("currentUserId");

    if (!isAuthenticated || !currentUserId) {
      setIsGlobalAdmin(false);
      return;
    }

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/admin/users?limit=1&offset=0`,
        {
          headers: {
            "X-User-Id": currentUserId,
          },
        }
      );

      if (res.status === 403 || res.status === 401) {
        setIsGlobalAdmin(false);
        return;
      }

      setIsGlobalAdmin(res.ok);
    } catch {
      setIsGlobalAdmin(false);
    }
  };

  checkGlobalAdmin();
}, [isAuthenticated]);

  useEffect(() => {
    if (!authReady || !isAuthenticated) return;

    const userId = localStorage.getItem('currentUserId');
    if (!userId) return;

    let stopped = false;
    let lastTouch = 0;

    const touchPresence = async () => {
      const now = Date.now();
      if (now - lastTouch < 15000) return;
      lastTouch = now;
      try {
        await apiJsonAuthed(`/user/${encodeURIComponent(userId)}/presence`, 'POST');
      } catch (error) {
        if (!stopped) {
          console.warn('[App] presence update failed:', error);
        }
      }
    };

    touchPresence();
    const interval = window.setInterval(touchPresence, 45000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') touchPresence();
    };
    window.addEventListener('focus', touchPresence);
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      stopped = true;
      window.clearInterval(interval);
      window.removeEventListener('focus', touchPresence);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [authReady, isAuthenticated]);

  // --- Handle share-link deep link: /?page=workspace&join_token=... ---
  useEffect(() => {
      const params = new URLSearchParams(window.location.search);
      const joinToken = params.get('join_token');
      if (!joinToken) return;

      // Save for after login
      sessionStorage.setItem('pendingJoinToken', joinToken);

      // Wait until auth state is hydrated
      if (!authReady) return;

      if (!isAuthenticated) {
        params.set('page', 'auth');
        window.history.replaceState({}, document.title, `?${params.toString()}`);
        setCurrentPage('auth'); 
        return;
      }

      // logged in -> go workspace, keep token so Workspace.tsx opens dialog
      params.set('page', 'workspace');
      window.history.replaceState({}, document.title, `?${params.toString()}`);
      setCurrentPage('workspace'); 
  }, [authReady, isAuthenticated]);

  
  // After login, resume pending share-link join
  useEffect(() => {
    if (!authReady) return;
    if (!isAuthenticated) return;

    const token = sessionStorage.getItem('pendingJoinToken');
    if (!token) return;

    const params = new URLSearchParams(window.location.search);
    params.set('page', 'workspace');
    params.set('join_token', token);

    window.history.replaceState({}, document.title, `?${params.toString()}`);
    setCurrentPage('workspace');
    sessionStorage.removeItem('pendingJoinToken');
  }, [authReady, isAuthenticated]);

  const getInitialPage = (): PageType => {
    try {
      const params = new URLSearchParams(window.location.search);

      // ✅ support shared links like /workspaces/join?token=...
     

      const p = params.get('page') as PageType | null;
      if (p) return p;

      const last = localStorage.getItem('lastPage') as PageType | null;
      return last || 'home';
    } catch {
      return 'home';
    }
  };

  // Local UI state
  const [currentPage, setCurrentPage] = useState<PageType>(getInitialPage);
  const navigationHistoryRef = useRef<PageType[]>([]);
  const [deepLinkStartSessionId, setDeepLinkStartSessionId] = useState<string | null>(null);
  const [currentTimetableData, setCurrentTimetableData] = useState<TimetableData | null>(null);
  const [showTimetableResults, setShowTimetableResults] = useState(false);
  const [settingsSection, setSettingsSection] = useState<SettingsSection>('profile');
  const [hasUnsavedTimetable, setHasUnsavedTimetable] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingNavigationPage, setPendingNavigationPage] = useState<string | null>(null);
  const [showPomodoroWidget, setShowPomodoroWidget] = useState(() => {
    try {
      const open = getUserItem('pomodoroWidgetOpen');
      if (open === 'true') return true;

      // Fallback: if the Pomodoro timer was active before refresh.
      const raw = getUserItem('pomodoroState');
      if (raw) {
        const st = JSON.parse(raw);
        if (st && st.isActive) return true;
      }
    } catch {
      // ignore
    }
    return false;
  });
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean>(true);
  const [autoStartTour, setAutoStartTour] = useState<boolean>(false);
  const [showWelcome, setShowWelcome] = useState<boolean>(false);
  const [showSubscriptionPrompt, setShowSubscriptionPrompt] = useState(false);
  const [showProfileQuestionnaire, setShowProfileQuestionnaire] = useState(false);
  // Client-side first-run welcome. This is shown for guest users and also acts as a
  // safety-net if backend onboarding flags aren't available yet.
  const [clientWelcomeOpen, setClientWelcomeOpen] = useState<boolean>(() => {
    try {
      // Don’t show onboarding for true guest visits.
      // Only show once a user has actually logged in/registered.
      const hasUserId = Boolean(localStorage.getItem('currentUserId'));
      if (!hasUserId) return false;

      return localStorage.getItem('uplan_welcome_seen') !== 'true';
    } catch {
      return true;
    }
  });

  const markWelcomeSeen = () => {
    try {
      localStorage.setItem('uplan_welcome_seen', 'true');
    } catch {
      // ignore
    }
    setClientWelcomeOpen(false);
    setShowWelcome(false);
  };
  const [isPomodoroFloating, setIsPomodoroFloating] = useState(() => {
    // Load floating state from localStorage
    const saved = localStorage.getItem('pomodoroFloating');
    return saved === 'true';
  });

  // Persist Pomodoro widget open state across refreshes (user-specific)
  useEffect(() => {
    try {
      setUserItem('pomodoroWidgetOpen', String(showPomodoroWidget));
    } catch {
      // ignore
    }
  }, [showPomodoroWidget]);

  // Ensure the Pomodoro widget re-opens when a timer starts (and closes when the user ends it).
  useEffect(() => {
    const handleStarted = () => setShowPomodoroWidget(true);
    const handleClose = () => setShowPomodoroWidget(false);

    window.addEventListener('pomodoro:started', handleStarted as any);
    window.addEventListener('pomodoro:close', handleClose as any);

    return () => {
      window.removeEventListener('pomodoro:started', handleStarted as any);
      window.removeEventListener('pomodoro:close', handleClose as any);
    };
  }, []);

  // Persist all form partial inputs across refreshes (except passwords)
  const currentPageRef = useRef(currentPage);
  useEffect(() => {
    currentPageRef.current = currentPage;
  }, [currentPage]);

  useEffect(() => {
    const cleanup = setupFormDraftPersistence(() => String(currentPageRef.current || ''));
    return cleanup;
  }, []);

  const setPage = (page: PageType, mode: 'push' | 'replace' = 'push') => {
    setCurrentPage(page);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('page', page);
      if (mode === 'replace') {
        window.history.replaceState({}, document.title, url.toString());
      } else {
        window.history.pushState({}, document.title, url.toString());
      }
    } catch {
      // ignore
    }
    localStorage.setItem('lastPage', page);
    if (isAuthenticated) {
      localStorage.setItem('lastAuthedPage', page);
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const page = (params.get('page') as PageType | null) || (isAuthenticated ? 'dashboard' : 'home');
        currentPageRef.current = page;
        setCurrentPage(page);
        setShowTimetableResults(false);
        setHasUnsavedTimetable(false);
        localStorage.setItem('lastPage', page);
        if (isAuthenticated) {
          localStorage.setItem('lastAuthedPage', page);
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch {
        // ignore
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isAuthenticated]);

  const rememberCurrentPageForBack = (nextPage: PageType) => {
    const current = currentPageRef.current as PageType;
    if (!current || current === nextPage) return;

    const history = navigationHistoryRef.current;
    if (history[history.length - 1] !== current) {
      navigationHistoryRef.current = [...history, current].slice(-30);
    }
  };

  const handleBackNavigation = () => {
    if (showTimetableResults) {
      setShowTimetableResults(false);
      setHasUnsavedTimetable(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    let previous = navigationHistoryRef.current.pop();
    while (previous && previous === currentPageRef.current) {
      previous = navigationHistoryRef.current.pop();
    }

    setPage(previous || (isAuthenticated ? 'dashboard' : 'home'), 'replace');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Deep-link scaffolding:
  // Visiting /?page=dashboard&startSession=<calendarSessionId> should open dashboard and auto-start that session.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const startSession = params.get('startSession');

    if (startSession) {
      // If auth isn't loaded yet, we still keep it in state and also persist as a fallback.
      setDeepLinkStartSessionId(startSession);
      localStorage.setItem('pendingStartSessionId', startSession);
    }
  }, []);

  // When auth resolves, normalize the page so refresh doesn't dump you to dashboard by default.
  useEffect(() => {
    // Don't run redirect/normalization logic until auth has hydrated from storage.
    if (!authReady) return;
    
    if (isAuthenticated) {
      const params = new URLSearchParams(window.location.search);
      const urlPage = params.get('page') as PageType | null;
      const lastAuthed = (localStorage.getItem('lastAuthedPage') as PageType | null) || 'dashboard';
      const safe = urlPage || (currentPage === 'home' || currentPage === 'auth' || currentPage === 'terms' || currentPage === 'privacy' ? lastAuthed : currentPage);
      if (safe !== currentPage) setPage(safe, 'replace');
    } else {
      // If unauth but URL says dashboard page, bounce to home.
      if (currentPage !== 'home' && currentPage !== 'auth' && currentPage !== 'terms' && currentPage !== 'privacy') {
        setPage('home', 'replace');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, isAuthenticated]);

  // Check onboarding status from backend once we have a user id.
  // IMPORTANT: do not depend on `clientWelcomeOpen` here.
  // When the user clicks Next on the Welcome screen, we flip `clientWelcomeOpen` to false.
  // If this effect re-runs, it re-fetches the profile and forces the Welcome open again
  // (because onboarding_completed is still false), trapping the user on Step 1.
  useEffect(() => {
    if (!isAuthenticated) {
      // Guest/public mode: always allow the client-side welcome to drive onboarding.
      setOnboardingChecked(true);
      setOnboardingCompleted(false);
      setAutoStartTour(false);
      setShowWelcome(clientWelcomeOpen);
      return;
    }

    const userId = localStorage.getItem('currentUserId');
    if (!userId) return;

    let cancelled = false;
    (async () => {
      try {
        const profile = await apiJsonAuthed<any>(`/user/${encodeURIComponent(userId)}`, 'GET');
        if (cancelled) return;
        const completed = Boolean(profile?.onboarding_completed);
        setOnboardingCompleted(completed);
        setOnboardingChecked(true);

        // New users: show a welcome overlay first, then start the tour when they click Next.
        if (!completed) {
          setAutoStartTour(false);
          setShowWelcome(true);
          // Ensure we show the Welcome screen even if the client flag was set previously.
          setClientWelcomeOpen(true);
          if (currentPage !== 'dashboard') setPage('dashboard');
        } else {
          setAutoStartTour(false);
          setShowWelcome(false);
        }
      } catch (e) {
        // If profile fetch fails, don't hard-block the app.
        if (cancelled) return;
        setOnboardingChecked(true);
        setOnboardingCompleted(true);
        setAutoStartTour(false);
        setShowWelcome(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const shouldShowWelcome = clientWelcomeOpen && (!isAuthenticated || (!onboardingCompleted && onboardingChecked && showWelcome));

  const clearProfileQuestionnaireQuery = () => {
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.has('showProfileQuestionnaire')) {
        url.searchParams.delete('showProfileQuestionnaire');
        window.history.replaceState({}, document.title, url.toString());
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (!authReady || !isAuthenticated) {
      setShowProfileQuestionnaire(false);
      return;
    }

    const userId = localStorage.getItem('currentUserId');
    if (!userId) {
      setShowProfileQuestionnaire(false);
      return;
    }

    setShowProfileQuestionnaire(
      localStorage.getItem(`uplan_profile_questionnaire_pending_${userId}`) === 'true'
    );
  }, [authReady, isAuthenticated]);

  useEffect(() => {
    if (!authReady || !isAuthenticated) return;

    try {
      const url = new URL(window.location.href);
      const shouldForceOpen = url.searchParams.get('showProfileQuestionnaire');
      if (shouldForceOpen === '1' || shouldForceOpen === 'true') {
        setShowProfileQuestionnaire(true);
      }
    } catch {
      // ignore
    }
  }, [authReady, isAuthenticated, currentPage]);

  useEffect(() => {
    if (!authReady || !isAuthenticated) {
      setShowSubscriptionPrompt(false);
      return;
    }

    const currentPlan = getUserItem('subscriptionPlan');
    if (currentPlan === 'pro' || currentPlan === 'university') {
      setShowSubscriptionPrompt(false);
      return;
    }

    const lastSeen = Number(getUserItem('subscriptionPromptLastSeen') || '0');
    const shouldShow = !lastSeen || Date.now() - lastSeen >= SUBSCRIPTION_PROMPT_INTERVAL_MS;
    setShowSubscriptionPrompt(shouldShow);
  }, [authReady, isAuthenticated]);

  const closeSubscriptionPrompt = () => {
    setUserItem('subscriptionPromptLastSeen', String(Date.now()));
    setShowSubscriptionPrompt(false);
  };

  const handleSelectSubscriptionPlan = (plan: SubscriptionPlan) => {
    setUserItem('subscriptionPromptLastSeen', String(Date.now()));

    if (plan === 'free') {
      setUserItem('subscriptionPlan', 'free');
      setShowSubscriptionPrompt(false);
      toast.success(t('app.toasts.freePlanSelected', 'Free plan selected'));
      return;
    }

    const checkoutUrl =
      plan === 'pro'
        ? import.meta.env.VITE_STRIPE_CHECKOUT_URL
        : import.meta.env.VITE_UNIVERSITY_PLAN_CONTACT_URL || import.meta.env.VITE_STRIPE_CHECKOUT_URL;

    if (checkoutUrl) {
      window.location.href = checkoutUrl;
      return;
    }

    setShowSubscriptionPrompt(false);
    toast.error(t('app.toasts.paymentLinkMissing', 'Payment link is not configured yet. Add it in frontend/UPLAN/.env.'));
  };

  // If the Welcome is visible, ensure the walkthrough doesn't start underneath it.
  useEffect(() => {
    if (shouldShowWelcome) setAutoStartTour(false);
  }, [shouldShowWelcome]);

  const completeOnboarding = async () => {
    const userId = localStorage.getItem('currentUserId');
    // Guest mode: just persist the client welcome flag.
    if (!userId) {
      markWelcomeSeen();
      return;
    }
    await apiJsonAuthed(`/user/${encodeURIComponent(userId)}`, 'PUT', { onboarding_completed: true });
    setOnboardingCompleted(true);
    setOnboardingChecked(true);
    setAutoStartTour(false);
    setShowWelcome(false);
  };

  // When auth becomes available, re-hydrate any pending deep-link that might have been opened on a fresh app start.
  useEffect(() => {
    if (!isAuthenticated) return;
    const pending = localStorage.getItem('pendingStartSessionId');
    if (pending && !deepLinkStartSessionId) {
      setDeepLinkStartSessionId(pending);
    }
  }, [isAuthenticated, deepLinkStartSessionId]);

  const consumeDeepLinkStartSession = () => {
    setDeepLinkStartSessionId(null);
    localStorage.removeItem('pendingStartSessionId');

    // Clean up URL param so refresh doesn't re-trigger the auto-start.
    const url = new URL(window.location.href);
    url.searchParams.delete('startSession');
    window.history.replaceState({}, document.title, url.toString());
  };

  // Navigation handler
  const handleNavigate = (page: string, settingsTab?: SettingsSection) => {
    // Check if there's an unsaved timetable
    if (hasUnsavedTimetable && showTimetableResults && page !== 'create-timetable') {
      // Show warning dialog
      setPendingNavigationPage(page);
      setShowUnsavedDialog(true);
      return;
    }

    // Guard: admin page is global-admin only
    if (page === 'admin' && !isGlobalAdmin) {
      toast.error(t('app.toasts.noAdminAccess', 'You do not have access to Admin.'));
      return;
    }

    // Normal navigation
    const nextPage = page as PageType;
    rememberCurrentPageForBack(nextPage);
    setPage(nextPage);
    setShowTimetableResults(false);
    if (page === 'settings' && settingsTab) {
      setSettingsSection(settingsTab);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Authentication handlers
  const handleLogin = (name: string, email: string, remember = true) => {
    login(name, email, remember);
    // New users will be routed to Welcome after profile fetch.
    setPage('dashboard');
  };

  const handleLogout = () => {
    const success = logout();
    if (success) {
      setPage('home');
    }
  };

  // Timetable handlers
  const handleGenerateTimetable = (data: TimetableData) => {
    setCurrentTimetableData(data);
    setShowTimetableResults(true);
    setHasUnsavedTimetable(true);
  };

  const handleSaveTimetable = (timetable: any) => {
    saveTimetable(timetable);
    setShowTimetableResults(false);
    setPage('view-timetables');
    setHasUnsavedTimetable(false);
  };

  const handleViewTimetable = (timetable: any) => {
    setCurrentTimetableData(timetable);
    setShowTimetableResults(true);
    setHasUnsavedTimetable(false);
  };

  // Handle dialog actions
  const handleDiscardTimetable = () => {
    setHasUnsavedTimetable(false);
    setShowUnsavedDialog(false);
    if (pendingNavigationPage) {
      const nextPage = pendingNavigationPage as PageType;
      rememberCurrentPageForBack(nextPage);
      setPage(nextPage);
      setShowTimetableResults(false);
      setPendingNavigationPage(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleStayOnPage = () => {
    setShowUnsavedDialog(false);
    setPendingNavigationPage(null);
  };

  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-neutral-950">
        <div className="flex flex-col items-center gap-6 px-6 text-center">
          <img
            src={logoImage}
            alt={t('auth.brand.logoAlt')}
            className="h-28 w-28 object-contain sm:h-36 sm:w-36"
          />
          <div className="space-y-1">
            <p className="text-base font-semibold text-neutral-950 dark:text-neutral-50">U PLAN</p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {t('common.loading', 'Loading...')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  
  if (isAuthenticated ) {
    return (
      <TourProvider>
        <PomodoroProvider>
          <GlobalTextLocalizer />
          <EnhancedDashboardLayout
            currentPage={currentPage}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
            userName={user?.name || 'User'}
            userEmail={user?.email || ''}
            onShowPomodoroWidget={() => setShowPomodoroWidget(true)}
            isGlobalAdmin={isGlobalAdmin}
            darkMode={darkMode}
            onToggleDarkMode={toggleDarkMode}
          >
            <DashboardPages
              currentPage={currentPage}
              userName={user.name}
              timetables={timetables}
              showTimetableResults={showTimetableResults}
              currentTimetableData={currentTimetableData}
              darkMode={darkMode}
              settingsSection={settingsSection}
              onNavigate={handleNavigate}
              onBack={handleBackNavigation}
              onGenerateTimetable={handleGenerateTimetable}
              onSaveTimetable={handleSaveTimetable}
              onDeleteTimetable={deleteTimetable}
              onViewTimetable={handleViewTimetable}
              onSetActiveTimetable={setActiveTimetable}
              onRenameTimetable={renameTimetable}
              onDuplicateTimetable={duplicateTimetable}
              onApplyTimetableToWeek={applyTimetableToWeek}
              onSaveCalendarTimetable={saveCalendarTimetable}
              onUpdateUserName={updateUserName}
              onToggleDarkMode={toggleDarkMode}
              onHideResults={() => setShowTimetableResults(false)}
              onShowPomodoroWidget={() => setShowPomodoroWidget(true)}
              autoStartSessionId={deepLinkStartSessionId || undefined}
              onAutoStartConsumed={consumeDeepLinkStartSession}
              onFinishOnboarding={completeOnboarding}
              onSkipOnboarding={completeOnboarding}
              isGlobalAdmin={isGlobalAdmin}
            />
          </EnhancedDashboardLayout>
          <Toaster
            position="top-center"
            richColors={false}
            closeButton={false}
            expand={false}
            visibleToasts={5}
            toastOptions={{
              duration: 1000,
              className:
                "rounded-2xl border border-black/10 bg-white px-4 py-3 text-black opacity-100 shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:border-white/10 dark:bg-neutral-950 dark:text-white",
              descriptionClassName:
                "mt-1 text-[13px] leading-5 !text-black !opacity-100 dark:!text-white/65",
            }}
          />
          <UnsavedTimetableDialog
            show={showUnsavedDialog}
            onClose={() => setShowUnsavedDialog(false)}
            onConfirm={() => {
              if (pendingNavigationPage) {
                handleNavigate(pendingNavigationPage);
              }
            }}
            onDiscard={handleDiscardTimetable}
            onStay={handleStayOnPage}
          />
          {showPomodoroWidget && (
            <Suspense fallback={null}>
              <PomodoroWidget
                show={showPomodoroWidget}
                onClose={() => setShowPomodoroWidget(false)}
              />
            </Suspense>
          )}

          {/* First-time welcome (blurred background + image) */}
          <PostSignupQuestionnaire
            open={showProfileQuestionnaire && onboardingCompleted}
            currentUserName={user?.name}
            onComplete={(updatedName) => {
              const userId = localStorage.getItem('currentUserId');
              if (userId) {
                localStorage.removeItem(`uplan_profile_questionnaire_pending_${userId}`);
              }
              if (updatedName) {
                updateUserName(updatedName);
              }
              clearProfileQuestionnaireQuery();
              setShowProfileQuestionnaire(false);
            }}
            onSkip={() => {
              const userId = localStorage.getItem('currentUserId');
              if (userId) {
                localStorage.removeItem(`uplan_profile_questionnaire_pending_${userId}`);
              }
              clearProfileQuestionnaireQuery();
              setShowProfileQuestionnaire(false);
            }}
          />
          <WelcomeOverlay
            open={!showProfileQuestionnaire && shouldShowWelcome}
            imageSrc={welcomeImg}
            currentStep={1}
            totalSteps={onboardingTotalSteps}
            title={t('app.welcome.title', 'Welcome to U PLAN')}
            body={
              t(
                'app.welcome.body',
                "Ready to turn school stress into a clear plan?\n\nIn the next 60 seconds, we'll show you where to:\n- update your profile\n- generate a clean timetable\n- track today's sessions\n\nTap Next to start the walkthrough.",
              )
            }
            onNext={() => {
              markWelcomeSeen();
              setAutoStartTour(true);
            }}
            onSkip={() => {
              markWelcomeSeen();
              // If authed, also mark onboarding complete on the backend.
              if (isAuthenticated) completeOnboarding();
            }}
          />

          {/* checkpoint-02: demo tour scaffold only (not wired to page navigation/DOM targets yet) */}
          <TourOverlay
            onNavigate={handleNavigate}
            autoStart={!showProfileQuestionnaire && autoStartTour}
            onFinishOnboarding={completeOnboarding}
          />
          <SubscriptionPrompt
            open={showSubscriptionPrompt && !shouldShowWelcome && !showProfileQuestionnaire}
            onClose={closeSubscriptionPrompt}
            onSelectPlan={handleSelectSubscriptionPlan}
          />
        </PomodoroProvider>
      </TourProvider>
    );
  }

  // Render public view
  return (
    <TourProvider>
      <div className="min-h-screen bg-background">
        <GlobalTextLocalizer />
        {currentPage !== 'auth' && (
          <Navigation currentPage={currentPage} onNavigate={handleNavigate} />
        )}
        <PublicPages
          currentPage={currentPage}
          onNavigate={handleNavigate}
          onBack={handleBackNavigation}
          onLogin={handleLogin}
        />
        <Toaster
            position="top-center"
            richColors={false}
            closeButton={false}
            expand={false}
            visibleToasts={5}
            toastOptions={{
              duration: 1000,
              className:
                "rounded-2xl border border-black/10 bg-white px-4 py-3 text-black opacity-100 shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:border-white/10 dark:bg-neutral-950 dark:text-white",
              descriptionClassName:
                "mt-1 text-[13px] leading-5 !text-black !opacity-100 dark:!text-white/65",
            }}
          />

        {/* First-time welcome (guest/public mode) */}
        <WelcomeOverlay
          open={shouldShowWelcome}
          imageSrc={welcomeImg}
          currentStep={1}
          totalSteps={onboardingTotalSteps}
          title={t('app.welcome.title', 'Welcome to U PLAN')}
          body={
            t(
              'app.welcome.body',
              "Ready to turn school stress into a clear plan?\n\nIn the next 60 seconds, we'll show you where to:\n- update your profile\n- generate a clean timetable\n- track today's sessions\n\nTap Next to start the walkthrough.",
            )
          }
          onNext={() => {
            markWelcomeSeen();
            setAutoStartTour(true);
          }}
          onSkip={() => {
            markWelcomeSeen();
          }}
        />

        {/* checkpoint-02: demo tour scaffold only (not wired to page navigation/DOM targets yet) */}
        <TourOverlay
          onNavigate={handleNavigate}
          autoStart={autoStartTour}
          onFinishOnboarding={completeOnboarding}
        />
      </div>
    </TourProvider>
  );
  
}
