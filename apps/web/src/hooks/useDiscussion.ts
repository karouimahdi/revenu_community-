'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/apiFetch';
import { queryKeys } from '@/lib/queryKeys';
import type { DiscussionDetail } from '@/lib/strapi/schemas';

export interface DiscussionResponse {
  data: DiscussionDetail;
  meta: Record<string, never>;
}

// staleTime: Infinity — the detail page's own content never needs a
// background refetch 
export function useDiscussion(documentId: string, initialData?: DiscussionResponse) {
  return useQuery({
    queryKey: queryKeys.discussion(documentId),
    queryFn: () => apiFetch<DiscussionResponse>(`/api/discussions/${documentId}`),
    initialData,
    staleTime: Infinity,
  });
}
