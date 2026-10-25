import { Suspense } from 'react';
import { ServerDiscussionsList } from './server-discussions-list';
import { ClientDiscussionsList } from './client-discussions-list';
import { SessionDisplay } from './session-display';
import { loginAsDemoUser, logout } from './actions';

// Phase 5 DoD proof, not a real page — delete before Phase 11 (or let
// Phase 6/9 supersede it). Proves: lib/strapi works server-side, the Route
// Handler + useDiscussions path works client-side, and the session store
// correctly reflects the httpOnly cookie in both directions.
export default function DebugPage() {
  return (
    <main className="mx-auto max-w-2xl space-y-8 p-8">
      <h1 className="text-xl font-bold">Debug — Phase 5 data layer</h1>

      <section className="space-y-2">
        <h2 className="font-semibold">Server-side (lib/strapi direct)</h2>
        <Suspense fallback={<p>Chargement…</p>}>
          <ServerDiscussionsList />
        </Suspense>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">Client-side (Route Handler + useDiscussions)</h2>
        <ClientDiscussionsList />
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">Session store</h2>
        <SessionDisplay />
        <div className="flex gap-2">
          <form action={loginAsDemoUser}>
            <button type="submit" className="rounded border px-3 py-1">
              Se connecter (vincent_etf)
            </button>
          </form>
          <form action={logout}>
            <button type="submit" className="rounded border px-3 py-1">
              Se déconnecter
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
