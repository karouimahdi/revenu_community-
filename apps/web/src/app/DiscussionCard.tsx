import Link from 'next/link';
import { Avatar } from '@/components/Avatar';
import { CategoryTag } from '@/components/CategoryTag';
import { formatRelativeDate } from '@/lib/relativeDate';
import { plainExcerpt } from '@/lib/formatBody';
import type { DiscussionListItem } from '@/lib/strapi/schemas';

export function DiscussionCard({ discussion }: { discussion: DiscussionListItem }) {
  const count = discussion.repliesCount;
  const username = discussion.authorUsername;

  return (
    <Link
      href={`/discussions/${discussion.documentId}`}
      className="grid grid-cols-[62px_minmax(0,1fr)] gap-4 border-t border-line p-4 transition-colors first:border-t-0 hover:bg-surface-2/70"
    >
      <div
        className={`flex h-[58px] w-[62px] flex-col items-center justify-center rounded-[9px] border text-ink-2 ${
          count === 0 ? 'border-dashed border-alert text-alert' : 'border-line'
        }`}
      >
        <b className="text-[19px] font-semibold tabular-nums text-ink">{count}</b>
        <span className="text-[10.5px]">réponse{count > 1 ? 's' : ''}</span>
      </div>

      <div className="min-w-0">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          {discussion.category && <CategoryTag name={discussion.category.name} />}
          {discussion.type === 'question' && (
            <span className="rounded-full bg-black/5 px-2 py-0.5 text-[11.5px] font-semibold text-ink-2">
              Question
            </span>
          )}
        </div>

        <h3 className="font-display text-[18.5px] font-bold leading-snug text-ink">{discussion.title}</h3>

        <p className="mt-1 line-clamp-2 text-[14px] text-ink-2">{plainExcerpt(discussion.content)}</p>

        <div className="mt-2 flex items-center gap-2 text-[13px] text-ink-3">
          <Avatar username={username ?? '?'} size="xs" />
          <b className="font-semibold text-ink-2">{username ?? 'Utilisateur supprimé'}</b>
          <span suppressHydrationWarning>· {formatRelativeDate(discussion.createdAt)}</span>
        </div>
      </div>
    </Link>
  );
}
