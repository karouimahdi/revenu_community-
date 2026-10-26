'use client';

import { useState } from 'react';
import { useDiscussions, type DiscussionsResponse } from '@/hooks/useDiscussions';
import { useDensity } from '@/hooks/useDensity';
import type { ListDiscussionsFilters } from '@/lib/strapi/discussions';
import type { Category } from '@/lib/strapi/schemas';
import { CategorySidebar } from './CategorySidebar';
import { CategoriesGrid } from './CategoriesGrid';
import { ComposerBar } from './ComposerBar';
import { DiscussionCard } from './DiscussionCard';
import { DiscussionRow } from './DiscussionRow';
import { FeedSkeleton } from './FeedSkeleton';
import { RightRail } from './RightRail';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';

type View = 'feed' | 'spaces';

function chipClass(active: boolean) {
  return `inline-flex shrink-0 items-center rounded-full border px-3 py-1.5 text-[13.5px] font-medium whitespace-nowrap ${
    active ? 'border-brand bg-brand text-white' : 'border-hairline bg-surface text-ink-2'
  }`;
}

function tabClass(active: boolean) {
  return `inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[8px] px-3.5 py-1.5 text-[14px] font-medium ${
    active ? 'bg-surface font-semibold text-ink shadow-card' : 'text-ink-2 hover:text-ink'
  }`;
}

function densityButtonClass(active: boolean) {
  return `grid h-[30px] w-[34px] place-items-center rounded-[8px] ${
    active ? 'bg-surface text-ink shadow-card' : 'text-ink-3 hover:text-ink'
  }`;
}

