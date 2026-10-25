import { cookies } from 'next/headers';
import { getMe } from '@/lib/strapi/auth';
import { SESSION_COOKIE_NAME } from '@/lib/session';
import { SessionSync } from './SessionSync';

// The only Server Component that reads the session cookie — isolated here,
// behind its own <Suspense> boundary in layout.tsx, so a runtime API read
// doesn't block the rest of the app's static shell under Cache Components
// (confirmed necessary against the installed Next 16: an uncached runtime
// read at the layout root would make every route dynamic).
export async function SessionBoundary() {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;

  let user = null;
  if (token) {
    try {
      user = await getMe(token);
    } catch {
      // Expired/invalid token — treat as logged out rather than erroring.
      user = null;
    }
  }

  return <SessionSync session={user} />;
}
