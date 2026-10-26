'use server';

import { cookies } from 'next/headers';
import { login, register } from '@/lib/strapi/auth';
import { StrapiRequestError } from '@/lib/strapi/client';
import { SESSION_COOKIE_NAME } from '@/lib/session';

async function setSessionCookie(jwt: string) {
  (await cookies()).set(SESSION_COOKIE_NAME, jwt, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });
}

export interface LoginActionState {
  error?: string;
  success?: boolean;
}

export async function loginAction(_prevState: LoginActionState, formData: FormData): Promise<LoginActionState> {
  const identifier = String(formData.get('identifier') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!identifier || !password) {
    return { error: 'Identifiant et mot de passe requis.' };
  }

  try {
    const { jwt } = await login(identifier, password);
    await setSessionCookie(jwt);
  } catch (error) {
    if (error instanceof StrapiRequestError) {
      return { error: 'Identifiant ou mot de passe incorrect.' };
    }
    throw error;
  }

  
  return { success: true };
}

export interface RegisterActionState {
  error?: string;
  success?: boolean;
}

export async function registerAction(
  _prevState: RegisterActionState,
  formData: FormData,
): Promise<RegisterActionState> {
  const username = String(formData.get('username') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!username || !email || !password) {
    return { error: 'Tous les champs sont requis.' };
  }
  if (password.length < 6) {
    return { error: 'Le mot de passe doit contenir au moins 6 caractères.' };
  }

  try {
    const { jwt } = await register(username, email, password);
    await setSessionCookie(jwt);
  } catch (error) {
    if (error instanceof StrapiRequestError) {
      const fieldError = error.fieldErrors ? Object.values(error.fieldErrors)[0] : undefined;
      return { error: fieldError ?? "Impossible de créer le compte avec ces informations." };
    }
    throw error;
  }

  return { success: true };
}
