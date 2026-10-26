'use client';

import { useActionState, useEffect } from 'react';
import { registerAction, type RegisterActionState } from './actions';

const initialState: RegisterActionState = {};

interface SignupFormProps {
  onSwitchToLogin: () => void;
  onSuccess: () => void;
}

export function SignupForm({ onSwitchToLogin, onSuccess }: SignupFormProps) {
  const [state, formAction, isPending] = useActionState(registerAction, initialState);

  useEffect(() => {
    if (state.success) onSuccess();
  }, [state.success, onSuccess]);

  return (
    <form action={formAction} className="flex flex-col gap-4">

      <div className="flex flex-col gap-1.5">
        <label htmlFor="username" className="text-sm font-semibold text-ink">
          Pseudo
        </label>
        <input
          id="username"
          name="username"
          type="text"
          required
          autoFocus
          maxLength={24}
          autoComplete="username"
          className="h-10 rounded-[9px] border border-line px-3 text-[15px] text-ink outline-none focus:border-brand"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-semibold text-ink">
          Adresse e-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="h-10 rounded-[9px] border border-line px-3 text-[15px] text-ink outline-none focus:border-brand"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="signup-password" className="text-sm font-semibold text-ink">
          Mot de passe
        </label>
        <input
          id="signup-password"
          name="password"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          className="h-10 rounded-[9px] border border-line px-3 text-[15px] text-ink outline-none focus:border-brand"
        />
      </div>

      {state.error && <p className="text-sm text-alert">{state.error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="h-9 w-full rounded-[10px] bg-brand text-sm font-semibold text-white disabled:opacity-50"
      >
        {isPending ? 'Création…' : 'Créer mon compte'}
      </button>

      <p className="text-center text-[12.5px] text-ink-3">
        Déjà un compte ?{' '}
        <button type="button" onClick={onSwitchToLogin} className="font-semibold text-[#e00b0b]">
          Se connecter
        </button>
      </p>
    </form>
  );
}
