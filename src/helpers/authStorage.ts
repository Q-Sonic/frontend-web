export const AUTH_STORAGE_KEYS = ['idToken', 'refreshToken', 'uid', 'role'] as const;

export type AuthStorageKey = (typeof AUTH_STORAGE_KEYS)[number];

type AuthStorageValue = string | null | undefined;
type AuthStorageValues = Partial<Record<AuthStorageKey, AuthStorageValue>>;

function getSafeStorage(type: 'local' | 'session'): Storage | null {
  try {
    return type === 'local' ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

export function readAuthStorage(key: AuthStorageKey): string | null {
  const sessionValue = getSafeStorage('session')?.getItem(key);
  if (sessionValue) return sessionValue;
  return getSafeStorage('local')?.getItem(key) ?? null;
}

export function clearAuthStorage(): void {
  const local = getSafeStorage('local');
  const session = getSafeStorage('session');

  for (const key of AUTH_STORAGE_KEYS) {
    local?.removeItem(key);
    session?.removeItem(key);
  }
}

export function writeAuthStorage(values: AuthStorageValues, rememberMe: boolean): void {
  const primary = getSafeStorage(rememberMe ? 'local' : 'session');
  const secondary = getSafeStorage(rememberMe ? 'session' : 'local');

  clearAuthStorage();

  for (const key of AUTH_STORAGE_KEYS) {
    const value = values[key];
    if (!value) continue;

    if (primary) {
      primary.setItem(key, value);
      continue;
    }

    secondary?.setItem(key, value);
  }
}
