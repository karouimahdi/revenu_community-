import { strapiFetch } from './client';
import { discussionDetailSchema, discussionListItemSchema, strapiListResponseSchema, strapiSingleResponseSchema } from './schemas';

export type DiscussionSort = 'createdAt:asc' | 'createdAt:desc';

export interface ListDiscussionsFilters {
  categorySlug?: string;
  sort?: DiscussionSort;
  page?: number;
  pageSize?: number;
}

const LIST_FIELDS = ['title', 'type', 'createdAt', 'repliesCount'];
const LIST_POPULATE = {
  author: { fields: ['username'] },
  category: { fields: ['name', 'slug'] },
};

export async function listDiscussions(filters: ListDiscussionsFilters = {}) {
  const { categorySlug, sort = 'createdAt:desc', page = 1, pageSize = 20 } = filters;

  const query: Record<string, unknown> = {
    sort: [sort],
    pagination: { page, pageSize },
    fields: LIST_FIELDS,
    populate: LIST_POPULATE,
  };
  if (categorySlug) {
    query.filters = { category: { slug: { $eq: categorySlug } } };
  }

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
