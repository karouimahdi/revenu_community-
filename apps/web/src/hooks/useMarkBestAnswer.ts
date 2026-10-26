'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/apiFetch';
import { queryKeys } from '@/lib/queryKeys';
import { useToast } from './useToast';
import type { Reply } from '@/lib/strapi/schemas';

interface MarkBestAnswerResponse {
  data: Reply;
  meta: Record<string, never>;
}

export function useMarkBestAnswer(documentId: string) {
  const queryClient = useQueryClient();
  const { push } = useToast();

  return useMutation<MarkBestAnswerResponse, Error, string>({
    mutationFn: (replyDocumentId) =>
      apiFetch<MarkBestAnswerResponse>(`/api/replies/${replyDocumentId}/best-answer`, { method: 'POST' }),

    onError: () => {
      push('Impossible de mettre à jour la meilleure réponse.', 'error');
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.replies(documentId) });
    },
  });
}
