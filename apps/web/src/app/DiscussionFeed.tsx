'use client';

import { useState } from 'react';
import { useDiscussions, type DiscussionsResponse } from '@/hooks/useDiscussions';
import type { ListDiscussionsFilters } from '@/lib/strapi/discussions';
import type { Category } from '@/lib/strapi/schemas';
import { DiscussionCard } from './DiscussionCard';
import { FeedSkeleton } from './FeedSkeleton';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';

function chipClass(active: boolean) {
  return `inline-flex shrink-0 items-center rounded-full border px-3 py-1.5 text-[13.5px] font-medium whitespace-nowrap ${
    active ? 'border-brand bg-brand text-white' : 'border-hairline bg-surface text-ink-2'
  }`;
}

// Updates the URL for shareability without going through next/navigation's
// router — that would trigger a soft RSC navigation, defeating the point
// of filtering through TanStack Query + the Route Handler (PLAN.md §4.2).
function syncUrl(filters: ListDiscussionsFilters) {
  const params = new URLSearchParams();
  if (filters.categorySlug) params.set('category', filters.categorySlug);
  if (filters.sort && filters.sort !== 'createdAt:desc') params.set('sort', filters.sort);
  const query = params.toString();
  window.history.replaceState(null, '', query ? `/?${query}` : '/');
}

interface DiscussionFeedProps {
  categories: Category[];
  initialFilters: ListDiscussionsFilters;
  initialData: DiscussionsResponse;
}

export function DiscussionFeed({ categories, initialFilters, initialData }: DiscussionFeedProps) {
  const [filters, setFilters] = useState<ListDiscussionsFilters>(initialFilters);
  const isInitialFilters = filters.categorySlug === initialFilters.categorySlug && filters.sort === initialFilters.sort;

  const { data, isPending, isError, error } = useDiscussions(filters, isInitialFilters ? initialData : undefined);

  function selectCategory(categorySlug: string | undefined) {
    const next = { ...filters, categorySlug };
    setFilters(next);
    syncUrl(next);
  }

  function toggleSort() {
    const next = { ...filters, sort: filters.sort === 'createdAt:asc' ? ('createdAt:desc' as const) : ('createdAt:asc' as const) };
    setFilters(next);
    syncUrl(next);
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button type="button" onClick={() => selectCategory(undefined)} className={chipClass(!filters.categorySlug)}>
            Tout
          </button>
          {categories.map((category) => (
            <button
              key={category.slug}
              type="button"
              onClick={() => selectCategory(category.slug)}
              className={chipClass(filters.categorySlug === category.slug)}
            >
              {category.name}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={toggleSort}
          className="shrink-0 whitespace-nowrap rounded-[9px] border border-hairline bg-surface px-3 py-1.5 text-[13px] font-medium text-ink-2 hover:bg-black/5"
        >
          {filters.sort === 'createdAt:asc' ? 'Plus ancien' : 'Plus récent'}
        </button>
      </div>

      {isPending ? (
        <FeedSkeleton />
      ) : isError ? (
        <div className="rounded-[14px] border border-line bg-surface shadow-card">
          <ErrorState message={error.message} />
        </div>
      ) : data.data.length === 0 ? (
        <div className="rounded-[14px] border border-line bg-surface shadow-card">
          <EmptyState
            title="Aucune discussion"
            description="Soyez le premier à lancer une discussion dans cet espace."
          />
        </div>
      ) : (
        <div className="rounded-[14px] border border-line bg-surface shadow-card overflow-hidden">
          {data.data.map((discussion) => (
            <DiscussionCard key={discussion.documentId} discussion={discussion} />
          ))}
        </div>
      )}
    </div>
  );
}
