import { Avatar } from '@/components/Avatar';
import { CategoryTag } from '@/components/CategoryTag';
import { Prose } from '@/components/Prose';
import { formatRelativeDate } from '@/lib/relativeDate';
import type { DiscussionDetail } from '@/lib/strapi/schemas';

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
          <div className="font-semibold text-ink">{username ?? 'Utilisateur supprimé'}</div>
          <div className="text-[13px] text-ink-3">{formatRelativeDate(discussion.createdAt)}</div>
        </div>
      </div>

      <div className="mt-5">
        <Prose content={discussion.content} />
      </div>
    </article>
  );
}
