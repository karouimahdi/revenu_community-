import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getProfile } from '@/lib/strapi/profile';
import { listDiscussions } from '@/lib/strapi/discussions';
import { StrapiRequestError } from '@/lib/strapi/client';
import type { Profile } from '@/lib/strapi/schemas';
import { DiscussionCard } from '@/app/DiscussionCard';
import { FeedSkeleton } from '@/app/FeedSkeleton';
import { EmptyState } from '@/components/EmptyState';
import { ProfileHeader } from './ProfileHeader';

async function ProfileDiscussions({ username }: { username: string }) {
  const discussions = await listDiscussions({ authorUsername: username, pageSize: 20 });

  if (discussions.data.length === 0) {
    return (
      <div className="rounded-[14px] border border-line bg-surface shadow-card">
        <EmptyState title="Aucune discussion" description={`@${username} n'a pas encore publié de discussion.`} />
      </div>
    );
  }

  return (
    <div className="rounded-[14px] border border-line bg-surface shadow-card overflow-hidden">
      {discussions.data.map((discussion) => (
        <DiscussionCard key={discussion.documentId} discussion={discussion} />
      ))}
    </div>
  );
}

// Not Suspense-wrapped at this level, unlike HomePage — once a fallback's
// 200 shell has flushed, a later notFound() can't change the status code.
export default async function ProfilePage({ params }: PageProps<'/profile/[username]'>) {
  const { username } = await params;

  let profile: Profile;
  try {
    const result = await getProfile(username);
    profile = result.data;
  } catch (error) {
    if (error instanceof StrapiRequestError && error.status === 404) notFound();
    throw error;
  }

  return (
    <main className="mx-auto w-full max-w-full flex-1 px-4 py-6">
      <div className="mx-auto max-w-[760px]">
        <ProfileHeader profile={profile} />
        <h2 className="mb-3 font-display text-lg font-bold text-ink">Discussions</h2>
        <Suspense fallback={<FeedSkeleton />}>
          <ProfileDiscussions username={username} />
        </Suspense>
      </div>
    </main>
  );
}
