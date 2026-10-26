import { Avatar } from '@/components/Avatar';
import type { Profile } from '@/lib/strapi/schemas';

export function ProfileHeader({ profile }: { profile: Profile }) {
  return (
    <section className="mb-6 rounded-[14px] border border-line bg-surface p-6 shadow-card">
      <div className="flex items-center gap-4">
        <Avatar username={profile.username} size="lg" />
        <h1 className="font-display text-2xl font-bold text-ink">@{profile.username}</h1>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:w-fit">
        <div className="rounded-[10px] border border-line px-6 py-3 text-center">
          <b className="block text-xl font-semibold tabular-nums text-ink">{profile.discussionsCount}</b>
          <span className="text-[12.5px] text-ink-2">discussion{profile.discussionsCount > 1 ? 's' : ''}</span>
        </div>
        <div className="rounded-[10px] border border-line px-6 py-3 text-center">
          <b className="block text-xl font-semibold tabular-nums text-ink">{profile.usefulReceived}</b>
          <span className="text-[12.5px] text-ink-2">« Utile » reçus</span>
        </div>
      </div>
    </section>
  );
}
