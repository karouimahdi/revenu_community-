import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::reply.reply', () => ({
  async create(ctx) {
    ctx.request.body.data.author = ctx.state.user.id;
    ctx.request.body.data.authorUsername = ctx.state.user.username;
    return super.create(ctx);
  },
}));
