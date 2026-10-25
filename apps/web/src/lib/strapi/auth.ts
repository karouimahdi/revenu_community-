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

export async function getMe(token: string) {
  const json = await strapiFetch('/api/users/me', { token });
  return sessionUserSchema.parse(json);
}
