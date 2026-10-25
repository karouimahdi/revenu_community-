'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/apiFetch';
import { queryKeys } from '@/lib/queryKeys';
import type { ListDiscussionsFilters } from '@/lib/strapi/discussions';
import type { DiscussionListItem, PaginationMeta } from '@/lib/strapi/schemas';

export interface DiscussionsResponse {
  data: DiscussionListItem[];
  meta: { pagination: PaginationMeta };
}

function buildQueryString(filters: ListDiscussionsFilters) {
  const params = new URLSearchParams();
  if (filters.categorySlug) params.set('category', filters.categorySlug);
  if (filters.sort) params.set('sort', filters.sort);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.pageSize) params.set('pageSize', String(filters.pageSize));
  return params.toString();
}

export function useDiscussions(filters: ListDiscussionsFilters = {}, initialData?: DiscussionsResponse) {
  return useQuery({
    queryKey: queryKeys.discussions(filters),
    queryFn: () => apiFetch<DiscussionsResponse>(`/api/discussions?${buildQueryString(filters)}`),
    initialData,
    // Switching back to an already-fetched filter/sort combo should be
    // instant with zero network request, not just instant-looking while a
    // background refetch fires (PLAN.md §4.5's original 30s home-list
    // number, carried forward as TanStack's client-side staleTime).
    staleTime: 30_000,
  });
}
