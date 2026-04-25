const DARK_MODE_KEY = 'darkMode';
const THEME_CHANGE_EVENT = 'uplan:theme-change';

export function getStoredDarkMode(): boolean | null {
  if (typeof window === 'undefined') return null;

  const saved = window.localStorage.getItem(DARK_MODE_KEY);
  if (saved === 'true') return true;
  if (saved === 'false') return false;
  return null;
}

export function getSystemDarkMode(): boolean {
  return (
    typeof window !== 'undefined' &&
    Boolean(window.matchMedia?.('(prefers-color-scheme: dark)').matches)
  );
}

export function getInitialDarkMode(): boolean {
  return getStoredDarkMode() ?? getSystemDarkMode();
}

export function applyDarkMode(darkMode: boolean): void {
  if (typeof document === 'undefined') return;

  document.documentElement.classList.toggle('dark', darkMode);
  document.documentElement.style.colorScheme = darkMode ? 'dark' : 'light';
}

export function saveDarkMode(darkMode: boolean): void {
  if (typeof window === 'undefined') return;

  window.localStorage.setItem(DARK_MODE_KEY, String(darkMode));
  applyDarkMode(darkMode);
  window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: { darkMode } }));
}

export function subscribeToDarkModeChanges(callback: (darkMode: boolean) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleThemeChange = (event: Event) => {
    const customEvent = event as CustomEvent<{ darkMode?: boolean }>;
    if (typeof customEvent.detail?.darkMode === 'boolean') {
      callback(customEvent.detail.darkMode);
    }
  };

  const handleStorageChange = (event: StorageEvent) => {
    if (event.key === DARK_MODE_KEY) callback(getInitialDarkMode());
  };

  window.addEventListener(THEME_CHANGE_EVENT, handleThemeChange);
  window.addEventListener('storage', handleStorageChange);

  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, handleThemeChange);
    window.removeEventListener('storage', handleStorageChange);
  };
}
