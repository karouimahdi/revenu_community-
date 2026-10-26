import { Suspense } from 'react';
import { listDiscussions, type DiscussionSort } from '@/lib/strapi/discussions';
import { listCategories } from '@/lib/strapi/categories';
import { DiscussionFeed } from './DiscussionFeed';
import { FeedSkeleton } from './FeedSkeleton';

async function HomeFeed({ searchParams }: Pick<PageProps<'/'>, 'searchParams'>) {
  const params = await searchParams;
  const categorySlug = typeof params.category === 'string' ? params.category : undefined;
  const search = typeof params.q === 'string' ? params.q : undefined;
  const sort: DiscussionSort = params.sort === 'createdAt:asc' ? 'createdAt:asc' : 'createdAt:desc';
  const unanswered = params.unanswered === '1';

  const [categories, discussions] = await Promise.all([
    listCategories(),
    listDiscussions({ categorySlug, search, sort, unanswered }),
  ]);

  return (
    <DiscussionFeed
      categories={categories.data}
      initialFilters={{ categorySlug, search, sort, unanswered }}
      initialData={discussions}
    />
  );
}

// Not async — awaiting searchParams here instead of in the Suspense-wrapped
// child would block the whole route from prerendering.
export default function HomePage({ searchParams }: PageProps<'/'>) {
  return (
    <main className="mx-auto w-full max-w-full flex-1 px-4 py-6">
      <Suspense fallback={<FeedSkeleton />}>
        <HomeFeed searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
