import Link from 'next/link';
import { CategoryTag } from '@/components/CategoryTag';
import { formatRelativeDate } from '@/lib/relativeDate';
import type { DiscussionListItem } from '@/lib/strapi/schemas';

// Mockup's .feed-compact .trow — one discussion per line, columns instead
// of the comfy card's stacked meta. Dropped the mockup's "views" column:
// we don't track view counts, and a fake one would be worse than omitting it.
export function DiscussionRow({ discussion }: { discussion: DiscussionListItem }) {
  const count = discussion.repliesCount;

  return (
    <Link
      href={`/discussions/${discussion.documentId}`}
      className="grid grid-cols-[minmax(0,1fr)_72px_84px] items-center gap-3 border-t border-line px-4 py-2.5 first:border-t-0 hover:bg-surface-2/70"
    >
      <div className="flex min-w-0 items-center gap-2">
        {discussion.category && <CategoryTag name={discussion.category.name} />}
        <span className="truncate text-[14.5px] font-semibold text-ink">{discussion.title}</span>
      </div>
      <span
        className={`justify-self-end text-[13px] font-semibold tabular-nums ${count === 0 ? 'text-alert' : 'text-ink-3'}`}
      >
        {count} réponse{count > 1 ? 's' : ''}
      </span>
      <span className="justify-self-end text-[12.5px] text-ink-3">{formatRelativeDate(discussion.createdAt)}</span>
    </Link>
  );
}
