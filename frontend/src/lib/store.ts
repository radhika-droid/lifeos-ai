import { create } from 'zustand';
import api from './api';
import type { User, TokenResponse, LoginRequest, SignupRequest } from './types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (data: LoginRequest) => Promise<void>;
  signup: (data: SignupRequest) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (data: LoginRequest) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post<TokenResponse>('/auth/login', data);
      const { access_token, user } = res.data;
      localStorage.setItem('lifeos_token', access_token);
      localStorage.setItem('lifeos_user', JSON.stringify(user));
      set({ user, token: access_token, isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      const message = err.response?.data?.detail || 'Login failed';
      set({ isLoading: false, error: message });
      throw err;
    }
  },

  signup: async (data: SignupRequest) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post<TokenResponse>('/auth/signup', data);
      const { access_token, user } = res.data;
      localStorage.setItem('lifeos_token', access_token);
      localStorage.setItem('lifeos_user', JSON.stringify(user));
      set({ user, token: access_token, isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      const message = err.response?.data?.detail || 'Signup failed';
      set({ isLoading: false, error: message });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem('lifeos_token');
    localStorage.removeItem('lifeos_user');
    set({ user: null, token: null, isAuthenticated: false });
  },

  clearError: () => set({ error: null }),

  hydrate: () => {
    const token = localStorage.getItem('lifeos_token');
    const userStr = localStorage.getItem('lifeos_user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as User;
        set({ user, token, isAuthenticated: true });
      } catch {
        localStorage.removeItem('lifeos_token');
        localStorage.removeItem('lifeos_user');
      }
    }
  },
}));
