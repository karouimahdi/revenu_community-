import { strapiFetch } from './client';
import { discussionDetailSchema, discussionListItemSchema, strapiListResponseSchema, strapiSingleResponseSchema } from './schemas';

export type DiscussionSort = 'createdAt:asc' | 'createdAt:desc';

export interface ListDiscussionsFilters {
  categorySlug?: string;
  search?: string;
  sort?: DiscussionSort;
  unanswered?: boolean;
  page?: number;
  pageSize?: number;
}

const LIST_FIELDS = ['title', 'type', 'content', 'createdAt', 'repliesCount', 'authorUsername'];
const LIST_POPULATE = {
  category: { fields: ['name', 'slug'] },
};

export async function listDiscussions(filters: ListDiscussionsFilters = {}) {
  const { categorySlug, search, sort = 'createdAt:desc', unanswered, page = 1, pageSize = 20 } = filters;

  const query: Record<string, unknown> = {
    sort: [sort],
    pagination: { page, pageSize },
    fields: LIST_FIELDS,
    populate: LIST_POPULATE,
  };
  const queryFilters: Record<string, unknown> = {};
  if (categorySlug) queryFilters.category = { slug: { $eq: categorySlug } };
  if (search) queryFilters.title = { $containsi: search };
  if (unanswered) queryFilters.repliesCount = { $eq: 0 };
  if (Object.keys(queryFilters).length > 0) query.filters = queryFilters;

  const json = await strapiFetch('/api/discussions', { query });
  return strapiListResponseSchema(discussionListItemSchema).parse(json);
}

export async function getDiscussion(documentId: string) {
  const json = await strapiFetch(`/api/discussions/${documentId}`, {
    query: { populate: LIST_POPULATE },
  });
  return strapiSingleResponseSchema(discussionDetailSchema).parse(json);
}

export interface CreateDiscussionInput {
  title: string;
  content: string;
  type: 'question' | 'discussion';
  category: string;
}

export async function createDiscussion(input: CreateDiscussionInput, token: string) {
  const json = await strapiFetch('/api/discussions', {
    method: 'POST',
    token,
    body: { data: input },
  });
  return strapiSingleResponseSchema(discussionDetailSchema).parse(json);
}
