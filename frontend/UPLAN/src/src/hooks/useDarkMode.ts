import { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { applyDarkMode, getInitialDarkMode, subscribeToDarkModeChanges } from '../../utils/theme';

/**
 * Custom hook for managing dark mode
 */
export const useDarkMode = () => {
  const [darkMode, setDarkMode] = useState(getInitialDarkMode);

  // Load dark mode from storage on mount
  useEffect(() => {
    setDarkMode(getInitialDarkMode());
    applyDarkMode(getInitialDarkMode());
    return subscribeToDarkModeChanges(setDarkMode);
  }, []);

  // Apply dark mode class to document and save to storage
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
    }
    storageService.saveDarkMode(darkMode);
  }, [darkMode]);

  return {
    darkMode,
    toggleDarkMode: setDarkMode,
  };
};
