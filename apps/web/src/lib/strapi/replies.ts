import { strapiFetch } from './client';
import { replySchema, strapiListResponseSchema, strapiSingleResponseSchema } from './schemas';

export async function listReplies(discussionDocumentId: string) {
  const json = await strapiFetch('/api/replies', {
    query: {
      filters: { discussion: { documentId: { $eq: discussionDocumentId } } },
      sort: ['createdAt:asc'],
      pagination: { pageSize: 100 },
    },
  });
  return strapiListResponseSchema(replySchema).parse(json);
}

export async function createReply(discussionDocumentId: string, content: string, token: string) {
  const json = await strapiFetch('/api/replies', {
    method: 'POST',
    token,
    body: { data: { content, discussion: discussionDocumentId } },
  });
  return strapiSingleResponseSchema(replySchema).parse(json);
}
