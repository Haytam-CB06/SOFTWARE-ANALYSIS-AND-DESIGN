import { useState, useEffect } from 'react';
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
import { registerServiceWorker, handleInstallPrompt } from './utils/registerServiceWorker';
import { GoogleSuccess } from './src/pages/GoogleSuccess';

export default function App() {
  // Register service worker for PWA support
  useEffect(() => {
    registerServiceWorker();
    handleInstallPrompt();
  }, []);

  // Custom hooks for state management
  const { isAuthenticated, user, login, logout, updateUserName } = useAuth();
  const {
    timetables,
    saveTimetable,
    deleteTimetable,
    setActiveTimetable,
    saveCalendarTimetable,
  } = useTimetables();
  const { darkMode, toggleDarkMode } = useDarkMode();

  // Local UI state
  const [currentPage, setCurrentPage] = useState<PageType>('home');
  const [currentTimetableData, setCurrentTimetableData] = useState<TimetableData | null>(null);
  const [showTimetableResults, setShowTimetableResults] = useState(false);
  const [settingsSection, setSettingsSection] = useState<SettingsSection>('profile');
  const [hasUnsavedTimetable, setHasUnsavedTimetable] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingNavigationPage, setPendingNavigationPage] = useState<string | null>(null);
  const [showPomodoroWidget, setShowPomodoroWidget] = useState(false);
  const [isPomodoroFloating, setIsPomodoroFloating] = useState(() => {
    // Load floating state from localStorage
    const saved = localStorage.getItem('pomodoroFloating');
    return saved === 'true';
  });

  // Navigation handler
  const handleNavigate = (page: string, settingsTab?: SettingsSection) => {
    // Check if there's an unsaved timetable
    if (hasUnsavedTimetable && showTimetableResults && page !== 'create-timetable') {
      // Show warning dialog
      setPendingNavigationPage(page);
      setShowUnsavedDialog(true);
      return;
    }

    // Normal navigation
    setCurrentPage(page as PageType);
    setShowTimetableResults(false);
    if (page === 'settings' && settingsTab) {
      setSettingsSection(settingsTab);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Authentication handlers
  const handleLogin = (name: string, email: string) => {
    login(name, email);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    const success = logout();
    if (success) {
      setCurrentPage('home');
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
  if (isAuthenticated) {
    return (
      <PomodoroProvider>
        <EnhancedDashboardLayout
          currentPage={currentPage}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
          userName={user?.name || 'User'}
          userEmail={user?.email || ''}
          onShowPomodoroWidget={() => setShowPomodoroWidget(true)}
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
            onSaveCalendarTimetable={saveCalendarTimetable}
            onUpdateUserName={updateUserName}
            onToggleDarkMode={toggleDarkMode}
            onHideResults={() => setShowTimetableResults(false)}
            onShowPomodoroWidget={() => setShowPomodoroWidget(true)}
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
      </PomodoroProvider>
    );
  }

  // Render public view
  return (
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
    </div>
  );
  
}