'use client';

import { useEffect } from 'react';
import { useSessionStore } from '@/stores/useSessionStore';
import type { SessionUser } from '@/lib/strapi/auth';

export function SessionSync({ session }: { session: SessionUser | null }) {
  const setSession = useSessionStore((state) => state.setSession);

  useEffect(() => {
    setSession(session);
  }, [session, setSession]);

  return null;
}
