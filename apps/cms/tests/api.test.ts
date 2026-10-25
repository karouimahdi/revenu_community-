import request from 'supertest';
import { compileStrapi, createStrapi } from '@strapi/strapi';
import type { Core } from '@strapi/strapi';

let strapi: Core.Strapi;
let http: ReturnType<typeof request>;

let categoryBourseDocumentId: string;
let categoryEpargneDocumentId: string;
let userAId: number;
let userBId: number;
let jwtA: string;

const BOURSE_FIXTURE_COUNT = 5;
const EPARGNE_FIXTURE_COUNT = 2;

async function createUser(username: string, email: string, roleId: number) {
  return strapi.plugin('users-permissions').service('user').add({
    username,
    email,
    password: 'Password123!',
    provider: 'local',
    confirmed: true,
    blocked: false,
    role: roleId,
  });
}

async function createFixtureDiscussion(index: number, categoryDocumentId: string) {
  await strapi.documents('api::discussion.discussion').create({
    data: {
      title: `Fixture discussion ${categoryDocumentId}-${index}`,
      content: 'Fixture content for query tests.',
      type: 'discussion',
      author: userAId,
      category: categoryDocumentId,
    },
  });
  // Distinct millisecond timestamps for the asc/desc sort assertion —
  // sequential creates in the same tick can otherwise tie.
  await new Promise((resolve) => setTimeout(resolve, 5));
}

beforeAll(async () => {
  const appContext = await compileStrapi();
  strapi = await createStrapi(appContext).load();
  strapi.log.level = 'error';
  strapi.server.mount();
  http = request(strapi.server.app.callback());

  const authenticatedRole = await strapi
    .db.query('plugin::users-permissions.role')
    .findOne({ where: { type: 'authenticated' } });

  const userA = await createUser('test_user_a', 'test.user.a@example.com', authenticatedRole.id);
  userAId = userA.id;
  jwtA = await strapi.plugin('users-permissions').service('jwt').issue({ id: userA.id });

  const userB = await createUser('test_user_b', 'test.user.b@example.com', authenticatedRole.id);
  userBId = userB.id;

  const bourse = await strapi.documents('api::category.category').create({
    data: { name: 'Bourse (test)', slug: 'bourse-test', description: 'fixture' },
  });
  categoryBourseDocumentId = bourse.documentId;

  const epargne = await strapi.documents('api::category.category').create({
    data: { name: 'Épargne (test)', slug: 'epargne-test', description: 'fixture' },
  });
  categoryEpargneDocumentId = epargne.documentId;

  for (let i = 0; i < BOURSE_FIXTURE_COUNT; i += 1) {
    await createFixtureDiscussion(i, categoryBourseDocumentId);
  }
  for (let i = 0; i < EPARGNE_FIXTURE_COUNT; i += 1) {
    await createFixtureDiscussion(i, categoryEpargneDocumentId);
  }
}, 120000);

afterAll(async () => {
  await strapi.destroy();
});

describe('POST /api/discussions validation', () => {
  it('rejects a title shorter than 10 characters', async () => {
    const res = await http
      .post('/api/discussions')
      .set('Authorization', `Bearer ${jwtA}`)
      .send({
        data: { title: 'short', content: 'x', type: 'discussion', category: categoryBourseDocumentId },
      });

    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body.error)).toContain('title');
  });

  it('rejects a missing content field', async () => {
    const res = await http
      .post('/api/discussions')
      .set('Authorization', `Bearer ${jwtA}`)
      .send({
        data: { title: 'A valid enough title', type: 'discussion', category: categoryBourseDocumentId },
      });

    expect(res.status).toBe(400);
  });

  it('rejects an invalid type value', async () => {
    const res = await http
      .post('/api/discussions')
      .set('Authorization', `Bearer ${jwtA}`)
      .send({
        data: { title: 'A valid enough title', content: 'x', type: 'poll', category: categoryBourseDocumentId },
      });

    expect(res.status).toBe(400);
  });

  it('rejects a non-existent category', async () => {
    const res = await http
      .post('/api/discussions')
      .set('Authorization', `Bearer ${jwtA}`)
      .send({
        data: { title: 'A valid enough title', content: 'x', type: 'discussion', category: 'does-not-exist' },
      });

    expect(res.status).toBe(400);
  });

  it('rejects a request with no Authorization header', async () => {
    const res = await http
      .post('/api/discussions')
      .send({
        data: { title: 'A valid enough title', content: 'x', type: 'discussion', category: categoryBourseDocumentId },
      });

    // Public role is correctly resolved and lacks the create permission —
    // 403, not 401. See PLAN.md §3.5 for why a 401-producing policy doesn't
    // work in Strapi v5's request pipeline.
    expect(res.status).toBe(403);
  });
});

