import { useState, useEffect, useRef } from 'react';
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
import PomodoroWidget from "./components/PomodoroWidget";
import { PomodoroProvider } from './contexts/PomodoroContext';
import { TourProvider } from './contexts/TourContext';
import TourOverlay, { TOUR_STEPS } from './components/tour/TourOverlay';
import WelcomeOverlay from './components/tour/WelcomeOverlay';
import welcomeImg from './assets/welcome.jpg';
import { registerServiceWorker, handleInstallPrompt } from './utils/registerServiceWorker';
import { GoogleSuccess } from './src/pages/GoogleSuccess';
import { apiJsonAuthed } from './lib/api';
import { setupFormDraftPersistence } from './utils/persistFormDrafts';
import { getUserItem, setUserItem } from './utils/userStorage';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

async function warmBackend(retries = 8) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(`${API_BASE_URL}/health`, { cache: "no-store" });
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("application/json")) return true;
    } catch {}
    await new Promise((r) => setTimeout(r, 1500));
  }
  return false;
}
export default function App() {
  const { isAuthenticated, authReady, user, login, logout, updateUserName } = useAuth();
  const [backendReady, setBackendReady] = useState(false);
  const onboardingTotalSteps = TOUR_STEPS.length + 1; // +1 for Welcome screen
  // Register service worker for PWA support
  useEffect(() => {
    registerServiceWorker();
    handleInstallPrompt();
  }, []);
  
  // ============Remove this effect in checkpoint-01, it's just to wake the backend during development so we don't have to wait on cold starts.===========
  
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const ok = await warmBackend();
      if (!cancelled) setBackendReady(ok);
    })();
    return () => { cancelled = true; };
  }, []);
  // ========================================================================================================================================
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
      toast.success('Signed in with Google');
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

  const setPage = (page: PageType) => {
    setCurrentPage(page);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('page', page);
      window.history.replaceState({}, document.title, url.toString());
    } catch {
      // ignore
    }
    localStorage.setItem('lastPage', page);
    if (isAuthenticated) {
      localStorage.setItem('lastAuthedPage', page);
    }
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
      if (safe !== currentPage) setPage(safe);
    } else {
      // If unauth but URL says dashboard page, bounce to home.
      if (currentPage !== 'home' && currentPage !== 'auth' && currentPage !== 'terms' && currentPage !== 'privacy') {
        setPage('home');
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
      toast.error('You do not have access to Admin.');
      return;
    }

    // Normal navigation
    setPage(page as PageType);
    setShowTimetableResults(false);
    if (page === 'settings' && settingsTab) {
      setSettingsSection(settingsTab);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Authentication handlers
  const handleLogin = (name: string, email: string) => {
    login(name, email);
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
    setCurrentPage('view-timetables');
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
      setCurrentPage(pendingNavigationPage as PageType);
      setShowTimetableResults(false);
      setPendingNavigationPage(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleStayOnPage = () => {
    setShowUnsavedDialog(false);
    setPendingNavigationPage(null);
  };

  // Render authenticated view
  if (isAuthenticated && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }
  if (isAuthenticated ) {
    return (
      <TourProvider>
        <PomodoroProvider>
          <EnhancedDashboardLayout
            currentPage={currentPage}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
            userName={user?.name || 'User'}
            userEmail={user?.email || ''}
            onShowPomodoroWidget={() => setShowPomodoroWidget(true)}
            isGlobalAdmin={isGlobalAdmin}
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
          <Toaster position="top-center" expand={true} richColors closeButton />
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
          <PomodoroWidget
            show={showPomodoroWidget}
            onClose={() => setShowPomodoroWidget(false)}
          />

          {/* First-time welcome (blurred background + image) */}
          <WelcomeOverlay
            open={shouldShowWelcome}
            imageSrc={welcomeImg}
            currentStep={1}
            totalSteps={onboardingTotalSteps}
            title="Welcome to U PLAN 🎉"
            body={
              "Ready to turn school stress into a clear plan?\n\nIn the next 60 seconds, we’ll show you where to:\n• update your profile\n• generate a clean timetable\n• track today’s sessions\n\nTap Next to start the walkthrough."
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
            autoStart={autoStartTour}
            onFinishOnboarding={completeOnboarding}
          />
        </PomodoroProvider>
      </TourProvider>
    );
  }

  // Render public view
  return (
    <TourProvider>
      <div className="min-h-screen bg-background">
        {currentPage !== 'auth' && (
          <Navigation currentPage={currentPage} onNavigate={handleNavigate} />
        )}
        <PublicPages
          currentPage={currentPage}
          onNavigate={handleNavigate}
          onLogin={handleLogin}
        />
        <Toaster position="top-center" expand={true} richColors closeButton />

        {/* First-time welcome (guest/public mode) */}
        <WelcomeOverlay
          open={shouldShowWelcome}
          imageSrc={welcomeImg}
          currentStep={1}
          totalSteps={onboardingTotalSteps}
          title="Welcome to U PLAN 🎉"
          body={
            "Ready to turn school stress into a clear plan?\n\nIn the next 60 seconds, we’ll show you where to:\n• update your profile\n• generate a clean timetable\n• track today’s sessions\n\nTap Next to start the walkthrough."
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
