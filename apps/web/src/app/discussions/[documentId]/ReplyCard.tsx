'use client';

import Link from 'next/link';
import { Avatar } from '@/components/Avatar';
import { Prose } from '@/components/Prose';
import { CheckIcon } from '@/components/icons';
import { formatRelativeDate } from '@/lib/relativeDate';
import type { Reply } from '@/lib/strapi/schemas';
import { useMarkBestAnswer } from '@/hooks/useMarkBestAnswer';
import { VoteButton } from './VoteButton';

interface ReplyCardProps {
  reply: Reply;
  discussionDocumentId: string;
  canMarkBestAnswer: boolean;
}

export function ReplyCard({ reply, discussionDocumentId, canMarkBestAnswer }: ReplyCardProps) {
  const username = reply.authorUsername;
  const markBestAnswer = useMarkBestAnswer(discussionDocumentId);

  return (
    <article
      className={`rounded-[14px] border bg-surface p-4 shadow-card ${
        reply.isBestAnswer ? 'border-ok' : 'border-line'
      }`}
    >
      {reply.isBestAnswer && (
        <div className="mb-2 flex items-center gap-1.5 text-[12.5px] font-semibold text-ok">
          <CheckIcon className="size-3.5" />
          Meilleure réponse
        </div>
      )}

      <div className="mb-2 flex items-center gap-2.5">
        <Avatar username={username ?? '?'} size="sm" />
        <div>
          {username ? (
            <Link href={`/profile/${username}`} className="text-sm font-semibold text-ink hover:text-brand">
              {username}
            </Link>
          ) : (
            <div className="text-sm font-semibold text-ink">Utilisateur supprimé</div>
          )}
          <div suppressHydrationWarning className="text-[12.5px] text-ink-3">
            {formatRelativeDate(reply.createdAt)}
          </div>
        </div>
      </div>

      <Prose content={reply.content} />

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <VoteButton
          discussionDocumentId={discussionDocumentId}
          replyDocumentId={reply.documentId}
          authorUsername={username}
          count={reply.usefulCount}
        />
        {canMarkBestAnswer && (
          <button
            type="button"
            disabled={markBestAnswer.isPending}
            onClick={() => markBestAnswer.mutate(reply.documentId)}
            className="inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-[12.5px] font-semibold text-ink-2 transition-colors hover:border-ok hover:text-ok disabled:opacity-60"
          >
            <CheckIcon className="size-3.5" />
            {reply.isBestAnswer ? 'Retirer la meilleure réponse' : 'Choisir comme meilleure réponse'}
          </button>
        )}
      </div>
    </article>
  );
}
