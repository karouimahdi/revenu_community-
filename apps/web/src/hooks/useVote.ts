'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/apiFetch';
import { queryKeys } from '@/lib/queryKeys';
import { useToast } from './useToast';
import type { Vote } from '@/lib/strapi/schemas';
import type { MyVotesResponse } from './useMyVotes';
import type { DiscussionResponse } from './useDiscussion';
import type { RepliesResponse } from './useReplies';

export interface VoteInput {
  discussion?: string;
  reply?: string;
}

interface CreateVoteResponse {
  data: Vote;
  meta: Record<string, never>;
}

interface MutationContext {
  previousMyVotes?: MyVotesResponse;
  previousDiscussion?: DiscussionResponse;
  previousReplies?: RepliesResponse;
}

export function useVote(documentId: string) {
  const queryClient = useQueryClient();
  const { push } = useToast();

  return useMutation<CreateVoteResponse, Error, VoteInput, MutationContext>({
    mutationFn: (input) =>
      apiFetch<CreateVoteResponse>('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      }),

    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.myVotes(documentId) });

      const previousMyVotes = queryClient.getQueryData<MyVotesResponse>(queryKeys.myVotes(documentId));
      const previousDiscussion = queryClient.getQueryData<DiscussionResponse>(queryKeys.discussion(documentId));
      const previousReplies = queryClient.getQueryData<RepliesResponse>(queryKeys.replies(documentId));

      if (previousMyVotes) {
        queryClient.setQueryData<MyVotesResponse>(
          queryKeys.myVotes(documentId),
          input.reply
            ? { ...previousMyVotes, votedReplyDocumentIds: [...previousMyVotes.votedReplyDocumentIds, input.reply] }
            : { ...previousMyVotes, votedDiscussion: true },
        );
      }

      if (input.discussion && previousDiscussion) {
        queryClient.setQueryData<DiscussionResponse>(queryKeys.discussion(documentId), {
          ...previousDiscussion,
          data: { ...previousDiscussion.data, usefulCount: previousDiscussion.data.usefulCount + 1 },
        });
      }

      if (input.reply && previousReplies) {
        queryClient.setQueryData<RepliesResponse>(queryKeys.replies(documentId), {
          ...previousReplies,
          data: previousReplies.data.map((reply) =>
            reply.documentId === input.reply ? { ...reply, usefulCount: reply.usefulCount + 1 } : reply,
          ),
        });
      }

      return { previousMyVotes, previousDiscussion, previousReplies };
    },

    onError: (_error, _input, context) => {
      if (context?.previousMyVotes) queryClient.setQueryData(queryKeys.myVotes(documentId), context.previousMyVotes);
      if (context?.previousDiscussion) queryClient.setQueryData(queryKeys.discussion(documentId), context.previousDiscussion);
      if (context?.previousReplies) queryClient.setQueryData(queryKeys.replies(documentId), context.previousReplies);
      push('Impossible d\'enregistrer le vote.', 'error');
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myVotes(documentId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.discussion(documentId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.replies(documentId) });
    },
  });
}
