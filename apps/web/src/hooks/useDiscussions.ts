'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/apiFetch';
import { queryKeys } from '@/lib/queryKeys';
import type { ListDiscussionsFilters } from '@/lib/strapi/discussions';
import type { DiscussionListItem, PaginationMeta } from '@/lib/strapi/schemas';

export interface DiscussionsResponse {
  data: DiscussionListItem[];
  meta: { pagination: PaginationMeta };
}

function buildQueryString(filters: ListDiscussionsFilters, page: number) {
  const params = new URLSearchParams();
  if (filters.categorySlug) params.set('category', filters.categorySlug);
  if (filters.search) params.set('search', filters.search);
  if (filters.sort) params.set('sort', filters.sort);
  if (filters.unanswered) params.set('unanswered', '1');
  params.set('page', String(page));
  if (filters.pageSize) params.set('pageSize', String(filters.pageSize));
  return params.toString();
}

export function useDiscussions(filters: ListDiscussionsFilters = {}, initialData?: DiscussionsResponse) {
  return useInfiniteQuery({
    queryKey: queryKeys.discussions(filters),
    queryFn: ({ pageParam }) => apiFetch<DiscussionsResponse>(`/api/discussions?${buildQueryString(filters, pageParam)}`),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.pagination.page < lastPage.meta.pagination.pageCount ? lastPage.meta.pagination.page + 1 : undefined,
    initialData: initialData ? { pages: [initialData], pageParams: [1] } : undefined,
    staleTime: 30_000,
  });
}