// Updates the URL for shareability without going through next/navigation's
// router — that would trigger a soft RSC navigation, defeating the point
// of filtering through TanStack Query + the Route Handler (PLAN.md §4.2).
// `view` (feed vs. the "Tous les espaces" grid) is deliberately not synced
// here — it's a client-only presentation toggle, not a server-fetched filter.
function syncUrl(filters: ListDiscussionsFilters) {
  const params = new URLSearchParams();
  if (filters.categorySlug) params.set('category', filters.categorySlug);
  if (filters.search) params.set('q', filters.search);
  if (filters.sort && filters.sort !== 'createdAt:desc') params.set('sort', filters.sort);
  if (filters.unanswered) params.set('unanswered', '1');
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
  const [view, setView] = useState<View>('feed');
  const [density, setDensity] = useDensity();
  const isInitialFilters =
    filters.categorySlug === initialFilters.categorySlug &&
    filters.search === initialFilters.search &&
    filters.sort === initialFilters.sort &&
    filters.unanswered === initialFilters.unanswered;

  const { data, isPending, isError, error } = useDiscussions(
    filters,
    isInitialFilters && view === 'feed' ? initialData : undefined,
  );

  function selectCategory(categorySlug: string) {
    const next = { ...filters, categorySlug };
    setFilters(next);
    syncUrl(next);
    setView('feed');
  }

  function selectHome() {
    const next = { ...filters, categorySlug: undefined };
    setFilters(next);
    syncUrl(next);
    setView('feed');
  }

  function selectAll() {
    const next = { ...filters, categorySlug: undefined };
    setFilters(next);
    syncUrl(next);
    setView('spaces');
  }

  function selectTab(tab: 'recent' | 'unanswered') {
    const next: ListDiscussionsFilters = {
      ...filters,
      sort: 'createdAt:desc',
      unanswered: tab === 'unanswered',
    };
    setFilters(next);
    syncUrl(next);
  }

  function clearSearch() {
    const next = { ...filters, search: undefined };
    setFilters(next);
    syncUrl(next);
  }

  const activeTab: 'recent' | 'unanswered' = filters.unanswered ? 'unanswered' : 'recent';

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_3fr] lg:grid-cols-[1fr_3fr_2fr] lg:gap-7">
      <CategorySidebar
        categories={categories}
        view={view}
        activeCategorySlug={filters.categorySlug}
        onSelectHome={selectHome}
        onSelectAll={selectAll}
        onSelectCategory={selectCategory}
      />

      <div className="min-w-0">
        {view === 'spaces' ? (
          <CategoriesGrid categories={categories} onSelect={selectCategory} />
        ) : (
          <>
            <ComposerBar />

            {filters.search ? (
              <div className="mb-3 flex items-center gap-2 text-sm text-ink-2">
                <span>
                  Résultats pour « <span className="font-semibold text-ink">{filters.search}</span> »
                </span>
                <button type="button" onClick={clearSearch} className="font-medium text-brand hover:text-brand-hover">
                  Effacer
                </button>
              </div>
            ) : null}

            <div className="mb-3 flex gap-2 overflow-x-auto pb-1 md:hidden">
              <button type="button" onClick={selectHome} className={chipClass(!filters.categorySlug)}>
                Accueil
              </button>
              <button type="button" onClick={selectAll} className={chipClass(false)}>
                Tous les espaces
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

            <div className="mb-3 flex items-center justify-between gap-3">
              <div role="tablist" className="inline-flex gap-0.5 rounded-[10px] bg-surface-2 p-[3px]">
                <button type="button" role="tab" aria-selected={activeTab === 'recent'} onClick={() => selectTab('recent')} className={tabClass(activeTab === 'recent')}>
                  Récentes
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'unanswered'}
                  onClick={() => selectTab('unanswered')}
                  className={tabClass(activeTab === 'unanswered')}
                >
                  Sans réponse
                </button>
              </div>

              <div role="group" aria-label="Affichage de la liste" className="inline-flex shrink-0 gap-[2px] rounded-[10px] bg-surface-2 p-[3px]">
                <button
                  type="button"
                  aria-pressed={density === 'comfy'}
                  aria-label="Vue détaillée"
                  title="Vue détaillée"
                  onClick={() => setDensity('comfy')}
                  className={densityButtonClass(density === 'comfy')}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-[17px] w-[17px]" aria-hidden="true">
                    <rect width="7" height="7" x="3" y="3" rx="1" />
                    <rect width="7" height="7" x="3" y="14" rx="1" />
                    <path d="M14 4h7" />
                    <path d="M14 9h7" />
                    <path d="M14 15h7" />
                    <path d="M14 20h7" />
                  </svg>
                </button>
                <button
                  type="button"
                  aria-pressed={density === 'compact'}
                  aria-label="Vue compacte"
                  title="Vue compacte"
                  onClick={() => setDensity('compact')}
                  className={densityButtonClass(density === 'compact')}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-[17px] w-[17px]" aria-hidden="true">
                    <path d="M3 6h.01" />
                    <path d="M3 12h.01" />
                    <path d="M3 18h.01" />
                    <path d="M8 6h13" />
                    <path d="M8 12h13" />
                    <path d="M8 18h13" />
                  </svg>
                </button>
              </div>
            </div>

            {isPending ? (
              <FeedSkeleton density={density} />
            ) : isError ? (
              <div className="rounded-[14px] border border-line bg-surface shadow-card">
                <ErrorState message={error.message} />
              </div>
            ) : data.data.length === 0 ? (
              <div className="rounded-[14px] border border-line bg-surface shadow-card">
                <EmptyState
                  title={filters.search ? 'Aucun résultat' : filters.unanswered ? 'Aucune question sans réponse' : 'Aucune discussion'}
                  description={
                    filters.search
                      ? 'Aucune discussion ne correspond à cette recherche.'
                      : filters.unanswered
                        ? 'Toutes les discussions de cet espace ont au moins une réponse.'
                        : 'Soyez le premier à lancer une discussion dans cet espace.'
                  }
                />
              </div>
            ) : (
              <div className="rounded-[14px] border border-line bg-surface shadow-card overflow-hidden">
                {data.data.map((discussion) =>
                  density === 'compact' ? (
                    <DiscussionRow key={discussion.documentId} discussion={discussion} />
                  ) : (
                    <DiscussionCard key={discussion.documentId} discussion={discussion} />
                  ),
                )}
              </div>
            )}
          </>
        )}
      </div>

      <RightRail />
    </div>
  );
}
