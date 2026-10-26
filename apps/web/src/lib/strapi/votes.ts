import { strapiFetch } from './client';
import { strapiListResponseSchema, strapiSingleResponseSchema, voteSchema } from './schemas';

export interface VoteInput {
  discussion?: string;
  reply?: string;
}

export async function createVote(input: VoteInput, token: string) {
  const json = await strapiFetch('/api/votes', {
    method: 'POST',
    token,
    body: { data: input },
  });
  return strapiSingleResponseSchema(voteSchema).parse(json);
}

// One query covers the whole detail page: the discussion's own vote and
// every one of its replies', so every VoteButton on the page shares it.
export async function listMyVotes(discussionDocumentId: string, token: string) {
  const json = await strapiFetch('/api/votes', {
    token,
    query: {
      filters: {
        $or: [
          { discussion: { documentId: { $eq: discussionDocumentId } } },
          { reply: { discussion: { documentId: { $eq: discussionDocumentId } } } },
        ],
      },
      populate: { discussion: { fields: ['documentId'] }, reply: { fields: ['documentId'] } },
      pagination: { pageSize: 200 },
    },
  });
  return strapiListResponseSchema(voteSchema).parse(json);
}
