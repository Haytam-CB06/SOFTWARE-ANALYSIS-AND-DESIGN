import { STORAGE_KEYS } from '../constants';
import { User, Timetable, Session } from '../types';
import { getUserItem, setUserItem, getCurrentUserEmail, getUserWeekKey } from '../../utils/userStorage';
import { getStoredDarkMode, saveDarkMode } from '../../utils/theme';

/**
 * Storage service for handling localStorage operations
 */
class StorageService {
  private getPersistentStorage(remember: boolean): Storage {
    return remember ? localStorage : sessionStorage;
  }

  private getStoredAuthSource(): Storage | null {
    const localAuth = localStorage.getItem(STORAGE_KEYS.IS_AUTHENTICATED) === 'true';
    if (localAuth) return localStorage;

    const sessionAuth = sessionStorage.getItem(STORAGE_KEYS.IS_AUTHENTICATED) === 'true';
    if (sessionAuth) return sessionStorage;

    return null;
  }

  // User authentication
  getAuth(): { isAuthenticated: boolean; user: User | null } {
    const authStorage = this.getStoredAuthSource();
    if (!authStorage) {
      return { isAuthenticated: false, user: null };
    }

    const isAuthenticated = authStorage.getItem(STORAGE_KEYS.IS_AUTHENTICATED) === 'true';
    const userName = authStorage.getItem(STORAGE_KEYS.USER_NAME);
    const userEmail = authStorage.getItem(STORAGE_KEYS.USER_EMAIL);

    if (isAuthenticated && userName && userEmail) {
      // IMPORTANT: Set currentUserEmail so user-specific storage works on app reload
      localStorage.setItem('currentUserEmail', userEmail);
      
      return {
        isAuthenticated: true,
        user: { name: userName, email: userEmail },
      };
    }

    return { isAuthenticated: false, user: null };
  }

  saveAuth(user: User, remember = true): void {
    const targetStorage = this.getPersistentStorage(remember);
    const otherStorage = remember ? sessionStorage : localStorage;

    otherStorage.removeItem(STORAGE_KEYS.IS_AUTHENTICATED);
    otherStorage.removeItem(STORAGE_KEYS.USER_NAME);
    otherStorage.removeItem(STORAGE_KEYS.USER_EMAIL);

    targetStorage.setItem(STORAGE_KEYS.IS_AUTHENTICATED, 'true');
    targetStorage.setItem(STORAGE_KEYS.USER_NAME, user.name);
    targetStorage.setItem(STORAGE_KEYS.USER_EMAIL, user.email);
    localStorage.setItem('rememberMe', remember ? 'true' : 'false');
    // Set current user email for user-specific data isolation
    localStorage.setItem('currentUserEmail', user.email);
  }

  clearAuth(): void {
    localStorage.removeItem(STORAGE_KEYS.IS_AUTHENTICATED);
    localStorage.removeItem(STORAGE_KEYS.USER_NAME);
    localStorage.removeItem(STORAGE_KEYS.USER_EMAIL);
    sessionStorage.removeItem(STORAGE_KEYS.IS_AUTHENTICATED);
    sessionStorage.removeItem(STORAGE_KEYS.USER_NAME);
    sessionStorage.removeItem(STORAGE_KEYS.USER_EMAIL);
    localStorage.removeItem('rememberMe');
    // Clear current user email when logging out
    localStorage.removeItem('currentUserEmail');
  }

  updateUserName(name: string): void {
    localStorage.setItem(STORAGE_KEYS.USER_NAME, name);
    sessionStorage.setItem(STORAGE_KEYS.USER_NAME, name);
  }

  // Timetables - now using user-specific storage
  getTimetables(): Timetable[] {
    const savedTimetables = getUserItem(STORAGE_KEYS.TIMETABLES);
    if (savedTimetables) {
      try {
        return JSON.parse(savedTimetables);
      } catch (e) {
        console.error('Error loading timetables:', e);
        return [];
      }
    }
    return [];
  }

  saveTimetables(timetables: Timetable[]): void {
    setUserItem(STORAGE_KEYS.TIMETABLES, JSON.stringify(timetables));
  }

  // Calendar sessions
  getCalendarSessions(): Session[] {
    const savedSessions = localStorage.getItem(STORAGE_KEYS.CALENDAR_SESSIONS);
    if (savedSessions) {
      try {
        return JSON.parse(savedSessions);
      } catch (e) {
        console.error('Error loading calendar sessions:', e);
        return [];
      }
    }
    return [];
  }

  saveCalendarSessions(sessions: Session[]): void {
    localStorage.setItem(STORAGE_KEYS.CALENDAR_SESSIONS, JSON.stringify(sessions));
  }

  saveCalendarSessionsForWeek(sessions: Session[], weekId: string): void {
    // Use user-specific week key for data isolation
    localStorage.setItem(getUserWeekKey(weekId), JSON.stringify(sessions));
  }

  // Dark mode
  getDarkMode(): boolean | null {
    return getStoredDarkMode();
  }

  saveDarkMode(darkMode: boolean): void {
    saveDarkMode(darkMode);
  }
}

export const storageService = new StorageService();
