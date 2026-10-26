'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/apiFetch';
import { queryKeys } from '@/lib/queryKeys';
import { useSession } from './useSession';

export interface MyVotesResponse {
  votedDiscussion: boolean;
  votedReplyDocumentIds: string[];
}

export function useMyVotes(documentId: string) {
  const { isAuthenticated } = useSession();

  return useQuery({
    queryKey: queryKeys.myVotes(documentId),
    queryFn: () => apiFetch<MyVotesResponse>(`/api/discussions/${documentId}/votes`),
    enabled: isAuthenticated,
  });
}
