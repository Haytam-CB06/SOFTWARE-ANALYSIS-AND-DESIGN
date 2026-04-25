// Type definitions for the application

export interface User {
  name: string;
  email: string;
}

export interface Session {
  id: string;
  subject: string;
  startTime: string;
  endTime: string;
  day: number;
  type: 'reading' | 'revision' | 'practice' | 'break' | 'lecture' | 'assignment' | 'test' | 'exam';
  color: string;
  priority?: 'high' | 'medium' | 'low';
  deadline?: string; // ISO date string for assignment, test, exam
}

export interface ScheduleSession {
  subject: string;
  startTime: string;
  endTime: string;
  type: 'study' | 'break' | 'blocked';
  priority?: string;
  color?: string;
  title?: string; // For blocked sessions
  duration?: number; // Duration in minutes
}

export interface DaySchedule {
  day: string;
  sessions: ScheduleSession[];
}

export interface Timetable {
  id: string;
  name: string;
  weekStartDate: string;
  schedule: DaySchedule[];
  isActive: boolean;
  createdAt: string;
  calendarSessions?: Session[];
  availabilitySettings?: any; // Availability settings from ImportDialog
}

export interface TimetableData {
  id: string;
  name: string;
  weekStartDate: string;
  schedule: DaySchedule[];
}

export type PageType = 
  | 'home' 
  | 'auth' 
  | 'terms' 
  | 'privacy' 
  | 'welcome'
  | 'dashboard' 
  | 'my-timetable' 
  | 'auto-generate'
  | 'assessments-deadlines'
  | 'goals-achievements'
  | 'create-timetable' 
  | 'view-timetables' 
  | 'workspace'
  | 'messages'
  | 'admin'
  | 'notebook'
  | 'settings'
  | 'notes';

export type SettingsSection = 'profile' | 'webapp';
