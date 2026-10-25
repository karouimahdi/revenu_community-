import type { Core } from '@strapi/strapi';

declare const strapi: Core.Strapi;

const discussionByReplyId = new Map<number, string>();

async function syncRepliesCount(discussionDocumentId: string) {
  const repliesCount = await strapi.documents('api::reply.reply').count({
    filters: { discussion: { documentId: discussionDocumentId } },
  });
  await strapi.documents('api::discussion.discussion').update({
    documentId: discussionDocumentId,
    data: { repliesCount },
  });
}

export default {
  async afterCreate(event: { result: { documentId: string } }) {
    const reply = await strapi.documents('api::reply.reply').findOne({
      documentId: event.result.documentId,
      populate: { discussion: true },
    });
    if (reply?.discussion?.documentId) {
      await syncRepliesCount(reply.discussion.documentId);
    }
  },

  // The discussion link lives in a join table, cascade-deleted alongside the
  // reply row itself, so afterDelete's `result` can no longer resolve it —
  // read it here, before the row is gone, and hand it off via the id.
  async beforeDelete(event: { params: { where: { id: number } } }) {
    const id = event.params.where?.id;
    if (id === undefined) return;
    const reply = await strapi.db.query('api::reply.reply').findOne({
      where: { id },
      populate: ['discussion'],
    });
    if (reply?.discussion?.documentId) {
      discussionByReplyId.set(id, reply.discussion.documentId);
    }
  },
  async afterDelete(event: { result: { id: number } }) {
    const id = event.result?.id;
    const discussionDocumentId = id !== undefined ? discussionByReplyId.get(id) : undefined;
    if (id !== undefined) discussionByReplyId.delete(id);
    if (discussionDocumentId) {
      await syncRepliesCount(discussionDocumentId);
    }
  },
};
