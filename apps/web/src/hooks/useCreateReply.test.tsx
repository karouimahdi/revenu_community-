import { describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCreateReply } from './useCreateReply';
import { queryKeys } from '@/lib/queryKeys';
import { apiFetch } from '@/lib/apiFetch';
import { useToastStore } from '@/stores/useToastStore';
import type { RepliesResponse } from './useReplies';

vi.mock('@/lib/apiFetch', () => ({
  apiFetch: vi.fn(),
}));

const mockedApiFetch = vi.mocked(apiFetch);
const DOCUMENT_ID = 'doc-1';

// Not renderWithProviders's gcTime: 0 default — useCreateReply never mounts
// a useQuery observer, so gcTime: 0 would evict the seed before onMutate runs.
function createReplyCacheClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

const SEED_REPLIES: RepliesResponse = {
  data: [{ id: 1, documentId: 'reply-1', content: 'Première réponse.', createdAt: new Date().toISOString(), authorUsername: 'karim_immo' }],
  meta: { pagination: { page: 1, pageSize: 20, pageCount: 1, total: 1 } },
};

describe('useCreateReply', () => {
  it('appends the pending reply to the cache before the mutation resolves', async () => {
    const queryClient = createReplyCacheClient();
    queryClient.setQueryData(queryKeys.replies(DOCUMENT_ID), SEED_REPLIES);
    // Never resolves — the assertion below can only pass via onMutate.
    mockedApiFetch.mockImplementation(() => new Promise(() => {}));

    function wrapper({ children }: { children: React.ReactNode }) {
      return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    }

    const { result } = renderHook(() => useCreateReply(DOCUMENT_ID), { wrapper });

    act(() => {
      result.current.mutate('Une nouvelle réponse.');
    });

    await waitFor(() => {
      const cached = queryClient.getQueryData<RepliesResponse>(queryKeys.replies(DOCUMENT_ID));
      expect(cached?.data).toHaveLength(2);
    });

    const cached = queryClient.getQueryData<RepliesResponse>(queryKeys.replies(DOCUMENT_ID));
    expect(cached?.data[1]).toMatchObject({ content: 'Une nouvelle réponse.' });
    expect(mockedApiFetch).toHaveBeenCalledTimes(1);
  });

  it('rolls back the cache and pushes an error toast when the mutation fails', async () => {
    const queryClient = createReplyCacheClient();
    queryClient.setQueryData(queryKeys.replies(DOCUMENT_ID), SEED_REPLIES);
    mockedApiFetch.mockRejectedValue(new Error('network down'));

    function wrapper({ children }: { children: React.ReactNode }) {
      return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    }

    const { result } = renderHook(() => useCreateReply(DOCUMENT_ID), { wrapper });

    act(() => {
      result.current.mutate('Une réponse qui va échouer.');
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(queryClient.getQueryData(queryKeys.replies(DOCUMENT_ID))).toEqual(SEED_REPLIES);

    const toasts = useToastStore.getState().toasts;
    expect(toasts).toHaveLength(1);
    expect(toasts[0]).toMatchObject({ variant: 'error', message: 'Impossible de publier la réponse.' });
  });
});
