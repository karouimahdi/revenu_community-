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

export default {
  register() {},

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    await syncRolePermissions(strapi, 'public');
    await syncRolePermissions(strapi, 'authenticated');
  },
};
