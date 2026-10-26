'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoginForm } from './LoginForm';
import { SignupForm } from './SignupForm';

type Mode = 'login' | 'signup';


export function AuthModal({ next }: { next: string }) {
  const [mode, setMode] = useState<Mode>('login');
  const router = useRouter();

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-black/[.28] p-4 backdrop-blur-sm">
      <div className="max-h-[calc(100dvh-32px)] w-full max-w-[440px] overflow-auto rounded-2xl bg-surface shadow-card-lg">
        <div className="flex items-center justify-between px-5 pt-4">
          <h2 className="font-display text-xl text-ink">{mode === 'login' ? 'Se connecter' : 'Créer un compte'}</h2>
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Fermer"
            className="inline-grid h-9 w-9 place-items-center rounded-[9px] text-xl text-ink-2 hover:bg-black/5 hover:text-ink"
          >
            ×
          </button>
        </div>
        <div className="p-5">
          {mode === 'login' ? (
            <LoginForm onSwitchToSignup={() => setMode('signup')} onSuccess={() => window.location.assign(next)} />
          ) : (
            <SignupForm onSwitchToLogin={() => setMode('login')} onSuccess={() => window.location.assign(next)} />
          )}
        </div>
      </div>
    </div>
  );
}
