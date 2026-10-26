import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/renderWithProviders';
import { DiscussionFeed } from './DiscussionFeed';
import type { ListDiscussionsFilters } from '@/lib/strapi/discussions';
import type { Category, DiscussionListItem } from '@/lib/strapi/schemas';
import type { DiscussionsResponse } from '@/hooks/useDiscussions';

const CATEGORIES: Category[] = [
  { id: 1, documentId: 'cat-bourse', name: 'Bourse & actions', slug: 'bourse', description: null },
];

const INITIAL_FILTERS: ListDiscussionsFilters = { sort: 'createdAt:desc' };

function makeDiscussion(overrides: Partial<DiscussionListItem>): DiscussionListItem {
  return {
    id: 1,
    documentId: 'doc-1',
    title: 'Un titre de discussion',
    type: 'discussion',
    content: 'Un contenu quelconque pour cette discussion.',
    repliesCount: 2,
    createdAt: new Date().toISOString(),
    authorUsername: 'sophie_invest',
    category: { id: 1, documentId: 'cat-bourse', name: 'Bourse & actions', slug: 'bourse' },
    ...overrides,
  };
}

function discussionsResponse(data: DiscussionListItem[]): DiscussionsResponse {
  return { data, meta: { pagination: { page: 1, pageSize: 20, pageCount: 1, total: data.length } } };
}

describe('DiscussionFeed', () => {
  it('renders a card per discussion in the initial data', () => {
    const data = [
      makeDiscussion({ documentId: 'doc-1', title: 'Premier sujet' }),
      makeDiscussion({ documentId: 'doc-2', title: 'Deuxième sujet' }),
      makeDiscussion({ documentId: 'doc-3', title: 'Troisième sujet' }),
    ];

    renderWithProviders(
      <DiscussionFeed categories={CATEGORIES} initialFilters={INITIAL_FILTERS} initialData={discussionsResponse(data)} />,
    );

    expect(screen.getByText('Premier sujet')).toBeInTheDocument();
    expect(screen.getByText('Deuxième sujet')).toBeInTheDocument();
    expect(screen.getByText('Troisième sujet')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /sujet/ })).toHaveLength(3);
  });

  it('renders the empty state when the list is empty', () => {
    renderWithProviders(
      <DiscussionFeed categories={CATEGORIES} initialFilters={INITIAL_FILTERS} initialData={discussionsResponse([])} />,
    );

    expect(screen.getByText('Aucune discussion')).toBeInTheDocument();
  });

  it('renders a skeleton while the query is pending', () => {
    // No initialData and a fetch that never resolves keeps the query pending.
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise(() => {})),
    );

    renderWithProviders(
      <DiscussionFeed
        categories={CATEGORIES}
        initialFilters={INITIAL_FILTERS}
        initialData={undefined as unknown as DiscussionsResponse}
      />,
    );

    expect(document.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);

    vi.unstubAllGlobals();
  });
});
