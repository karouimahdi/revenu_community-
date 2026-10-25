import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';
import { createReply, listReplies } from '@/lib/strapi/replies';
import { StrapiRequestError } from '@/lib/strapi/client';
import { SESSION_COOKIE_NAME } from '@/lib/session';

export async function GET(_request: NextRequest, ctx: RouteContext<'/api/discussions/[documentId]/replies'>) {
  const { documentId } = await ctx.params;

  try {
    const result = await listReplies(documentId);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof StrapiRequestError) {
      return NextResponse.json(
        { message: error.message, fieldErrors: error.fieldErrors },
        { status: error.status },
      );
    }
    throw error;
  }
}

export async function POST(request: NextRequest, ctx: RouteContext<'/api/discussions/[documentId]/replies'>) {
  const { documentId } = await ctx.params;
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json({ message: 'Vous devez être connecté pour répondre.' }, { status: 403 });
  }

  const body = (await request.json()) as { content?: string };
  if (!body.content) {
    return NextResponse.json({ message: 'Le contenu de la réponse est requis.' }, { status: 400 });
  }

  try {
    const result = await createReply(documentId, body.content, token);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof StrapiRequestError) {
      return NextResponse.json(
        { message: error.message, fieldErrors: error.fieldErrors },
        { status: error.status },
      );
    }
    throw error;
  }
}
