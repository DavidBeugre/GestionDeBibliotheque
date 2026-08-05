import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { authService } from '@/services/auth.service';
import { registerSessionExpiredHandler } from '@/services/apiClient';
import type { AuthUser, RoleName } from '@/types';

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasRole: (...roles: RoleName[]) => boolean;
  hasPermission: (code: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Au chargement de l'app : tente de restaurer la session via le cookie httpOnly de refresh
  // (aucun secret n'est jamais lu depuis le stockage du navigateur, voir apiClient.ts).
  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      const result = await authService.refresh();
      if (!cancelled) {
        setUser(result?.user ?? null);
        setIsLoading(false);
      }
    }
    restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    registerSessionExpiredHandler(() => setUser(null));
  }, []);

  const login = async (email: string, password: string) => {
    const loggedInUser = await authService.login(email, password);
    setUser(loggedInUser);
    return loggedInUser;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const refreshUser = async () => {
    const freshUser = await authService.me();
    setUser(freshUser);
  };

  const hasRole = (...roles: RoleName[]) => !!user && roles.includes(user.role);
  const hasPermission = (code: string) => !!user && user.permissions.includes(code);

  return (
    <AuthContext.Provider
      value={{ user, isLoading, isAuthenticated: !!user, login, logout, refreshUser, hasRole, hasPermission }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé à l’intérieur de <AuthProvider>');
  return ctx;
}
