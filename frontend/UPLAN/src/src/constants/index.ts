// Application constants

export const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

export const COLOR_MAP = {
  'bg-blue-500': '#3B82F6',
  'bg-indigo-500': '#6366F1',
  'bg-purple-500': '#A855F7',
  'bg-pink-500': '#EC4899',
  'bg-red-500': '#EF4444',
  'bg-orange-500': '#F97316',
  'bg-yellow-500': '#EAB308',
  'bg-green-500': '#10B981',
  'bg-teal-500': '#14B8A6',
  'bg-cyan-500': '#06B6D4',
  'bg-gray-400': '#9CA3AF',
} as const;

export const SESSION_TYPE_COLORS = {
  reading: '#3B82F6',
  revision: '#A855F7',
  practice: '#10B981',
  break: '#9CA3AF',
  lecture: '#6366F1',
  assignment: '#F97316',
} as const;

export const PRIORITY_TO_TYPE_MAP = {
  high: 'revision',
  medium: 'reading',
  low: 'practice',
} as const;

export const STORAGE_KEYS = {
  IS_AUTHENTICATED: 'isAuthenticated',
  USER_NAME: 'userName',
  USER_EMAIL: 'userEmail',
  TIMETABLES: 'timetables',
  CALENDAR_SESSIONS: 'calendarSessions',
  DARK_MODE: 'darkMode',
} as const;
