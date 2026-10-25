'use client';

import { useSession } from '@/hooks/useSession';

export function SessionDisplay() {
  const { user, isAuthenticated } = useSession();

  return (
    <p>{isAuthenticated ? `Connecté en tant que ${user?.username}` : 'Déconnecté'}</p>
  );
}
