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
    // Required for the author-injection controllers to work at all: Strapi's
    // input validator rejects writing *any* relation whose target type the
    // writer's role can't `find` — nothing to do with discussion/reply
    // permissions themselves, just the generic "can't link to what you can't
    // see" guard. See PLAN.md §3.5.
    'plugin::users-permissions.user.find',
  ],
};

// Discussion/Reply update and delete stay unlisted for both roles on purpose
// — Strapi leaves a permission disabled until a row for it exists, so "not
// in this matrix" already means "denied". See PLAN.md §3.6.

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

// A `database/migrations/*.js` file runs schema-sync's *own* migration step,
// which happens *before* schema-sync creates the content-type tables on a
// fresh database (confirmed: `@strapi/database`'s `schema.sync()` runs user
// migrations, then syncs schema from content-types — in that order). A
// migration targeting `discussions` itself hits "no such table" on a
// genuinely empty DB; only looked fine against the long-lived dev Postgres
// DB where the table already existed from earlier boots. `bootstrap()` runs
// strictly after schema-sync (`Strapi.bootstrap()`'s own internal order), so
// it's the correct place for an index schema-sync doesn't manage itself.
async function ensureDiscussionsCreatedAtIndex(strapi: Core.Strapi) {
  const knex = strapi.db.connection;
  if (!(await knex.schema.hasTable('discussions'))) return;

  try {
    await knex.schema.alterTable('discussions', (table) => {
      table.index('created_at', 'discussions_created_at_idx');
    });
  } catch (error) {
    // Already exists. Knex has no portable "hasIndex" across Postgres/
    // SQLite (the two clients this project runs against); both throw here
    // with "already exists" in the message, so that's the idempotency check.
    const message = error instanceof Error ? error.message : String(error);
    if (!message.includes('already exists')) throw error;
  }
}

export default {
  register() {},

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    await syncRolePermissions(strapi, 'public');
    await syncRolePermissions(strapi, 'authenticated');
    await ensureDiscussionsCreatedAtIndex(strapi);
  },
};
