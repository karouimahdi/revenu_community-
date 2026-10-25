'use client';

import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { apiFetch } from '@/lib/apiFetch';
import { queryKeys } from '@/lib/queryKeys';
import { useSession } from './useSession';
import { useToast } from './useToast';
import type { Reply } from '@/lib/strapi/schemas';
import type { RepliesResponse } from './useReplies';
import type { DiscussionResponse } from './useDiscussion';
import type { DiscussionsResponse } from './useDiscussions';

interface CreateReplyResponse {
  data: Reply;
  meta: Record<string, never>;
}

interface MutationContext {
  previousReplies?: RepliesResponse;
  previousDiscussion?: DiscussionResponse;
  previousLists: Array<[QueryKey, DiscussionsResponse | undefined]>;
}

function bumpRepliesCount(list: DiscussionsResponse, documentId: string): DiscussionsResponse {
  return {
    ...list,
    data: list.data.map((item) =>
      item.documentId === documentId ? { ...item, repliesCount: item.repliesCount + 1 } : item,
    ),
  };
}

export function useCreateReply(documentId: string) {
  const queryClient = useQueryClient();
  const { user } = useSession();
  const { push } = useToast();

  return useMutation<CreateReplyResponse, Error, string, MutationContext>({
    mutationFn: (content) =>
      apiFetch<CreateReplyResponse>(`/api/discussions/${documentId}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      }),

    onMutate: async (content) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.replies(documentId) });

      const previousReplies = queryClient.getQueryData<RepliesResponse>(queryKeys.replies(documentId));
      const previousDiscussion = queryClient.getQueryData<DiscussionResponse>(queryKeys.discussion(documentId));
      const previousLists = queryClient.getQueriesData<DiscussionsResponse>({ queryKey: ['discussions'] });

      const pendingReply: Reply = {
        id: -Date.now(),
        documentId: `pending-${Date.now()}`,
        content,
        createdAt: new Date().toISOString(),
        author: user ? { id: user.id, username: user.username } : null,
      };

      if (previousReplies) {
        queryClient.setQueryData<RepliesResponse>(queryKeys.replies(documentId), {
          ...previousReplies,
          data: [...previousReplies.data, pendingReply],
        });
      }

      if (previousDiscussion) {
        queryClient.setQueryData<DiscussionResponse>(queryKeys.discussion(documentId), {
          ...previousDiscussion,
          data: { ...previousDiscussion.data, repliesCount: previousDiscussion.data.repliesCount + 1 },
        });
      }

      for (const [key, list] of previousLists) {
        if (list) queryClient.setQueryData(key, bumpRepliesCount(list, documentId));
      }

      return { previousReplies, previousDiscussion, previousLists };
    },

    onError: (_error, _content, context) => {
      if (context?.previousReplies) {
        queryClient.setQueryData(queryKeys.replies(documentId), context.previousReplies);
      }
      if (context?.previousDiscussion) {
        queryClient.setQueryData(queryKeys.discussion(documentId), context.previousDiscussion);
      }
      for (const [key, list] of context?.previousLists ?? []) {
        queryClient.setQueryData(key, list);
      }
      push('Impossible de publier la réponse.', 'error');
    },

    onSuccess: () => {
      push('Réponse publiée.', 'success');
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.replies(documentId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.discussion(documentId) });
    },
  });
}
