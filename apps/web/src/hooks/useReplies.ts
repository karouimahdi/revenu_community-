'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/apiFetch';
import { queryKeys } from '@/lib/queryKeys';
import type { PaginationMeta, Reply } from '@/lib/strapi/schemas';

export interface RepliesResponse {
  data: Reply[];
  meta: { pagination: PaginationMeta };
}

export function useReplies(documentId: string, initialData?: RepliesResponse) {
  return useQuery({
    queryKey: queryKeys.replies(documentId),
    queryFn: () => apiFetch<RepliesResponse>(`/api/discussions/${documentId}/replies`),
    initialData,
  });
}
