import { create } from 'zustand';
import { loginApi } from '../api/auth';
import type { LoginParams, UserInfo } from '../types';

interface AuthState {
  token: string | null;
  userInfo: UserInfo | null;
  login: (params: LoginParams) => Promise<void>;
  logout: () => void;
  setToken: (token: string) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('token'),
  userInfo: null,

  login: async (params) => {
    const res = await loginApi(params);
    const { token, userInfo } = res.data;
    localStorage.setItem('token', token);
    set({ token, userInfo });
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ token: null, userInfo: null });
  },

  setToken: (token) => {
    localStorage.setItem('token', token);
    set({ token });
  },
}));
