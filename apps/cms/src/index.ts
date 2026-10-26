import type { Core } from '@strapi/strapi';

type RoleType = 'public' | 'authenticated';

const PERMISSIONS: Record<RoleType, string[]> = {
  public: [
    'api::category.category.find',
    'api::category.category.findOne',
    'api::discussion.discussion.find',
    'api::discussion.discussion.findOne',
    'api::reply.reply.find',
    'api::reply.reply.findOne',
    'api::profile.profile.show',
  ],
  authenticated: [
    'api::category.category.find',
    'api::category.category.findOne',
    'api::discussion.discussion.find',
    'api::discussion.discussion.findOne',
    'api::discussion.discussion.create',
    'api::reply.reply.find',
    'api::reply.reply.findOne',
    'api::reply.reply.create',
    'api::reply.reply.markBestAnswer',
    'api::vote.vote.create',
    'api::vote.vote.find',
    'api::profile.profile.show',
    'plugin::users-permissions.user.find',
  ],
};



async function syncRolePermissions(strapi: Core.Strapi, roleType: RoleType) {
  const role = await strapi.query('plugin::users-permissions.role').findOne({ where: { type: roleType } });
  if (!role) return;

  const wantedActions = PERMISSIONS[roleType];

  const existing = await strapi.query('plugin::users-permissions.permission').findMany({
    where: { role: role.id, action: { $in: wantedActions } },
  });
  const existingActions = new Set(existing.map((permission) => permission.action));

  const missingActions = wantedActions.filter((action) => !existingActions.has(action));
  await Promise.all(
    missingActions.map((action) =>
      strapi.query('plugin::users-permissions.permission').create({ data: { action, role: role.id } }),
    ),
  );
}

async function ensureDiscussionsCreatedAtIndex(strapi: Core.Strapi) {
  const knex = strapi.db.connection;
  if (!(await knex.schema.hasTable('discussions'))) return;

  try {
    await knex.schema.alterTable('discussions', (table) => {
      table.index('created_at', 'discussions_created_at_idx');
    });
  } catch (error) {
    
    const message = error instanceof Error ? error.message : String(error);
    if (!message.includes('already exists')) throw error;
  }
}

// Schema sync adds a new column to existing rows as NULL, not the schema's
// declared default — only fresh creates get `default: 0`/`false` for free.
async function backfillUsefulCounts(strapi: Core.Strapi) {
  const knex = strapi.db.connection;
  if (await knex.schema.hasTable('discussions')) {
    await knex('discussions').whereNull('useful_count').update({ useful_count: 0 });
  }
  if (await knex.schema.hasTable('replies')) {
    await knex('replies').whereNull('useful_count').update({ useful_count: 0 });
    await knex('replies').whereNull('is_best_answer').update({ is_best_answer: false });
  }
}

export default {
  register() {},

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    await syncRolePermissions(strapi, 'public');
    await syncRolePermissions(strapi, 'authenticated');
    await ensureDiscussionsCreatedAtIndex(strapi);
    await backfillUsefulCounts(strapi);
  },
};
