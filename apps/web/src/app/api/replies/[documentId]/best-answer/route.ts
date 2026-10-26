import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';
import { markBestAnswer } from '@/lib/strapi/replies';
import { StrapiRequestError } from '@/lib/strapi/client';
import { SESSION_COOKIE_NAME } from '@/lib/session';

export async function POST(_request: NextRequest, ctx: RouteContext<'/api/replies/[documentId]/best-answer'>) {
  const { documentId } = await ctx.params;
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json({ message: 'Vous devez être connecté.' }, { status: 403 });
  }

  try {
    const result = await markBestAnswer(documentId, token);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof StrapiRequestError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    throw error;
  }
}
