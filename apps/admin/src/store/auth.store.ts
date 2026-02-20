import { create } from 'zustand';
import { User, LoginResponse } from '@/lib/auth';
import { TokenStorage } from '@/lib/api';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  login: (response: LoginResponse) => void;
  logout: () => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: User) => void;
  setLoading: (loading: boolean) => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,

  login: (response: LoginResponse) => {
    TokenStorage.setTokens(response.accessToken, response.refreshToken);

    if (typeof window !== 'undefined') {
      localStorage.setItem('dblock_admin_user', JSON.stringify(response.user));
    }

    set({
      user: response.user,
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  logout: () => {
    TokenStorage.clearTokens();

    if (typeof window !== 'undefined') {
      localStorage.removeItem('dblock_admin_user');
    }

    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  setTokens: (accessToken: string, refreshToken: string) => {
    TokenStorage.setTokens(accessToken, refreshToken);
    set({ accessToken, refreshToken });
  },

  setUser: (user: User) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('dblock_admin_user', JSON.stringify(user));
    }
    set({ user });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  initialize: () => {
    if (typeof window === 'undefined') {
      set({ isLoading: false });
      return;
    }

    const accessToken = TokenStorage.getAccessToken();
    const refreshToken = TokenStorage.getRefreshToken();
    const userJson = localStorage.getItem('dblock_admin_user');

    if (accessToken && refreshToken && userJson) {
      try {
        const user = JSON.parse(userJson) as User;
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch {
        TokenStorage.clearTokens();
        localStorage.removeItem('dblock_admin_user');
        set({ isLoading: false });
      }
    } else {
      set({ isLoading: false });
    }
  },
}));
