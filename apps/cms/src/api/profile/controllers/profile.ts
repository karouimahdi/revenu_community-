import type { Core } from '@strapi/strapi';
import type { Context } from 'koa';

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  async show(ctx: Context) {
    const { username } = ctx.params;

    const user = await strapi.db.query('plugin::users-permissions.user').findOne({
      where: { username },
      select: ['id', 'username'],
    });
    if (!user) return ctx.notFound();

    const discussions = await strapi.db.query('api::discussion.discussion').findMany({
      where: { authorUsername: username },
      select: ['usefulCount'],
    });
    const replies = await strapi.db.query('api::reply.reply').findMany({
      where: { authorUsername: username },
      select: ['usefulCount'],
    });

    const usefulReceived =
      discussions.reduce((sum: number, d: { usefulCount: number }) => sum + d.usefulCount, 0) +
      replies.reduce((sum: number, r: { usefulCount: number }) => sum + r.usefulCount, 0);

    return {
      data: {
        username: user.username,
        discussionsCount: discussions.length,
        usefulReceived,
      },
      meta: {},
    };
  },
});
