import { Suspense } from 'react';
import { listDiscussions, type DiscussionSort } from '@/lib/strapi/discussions';
import { listCategories } from '@/lib/strapi/categories';
import { DiscussionFeed } from './DiscussionFeed';
import { FeedSkeleton } from './FeedSkeleton';

async function HomeFeed({ searchParams }: Pick<PageProps<'/'>, 'searchParams'>) {
  const params = await searchParams;
  const categorySlug = typeof params.category === 'string' ? params.category : undefined;
  const sort: DiscussionSort = params.sort === 'createdAt:asc' ? 'createdAt:asc' : 'createdAt:desc';

  const [categories, discussions] = await Promise.all([
    listCategories(),
    listDiscussions({ categorySlug, sort }),
  ]);

  return (
    <DiscussionFeed categories={categories.data} initialFilters={{ categorySlug, sort }} initialData={discussions} />
  );
}

// Not async — awaiting searchParams here (a runtime API) instead of inside
// the Suspense-wrapped child would block the whole route from prerendering
// (confirmed in Phase 7 reading the dev server's own console).
export default function HomePage({ searchParams }: PageProps<'/'>) {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
      <Suspense fallback={<FeedSkeleton />}>
        <HomeFeed searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
