import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getDiscussion } from '@/lib/strapi/discussions';
import { listReplies } from '@/lib/strapi/replies';
import { StrapiRequestError } from '@/lib/strapi/client';
import type { DiscussionDetail } from '@/lib/strapi/schemas';
import { DiscussionPost } from './DiscussionPost';
import { ReplyThread } from './ReplyThread';
import { RepliesSkeleton } from './RepliesSkeleton';

async function RepliesSection({ documentId, discussion }: { documentId: string; discussion: DiscussionDetail }) {
  const replies = await listReplies(documentId);

  return (
    <ReplyThread
      documentId={documentId}
      initialReplies={replies}
      initialDiscussion={{ data: discussion, meta: {} }}
    />
  );
}

// Deliberately NOT Suspense-wrapped at this level, unlike HomePage —
// notFound()'s HTTP status can only land correctly if it fires before any
// bytes stream out. Once a Suspense fallback's 200 shell has flushed, a
// later notFound() swaps the body but can't retroactively change the
// status code (confirmed empirically: body showed the not-found UI, curl
// still saw 200). §3.10's error contract commits to a real 404 for an
// unknown documentId, which matters more here than this one route's
// otherwise-avoidable "uncached data during prerendering" dev warning.
export default async function DiscussionDetailPage({ params }: PageProps<'/discussions/[documentId]'>) {
  const { documentId } = await params;

  let discussion: DiscussionDetail;
  try {
    const result = await getDiscussion(documentId);
    discussion = result.data;
  } catch (error) {
    if (error instanceof StrapiRequestError && error.status === 404) notFound();
    throw error;
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
      <DiscussionPost discussion={discussion} />
      <Suspense
        fallback={
          <div className="mt-6">
            <RepliesSkeleton />
          </div>
        }
      >
        <RepliesSection documentId={documentId} discussion={discussion} />
      </Suspense>
    </main>
  );
}
