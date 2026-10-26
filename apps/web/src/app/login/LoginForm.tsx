'use client';

import { useActionState, useEffect } from 'react';
import { loginAction, type LoginActionState } from './actions';

const initialState: LoginActionState = {};

interface LoginFormProps {
  onSwitchToSignup: () => void;
  onSuccess: () => void;
}

export function LoginForm({ onSwitchToSignup, onSuccess }: LoginFormProps) {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);

  useEffect(() => {
    if (state.success) onSuccess();
  }, [state.success, onSuccess]);

  return (
    <form action={formAction} className="flex flex-col gap-4">

      <div className="flex flex-col gap-1.5">
        <label htmlFor="identifier" className="text-sm font-semibold text-ink">
          Identifiant ou email
        </label>
        <input
          id="identifier"
          name="identifier"
          type="text"
          required
          autoFocus
          autoComplete="username"
          className="h-10 rounded-[9px] border border-line px-3 text-[15px] text-ink outline-none focus:border-brand"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-semibold text-ink">
          Mot de passe
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="h-10 rounded-[9px] border border-line px-3 text-[15px] text-ink outline-none focus:border-brand"
        />
      </div>

      {state.error && <p className="text-sm text-alert">{state.error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="h-9 w-full rounded-[10px] bg-brand text-sm font-semibold text-white disabled:opacity-50"
      >
        {isPending ? 'Connexion…' : 'Se connecter'}
      </button>

      <p className="text-center text-[12.5px] text-ink-3">
        Pas encore de compte ?{' '}
        <button type="button" onClick={onSwitchToSignup} className="font-semibold text-[#e00b0b]">
          Créer un compte gratuit
        </button>
      </p>
    </form>
  );
}
