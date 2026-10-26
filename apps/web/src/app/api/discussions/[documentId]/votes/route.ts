import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';
import { listMyVotes } from '@/lib/strapi/votes';
import { StrapiRequestError } from '@/lib/strapi/client';
import { SESSION_COOKIE_NAME } from '@/lib/session';

export async function GET(_request: NextRequest, ctx: RouteContext<'/api/discussions/[documentId]/votes'>) {
  const { documentId } = await ctx.params;
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json({ votedDiscussion: false, votedReplyDocumentIds: [] });
  }

  try {
    const result = await listMyVotes(documentId, token);
    const votedDiscussion = result.data.some((vote) => vote.discussion?.documentId === documentId);
    const votedReplyDocumentIds = result.data.flatMap((vote) => (vote.reply?.documentId ? [vote.reply.documentId] : []));
    return NextResponse.json({ votedDiscussion, votedReplyDocumentIds });
  } catch (error) {
    if (error instanceof StrapiRequestError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    throw error;
  }
}
