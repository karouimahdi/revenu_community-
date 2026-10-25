import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::discussion.discussion', () => ({
  async create(ctx) {
    ctx.request.body.data.author = ctx.state.user.id;
    return super.create(ctx);
  },
}));
