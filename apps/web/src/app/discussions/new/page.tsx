import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getMe } from '@/lib/strapi/auth';
import { SESSION_COOKIE_NAME } from '@/lib/session';
import { listCategories } from '@/lib/strapi/categories';
import { DiscussionForm } from './DiscussionForm';

async function CategoriesSection({ initialType }: { initialType: 'question' | 'discussion' }) {
  const categories = await listCategories();
  return <DiscussionForm categories={categories.data} initialType={initialType} />;
}

// The auth check (and its redirect()) deliberately stays outside Suspense
// — same reason as the discussion detail page's notFound(): once a
// Suspense fallback's 200 shell has streamed, a later redirect() can only
// become a client-side script-tag redirect, not a real HTTP redirect
// (confirmed empirically: curl saw a 200 with the login page's content
// inlined, not a 307/308). A real redirect for a logged-out visit matters
// more than this one check's avoidable dev warning.
export default async function NewDiscussionPage({ searchParams }: PageProps<'/discussions/new'>) {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;

  let authenticated = false;
  if (token) {
    try {
      await getMe(token);
      authenticated = true;
    } catch {
      authenticated = false;
    }
  }

  if (!authenticated) redirect('/login?next=/discussions/new');

  const params = await searchParams;
  const initialType = params.type === 'question' ? 'question' : 'discussion';

  return (
    <main className="mx-auto w-full max-w-full flex-1 px-4 py-6">
      <div className="mx-auto max-w-[640px]">
        <Suspense fallback={null}>
          <CategoriesSection initialType={initialType} />
        </Suspense>
      </div>
    </main>
  );
}
