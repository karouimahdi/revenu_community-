import { create } from 'zustand';
import type { SessionUser } from '@/lib/strapi/auth';

interface SessionState {
  user: SessionUser | null;
  isAuthenticated: boolean;
  setSession: (user: SessionUser | null) => void;
}

// Seeded once from the server-read httpOnly cookie (see app/session-boundary.tsx)
// — never read or written during server rendering past that single hydration.
export const useSessionStore = create<SessionState>((set) => ({
  user: null,
  isAuthenticated: false,
  setSession: (user) => set({ user, isAuthenticated: user !== null }),
}));
