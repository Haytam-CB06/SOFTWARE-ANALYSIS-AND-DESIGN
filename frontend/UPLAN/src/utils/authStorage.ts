// Small helper so we can safely run two accounts in two tabs during local testing.
// Priority: sessionStorage (per-tab) -> localStorage (fallback / legacy)

export function getStored(key: string): string | null {
  try {
    return sessionStorage.getItem(key) ?? localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function setStored(key: string, value: string) {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // ignore
  }
  try {
    // Keep legacy behavior for users who rely on persistence across restarts.
    localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

export function clearStored(key: string) {
  try {
    sessionStorage.removeItem(key);
  } catch {}
  try {
    localStorage.removeItem(key);
  } catch {}
}

export function getCurrentUserEmail(): string | null {
  return getStored('currentUserEmail');
}

export function getCurrentUserId(): string | null {
  return getStored('currentUserId');
}

export function getCurrentUserName(): string | null {
  return getStored('currentUserName');
}
