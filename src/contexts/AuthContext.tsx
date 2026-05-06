import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { UserRecord } from '../types';
import { getIdToken } from '../api';
import { getMe } from '../api/authService';
import { ensureArtistProfileListedForDiscovery } from '../api/artistProfileService';
import { clearAuthStorage } from '../helpers/authStorage';
import { isBackendRoleArtista, normalizeRole } from '../helpers/role';

interface AuthState {
  user: UserRecord | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  setUser: (user: UserRecord | null) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<UserRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const idToken = getIdToken();
    if (!idToken) {
      setUserState(null);
      setIsLoading(false);
      return;
    }
    try {
      const res = await getMe();
      const userData = res.data;
      const normalizedRole = userData.role ? normalizeRole(userData.role) : userData.role;
      setUserState({
        ...userData,
        role: normalizedRole,
      });

      if (userData.uid && isBackendRoleArtista(normalizedRole)) {
        void ensureArtistProfileListedForDiscovery(userData.uid);
      }
    } catch {
      clearAuthStorage();
      setUserState(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const setUser = useCallback((u: UserRecord | null) => {
    setUserState(u);
  }, []);

  const logout = useCallback(() => {
    clearAuthStorage();
    setUserState(null);
  }, []);

  const value: AuthContextValue = {
    user,
    isLoading,
    isAuthenticated: !!user,
    setUser,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
