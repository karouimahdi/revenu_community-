import type { Core } from '@strapi/strapi';

declare const strapi: Core.Strapi;

type TargetType = 'discussion' | 'reply';

const targetByVoteId = new Map<number, { type: TargetType; documentId: string }>();

async function syncUsefulCount(type: TargetType, documentId: string) {
  const usefulCount = await strapi.documents('api::vote.vote').count({
    filters: { [type]: { documentId } },
  });
  const uid = type === 'discussion' ? 'api::discussion.discussion' : 'api::reply.reply';
  await strapi.documents(uid).update({ documentId, data: { usefulCount } });
}

export default {
  async afterCreate(event: { result: { documentId: string } }) {
    const vote = await strapi.documents('api::vote.vote').findOne({
      documentId: event.result.documentId,
      populate: { discussion: true, reply: true },
    });
    if (vote?.discussion?.documentId) await syncUsefulCount('discussion', vote.discussion.documentId);
    else if (vote?.reply?.documentId) await syncUsefulCount('reply', vote.reply.documentId);
  },

  // Same join-table cascade issue as reply/lifecycles.ts: the link row is
  // gone by afterDelete, so the target has to be captured here first.
  async beforeDelete(event: { params: { where: { id: number } } }) {
    const id = event.params.where?.id;
    if (id === undefined) return;
    const vote = await strapi.db.query('api::vote.vote').findOne({ where: { id }, populate: ['discussion', 'reply'] });
    if (vote?.discussion?.documentId) targetByVoteId.set(id, { type: 'discussion', documentId: vote.discussion.documentId });
    else if (vote?.reply?.documentId) targetByVoteId.set(id, { type: 'reply', documentId: vote.reply.documentId });
  },
  async afterDelete(event: { result: { id: number } }) {
    const id = event.result?.id;
    const target = id !== undefined ? targetByVoteId.get(id) : undefined;
    if (id !== undefined) targetByVoteId.delete(id);
    if (target) await syncUsefulCount(target.type, target.documentId);
  },
};
