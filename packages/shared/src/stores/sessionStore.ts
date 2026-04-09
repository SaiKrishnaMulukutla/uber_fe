import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserRole } from '../auth/session';

interface SessionState {
  accessToken: string | null;
  refreshToken: string | null;
  userId: string | null;
  email: string | null;
  role: UserRole | null;
  setSession: (params: {
    accessToken: string;
    refreshToken: string;
    userId: string;
    email: string;
    role: UserRole;
  }) => void;
  updateTokens: (accessToken: string, refreshToken: string) => void;
  clearSession: () => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      userId: null,
      email: null,
      role: null,
      setSession: ({ accessToken, refreshToken, userId, email, role }) =>
        set({ accessToken, refreshToken, userId, email, role }),
      updateTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),
      clearSession: () =>
        set({ accessToken: null, refreshToken: null, userId: null, email: null, role: null }),
    }),
    { name: 'uber-session' },
  ),
);
