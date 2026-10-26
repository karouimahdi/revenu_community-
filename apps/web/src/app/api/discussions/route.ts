import { NextResponse, type NextRequest } from 'next/server';
import { listDiscussions, type DiscussionSort } from '@/lib/strapi/discussions';
import { StrapiRequestError } from '@/lib/strapi/client';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const categorySlug = searchParams.get('category') ?? undefined;
  const search = searchParams.get('search') ?? undefined;
  const sort = (searchParams.get('sort') as DiscussionSort | null) ?? undefined;
  const unanswered = searchParams.get('unanswered') === '1';
  const page = Number(searchParams.get('page') ?? '1');
  const pageSize = Number(searchParams.get('pageSize') ?? '20');

  try {
    const result = await listDiscussions({ categorySlug, search, sort, unanswered, page, pageSize });
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
