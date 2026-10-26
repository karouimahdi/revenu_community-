import { cache } from 'react';
import { z } from 'zod';
import { strapiFetch } from './client';

export const sessionUserSchema = z.object({
  id: z.number(),
  username: z.string(),
});

const loginResponseSchema = z.object({
  jwt: z.string(),
  user: sessionUserSchema,
});

export type SessionUser = z.infer<typeof sessionUserSchema>;

export async function login(identifier: string, password: string) {
  const json = await strapiFetch('/api/auth/local', {
    method: 'POST',
    body: { identifier, password },
  });
  return loginResponseSchema.parse(json);
}

// Public on Strapi by default (users-permissions' Public role) — confirmed
// against the live instance while seeding/testing earlier phases.
export async function register(username: string, email: string, password: string) {
  const json = await strapiFetch('/api/auth/local/register', {
    method: 'POST',
    body: { username, email, password },
  });
  return loginResponseSchema.parse(json);
}

// Cached per-request (React's cache(), not Next's data cache) — both
// SessionBoundary and Header independently derive the session from the
// same cookie this render; without this they'd each hit Strapi once.
export const getMe = cache(async (token: string) => {
  const json = await strapiFetch('/api/users/me', { token });
  return sessionUserSchema.parse(json);
});
