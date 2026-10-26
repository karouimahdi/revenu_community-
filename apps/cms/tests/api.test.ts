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
let jwtB: string;

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
  jwtB = await strapi.plugin('users-permissions').service('jwt').issue({ id: userB.id });

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

describe('POST /api/votes', () => {
  it('marks another member\'s discussion as useful and bumps usefulCount', async () => {
    const discussion = await strapi.documents('api::discussion.discussion').create({
      data: {
        title: 'Vote target discussion title',
        content: 'x',
        type: 'discussion',
        author: userAId,
        category: categoryBourseDocumentId,
      },
    });

    const res = await http
      .post('/api/votes')
      .set('Authorization', `Bearer ${jwtB}`)
      .send({ data: { discussion: discussion.documentId } });

    expect(res.status).toBe(201);

    const updated = await strapi.documents('api::discussion.discussion').findOne({ documentId: discussion.documentId });
    expect(updated?.usefulCount).toBe(1);
  });

  it('rejects a duplicate vote from the same user on the same target', async () => {
    const discussion = await strapi.documents('api::discussion.discussion').create({
      data: {
        title: 'Duplicate vote discussion title',
        content: 'x',
        type: 'discussion',
        author: userAId,
        category: categoryBourseDocumentId,
      },
    });

    const first = await http
      .post('/api/votes')
      .set('Authorization', `Bearer ${jwtB}`)
      .send({ data: { discussion: discussion.documentId } });
    expect(first.status).toBe(201);

    const second = await http
      .post('/api/votes')
      .set('Authorization', `Bearer ${jwtB}`)
      .send({ data: { discussion: discussion.documentId } });
    expect(second.status).toBe(400);
  });

  it('rejects marking one\'s own discussion as useful', async () => {
    const discussion = await strapi.documents('api::discussion.discussion').create({
      data: {
        title: 'Own discussion vote attempt title',
        content: 'x',
        type: 'discussion',
        author: userAId,
        category: categoryBourseDocumentId,
      },
    });

    const res = await http
      .post('/api/votes')
      .set('Authorization', `Bearer ${jwtA}`)
      .send({ data: { discussion: discussion.documentId } });

    expect(res.status).toBe(403);
  });
});

describe('POST /api/replies/:documentId/best-answer', () => {
  it('rejects the call from someone other than the discussion author', async () => {
    const discussion = await strapi.documents('api::discussion.discussion').create({
      data: {
        title: 'Best answer permission discussion',
        content: 'x',
        type: 'question',
        author: userAId,
        category: categoryBourseDocumentId,
      },
    });
    const reply = await strapi.documents('api::reply.reply').create({
      data: { content: 'A reply', author: userBId, discussion: discussion.documentId },
    });

    const res = await http.post(`/api/replies/${reply.documentId}/best-answer`).set('Authorization', `Bearer ${jwtB}`);

    expect(res.status).toBe(403);
  });

  it('lets the discussion author toggle a reply as best answer, unsetting any previous one', async () => {
    const discussion = await strapi.documents('api::discussion.discussion').create({
      data: {
        title: 'Best answer toggle discussion',
        content: 'x',
        type: 'question',
        author: userAId,
        category: categoryBourseDocumentId,
      },
    });
    const replyOne = await strapi.documents('api::reply.reply').create({
      data: { content: 'First reply', author: userBId, discussion: discussion.documentId },
    });
    const replyTwo = await strapi.documents('api::reply.reply').create({
      data: { content: 'Second reply', author: userBId, discussion: discussion.documentId },
    });

    const markFirst = await http
      .post(`/api/replies/${replyOne.documentId}/best-answer`)
      .set('Authorization', `Bearer ${jwtA}`);
    expect(markFirst.status).toBe(200);
    expect(markFirst.body.data.isBestAnswer).toBe(true);

    const markSecond = await http
      .post(`/api/replies/${replyTwo.documentId}/best-answer`)
      .set('Authorization', `Bearer ${jwtA}`);
    expect(markSecond.status).toBe(200);
    expect(markSecond.body.data.isBestAnswer).toBe(true);

    const refreshedFirst = await strapi.documents('api::reply.reply').findOne({ documentId: replyOne.documentId });
    expect(refreshedFirst?.isBestAnswer).toBe(false);
  });
});

describe('GET /api/profiles/:username', () => {
  it('returns 404 for a username with no account', async () => {
    const res = await http.get('/api/profiles/no_such_user');
    expect(res.status).toBe(404);
  });

  it('aggregates usefulCount across the user\'s discussions and replies', async () => {
    // Delta, not an absolute count — the "author injection" block above
    // already created a discussion authored (via the real HTTP endpoint)
    // as test_user_a in this same shared instance.
    const before = await http.get('/api/profiles/test_user_a');

    const discussion = await strapi.documents('api::discussion.discussion').create({
      data: {
        title: 'Profile stats discussion title',
        content: 'x',
        type: 'discussion',
        author: userAId,
        authorUsername: 'test_user_a',
        category: categoryBourseDocumentId,
      },
    });
    const reply = await strapi.documents('api::reply.reply').create({
      data: {
        content: 'Profile stats reply',
        author: userAId,
        authorUsername: 'test_user_a',
        discussion: discussion.documentId,
      },
    });

    await http
      .post('/api/votes')
      .set('Authorization', `Bearer ${jwtB}`)
      .send({ data: { discussion: discussion.documentId } });
    await http
      .post('/api/votes')
      .set('Authorization', `Bearer ${jwtB}`)
      .send({ data: { reply: reply.documentId } });

    const after = await http.get('/api/profiles/test_user_a');

    expect(after.status).toBe(200);
    expect(after.body.data.username).toBe('test_user_a');
    expect(after.body.data.discussionsCount).toBe(before.body.data.discussionsCount + 1);
    expect(after.body.data.usefulReceived).toBe(before.body.data.usefulReceived + 2);
  });
});
