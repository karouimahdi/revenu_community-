import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::vote.vote', ({ strapi }) => ({
  async create(ctx) {
    const data = ctx.request.body.data ?? {};
    const { discussion, reply } = data;

    if (!discussion && !reply) return ctx.badRequest('Une discussion ou une réponse est requise.');
    if (discussion && reply) return ctx.badRequest('Un vote ne peut viser qu\'une seule cible.');

    const userId = ctx.state.user.id;
    const targetUid = discussion ? 'api::discussion.discussion' : 'api::reply.reply';
    const targetDocumentId = discussion ?? reply;

    const target = await strapi.documents(targetUid).findOne({
      documentId: targetDocumentId,
      populate: { author: { fields: ['id'] } },
    });
    if (!target) return ctx.notFound();
    if (target.author?.id === userId) {
      return ctx.forbidden('Vous ne pouvez pas marquer votre propre message comme utile.');
    }

    ctx.request.body.data = {
      user: userId,
      discussion: discussion ? targetDocumentId : undefined,
      reply: reply ? targetDocumentId : undefined,
      voteKey: `${userId}:${discussion ? 'discussion' : 'reply'}:${targetDocumentId}`,
    };

    return super.create(ctx);
  },

  async find(ctx) {
    const userId = ctx.state.user.id;
    const existingFilters = (ctx.query.filters as Record<string, unknown>) ?? {};
    ctx.query = { ...ctx.query, filters: { ...existingFilters, user: { id: { $eq: userId } } } };
    return super.find(ctx);
  },
}));
