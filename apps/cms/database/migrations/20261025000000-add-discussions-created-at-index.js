// Strapi v5's schema sync already indexes both sides of every relation link
// table (verified: discussions_category_lnk, replies_discussion_lnk,
// discussions_author_lnk all come out of the box with btree indexes on both
// FK columns) — the one gap it leaves is a plain scalar sort column, which
// is this migration's only job.
module.exports = {
  async up(knex) {
    await knex.schema.alterTable('discussions', (table) => {
      table.index('created_at', 'discussions_created_at_idx');
    });
  },
  async down(knex) {
    await knex.schema.alterTable('discussions', (table) => {
      table.dropIndex('created_at', 'discussions_created_at_idx');
    });
  },
};
