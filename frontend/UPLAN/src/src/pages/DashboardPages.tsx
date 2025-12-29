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
  onSaveCalendarTimetable: (sessions: Session[]) => void;
  onUpdateUserName: (name: string) => void;
  onToggleDarkMode: (darkMode: boolean) => void;
  onHideResults: () => void;
  onShowPomodoroWidget?: () => void;
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
  onSaveCalendarTimetable,
  onUpdateUserName,
  onToggleDarkMode,
  onHideResults,
  onShowPomodoroWidget,
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
    case 'dashboard':
      return (
        <Dashboard
          userName={userName}
          onNavigate={onNavigate}
          timetables={timetables}
          onShowPomodoroWidget={onShowPomodoroWidget}
        />
      );
    case 'my-timetable':
      return <CalendarView onSaveTimetable={onSaveCalendarTimetable} onNavigate={onNavigate} />;
    case 'auto-generate':
	      return <AutoGenerateTimetable onNavigate={onNavigate} />;
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
          onNavigate={onNavigate}
        />
      );
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
      return <Workspace />;
    default:
      return (
        <Dashboard
          userName={userName}
          onNavigate={onNavigate}
          timetables={timetables}
        />
      );
  }
};