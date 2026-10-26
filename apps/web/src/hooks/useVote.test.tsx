import { describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useVote } from './useVote';
import { queryKeys } from '@/lib/queryKeys';
import { apiFetch } from '@/lib/apiFetch';
import { useToastStore } from '@/stores/useToastStore';
import type { MyVotesResponse } from './useMyVotes';
import type { DiscussionResponse } from './useDiscussion';

vi.mock('@/lib/apiFetch', () => ({
  apiFetch: vi.fn(),
}));

const mockedApiFetch = vi.mocked(apiFetch);
const DOCUMENT_ID = 'doc-1';

// Not renderWithProviders's gcTime: 0 default — useVote never mounts a
// useQuery observer for these keys, so gcTime: 0 would evict the seed before onMutate runs.
function createVoteCacheClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

const SEED_MY_VOTES: MyVotesResponse = { votedDiscussion: false, votedReplyDocumentIds: [] };

const SEED_DISCUSSION: DiscussionResponse = {
  data: {
    id: 1,
    documentId: DOCUMENT_ID,
    title: 'Une discussion suffisamment longue',
    type: 'discussion',
    content: 'Contenu.',
    repliesCount: 0,
    usefulCount: 3,
    createdAt: new Date().toISOString(),
    authorUsername: 'karim_immo',
    category: null,
  },
  meta: {},
};

describe('useVote', () => {
  it('optimistically marks the discussion as voted and bumps usefulCount', async () => {
    const queryClient = createVoteCacheClient();
    queryClient.setQueryData(queryKeys.myVotes(DOCUMENT_ID), SEED_MY_VOTES);
    queryClient.setQueryData(queryKeys.discussion(DOCUMENT_ID), SEED_DISCUSSION);
    mockedApiFetch.mockImplementation(() => new Promise(() => {}));

    function wrapper({ children }: { children: React.ReactNode }) {
      return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    }

    const { result } = renderHook(() => useVote(DOCUMENT_ID), { wrapper });

    act(() => {
      result.current.mutate({ discussion: DOCUMENT_ID });
    });

    await waitFor(() => {
      const cached = queryClient.getQueryData<MyVotesResponse>(queryKeys.myVotes(DOCUMENT_ID));
      expect(cached?.votedDiscussion).toBe(true);
    });

    const cachedDiscussion = queryClient.getQueryData<DiscussionResponse>(queryKeys.discussion(DOCUMENT_ID));
    expect(cachedDiscussion?.data.usefulCount).toBe(4);
  });

  it('rolls back the cache and pushes an error toast when the mutation fails', async () => {
    const queryClient = createVoteCacheClient();
    queryClient.setQueryData(queryKeys.myVotes(DOCUMENT_ID), SEED_MY_VOTES);
    queryClient.setQueryData(queryKeys.discussion(DOCUMENT_ID), SEED_DISCUSSION);
    mockedApiFetch.mockRejectedValue(new Error('network down'));

    function wrapper({ children }: { children: React.ReactNode }) {
      return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    }

    const { result } = renderHook(() => useVote(DOCUMENT_ID), { wrapper });

    act(() => {
      result.current.mutate({ discussion: DOCUMENT_ID });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(queryClient.getQueryData(queryKeys.myVotes(DOCUMENT_ID))).toEqual(SEED_MY_VOTES);
    expect(queryClient.getQueryData<DiscussionResponse>(queryKeys.discussion(DOCUMENT_ID))?.data.usefulCount).toBe(3);

    const toasts = useToastStore.getState().toasts;
    expect(toasts).toHaveLength(1);
    expect(toasts[0]).toMatchObject({ variant: 'error', message: 'Impossible d\'enregistrer le vote.' });
  });
});
