import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';
import { createVote } from '@/lib/strapi/votes';
import { StrapiRequestError } from '@/lib/strapi/client';
import { SESSION_COOKIE_NAME } from '@/lib/session';

export async function POST(request: NextRequest) {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ message: 'Vous devez être connecté pour voter.' }, { status: 403 });
  }

  const body = (await request.json()) as { discussion?: string; reply?: string };
  if (!body.discussion && !body.reply) {
    return NextResponse.json({ message: 'Cible du vote manquante.' }, { status: 400 });
  }

  try {
    const result = await createVote(body, token);
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
