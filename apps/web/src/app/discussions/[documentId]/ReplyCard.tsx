import { Avatar } from '@/components/Avatar';
import { Prose } from '@/components/Prose';
import { formatRelativeDate } from '@/lib/relativeDate';
import type { Reply } from '@/lib/strapi/schemas';

export function ReplyCard({ reply }: { reply: Reply }) {
  const username = reply.authorUsername;

  return (
    <article className="rounded-[14px] border border-line bg-surface p-4 shadow-card">
      <div className="mb-2 flex items-center gap-2.5">
        <Avatar username={username ?? '?'} size="sm" />
        <div>
          <div className="text-sm font-semibold text-ink">{username ?? 'Utilisateur supprimé'}</div>
          <div className="text-[12.5px] text-ink-3">{formatRelativeDate(reply.createdAt)}</div>
        </div>
      </div>
      <Prose content={reply.content} />
    </article>
  );
}
