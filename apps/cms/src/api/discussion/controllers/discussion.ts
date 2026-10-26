import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::discussion.discussion', () => ({
  async create(ctx) {
    ctx.request.body.data.author = ctx.state.user.id;
    // Denormalized alongside the real relation: Strapi's output sanitizer
    // silently drops a populated `author` for any role that lacks `find`
    // on plugin::users-permissions.user (confirmed — same rule as the
    // input-side check in §3.5, just symmetric for reads). Public needs
    // to see author names on the home feed without gaining `user.find`
    // itself, which would expose every email via GET /api/users.
    ctx.request.body.data.authorUsername = ctx.state.user.username;
    return super.create(ctx);
  },
}));
