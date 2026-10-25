import { useSessionStore } from '@/stores/useSessionStore';

export function useSession() {
  const user = useSessionStore((state) => state.user);
  const isAuthenticated = useSessionStore((state) => state.isAuthenticated);
  return { user, isAuthenticated };
}
