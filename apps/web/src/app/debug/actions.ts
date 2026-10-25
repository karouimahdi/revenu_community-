'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { login } from '@/lib/strapi/auth';
import { SESSION_COOKIE_NAME } from '@/lib/session';

export async function loginAsDemoUser() {
  const { jwt } = await login('vincent_etf', 'Demo1234!');

  (await cookies()).set(SESSION_COOKIE_NAME, jwt, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });

  revalidatePath('/debug');
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE_NAME);
  revalidatePath('/debug');
}
