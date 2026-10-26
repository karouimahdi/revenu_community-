import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::reply.reply', ({ strapi }) => ({
  async create(ctx) {
    ctx.request.body.data.author = ctx.state.user.id;
    ctx.request.body.data.authorUsername = ctx.state.user.username;
    return super.create(ctx);
  },

  // Not a core update — only the discussion's own author may call this, and
  // setting one reply as the best answer must unset any previous one.
  async markBestAnswer(ctx) {
    const { documentId } = ctx.params;

    const reply = await strapi.documents('api::reply.reply').findOne({
      documentId,
      populate: { discussion: { populate: { author: { fields: ['id'] } } } },
    });
    if (!reply) return ctx.notFound();

    const discussion = reply.discussion;
    if (!discussion || discussion.author?.id !== ctx.state.user.id) {
      return ctx.forbidden('Seul l\'auteur de la discussion peut choisir la meilleure réponse.');
    }

    const nextValue = !reply.isBestAnswer;

    if (nextValue) {
      const previousBest = await strapi.documents('api::reply.reply').findMany({
        filters: { discussion: { documentId: discussion.documentId }, isBestAnswer: { $eq: true } },
      });
      await Promise.all(
        previousBest.map((entry) =>
          strapi.documents('api::reply.reply').update({ documentId: entry.documentId, data: { isBestAnswer: false } }),
        ),
      );
    }

    const updated = await strapi.documents('api::reply.reply').update({
      documentId,
      data: { isBestAnswer: nextValue },
    });

    return { data: updated, meta: {} };
  },
}));
