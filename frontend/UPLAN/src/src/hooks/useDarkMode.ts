import { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';

/**
 * Custom hook for managing dark mode
 */
export const useDarkMode = () => {
  const [darkMode, setDarkMode] = useState(false);

  // Load dark mode from storage on mount
  useEffect(() => {
    const savedDarkMode = storageService.getDarkMode();
    setDarkMode(savedDarkMode);
  }, []);

  // Apply dark mode class to document and save to storage
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    storageService.saveDarkMode(darkMode);
  }, [darkMode]);

  return {
    darkMode,
    toggleDarkMode: setDarkMode,
  };
};
