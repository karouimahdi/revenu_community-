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

// Not Suspense-wrapped at this level, unlike HomePage — once a fallback's
// 200 shell has flushed, a later notFound() can't change the status code.
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
    <main className="mx-auto w-full max-w-full flex-1 px-4 py-6">
      {/* Narrower than the header/home shell — a 1260px-wide paragraph is uncomfortable to read. */}
      <div className="mx-auto max-w-[760px]">
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
      </div>
    </main>
  );
}
