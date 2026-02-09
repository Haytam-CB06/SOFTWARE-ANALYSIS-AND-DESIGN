import Dashboard from '../../components/Dashboard';
import CalendarView from '../../components/CalendarView';
import CreateTimetable from '../../components/CreateTimetable';
import ViewTimetables from '../../components/ViewTimetables';
import AutoGenerateTimetable from '../../components/AutoGenerateTimetable';
import AssessmentsDeadlines from '../../components/AssessmentsDeadlines';
import GoalsAchievements from '../../components/GoalsAchievements';
import Settings from '../../components/Settings';
import TimetableResults from '../../components/TimetableResults';
import Workspace from '../../components/Workspace';
import WelcomeWalkthrough from '../../components/WelcomeWalkthrough';
import GlobalAdminDashboard from '../../components/GlobalAdminDashboard';
import Notebook from "../../components/Notebook";
import { PageType, Timetable, TimetableData, Session, SettingsSection } from '../types';

interface DashboardPagesProps {
  currentPage: PageType;
  userName: string;
  timetables: Timetable[];
  showTimetableResults: boolean;
  currentTimetableData: TimetableData | null;
  darkMode: boolean;
  settingsSection: SettingsSection;
  onNavigate: (page: string) => void;
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

  // Deep-link support: /?page=dashboard&startSession=<calendarSessionId>
  autoStartSessionId?: string;
  onAutoStartConsumed?: () => void;

  // Role gating
  isGlobalAdmin?: boolean;
}

/**
 * Renders dashboard pages (after authentication)
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
  // If showing timetable results
  if (showTimetableResults && currentTimetableData) {
    return (
      <TimetableResults
        timetableData={currentTimetableData}
        onSave={onSaveTimetable}
        onEdit={onHideResults}
        onBack={() => {
          onHideResults();
          onNavigate('dashboard');
        }}
      />
    );
  }

  // Regular dashboard pages
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
      // Force user scope so workspace auto-generate never clobbers personal inputs.
      return <AutoGenerateTimetable scope="user" onNavigate={onNavigate} />;
    case 'assessments-deadlines':
      return <AssessmentsDeadlines onNavigate={onNavigate} />;
    case 'goals-achievements':
      return <GoalsAchievements onNavigate={onNavigate} />;
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
      return <Workspace onNavigate={onNavigate} />;
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
        />
      );
  }
};