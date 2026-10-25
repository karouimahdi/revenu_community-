import { Suspense } from 'react';
import { listDiscussions, type DiscussionSort } from '@/lib/strapi/discussions';
import { listCategories } from '@/lib/strapi/categories';
import { DiscussionFeed } from './DiscussionFeed';
import { FeedSkeleton } from './FeedSkeleton';

interface HomeFeedProps {
  categorySlug?: string;
  sort: DiscussionSort;
}

async function HomeFeed({ categorySlug, sort }: HomeFeedProps) {
  const [categories, discussions] = await Promise.all([
    listCategories(),
    listDiscussions({ categorySlug, sort }),
  ]);

  return (
    <DiscussionFeed categories={categories.data} initialFilters={{ categorySlug, sort }} initialData={discussions} />
  );
}

export default async function HomePage({ searchParams }: PageProps<'/'>) {
  const params = await searchParams;
  const categorySlug = typeof params.category === 'string' ? params.category : undefined;
  const sort: DiscussionSort = params.sort === 'createdAt:asc' ? 'createdAt:asc' : 'createdAt:desc';

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
      <Suspense fallback={<FeedSkeleton />}>
        <HomeFeed categorySlug={categorySlug} sort={sort} />
      </Suspense>
    </main>
  );
}
