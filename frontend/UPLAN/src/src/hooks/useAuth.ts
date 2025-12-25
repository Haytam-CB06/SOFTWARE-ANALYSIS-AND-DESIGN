import { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { User } from '../types';

/**
 * Initialize currentUserEmail synchronously BEFORE any component renders
 * This prevents race conditions where components try to access user data
 * before useAuth's useEffect runs
 */
const initializeCurrentUser = () => {
  const { isAuthenticated, user } = storageService.getAuth();
  if (isAuthenticated && user) {
    localStorage.setItem('currentUserEmail', user.email);
    console.log(`[useAuth] Initialized currentUserEmail on module load: ${user.email}`);
  }
};

// Call this immediately when the module loads
initializeCurrentUser();

/**
 * Custom hook for managing authentication state
 */
export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User>({ name: '', email: '' });

  // Load auth state from storage on mount
  useEffect(() => {
    const { isAuthenticated: savedAuth, user: savedUser } = storageService.getAuth();
    if (savedAuth && savedUser) {
      setIsAuthenticated(true);
      setUser(savedUser);
      console.log(`[useAuth] Loaded authenticated user on mount: ${savedUser.email}`);
    }
  }, []);

  const login = (name: string, email: string) => {
    const newUser = { name, email };
    setUser(newUser);
    setIsAuthenticated(true);
    storageService.saveAuth(newUser);
    
    // Dispatch event after a microtask to ensure currentUserEmail is set
    setTimeout(() => {
      window.dispatchEvent(new Event('userChanged'));
      console.log(`[useAuth] User logged in: ${email}, dispatched userChanged event`);
    }, 0);
  };

  const logout = () => {
    if (confirm('Are you sure you want to logout?')) {
      setIsAuthenticated(false);
      setUser({ name: '', email: '' });
      storageService.clearAuth();
      
      // Dispatch event after a microtask to ensure localStorage is cleared
      setTimeout(() => {
        window.dispatchEvent(new Event('userChanged'));
        console.log('[useAuth] User logged out, dispatched userChanged event');
      }, 0);
      
      return true;
    }
    return false;
  };

  const updateUserName = (name: string) => {
    setUser((prev) => ({ ...prev, name }));
    storageService.updateUserName(name);
  };

  return {
    isAuthenticated,
    user,
    login,
    logout,
    updateUserName,
  };
};