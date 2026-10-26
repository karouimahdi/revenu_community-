import Link from 'next/link';
import { Avatar } from '@/components/Avatar';
import { CategoryTag } from '@/components/CategoryTag';
import { Prose } from '@/components/Prose';
import { formatRelativeDate } from '@/lib/relativeDate';
import type { DiscussionDetail } from '@/lib/strapi/schemas';
import { VoteButton } from './VoteButton';

export function DiscussionPost({ discussion }: { discussion: DiscussionDetail }) {
  const username = discussion.authorUsername;

  return (
    <article className="rounded-[14px] border border-line bg-surface p-6 shadow-card">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {discussion.category && <CategoryTag name={discussion.category.name} />}
        {discussion.type === 'question' && (
          <span className="rounded-full bg-black/5 px-2 py-0.5 text-[11.5px] font-semibold text-ink-2">
            Question
          </span>
        )}
      </div>

      <h1 className="font-display text-[28px] font-bold leading-tight text-ink">{discussion.title}</h1>

      <div className="mt-4 flex items-center gap-3">
        <Avatar username={username ?? '?'} size="md" />
        <div>
          {username ? (
            <Link href={`/profile/${username}`} className="font-semibold text-ink hover:text-brand">
              {username}
            </Link>
          ) : (
            <div className="font-semibold text-ink">Utilisateur supprimé</div>
          )}
          <div suppressHydrationWarning className="text-[13px] text-ink-3">
            {formatRelativeDate(discussion.createdAt)}
          </div>
        </div>
      </div>

      <div className="mt-5">
        <Prose content={discussion.content} />
      </div>

      <div className="mt-4">
        <VoteButton
          discussionDocumentId={discussion.documentId}
          authorUsername={username}
          count={discussion.usefulCount}
        />
      </div>
    </article>
  );
}
