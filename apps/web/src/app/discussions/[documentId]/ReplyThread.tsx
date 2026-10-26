'use client';

import Link from 'next/link';
import { useDiscussion, type DiscussionResponse } from '@/hooks/useDiscussion';
import { useReplies, type RepliesResponse } from '@/hooks/useReplies';
import { useSession } from '@/hooks/useSession';
import { ErrorState } from '@/components/ErrorState';
import { ReplyCard } from './ReplyCard';
import { ReplyForm } from './ReplyForm';
import { RepliesSkeleton } from './RepliesSkeleton';

interface ReplyThreadProps {
  documentId: string;
  initialReplies: RepliesResponse;
  initialDiscussion: DiscussionResponse;
}

export function ReplyThread({ documentId, initialReplies, initialDiscussion }: ReplyThreadProps) {
  // Seeds the discussion(documentId) cache entry so useCreateReply's
  // optimistic update can read the discussion's type without a background
  useDiscussion(documentId, initialDiscussion);

  const { data, isPending, isError, error } = useReplies(documentId, initialReplies);
  const { isAuthenticated } = useSession();
  const count = data?.data.length ?? 0;

  return (
    <section aria-label="Réponses" className="mt-6">
      <h2 className="mb-3 font-display text-xl font-bold text-ink">
        {isPending
          ? 'Réponses'
          : count > 0
            ? `${count} réponse${count > 1 ? 's' : ''}`
            : "Aucune réponse pour l'instant"}
      </h2>

      {isPending ? (
        <RepliesSkeleton />
      ) : isError ? (
        <ErrorState message={error.message} />
      ) : (
        <div className="mb-6 space-y-4">
          {data.data.map((reply) => (
            <ReplyCard key={reply.documentId} reply={reply} />
          ))}
        </div>
      )}

      {isAuthenticated ? (
        <ReplyForm documentId={documentId} />
      ) : (
        <div className="rounded-[14px] border border-line bg-surface p-5 text-center shadow-card">
          <h3 className="font-display text-lg font-bold text-ink">Vous avez un avis à partager ?</h3>
          <p className="mt-1 text-sm text-ink-2">Rejoignez la communauté pour répondre à cette discussion.</p>
          <Link
            href={`/login?next=/discussions/${documentId}`}
            className="mt-3 inline-block rounded-[9px] bg-brand px-4 py-1.5 text-sm font-semibold text-white hover:bg-brand-hover"
          >
            Se connecter pour répondre
          </Link>
        </div>
      )}
    </section>
  );
}
