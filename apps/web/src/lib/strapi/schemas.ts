import { z } from 'zod';

export const authorSchema = z.object({
  id: z.number(),
  username: z.string(),
});

export const categorySchema = z.object({
  id: z.number(),
  documentId: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable().optional(),
});

export const categoryRefSchema = categorySchema.pick({ id: true, documentId: true, name: true, slug: true });

export const discussionListItemSchema = z.object({
  id: z.number(),
  documentId: z.string(),
  title: z.string(),
  type: z.enum(['question', 'discussion']),
  repliesCount: z.number(),
  createdAt: z.string(),
  author: authorSchema.nullable().optional(),
  category: categoryRefSchema.nullable().optional(),
});

export const discussionDetailSchema = discussionListItemSchema.extend({
  content: z.string(),
});

export const replySchema = z.object({
  id: z.number(),
  documentId: z.string(),
  content: z.string(),
  createdAt: z.string(),
  author: authorSchema.nullable().optional(),
});

export const paginationMetaSchema = z.object({
  page: z.number(),
  pageSize: z.number(),
  pageCount: z.number(),
  total: z.number(),
});

export function strapiListResponseSchema<T extends z.ZodTypeAny>(item: T) {
  return z.object({
    data: z.array(item),
    meta: z.object({ pagination: paginationMetaSchema }),
  });
}

export function strapiSingleResponseSchema<T extends z.ZodTypeAny>(item: T) {
  return z.object({
    data: item,
    meta: z.object({}),
  });
}

export type Author = z.infer<typeof authorSchema>;
export type Category = z.infer<typeof categorySchema>;
export type DiscussionListItem = z.infer<typeof discussionListItemSchema>;
export type DiscussionDetail = z.infer<typeof discussionDetailSchema>;
export type Reply = z.infer<typeof replySchema>;
export type PaginationMeta = z.infer<typeof paginationMetaSchema>;
