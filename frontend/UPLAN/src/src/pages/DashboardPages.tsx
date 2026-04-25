import { lazy, Suspense } from 'react';

import { PageType, Timetable, TimetableData, Session, SettingsSection } from '../types';

const Dashboard = lazy(() => import('../../components/Dashboard'));
const CalendarView = lazy(() => import('../../components/CalendarView'));
const CreateTimetable = lazy(() => import('../../components/CreateTimetable'));
const ViewTimetables = lazy(() => import('../../components/ViewTimetables'));
const AutoGenerateTimetable = lazy(() => import('../../components/AutoGenerateTimetable'));
const AssessmentsDeadlines = lazy(() => import('../../components/AssessmentsDeadlines'));
const GoalsAchievements = lazy(() => import('../../components/GoalsAchievements'));
const Settings = lazy(() => import('../../components/Settings'));
const TimetableResults = lazy(() => import('../../components/TimetableResults'));
const Workspace = lazy(() => import('../../components/Workspace'));
const DirectMessages = lazy(() => import('../../components/DirectMessages'));
const WelcomeWalkthrough = lazy(() => import('../../components/WelcomeWalkthrough'));
const GlobalAdminDashboard = lazy(() => import('../../components/GlobalAdminDashboard'));
const Notebook = lazy(() => import("../../components/Notebook"));

interface DashboardPagesProps {
  currentPage: PageType;
  userName: string;
  timetables: Timetable[];
  showTimetableResults: boolean;
  currentTimetableData: TimetableData | null;
  darkMode: boolean;
  settingsSection: SettingsSection;
  onNavigate: (page: string) => void;
  onBack: () => void;
  onGenerateTimetable: (data: TimetableData) => void;
  onSaveTimetable: (timetable: Timetable) => void;
  onDeleteTimetable: (id: string) => void;
  onViewTimetable: (timetable: Timetable) => void;
  onSetActiveTimetable: (id: string) => void;
  onRenameTimetable: (id: string, newName: string) => void;
  onDuplicateTimetable: (id: string) => void;
  onApplyTimetableToWeek: (id: string, mode: 'overwrite' | 'merge') => void;
  onSaveCalendarTimetable: (sessions: Session[]) => void;
  onUpdateUserName: (name: string) => void;
  onToggleDarkMode: (darkMode: boolean) => void;
  onHideResults: () => void;
  onShowPomodoroWidget?: () => void;
  onFinishOnboarding?: () => Promise<void> | void;
  onSkipOnboarding?: () => Promise<void> | void;
  autoStartSessionId?: string;
  onAutoStartConsumed?: () => void;
  isGlobalAdmin?: boolean;
}

/**
 * Renders authenticated dashboard pages.
 * This component is intentionally logic-focused and delegates
 * visual design to the page-level components it renders.
 */
export const DashboardPages = ({
  currentPage,
  userName,
  timetables,
  showTimetableResults,
  currentTimetableData,
  darkMode,
  settingsSection,
  onNavigate,
  onBack,
  onGenerateTimetable,
  onSaveTimetable,
  onDeleteTimetable,
  onViewTimetable,
  onSetActiveTimetable,
  onRenameTimetable,
  onDuplicateTimetable,
  onApplyTimetableToWeek,
  onSaveCalendarTimetable,
  onUpdateUserName,
  onToggleDarkMode,
  onHideResults,
  onShowPomodoroWidget,
  onFinishOnboarding,
  onSkipOnboarding,
  autoStartSessionId,
  onAutoStartConsumed,
  isGlobalAdmin,
}: DashboardPagesProps) => {
  const pageFallback = (
    <div className="min-h-[60vh] animate-pulse rounded-2xl border border-slate-200 bg-white/70 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
      <div className="h-7 w-48 rounded bg-slate-200 dark:bg-slate-800" />
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="h-32 rounded-xl bg-slate-100 dark:bg-slate-800/70" />
        <div className="h-32 rounded-xl bg-slate-100 dark:bg-slate-800/70" />
        <div className="h-32 rounded-xl bg-slate-100 dark:bg-slate-800/70" />
      </div>
    </div>
  );

  const renderPage = () => {
    if (showTimetableResults && currentTimetableData) {
      return (
        <TimetableResults
          timetableData={currentTimetableData}
          onSave={onSaveTimetable}
          onEdit={onHideResults}
          onBack={() => {
            onHideResults();
          }}
        />
      );
    }

    switch (currentPage) {
      case 'welcome':
        return (
          <WelcomeWalkthrough
            userName={userName}
            onFinish={async () => {
              await onFinishOnboarding?.();
              onNavigate('dashboard');
            }}
            onSkip={async () => {
              await onSkipOnboarding?.();
              onNavigate('dashboard');
            }}
            onNavigate={onNavigate}
          />
        );

      case 'dashboard':
        return (
          <Dashboard
            userName={userName}
            onNavigate={onNavigate}
            timetables={timetables}
            onShowPomodoroWidget={onShowPomodoroWidget}
            autoStartSessionId={autoStartSessionId}
            onAutoStartConsumed={onAutoStartConsumed}
            onSetActiveTimetable={onSetActiveTimetable}
          />
        );

      case 'my-timetable':
        return (
          <CalendarView
            onSaveTimetable={onSaveCalendarTimetable}
            onNavigate={onNavigate}
            isGlobalAdmin={isGlobalAdmin}
          />
        );

      case 'auto-generate':
        return <AutoGenerateTimetable scope="user" onNavigate={onNavigate} onBack={onBack} />;

      case 'assessments-deadlines':
        return <AssessmentsDeadlines onNavigate={onNavigate} onBack={onBack} />;

      case 'goals-achievements':
        return <GoalsAchievements onNavigate={onNavigate} onBack={onBack} />;

      case 'create-timetable':
        return <CreateTimetable onGenerate={onGenerateTimetable} />;

      case 'view-timetables':
        return (
          <ViewTimetables
            timetables={timetables}
            onDelete={onDeleteTimetable}
            onView={onViewTimetable}
            onSetActive={onSetActiveTimetable}
            onRename={onRenameTimetable}
            onDuplicate={onDuplicateTimetable}
            onApplyToWeek={onApplyTimetableToWeek}
            onNavigate={onNavigate}
          />
        );

      case 'admin':
        return <GlobalAdminDashboard />;

      case 'settings':
        return (
          <Settings
            userName={userName}
            onUpdateName={onUpdateUserName}
            darkMode={darkMode}
            onToggleDarkMode={onToggleDarkMode}
            initialSection={settingsSection}
          />
        );

      case 'workspace':
        return (
          <div className="min-w-0 overflow-x-hidden">
            <Workspace onNavigate={onNavigate} />
          </div>
        );

      case 'messages':
        return <DirectMessages />;

      case 'notebook':
        return <Notebook onNavigate={onNavigate} />;

      default:
        return (
          <Dashboard
            userName={userName}
            onNavigate={onNavigate}
            timetables={timetables}
            autoStartSessionId={autoStartSessionId}
            onAutoStartConsumed={onAutoStartConsumed}
            onSetActiveTimetable={onSetActiveTimetable}
          />
        );
    }
  };

  return <Suspense fallback={pageFallback}>{renderPage()}</Suspense>;
};
