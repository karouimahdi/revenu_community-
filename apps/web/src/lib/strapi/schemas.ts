import { z } from 'zod';

export const categorySchema = z.object({
  id: z.number(),
  documentId: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable().optional(),
});

export const categoryRefSchema = categorySchema.pick({ id: true, documentId: true, name: true, slug: true });

// authorUsername is denormalized, not a populated relation — Strapi's
// output sanitizer drops a populated `author` for any role lacking `find`
// on plugin::users-permissions.user, which the Public role deliberately
// doesn't have (see apps/cms's discussion/reply controllers).
export const discussionListItemSchema = z.object({
  id: z.number(),
  documentId: z.string(),
  title: z.string(),
  type: z.enum(['question', 'discussion']),
  content: z.string(),
  repliesCount: z.number(),
  createdAt: z.string(),
  authorUsername: z.string().nullable().optional(),
  category: categoryRefSchema.nullable().optional(),
});

export const discussionDetailSchema = discussionListItemSchema;

export const replySchema = z.object({
  id: z.number(),
  documentId: z.string(),
  content: z.string(),
  createdAt: z.string(),
  authorUsername: z.string().nullable().optional(),
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

export type Category = z.infer<typeof categorySchema>;
export type DiscussionListItem = z.infer<typeof discussionListItemSchema>;
export type DiscussionDetail = z.infer<typeof discussionDetailSchema>;
export type Reply = z.infer<typeof replySchema>;
export type PaginationMeta = z.infer<typeof paginationMetaSchema>;
