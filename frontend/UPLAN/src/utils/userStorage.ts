// Helper functions for user-specific localStorage

// Storage keys for auth
const STORAGE_KEYS = {
  IS_AUTHENTICATED: 'isAuthenticated',
  USER_NAME: 'userName',
  USER_EMAIL: 'userEmail',
};

/**
 * Initialize currentUserEmail on module load
 * This ensures it's available before any components try to access user data
 */
const initializeCurrentUserEmail = () => {
  const isAuthenticated = localStorage.getItem(STORAGE_KEYS.IS_AUTHENTICATED) === 'true';
  const userEmail = localStorage.getItem(STORAGE_KEYS.USER_EMAIL);
  
  if (isAuthenticated && userEmail) {
    localStorage.setItem('currentUserEmail', userEmail);
    console.log(`[UserStorage] Initialized currentUserEmail on module load: ${userEmail}`);
  } else {
    console.log('[UserStorage] No authenticated user found on module load');
  }
};

// Initialize immediately when this module loads
initializeCurrentUserEmail();

/**
 * Get the current user's email from localStorage
 */
export const getCurrentUserEmail = (): string | null => {
  let email = localStorage.getItem('currentUserEmail');
  
  // If not set, try to initialize it now (defensive check)
  if (!email) {
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    const userEmail = localStorage.getItem('userEmail');
    
    if (isAuthenticated && userEmail) {
      localStorage.setItem('currentUserEmail', userEmail);
      email = userEmail;
      console.log(`[UserStorage] Lazy initialized currentUserEmail: ${userEmail}`);
    }
  }
  
  return email;
};

/**
 * Generate a user-specific key for localStorage
 * @param key - The base key name
 * @returns User-specific key or falls back to global key if no user is logged in
 */
export const getUserKey = (key: string): string => {
  const userEmail = getCurrentUserEmail();
  if (!userEmail) {
    // Only warn if user IS authenticated but email is missing (this would be a bug)
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    if (isAuthenticated) {
      console.error(`[UserStorage] BUG: User is authenticated but currentUserEmail not set! Using global key: ${key}`);
    }
    // Don't warn if user is simply not logged in - that's expected
    return key;
  }
  return `${userEmail}_${key}`;
};

/**
 * Get item from user-specific localStorage
 */
export const getUserItem = (key: string): string | null => {
  return localStorage.getItem(getUserKey(key));
};

/**
 * Set item to user-specific localStorage
 */
export const setUserItem = (key: string, value: string): void => {
  localStorage.setItem(getUserKey(key), value);
};

/**
 * Remove item from user-specific localStorage
 */
export const removeUserItem = (key: string): void => {
  localStorage.removeItem(getUserKey(key));
};

/**
 * Clear all data for the current user
 */
export const clearUserData = (): void => {
  const userEmail = getCurrentUserEmail();
  if (!userEmail) return;

  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(`${userEmail}_`)) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach(key => localStorage.removeItem(key));
};

/**
 * Get user-specific week key for calendar sessions
 */
export const getUserWeekKey = (weekId: string): string => {
  const userEmail = getCurrentUserEmail();
  if (!userEmail) {
    return `calendarSessions_${weekId}`;
  }
  return `${userEmail}_calendarSessions_${weekId}`;
};