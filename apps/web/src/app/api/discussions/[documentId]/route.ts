import { NextResponse, type NextRequest } from 'next/server';
import { getDiscussion } from '@/lib/strapi/discussions';
import { StrapiRequestError } from '@/lib/strapi/client';

export async function GET(_request: NextRequest, ctx: RouteContext<'/api/discussions/[documentId]'>) {
  const { documentId } = await ctx.params;

  try {
    const result = await getDiscussion(documentId);
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