describe('author injection', () => {
  it('ignores a spoofed author on discussion create', async () => {
    const res = await http
      .post('/api/discussions')
      .set('Authorization', `Bearer ${jwtA}`)
      .send({
        data: {
          title: 'Spoofing test discussion title',
          content: 'x',
          type: 'discussion',
          category: categoryBourseDocumentId,
          author: userBId,
        },
      });

    expect(res.status).toBe(201);

    const created = await strapi.documents('api::discussion.discussion').findOne({
      documentId: res.body.data.documentId,
      populate: { author: true },
    });
    expect(created?.author?.id).toBe(userAId);
  });

  it('ignores a spoofed author on reply create', async () => {
    const discussion = await strapi.documents('api::discussion.discussion').findFirst({
      filters: { title: 'Spoofing test discussion title' },
    });

    const res = await http
      .post('/api/replies')
      .set('Authorization', `Bearer ${jwtA}`)
      .send({
        data: { content: 'Reply content', discussion: discussion!.documentId, author: userBId },
      });

    expect(res.status).toBe(201);

    const created = await strapi.documents('api::reply.reply').findOne({
      documentId: res.body.data.documentId,
      populate: { author: true },
    });
    expect(created?.author?.id).toBe(userAId);
  });
});

describe('GET /api/discussions query features', () => {
  it('paginates results', async () => {
    const res = await http.get('/api/discussions?pagination[pageSize]=5&pagination[page]=1');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(5);
    expect(res.body.meta.pagination.pageSize).toBe(5);
    expect(res.body.meta.pagination.page).toBe(1);
    expect(res.body.meta.pagination.pageCount).toBe(
      Math.ceil(res.body.meta.pagination.total / 5),
    );
  });

  it('flips order between createdAt asc and desc', async () => {
    const asc = await http.get('/api/discussions?sort[0]=createdAt:asc&pagination[pageSize]=100');
    const desc = await http.get('/api/discussions?sort[0]=createdAt:desc&pagination[pageSize]=100');

    const ascIds = asc.body.data.map((d: { documentId: string }) => d.documentId);
    const descIds = desc.body.data.map((d: { documentId: string }) => d.documentId);

    expect(ascIds).toHaveLength(descIds.length);
    expect(ascIds).toEqual([...descIds].reverse());
  });

  it('filters by category slug', async () => {
    const res = await http.get(
      '/api/discussions?filters[category][slug][$eq]=bourse-test&pagination[pageSize]=100',
    );
    expect(res.status).toBe(200);

    const expectedCount = await strapi.documents('api::discussion.discussion').count({
      filters: { category: { slug: 'bourse-test' } },
    });
    expect(res.body.data).toHaveLength(expectedCount);

    for (const discussion of res.body.data as Array<{ documentId: string }>) {
      const populated = await strapi.documents('api::discussion.discussion').findOne({
        documentId: discussion.documentId,
        populate: { category: true },
      });
      expect(populated?.category?.slug).toBe('bourse-test');
    }
  });
});
