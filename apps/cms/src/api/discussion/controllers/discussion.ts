import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::discussion.discussion', () => ({
  async create(ctx) {
    ctx.request.body.data.author = ctx.state.user.id;
    // Denormalized: Strapi's output sanitizer drops a populated `author` for
    // any role lacking `find` on users-permissions.user — Public shouldn't get that.
    ctx.request.body.data.authorUsername = ctx.state.user.username;
    return super.create(ctx);
  },
}));
