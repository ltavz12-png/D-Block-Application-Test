import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  User,
  RegisterPayload,
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout,
  getMe,
} from '@/services/auth';
import { getTokens, setTokens, clearTokens } from '@/services/api';

// ── Types ───────────────────────────────────────────────────────────────

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (
    email: string,
    password: string,
    twoFactorCode?: string,
  ) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

// ── Context ─────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ── Provider ────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Auto-load user from stored tokens on mount
  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      try {
        const { accessToken } = await getTokens();
        if (!accessToken) {
          if (mounted) {
            setState({ user: null, isAuthenticated: false, isLoading: false });
          }
          return;
        }

        const user = await getMe();
        if (mounted) {
          setState({ user, isAuthenticated: true, isLoading: false });
        }
      } catch {
        await clearTokens();
        if (mounted) {
          setState({ user: null, isAuthenticated: false, isLoading: false });
        }
      }
    }

    loadUser();

    return () => {
      mounted = false;
    };
  }, []);

  const login = useCallback(
    async (email: string, password: string, twoFactorCode?: string) => {
      setState((prev) => ({ ...prev, isLoading: true }));
      try {
        const response = await apiLogin(email, password, twoFactorCode);
        await setTokens(response.tokens.accessToken, response.tokens.refreshToken);
        setState({
          user: response.user,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch (error) {
        setState((prev) => ({ ...prev, isLoading: false }));
        throw error;
      }
    },
    [],
  );

  const register = useCallback(async (payload: RegisterPayload) => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const response = await apiRegister(payload);
      await setTokens(response.tokens.accessToken, response.tokens.refreshToken);
      setState({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      setState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      const { refreshToken } = await getTokens();
      if (refreshToken) {
        await apiLogout(refreshToken);
      }
    } catch {
      // Silently fail – we still want to clear local state
    } finally {
      await clearTokens();
      setState({ user: null, isAuthenticated: false, isLoading: false });
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      const user = await getMe();
      setState({ user, isAuthenticated: true, isLoading: false });
    } catch {
      await clearTokens();
      setState({ user: null, isAuthenticated: false, isLoading: false });
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      login,
      register,
      logout,
      refresh,
    }),
    [state, login, register, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ── Hook ────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
