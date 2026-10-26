'use client';

import Link from 'next/link';
import { ThumbIcon } from '@/components/icons';
import { useSession } from '@/hooks/useSession';
import { useMyVotes } from '@/hooks/useMyVotes';
import { useVote } from '@/hooks/useVote';

interface VoteButtonProps {
  discussionDocumentId: string;
  replyDocumentId?: string;
  authorUsername?: string | null;
  count: number;
}

export function VoteButton({ discussionDocumentId, replyDocumentId, authorUsername, count }: VoteButtonProps) {
  const { user, isAuthenticated } = useSession();
  const { data: myVotes } = useMyVotes(discussionDocumentId);
  const vote = useVote(discussionDocumentId);

  const isOwn = isAuthenticated && user?.username === authorUsername;
  const hasVoted = replyDocumentId
    ? (myVotes?.votedReplyDocumentIds.includes(replyDocumentId) ?? false)
    : (myVotes?.votedDiscussion ?? false);

  const baseClasses =
    'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12.5px] font-semibold transition-colors';

  if (isOwn) {
    return (
      <span className={`${baseClasses} border-line text-ink-3`} title="Vous ne pouvez pas marquer votre propre message comme utile.">
        <ThumbIcon className="size-3.5" />
        Utile · {count}
      </span>
    );
  }

  if (!isAuthenticated) {
    return (
      <Link
        href={`/login?next=/discussions/${discussionDocumentId}`}
        className={`${baseClasses} border-line text-ink-3 hover:border-ink-3`}
      >
        <ThumbIcon className="size-3.5" />
        Utile · {count}
      </Link>
    );
  }

  return (
    <button
      type="button"
      disabled={hasVoted || vote.isPending}
      aria-pressed={hasVoted}
      onClick={() => vote.mutate(replyDocumentId ? { reply: replyDocumentId } : { discussion: discussionDocumentId })}
      className={`${baseClasses} ${
        hasVoted
          ? 'border-brand bg-brand/10 text-brand'
          : 'border-line text-ink-2 hover:border-brand hover:text-brand disabled:opacity-60'
      }`}
    >
      <ThumbIcon className="size-3.5" />
      Utile · {count}
    </button>
  );
}
