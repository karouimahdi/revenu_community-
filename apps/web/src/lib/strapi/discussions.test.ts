import { describe, expect, it, vi } from 'vitest';
import { listDiscussions } from './discussions';
import { strapiFetch } from './client';

vi.mock('./client', () => ({
  strapiFetch: vi.fn(),
}));

const mockedStrapiFetch = vi.mocked(strapiFetch);

const EMPTY_LIST_RESPONSE = {
  data: [],
  meta: { pagination: { page: 1, pageSize: 20, pageCount: 0, total: 0 } },
};

describe('listDiscussions', () => {
  it('omits filters entirely when no search/category/unanswered is given', async () => {
    mockedStrapiFetch.mockResolvedValue(EMPTY_LIST_RESPONSE);

    await listDiscussions({});

    const [, options] = mockedStrapiFetch.mock.calls[0]!;
    expect(options?.query).not.toHaveProperty('filters');
  });

  it('matches a search term against title, content, and authorUsername via $containsi', async () => {
    mockedStrapiFetch.mockResolvedValue(EMPTY_LIST_RESPONSE);

    await listDiscussions({ search: 'fiscalité' });

    const [, options] = mockedStrapiFetch.mock.calls[0]!;
    const query = options?.query as { filters?: { $or?: unknown } };
    expect(query.filters?.$or).toEqual([
      { title: { $containsi: 'fiscalité' } },
      { content: { $containsi: 'fiscalité' } },
      { authorUsername: { $containsi: 'fiscalité' } },
    ]);
  });

  it('combines a search term with the category filter via implicit AND', async () => {
    mockedStrapiFetch.mockResolvedValue(EMPTY_LIST_RESPONSE);

    await listDiscussions({ search: 'pea', categorySlug: 'bourse' });

    const [, options] = mockedStrapiFetch.mock.calls[0]!;
    const query = options?.query as { filters?: { category?: unknown; $or?: unknown } };
    expect(query.filters?.category).toEqual({ slug: { $eq: 'bourse' } });
    expect(query.filters?.$or).toHaveLength(3);
  });
});
