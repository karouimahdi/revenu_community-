# PLAN — Communauté Le Revenu

Implementation plan for the take-home test: a forum-style community for Le
Revenu, built with Next.js (App Router) + Strapi v5 + PostgreSQL. Source of
truth for scope is `Test_technique_Developpeur_Full_Stack_Le_Revenu.pdf`
("the brief"). Visual/UX/copy reference is
`maquette-communaute-le-revenu.html` ("the mockup") — an HTML/CSS/JS
prototype, not a spec to reproduce wholesale (brief §8: "la reproduction
intégrale de la maquette n'est pas demandée").

Companion file `CLAUDE.md` holds the standing rules for every session that
works on this repo. This file holds the *plan*; `CLAUDE.md` holds the *law*.

---

## 1. Brief analysis

### In scope (core, must be excellent)
- **A. Home**: discussion list from Strapi (title, author, category, reply
  count, date), filter by category, sort by date, link to detail. No
  hardcoded discussions.
- **B. Discussion detail**: clean URL, full content + author + date +
  category + replies, reply form persisted via Strapi.
- **C. Create discussion**: title (≥10 chars), content (required), category,
  type (question|discussion); client + server validation; redirect to the
  new discussion on success.
- **D. Demo users & auth**: Users & Permissions JWT, seeded demo users.
  Unauthenticated users cannot publish. A user cannot publish as another
  user — enforced in Strapi, not just hidden in the UI.
- Loading / error / empty states everywhere. Responsive UI that respects the
  mockup's visual language (tokens, type, spacing, component shapes).

### Out of scope (explicit — will NOT build)
Everything in the mockup that is gamification or editorial dressing on top
of the plain forum the brief actually asks for:
- Points, levels, streaks, badges, the monthly leaderboard ("Classement").
- Polls (`type: 'poll'`) — brief's `type` enum is `question | discussion`
  only.
- "Le Revenu répond" live Q&A events widget.
- Per-profile blog posts (separate from discussions/replies).
- Notifications bell/dropdown, @mention autocomplete, hover-card member
  previews.
- "Expertise vérifiée" / subscriber gold badge / role tags beyond a plain
  author name.
- Avatar photo upload + client-side cropping (seeded monogram avatars only).
- Dark mode.
- "Tendances" sort (requires view counts/"Utile" votes we don't track —
  dropped from the mockup's three-tab bar, kept "Récentes" and
  "Sans réponse").
- The `sitebar` / cross-links back to lerevenu.com, the fake
  "compte lerevenu.com" SSO box on login.
- Onboarding "choose your interests" step.
- Charter ("Charte") page, report/flag UI, SEO noindex/QAPage admin panel.
- Similar-discussion-while-typing duplicate detector.
- A dedicated `/categories/[slug]` landing page (category filtering is
  satisfied by a filter control on the home list — see §4).
- Nested replies (reply-to-reply). The brief's Reply model is flat:
  `content, author, discussion`.
- Editing/deleting a discussion or reply after creation (brief's feature
  list never asks for it; sketched as a future extension in §8).

Bonuses (search, "Utile" votes + best answer, pagination UI, user profile,
Playwright, Docker Compose) are planned in §6 but sequenced strictly after
core is done and tested, per brief §5: "la qualité du périmètre principal
prime sur le nombre de bonus réalisés."

**Added beyond the brief, by explicit request after Phase 9 shipped**:
self-service account creation (a real "Créer un compte" form, toggled
inside the same popup as login, calling Strapi's own public
`/api/auth/local/register`) and restyling `/login` as a popup/modal
matching the mockup's `.overlay`/`.modal.sm` visual chrome, instead of a
plain page. The brief only asks for auth against *seeded* demo users
(§2.D) — registration was never a requirement — but it's a small, already-
supported Strapi endpoint, not a new subsystem. The onboarding
"choose your interests" step that follows login in the mockup's own
2-step flow stays out of scope (asked and confirmed): no backing field
for interests on the Strapi User model, and nothing downstream (no
personalized feed) would consume it.

Also added beyond the brief, by explicit request: the mockup's left
sidebar category nav (vertical, with per-category icon/color, desktop
only — mobile keeps the horizontal chip scroller) replacing the home
feed's single horizontal chip row; a "Sans réponse" filter tab
(`repliesCount: { $eq: 0 }`, trivial given `repliesCount` was already
denormalized) alongside "Récentes"; and the comfy/compact density
toggle (view-only, persisted to `localStorage`, no backing Strapi
field). All three are presentation-only — no new Strapi schema.

### Assumptions
These are decisions, not open questions — flagged so they can be
challenged in the review, not because they block starting.

1. **URL = `/discussions/[documentId]`, no slug.** The brief's minimal
   schema gives Category a `slug` but not Discussion, and explicitly
   recommends `documentId` (not numeric id) in public URLs. A slug on
   Discussion would need uniqueness handling on title edits for no asked-for
   benefit. See §3 for the full justification.
2. **`content` is plain text, not Strapi's Blocks rich-text editor.** The
   mockup's "formatting" is a tiny whitelist (`**bold**`, `- ` lists)
   rendered client-side. Pulling in Blocks is real integration surface the
   brief doesn't ask for.
3. **Package manager: npm workspaces, Node 22 LTS.** Zero extra tooling to
   install on the reviewer's machine; `npm install` at the repo root is
   enough. Originally planned as Node 20 — revised during Phase 0
   scaffolding: the Strapi version that actually installed (`5.59.0`)
   pulls in `undici@8`, which needs Node `≥22.19.0` at runtime (`engines`
   in Strapi's own `package.json` still says `>=20.0.0`, but that's stale
   relative to this dependency — confirmed by the `EBADENGINE` warning
   during install, not assumed). Node 22 is Active LTS, so this isn't a
   downgrade in safety, just a correction of an assumption made before the
   actual package versions were known.
4. **Draft & publish: disabled** on Category, Discussion, Reply. Nothing in
   the brief implies a moderation/review workflow; enabling it would add a
   `publicationState` filter to every read and every permission check for no
   asked-for benefit.
5. **`repliesCount` is denormalized** on Discussion, maintained by a Reply
   lifecycle hook, rather than computed per-request. See §3.
6. **JWT lives in an httpOnly cookie**, set by a Next.js Server
   Action/Route Handler that proxies `/api/auth/local`. This matches the
   brief's own stated lean; see §4 for the full flow and CSRF reasoning.
7. **Seed data uses a representative subset of the mockup's 11 categories**
   (6–7) and ~5 demo users, not the full cast — enough to demonstrate
   filtering/sorting/relations without maintaining 20 users' worth of fixture
   data.
8. **No dedicated category landing page.** "Filtrer par catégorie" is read
   as a control on the home list, not a requirement for `/categories/[slug]`
   to exist as its own page.
9. **TanStack Query + Zustand, added on instruction (not a default this
   plan would have reached for on its own).** Scoped narrowly rather than
   applied everywhere a library *could* fit: TanStack Query only backs the
   two subtrees with real post-load interactivity (the home feed, the
   reply thread — §4.2/§4.4); Zustand holds exactly two small stores
   (session echo, toast queue), not a general client-state dumping ground.
   Create-discussion and login stay plain Server Actions — converting them
   would add a dependency for no UX gain, since both end in a redirect.
   See §4.4 for the full division of responsibility and §8 for the
   "isn't this redundant with Server Components" answers a reviewer will
   likely ask first.

None of these change the stack or the Strapi/Next.js boundary, so none of
them were asked as a blocking question — redirect any of them and the
affected section of this plan updates.

---

## 2. Repository structure

```
/
├── apps/
│   ├── web/                      # Next.js App Router frontend — code under src/ (create-next-app default)
│   │   ├── src/app/
│   │   │   ├── api/               # Route Handlers — thin proxies to lib/strapi, read the httpOnly cookie
│   │   │   │   └── discussions/
│   │   │   │       ├── route.ts                    # GET, backs useDiscussions
│   │   │   │       ├── [documentId]/route.ts        # GET, backs useDiscussion (added — see §4.4)
│   │   │   │       └── [documentId]/replies/route.ts  # GET+POST, backs useReplies/useCreateReply
│   │   │   ├── providers.tsx      # 'use client' — QueryClientProvider only
│   │   │   ├── session-boundary.tsx  # server, async — reads the session cookie, Suspense-wrapped
│   │   │   └── session-sync.tsx   # 'use client' — hydrates the session store from session-boundary
│   │   ├── src/hooks/             # useDiscussions, useDiscussion, useReplies, useCreateReply, useSession, useToast
│   │   ├── src/stores/            # useSessionStore, useToastStore (Zustand)
│   │   └── src/lib/
│   │       ├── strapi/            # server-only — the one place that calls Strapi over HTTP
│   │       ├── queryKeys.ts       # TanStack Query key factory
│   │       ├── apiFetch.ts        # browser-side fetch helper for Route Handler calls
│   │       └── session.ts         # SESSION_COOKIE_NAME constant
│   └── cms/                      # Strapi v5 backend
├── package.json              # npm workspaces root: dev/build/seed/test/lint scripts
├── docker-compose.yml         # bonus, phase B6 — web + cms + postgres
├── .env.example
├── README.md
├── PLAN.md
└── CLAUDE.md
```

- **Package manager: npm workspaces.** No pnpm/yarn dependency for whoever
  clones the repo; `npm install` once at the root installs both apps.
- **Node 22 LTS**, pinned via `.nvmrc` (`22`) and `engines` in root
  `package.json`. Confirmed necessary, not just chosen, during Phase 0: the
  installed Strapi `5.59.0` depends on `undici@8`, which requires Node
  `≥22.19.0` — Node 20 installs (with an `EBADENGINE` warning) but isn't
  what Strapi's own tested baseline is for this release.
- **Two deployable units, one repo.** `apps/web` and `apps/cms` are
  independent npm workspaces with their own `package.json`, `tsconfig.json`,
  `.env`. The root `package.json` only orchestrates (`concurrently` for
  `npm run dev` to boot both at once — the one new devDependency at the
  root, justified purely for local DX).
- Each app keeps its own `node_modules` via npm workspace hoisting; Strapi
  and Next.js have enough peer-dependency friction that forcing a single
  flat tree isn't worth fighting.

---

## 3. Strapi design

### 3.1 Content-type schemas

**Category** (`api::category.category`)

| field | type | constraints |
|---|---|---|
| name | string | required, unique |
| slug | uid (target: name) | required |
| description | text | optional |
| discussions | relation oneToMany → Discussion | `mappedBy: 'category'` |

**Discussion** (`api::discussion.discussion`)

| field | type | constraints |
|---|---|---|
| title | string | required, minLength 10, maxLength 150 |
| content | text | required |
| type | enumeration `question`, `discussion` | required, default `discussion` |
| author | relation manyToOne → `plugin::users-permissions.user` | required; **set server-side only, never from client input** |
| category | relation manyToOne → Category | required, `inversedBy: 'discussions'` |
| replies | relation oneToMany → Reply | `mappedBy: 'discussion'` |
| repliesCount | integer | default 0; **server-maintained only**, never accepted in create/update payloads |

**Reply** (`api::reply.reply`)

| field | type | constraints |
|---|---|---|
| content | text | required |
| author | relation manyToOne → `plugin::users-permissions.user` | required; server-side only |
| discussion | relation manyToOne → Discussion | required, `inversedBy: 'replies'` |

`author` relations are one-directional (no inverse field added to the
Users & Permissions `user` schema) — avoids touching the plugin's core
content type for a "show a user's discussions" feature the core scope
doesn't ask for (sketched as a future extension in §8).

### 3.2 Why `documentId`, not a slug, in the URL

The brief explicitly flags `documentId` as the right public identifier in
v5 ("ne pas utiliser les id numériques dans les URLs/APIs publiques"). A
numeric `id` is a DB-row detail that can differ across draft/published/
locale copies of the same logical entry; `documentId` is the stable
identifier Strapi v5 introduced specifically so frontends never have to
care about that. Route: `app/discussions/[documentId]/page.tsx`, fetched
via `strapi.documents('api::discussion.discussion').findOne({ documentId })`.
No separate `slug` field on Discussion — one less uniqueness constraint to
maintain on every title edit, for a feature (pretty slugs) the brief never
asks for.

### 3.3 Reply count strategy

Three options considered:

| approach | read cost | accuracy | complexity |
|---|---|---|---|
| populate + count relation at read time | grows with thread size, repeated per list row | always exact | none |
| custom aggregation endpoint | one extra query per request | always exact | a controller to maintain |
| **denormalized `repliesCount`, kept in sync on Reply write** | O(1), already on the row | exact unless a hook fails mid-write | one lifecycle hook |

Chosen: **denormalized counter**. The home list already needs
`title, author, category, repliesCount, createdAt` per row — with a
denormalized field that's a single flat query with two shallow relation
populations, no join/count per row. Implementation: a classic
`afterCreate`/`afterDelete` lifecycle hook on Reply
(`src/api/reply/content-types/reply/lifecycles.ts`) that calls
`strapi.documents('api::discussion.discussion').update({ documentId, data: { repliesCount } })` —
classic lifecycle hooks as the trigger (stable across v4→v5), Document
Service API for the actual mutation (per the brief's explicit steer toward
it for custom business operations).
**Verify in docs**: whether v5's newer Document Service middleware
(`strapi.documents.use(...)`) should replace the classic lifecycle file —
both are expected to work in v5; the lifecycle file is the better-documented,
lower-risk choice for a project that has to work correctly with no second
pass.

### 3.4 Draft & publish

**Disabled** on all three content types. Nothing in the brief implies a
moderation workflow, and leaving it off means every read and every
permission rule is written once, without a `publicationState` branch to
keep in sync everywhere.

### 3.5 Custom controllers / services / policies / middlewares

Deliberately minimal — native Strapi handles everything schema-level
validation (required, minLength, enum, relation-required) already covers.
Custom code exists only where the request needs *runtime identity*, which
the content-type schema can't express:

| piece | type | route | enforces |
|---|---|---|---|
| Discussion `create` override | controller | `POST /api/discussions` | overwrites `ctx.request.body.data.author = ctx.state.user.id` unconditionally before delegating to the core `create` action — any `author` sent by the client is discarded, not merely validated. This is the author-spoofing defense; the Public role having no `create` permission is the only other layer (a would-be second layer, a custom policy, turned out to be unreachable — see below). |
| Reply `create` override | controller | `POST /api/replies` | same pattern as above, for `author`. |
| Reply `afterCreate`/`beforeDelete`+`afterDelete` | lifecycle hook | — | maintains `Discussion.repliesCount` (§3.3). |

Both controller overrides follow the standard `createCoreController`
factory-extension pattern (`({ strapi }) => ({ async create(ctx) { ... ;
return super.create(ctx); } })`), confirmed working as documented against
v5.59.

**No `is-authenticated` policy — removed after empirical testing proved it
dead code.** The original plan here was a global policy returning `401` via
`ctx.unauthorized()` when `!ctx.state.user`, attached to `discussion.create`/
`reply.create` specifically to distinguish "no identity at all" (401) from
"has identity, lacks permission" (403). Reading Strapi's actual request
pipeline (`@strapi/core`'s `compose-endpoint.js`) shows why this can't work:
the composed handler order is `authenticate → authorize → policies →
middlewares → controller`. The built-in `authorize` step resolves
permissions by role *before* any custom policy runs — a request with no
token is evaluated as the Public role, and since Public has zero write
permission (by design, §3.6), `authorize` already throws `ForbiddenError`
(403) and the request never reaches a custom policy at all. A request
*with* a valid, permitted token never needed the policy in the first place
(`ctx.state.user` is already guaranteed to exist by the time any policy
would run). There is no code path where the policy's `unauthorized()`
branch is reachable without first granting Public the very permission the
two-layer design means to deny — so it was deleted rather than kept as dead
code. Confirmed by curl against a live instance, not just by reading
source.

**Corrected error contract** (supersedes the `401` claim in the original
§3.5/§3.10): unauthenticated `POST /api/discussions` or `/api/replies`
returns **`403`** (Public correctly resolved, permission denied) — not
`401`. `401` is still real and reachable, just for a different case: a
*present but invalid/expired* token (`UnauthorizedError`, "Missing or
invalid credentials"), confirmed via curl with a garbage Bearer token. This
is arguably the more standard REST split anyway (401 = failed
authentication attempt, 403 = successfully identified — even as anonymous
— but forbidden) and costs zero custom code, versus the original plan's
one policy file that turned out to not even work.

**A second, unplanned permission requirement, also found empirically, not
assumed**: the author-injection controllers above only work if the acting
role has `find` permission on the relation's *target* type —
`plugin::users-permissions.user.find` for the Authenticated role — because
Strapi's input validator (`@strapi/utils`'s `throwRestrictedRelations`
visitor) rejects writing *any* relation whose target the writer can't read,
regardless of the value being written or which route is being hit. Without
it, `POST /api/discussions`/`/api/replies` fails with `400 Invalid key
author` even when the injected value is the caller's own verified id. Added
to the Authenticated row in the matrix (§3.6) for this reason alone — it
has nothing to do with `category`/`discussion`'s own find permissions,
which were already granted and already sufficient for those two relations.
**Accepted trade-off**: this also lets any authenticated demo user call
`GET /api/users` and see every other seeded user's username *and* email
(Strapi's default output sanitization strips password/tokens, not email).
For this app — solo take-home test, fully fake seeded accounts, no real
PII, and `/api/users` was never a required feature in its own right —
documented here rather than built around (a plugin-controller override to
redact email from that one listing endpoint would be real added surface
for a non-requirement). Revisit if this app ever had real users.

Custom routes (`src/api/discussion/routes/discussion.ts`,
`src/api/reply/routes/reply.ts`) were reverted to the plain generated core
router with no `config.policies` override, since there's no longer a
policy to attach.

**`repliesCount` lifecycle, the actual v5 shape** (resolves the §3.3
"verify in docs" flag): classic lifecycle hooks, confirmed still the right
tool, but not a plain increment/decrement. v5 stores every relation in a
join table ("link table"), not a FK column on the owning row — `replies`
has no `discussion_id` column at all (confirmed via `\d replies`) — so a
relation is *not* reliably present on `event.result` for `afterCreate`, and
for `afterDelete` the link row is already `ON DELETE CASCADE`-gone by the
time the hook fires regardless. The working implementation
(`src/api/reply/content-types/reply/lifecycles.ts`):
- `afterCreate`: re-fetches the just-created reply via
  `strapi.documents('api::reply.reply').findOne({ documentId,
  populate: { discussion: true } })` — the reply's own `documentId` is
  reliably on `event.result`, relations fetched explicitly from there —
  then recomputes `repliesCount` via
  `strapi.documents('api::reply.reply').count({ filters: { discussion:
  { documentId } } })` (a count, not a blind `+1`; self-correcting, can't
  drift from a missed event the way a raw increment could).
- `beforeDelete` + `afterDelete`, paired: `beforeDelete` is the *only*
  point where the reply row (and its link-table row) still exists, so it
  queries the discussion relation there via `strapi.db.query(...).findOne({
  where: { id }, populate: ['discussion'] })` and stashes the discussion's
  `documentId` in a module-level `Map` keyed by the reply's numeric id
  (Strapi's own lifecycle `event.state` is *not* threaded from
  `beforeDelete` into `afterDelete` for single-record deletes — checked
  directly in `@strapi/database`'s `entity-manager`, where `afterDelete`'s
  lifecycle run omits the `states` argument `beforeDelete`'s run returned).
  `afterDelete` reads the stashed id off `event.result.id` (reliably
  present — it's the deleted row's own id) and recomputes the count the
  same way.

### 3.6 Roles & permissions matrix

| action | Public | Authenticated |
|---|---|---|
| Category: find, findOne | ✅ | ✅ |
| Discussion: find, findOne | ✅ | ✅ |
| Discussion: create | ❌ | ✅ (author injection, §3.5 — the policy originally planned here turned out to be unreachable and was dropped) |
| Reply: find, findOne | ✅ (needed so anonymous visitors can read replies on a discussion, per brief §2.B) | ✅ |
| Reply: create | ❌ | ✅ (author injection) |
| Discussion/Reply: update, delete | ❌ | ❌ (not in core scope — see §8 for the sketch) |
| `users-permissions` `/api/auth/local`, `/local/register` | ✅ (that's how login/signup work) | — |
| `users-permissions` `/api/users/me` | ❌ | ✅ |
| `users-permissions` `/api/users` (`find`) | ❌ | ✅ (not a planned feature — required so the author-injection controllers are allowed to write a relation to the user model at all; see §3.5's accepted trade-off) |

**Applied reproducibly, not via admin clicks**: a bootstrap function
(`src/index.ts` → `bootstrap({ strapi })`) that idempotently sets these
exact permissions on every Strapi start — finds the Public/Authenticated
role, finds-or-creates each `plugin::users-permissions.permission` row
(`action`, `role`), only writes on drift (verified: running the same boot
sequence repeatedly across several dev-server restarts left the row count
unchanged). This is also what makes the matrix reviewable as code instead
of a click-path nobody can diff.

### 3.7 Input sanitization of populated relations

Whenever `author` is populated on a Discussion/Reply response, the
populate query **must** carry an explicit `fields` allowlist —
`populate: { author: { fields: ['username'] } }` — never a bare
`populate: ['author']`. Strapi's users-permissions plugin strips
password/reset-token by default, but email exposure depends on plugin
config that shouldn't be trusted blindly from a content API that's
supposed to be public-readable. This is a MUST rule, restated in
`CLAUDE.md`.

### 3.8 Pagination, sorting, filtering

All native Strapi REST query params on the default `find` action —
no custom controller needed for listing:

```
GET /api/discussions
  ?filters[category][slug][$eq]=bourse
  &sort[0]=createdAt:desc
  &pagination[page]=1&pagination[pageSize]=20
  &fields[0]=title&fields[1]=type&fields[2]=createdAt&fields[3]=repliesCount
  &populate[author][fields][0]=username
  &populate[category][fields][0]=name&populate[category][fields][1]=slug
```

`fields` deliberately excludes `content` on the list query (no need to ship
the full body for a card that only shows a title) — the "no over-fetching"
requirement satisfied without a hand-written controller.

### 3.9 Indexes

**Resolved, not assumed**: inspected the live schema directly (`\d
discussions`, `\d replies`, `\d discussions_category_lnk`, etc. against the
dev Postgres container) rather than trusting the original plan's guess.
v5's schema sync already creates a btree index on *both* columns of every
relation's link table automatically — confirmed present without any
migration: `discussions_category_lnk_fk`/`_ifk`, `replies_discussion_lnk_
fk`/`_ifk`, `discussions_author_lnk_fk`/`_ifk`. This supersedes the
original plan's assumed `discussions(category_id)` and
`replies(discussion_id)` migrations entirely — there's no `category_id` or
`discussion_id` column on those tables at all in v5 (relations live in the
link table, not a FK column on the owning row), and the link table's own
indexes already cover that lookup path.

The one real gap, confirmed by the same inspection: no index on
`discussions.created_at`, the home feed's sort column.

**Not a `database/migrations/*.js` file, despite that being the first
instinct** — caught by Phase 4's tests running against a genuinely fresh
database, not by inspection. `@strapi/database`'s `schema.sync()` runs user
migrations *before* syncing schema from content-type definitions (read
directly in `@strapi/database/dist/schema/index.js`): on a brand-new
database the `discussions` table doesn't exist yet when a migration file
would run, so `alterTable('discussions', ...)` throws `no such table` —
invisible against the long-lived dev Postgres DB where the table already
existed from earlier boots, but fatal on a fresh clone or (as surfaced
here) a fresh test database. `database/migrations/` is for transforming
schema an *existing* install already has, not for adding something new a
fresh install needs — the wrong tool for this job entirely, not just a
file in the wrong order.

Implemented instead in `src/index.ts`'s `bootstrap()` — which runs strictly
*after* `Strapi.bootstrap()`'s own schema-sync step, confirmed by reading
`@strapi/core/dist/Strapi.js` directly — guarded by `hasTable` and an
"already exists" error catch (knex has no portable `hasIndex` across the
Postgres/sqlite clients this project actually runs against, so catching
the duplicate-creation error is the idempotency check, same file that
already handles permission syncing).

### 3.10 Error format & status codes

Strapi's default shape is already uniform:
```json
{ "data": null, "error": { "status": 400, "name": "ValidationError", "message": "...", "details": { "errors": [{ "path": ["title"], "message": "..." }] } } }
```
Next.js's `lib/strapi/client.ts` normalizes this into one internal shape
(`{ status, message, fieldErrors?: Record<string,string> }`) used by every
form — one error-mapping function, not one per form. Codes in play, each
confirmed against a live instance rather than assumed (§3.5): `400` (schema
validation, or — specifically for `author`/`discussion`/`category` — a
relation the writer's role can't `find`), `401` (a token was sent but is
invalid/expired — Strapi's own "Missing or invalid credentials"), `403`
(no token at all, or a valid token whose role lacks the permission — both
resolve to Public-or-insufficient-role and get the same code), `404`
(unknown documentId).

### 3.11 Seeding

A bootstrap-time idempotent seed (checks "does category X exist by slug"
/ "does user Y exist by username" before creating) using the Document
Service API and `plugin('users-permissions').service('user').add(...)`
for users:
- 6–7 categories, names/descriptions adapted from the mockup's `CATS` list
  (Bourse & actions, Épargne & placements, Assurance-vie, Immobilier & SCPI,
  Impôts & fiscalité, Retraite, Le Café du Revenu).
- 5 demo users with known passwords — documented in `README.md`, not in
  `.env.example` (they're fixtures, not secrets).
- ~12–15 sample discussions (mix of `question`/`discussion`) and their
  replies, copy adapted from the mockup's `TOPICS` array (already
  French, financial-advice-flavored, on-brand — reuse rather than
  reinvent).
- Running the seed twice must not duplicate or error.

---

## 4. Next.js design

### 4.1 Routes

| route | purpose | component type |
|---|---|---|
| `/` | home feed, category filter + date sort via searchParams | Server Component page + small Client Component filter bar |
| `/discussions/[documentId]` | detail + replies + reply form | Server Component page; ReplyForm is Client |
| `/discussions/new` | create-discussion form | Client Component (form state) + Server Action |
| `/login` | demo-user login | Client Component + Server Action |

Category filtering is `/?category=slug&sort=date_desc`, not a separate
route (§1 assumption 8) — simpler, and the brief only asks for a filter
*control*, not a landing page per category.

### 4.2 Server vs Client Components, with reasons

Pages stay **Server Component shells**; only the subtree that genuinely
needs client-side interactivity (filtering without a full reload,
optimistic mutation feedback) becomes a Client Component island inside
that shell. This is a deliberate middle ground, not a default — see §4.4
for why TanStack Query changes the split from the original plain-RSC
version of this section.

- **Home page, Discussion detail page — Server Component shells.** Each
  does the **initial** fetch server-side (so the Strapi base URL and any
  server-only token never ship to the client bundle, and first paint
  doesn't wait on a client round trip), then hands that data to a Client
  Component as `initialData`. The *shell* — route, metadata, the detail
  page's static post content (title/body/author/date/category, which
  never changes after load and has no reason to be client-fetched) —
  never needs to re-render client-side at all.
- **DiscussionFeed (home list) and ReplyThread (detail page's replies) —
  Client Components using TanStack Query**, seeded with the shell's
  `initialData`. Filtering, sorting, pagination, and posting a reply all
  need to update the UI without a full navigation and without re-fetching
  data the user already has cached — exactly TanStack Query's job. See
  §4.4.
- **Header — Server Component**, still. Session state for *rendering the
  header's own markup* comes from reading the httpOnly cookie via
  `cookies()` at render time; login/logout are full navigations, so
  there's no client state to manage here. (The session is *separately*
  mirrored into a Zustand store for the Client Components nested below the
  header that need it — §4.4 — but the header itself doesn't need that
  store.)
- **Category filter/sort bar — Client Component**, now part of the
  DiscussionFeed island rather than driving a server navigation: a filter
  change updates the URL's searchParams (`router.replace`, shallow, so the
  state stays bookmarkable/shareable) *and* feeds TanStack Query's query
  key, which serves cached results instantly if that filter combination
  was already seen this session.
- **DiscussionForm, LoginForm — Client Components**, each bound to a
  Server Action via `useActionState` (React 19 / App Router convention).
  **Deliberately NOT converted to TanStack Query mutations** — both end in
  a `redirect()`, neither has anything to show optimistically before the
  server assigns a `documentId`/session, and the plain
  `<form action={serverAction}>` keeps working if JS hasn't hydrated yet.
  Converting these would trade away that for no actual UX gain — see the
  §8 review-prep answer on this exact question.
- **ReplyForm — Client Component using TanStack Query's `useMutation`**
  (via the `useCreateReply` hook, §4.4), not a Server Action. This is the
  one mutation in the app where optimistic UI has real value: the poster
  sees their own reply appear immediately, not after a round trip.

### 4.3 Data layer

`apps/web/lib/strapi/`:
- `client.ts` — one `fetch` wrapper: base URL from `STRAPI_URL` (server-only
  env, never `NEXT_PUBLIC_`), attaches `Authorization: Bearer <jwt>` when a
  session cookie is present, normalizes Strapi's error shape (§3.10).
- `discussions.ts`, `replies.ts`, `categories.ts`, `auth.ts` — one typed
  function per operation (`listDiscussions`, `getDiscussion`,
  `createDiscussion`, `createReply`, `login`), each building its query with
  `qs.stringify` (new dependency, justified: Strapi's bracket query syntax
  for nested `filters`/`populate`/`fields` is unreadable to hand-write and
  error-prone to get exactly right by string concatenation).
- Response shapes validated with **Zod** (new dependency, justified: a
  schema check at the API boundary turns a backend contract break into a
  loud dev-time error instead of a `undefined.map is not a function`
  several components deep).

### 4.4 Client state: TanStack Query, Zustand, custom hooks

Added on top of the original plain-RSC design on your instruction. The
split of responsibility is the thing to get right — and the thing a
reviewer will probe first, since both libraries can *technically* hold any
kind of state, which invites misuse:

- **TanStack Query owns server state** — anything that originates in
  Strapi: discussions, replies, categories, their loading/error status,
  their cache lifetime. If it could be answered by a Strapi query, it
  lives here, never duplicated into Zustand.
- **Zustand owns client-only UI state that has no server representation**
  — state that would exist even if Strapi didn't. Concretely, exactly two
  stores, both intentionally small:
  - `useSessionStore` (`{ id, username, isAuthenticated }`) — seeded from
    the httpOnly cookie, read server-side. **Split across three small
    files, not the single `app/providers.tsx` originally sketched here** —
    confirmed necessary against the installed Next 16: Cache Components
    treats a runtime cookie read as blocking prerendering for whatever
    subtree touches it, and `providers.tsx` wraps the entire app, so doing
    the read there would make every route dynamic. Instead:
    `app/session-boundary.tsx` (server, async) is the *only* place that
    calls `cookies()` for this, wrapped in its own `<Suspense>` in
    `layout.tsx` so the rest of the static shell is unaffected; it renders
    `app/session-sync.tsx` (`'use client'`), which is the only place that
    writes to the store, via a `useEffect`. `app/providers.tsx` itself now
    only sets up `QueryClientProvider` — see §7. Deeply nested Client
    Components (reply form, vote button, header avatar menu once there is
    one) read the store without prop-drilling through every list/card.
    **Never read or written during server rendering** — see the pitfall
    in §7.
  - `useToastStore` — a small FIFO queue for mutation feedback
    ("Réponse publiée", error toasts), consumed by a single `<Toaster/>`
    mounted once in the root layout.
- **Explicitly NOT in Zustand**: filter/sort state stays in the URL's
  searchParams (shareable/bookmarkable — a feature, not a gap); optimistic
  mutation data (a pending reply, a bumped `repliesCount`) lives in
  TanStack Query's own cache via `setQueryData`, not mirrored into a
  second store. Two sources of truth for the same fact is exactly the bug
  class this separation is meant to avoid.

**Custom hooks layer** — components never call `useQuery`, `useMutation`,
or a Zustand store hook directly; they call a domain hook from
`apps/web/hooks/`:
- `useDiscussions(filters)`, `useDiscussion(documentId)`,
  `useReplies(documentId)` — thin `useQuery` wrappers.
- `useCreateReply(documentId)` — the `useMutation` wrapper carrying the
  optimistic-update logic (below).
- `useSession()` — reads `useSessionStore`, exposes `{ user, isAuthenticated }`.
- `useToast()` — exposes `push(message, variant)`, reads/writes
  `useToastStore`.

This centralizes query keys and cache-update logic in one tested place
(`hooks/useCreateReply.test.ts` can assert the optimistic/rollback
behavior directly) instead of scattering `queryClient.setQueryData` calls
across components.

**Query key factory** (`apps/web/lib/queryKeys.ts`): `discussions(filters)`,
`discussion(documentId)`, `replies(documentId)` — one place, so an
invalidation call elsewhere can't silently typo a key and invalidate
nothing.

**Route Handlers as the only bridge from browser to Strapi.**
`useQuery`/`useMutation` run in the browser — they cannot call Strapi
directly without shipping `STRAPI_URL` and the JWT to client JS, which
breaks the httpOnly-cookie design in §4.6. Instead, thin Route Handlers
read the httpOnly cookie server-side and delegate to the exact same
`lib/strapi` functions Server Components/Actions already use:
`app/api/discussions/route.ts` (GET, backs `useDiscussions`),
`app/api/discussions/[documentId]/route.ts` (GET, backs `useDiscussion`),
and `app/api/discussions/[documentId]/replies/route.ts` (GET + POST,
backs `useReplies`/`useCreateReply`). **Three, not the two originally
planned** — `useDiscussion` needed somewhere to fetch from too, even
though in the real app (§4.2) it's seeded via `initialData` and rarely
refetches; `useQuery` still requires a real `queryFn` for cache misses, so
leaving it without a backing route would make the hook quietly broken the
one time it's actually called. This *reinforces* the existing
`CLAUDE.md` rule ("`lib/strapi` is the only thing that talks to Strapi"),
it doesn't create an exception to it — Route Handlers are a second
*caller* of that module, not a second way to reach Strapi.

**`QueryClientProvider` SSR-safety.** `app/providers.tsx` is a `'use
client'` boundary that creates the `QueryClient` with
`useState(() => new QueryClient())` inside the component — never a
module-level singleton. A module-level `QueryClient` on the server would
be shared across unrelated users' requests and leak cached data between
them; this is a named pitfall in §7, not a hypothetical.

### 4.5 Mutations & caching

- **Create-discussion, login — unchanged, Server Actions.** Co-located
  with their pages (`app/discussions/new/actions.ts`, `app/login/actions.ts`),
  calling Strapi server-side via `lib/strapi`, never a client-exposed
  route. After a successful create: `revalidatePath('/')` then
  `redirect(`/discussions/${documentId}`)` — satisfies the brief's
  "rediriger vers la nouvelle discussion après création" with one Next.js
  primitive.
- **Reply creation — `useCreateReply` (`useMutation`), with optimistic
  update:**
  - `onMutate`: append a pending reply (client-generated temp id, the
    session's own username from `useSession()`) to the
    `replies(documentId)` cache, and optimistically increment the cached
    `repliesCount` on both `discussion(documentId)` and the matching entry
    inside any cached `discussions(filters)` list — so the header count and
    the home feed's card agree with what the user just saw happen.
  - `onError`: roll both back to the snapshot taken in `onMutate`, and push
    an error toast via `useToast()`.
  - `onSettled`: `invalidateQueries` for `replies(documentId)` and
    `discussion(documentId)` to reconcile with the server's real id and
    timestamp, whether the optimistic path succeeded or not.
- **Home feed staleness after creating a discussion elsewhere.** Create
  always redirects straight to the new discussion's detail page, never
  back to `/` — so there's no cross-boundary cache to invalidate from a
  Server Action into a browser-side `QueryClient` it has no handle to.
  `discussions(filters)`'s own `staleTime` (kept short, ~30s, matching the
  SSR numbers below) is what keeps `/` reasonably fresh the next time the
  user actually visits it. Stated as a deliberate, simple trade-off, not a
  gap — wiring a cross-request invalidation bus for a case that redirects
  away anyway would be solving a problem that doesn't occur.
- **Two caches, two layers, not a conflict — resolved against the
  installed Next 16, not the `next: { revalidate }` model this bullet
  originally assumed.** Cache Components replaces implicit fetch-config
  caching with an explicit `'use cache'` directive + `cacheLife(...)` on
  the data-fetching function itself (confirmed by reading
  `node_modules/next/dist/docs/01-app/01-getting-started/08-caching.md`
  against the actual installed version, per the §7 flag from Phase 0).
  `lib/strapi`'s functions deliberately don't carry `'use cache'` yet —
  Phase 5 is plumbing, and a cached function can't read `cookies()`
  directly (a runtime API), so the right `cacheLife` per function is a
  Phase 6/7 decision once the pages that actually care about staleness
  exist, not a Phase 5 one. TanStack Query's `staleTime`/`gcTime` still
  governs everything **after** hydration exactly as planned, for the life
  of that browser tab — only the *server*-side half of this bullet changes.

### 4.6 Auth flow end to end

1. `/login` form → Server Action `login(formData)` → `POST
   {STRAPI_URL}/api/auth/local` with identifier/password.
2. On success, Strapi returns `{ jwt, user }`; the Server Action sets an
   httpOnly, `sameSite: 'lax'`, `secure` (in prod) cookie carrying the JWT.
3. Every subsequent Server Component/Server Action reads the cookie via
   `cookies()` and attaches it as a Bearer token to Strapi calls; the Route
   Handlers in §4.4 do the same. `app/session-boundary.tsx` reads it once
   (Suspense-wrapped in `layout.tsx`, not the root layout body directly —
   see §4.4) to derive `{ id, username }` via `getMe`, and hands that to
   `app/session-sync.tsx` so `useSessionStore` can be initialized
   client-side — the *only* place the session crosses into Zustand, and
   only the derived, already-public fields, never the JWT itself.
4. Logout: a Route Handler/Server Action clears the cookie, resets
   `useSessionStore` to its signed-out shape, redirects to `/`.
5. **Why httpOnly cookie over localStorage** (confirming the brief's own
   lean): an XSS payload can't read an httpOnly cookie; it trivially reads
   localStorage. Cookie-based sessions need CSRF consideration in
   principle, but Next.js Server Actions already validate the request's
   `Origin` against the deployment's allowed origins before running — since
   every mutation in this app goes through a Server Action and nothing
   exposes a plain cross-origin-postable endpoint, no separate CSRF token
   is added. This is a specific, stated trade-off, not an oversight — worth
   restating clearly in the review.
6. `/discussions/new` and the reply form check for the session cookie
   server-side and redirect to `/login?next=...` (or render the logged-out
   prompt state, matching the mockup's `.reply-login` block) rather than
   relying on hiding a button — the actual enforcement is Strapi's 401/403
   regardless (brief §2.D: "configurer les permissions côté Strapi et non
   uniquement dans le frontend").

### 4.7 Component inventory (mapped to the mockup)

| component | mockup reference | notes |
|---|---|---|
| Header ✅ | `.hdr` / `.brand` / `.hdr-act` | Server Component; static placeholder in Phase 6, made session-aware in Phase 9 — a small async sub-component (`HeaderSessionActions`) wrapped in its own local `<Suspense>`, not the whole header, swaps "Se connecter" for the username + "Se déconnecter"; no search bar in MVP |
| DiscussionFeed ✅ | `.feed` + `.side`/`.nav-link` + `.tabs` + `.seg-ic` | Client Component, `useDiscussions` — owns the sidebar/chip category filter, Récentes/Sans réponse tabs, comfy/compact density toggle, and card list together as one island (§4.2/§4.4) |
| CategorySidebar ✅ | `.side` / `.nav-link` / `spIcon(c)` | sibling to DiscussionFeed, desktop only (`hidden md:flex`); icon+color per slug is a static client map (`categoryVisuals.tsx`), not a Strapi field |
| DiscussionCard ✅ | `.tcard` | title, author byline, category tag, reply-count box, relative date |
| DiscussionDetail ✅ | `.post.post-main` | Server Component (`DiscussionPost.tsx`) — static post content only |
| ReplyThread ✅ | `.replies` / `.post.reply` | Client Component, `useReplies` + `useCreateReply` — flat list, no threading; also calls `useDiscussion` (render output unused) purely to seed the cache entry `useCreateReply` bumps |
| ReplyForm ✅ | `.reply-box` | nested in ReplyThread; Client Component, `useCreateReply` (`useMutation`, optimistic); logged-out state renders a plain message instead of `.reply-login`'s "Se connecter" button — no `/login` page to link to until Phase 9 |
| DiscussionForm ✅ | composer modal's `.m-body` fields, as a full page not a modal | Client Component + Server Action (§4.2) — type radio, title, category select, content textarea |
| LoginForm ✅ | `.overlay`/`.modal.sm`/`.m-head`/`.m-body`/`.field` | `/login` is styled as a popup (not a true overlay-over-any-page modal — it's still a real route, since the server-side guards need a URL to redirect to). `AuthModal` toggles between `LoginForm` and a new `SignupForm` (real registration via Strapi's public `/api/auth/local/register` — added beyond the brief, see §1); the fake "compte lerevenu.com" SSO box itself is still dropped, and so is the mockup's step-2 onboarding screen |
| Toaster ✅ | — (new) | root-layout singleton, reads `useToastStore`; surfaces mutation feedback from `useCreateReply` (written in Phase 5, had nothing to render into until this phase) |
| EmptyState ✅ | `.empty` | reused for "no discussions", "no replies", "no results" |
| ErrorState ✅ | — (new) | mockup has no error states to mirror; designed fresh using the same card/typography tokens |
| Skeletons ✅ | — (new) | `FeedSkeleton` built in Phase 6, shaped like `.tcard`; also TanStack Query's `isPending` state inside DiscussionFeed/ReplyThread after the initial SSR paint |
| Avatar ✅ | `.av` | monogram from username initials (no `name`/`bio` fields on our User model, so initials come from `username` directly, split on `_`/`.`); accent color picked deterministically by hashing the username (no stored color field either) — no photo upload |
| CategoryTag ✅ | `.cat-tag` / `.tag` | |
| relative date ✅ | mockup's `ago()` util | ported almost verbatim in `lib/relativeDate.ts`: "à l'instant / il y a N min / il y a N h / hier / il y a N j" |

### 4.8 Design tokens → Tailwind

**Landed in `globals.css`'s `@theme inline` block, not `tailwind.config.ts`**
— this table originally assumed a JS config file; the actual
`create-next-app` scaffold (confirmed in Phase 0, acted on in Phase 6)
never generated one, because Tailwind v4 is CSS-first config. `--color-*`/
`--font-*` entries in `@theme` generate the exact same utility classes a
`tailwind.config.ts` `theme.extend` would have, so nothing from the
original intent was lost, just the mechanism:

| token | mockup value | Tailwind |
|---|---|---|
| brand | `#eb0f0f` | `bg-brand`/`text-brand`, `bg-brand-hover` |
| ink / ink-2 / ink-3 | `#1d1d1f` / `#424245` / `#6e6e73` | `text-ink`, `text-ink-2`, `text-ink-3` |
| surface / surface-2 | `#ffffff` / `#f2f2f4` | `bg-surface`, `bg-surface-2` |
| line / hairline | `#e5e5ea` / `rgba(0,0,0,.07)` | `border-line`, `border-hairline` |
| ok / alert | `#1a8a4a` / `#e00b0b` | `text-ok`, `text-alert`, `border-alert` |
| avatar accents (av-1…5) | `#5856d6` `#0a7f99` `#6e6e73` `#c93400` `#d30f45` | `--color-avatar-1`…`5`, picked deterministically per username in `Avatar.tsx` |
| `--r` / `--r-sm` | 14px / 9px | written as literal arbitrary values (`rounded-[14px]`/`rounded-[9px]`) rather than a token — used in exactly two places, not worth a named scale entry |
| `--f-display` | Playfair Display 700/900 | `font-display` (loaded via `next/font/google`, referenced through its own `--font-playfair-display` variable — not a bare string, for the self-hosted/no-FOIT benefit) |
| `--f-body` | system font stack | unchanged — Tailwind's default `font-sans` (Geist, already wired in Phase 0) |
| `--shadow` / `--shadow-lg` | layered box-shadows | `shadow-card` via Tailwind v4's `@utility` directive (only `--shadow` ported so far — `--shadow-lg` has no consumer yet, added when something needs it) |

**Dark mode: out of scope for MVP** — the mockup ships a full dark palette,
but the brief doesn't ask for it and reproducing it doubles every visual
QA pass for a feature nobody requested. Single light theme, revisit if
there's time left after bonuses.

---

## 5. Testing strategy

### Strapi — Jest + Supertest

Tests run against a running Strapi test instance pointed at an **sqlite
file DB**, not Postgres. Strapi's query layer (`strapi.documents(...)`,
permission checks, lifecycle hooks, custom controllers) is the thing under
test here, and it's DB-client-agnostic for everything these tests exercise
— swapping to sqlite for CI speed and zero external dependency is a stated
trade-off, not an oversight; production config stays Postgres-only.

**One test file, not several** (revised from the original "each test file
resets the sqlite file" plan, which assumed the sqlite reset was the only
coordination concern). `compileStrapi()` unconditionally recompiles the
*shared* `dist/` on every call — confirmed by reading
`@strapi/core/dist/compile.js`, and by corrupting a live `strapi develop`
process in Phase 2 when a second boot raced it. Multiple test files, each
booting their own Strapi instance, would hit the same problem the moment
Jest's default parallel workers picked up more than one of them. All 10
cases exercise the same two content types anyway, so one file with one
shared `beforeAll` boot (and `jest.config.js`'s `maxWorkers: 1`, kept as a
guard for if more files get added later) sidesteps the risk entirely rather
than working around it.

Required cases (from brief §6, concretely):
1. `POST /api/discussions` with `title` < 10 chars → `400`, error mentions
   `title`.
2. `POST /api/discussions` with missing `content` → `400`.
3. `POST /api/discussions` with an invalid `type` (not `question`/
   `discussion`) → `400`.
4. `POST /api/discussions` with a non-existent `category` documentId →
   `400`.
5. `POST /api/discussions` with no `Authorization` header → `403` (Public
   role, correctly resolved, lacks the permission — confirmed empirically
   in Phase 2, see §3.5; `401` is reserved for a present-but-invalid token).
6. `POST /api/discussions` authenticated as user A, `data.author` set to
   user B's id → response's `author` is user A, not B.
7. Same spoofing test for `POST /api/replies`.
8. `GET /api/discussions?pagination[pageSize]=5` → exactly 5 items,
   `meta.pagination` correct.
9. `GET /api/discussions?sort[0]=createdAt:asc` vs `:desc` → order flips.
10. `GET /api/discussions?filters[category][slug][$eq]=bourse` → only that
    category's discussions returned.

### Next.js — Vitest + Testing Library

Test setup includes a `renderWithProviders` helper that wraps the
component under test in a **fresh `QueryClient` per test** (`gcTime: 0`,
`retry: false`) so TanStack Query cache doesn't leak between test cases,
and resets every Zustand store in `afterEach` (module-singleton state is
the same gotcha, different library — a store not reset the same way would
leak a logged-in session into the next test).

- `DiscussionFeed` renders N cards from a mocked `useDiscussions` route
  response, renders the empty state when the list is empty, renders a
  skeleton while `isPending`.
- `DiscussionForm` client-side validation: submitting a <10-char title
  blocks submission and shows the inline error without a network call.
- `DiscussionForm` server-error mapping: a mocked `400` response with
  `details.errors` renders the matching field error.
- `useCreateReply` optimistic update: calling `mutate` appends the pending
  reply to the `replies(documentId)` cache synchronously (before the
  mocked network response resolves), and a mocked mutation error rolls the
  cache back to its pre-mutation snapshot and pushes a toast via
  `useToastStore`.

### Playwright E2E (bonus, phase B7)

One happy-path spec: login with a seeded demo user → create a discussion →
redirected to its detail page → reply form visible and usable → post a
reply → reply appears without reload.

---

## 6. Phased roadmap

Core first, bonuses strictly after. Each phase has a definition of done
with the exact command(s) to verify it — check these off in this file as
they land.

**Phase 0 — Scaffolding** ✅
- [x] npm workspaces root, `apps/web` (Next.js 16+TS+Tailwind), `apps/cms`
      (Strapi v5.59+TS+Postgres), `.env.example` (per app), README
      skeleton, strict tsconfig (both apps default to `strict: true`
      already) + ESLint/Prettier in both apps.
- DoD: `npm install` at root succeeds; `npm run dev` boots both apps on
  their default pages with zero console errors. **Verified** — Next ready
  in ~1.2s on Turbopack (port 3001; 3000 was already held by an unrelated
  local process), Strapi connected to Postgres, ran its v5 internal
  migrations cleanly, served `/admin` with `200`.
- Local Postgres for dev: a disposable Docker container
  (`lerevenu-postgres`, `postgres:16-alpine`, host port `5433`, named
  volume `lerevenu_pgdata`) rather than the machine's existing native
  Postgres cluster — avoids touching a shared cluster this project has no
  business modifying; documented in `README.md`. Superseded by the
  `docker-compose.yml` bonus (B6) once that lands.
- Two corrections made mid-phase and already folded into §1/§2/§7 above:
  Node pinned to **22** LTS (not 20 — Strapi `5.59.0`'s `undici`
  dependency needs it), and Next.js **16**'s caching model (Cache
  Components, confirmed enabled by default) differs from what §4.5
  describes — flagged as unverified until Phase 5/6, not silently
  carried forward.

**Phase 1 — Strapi content types** ✅
- [x] Category, Discussion, Reply schemas per §3.1, draft&publish off,
      relations wired both directions.
- DoD: all three content types visible and correctly related in the Strapi
  admin; a manual create-via-admin round-trips correctly. **Verified** —
  `npm run dev:cms` boots clean (zero schema errors), Postgres shows
  `discussions_author_lnk`, `discussions_category_lnk`,
  `replies_author_lnk`, `replies_discussion_lnk` link tables and the
  expected FKs. Round trip verified programmatically via the Document
  Service API (create category → discussion → reply, then re-fetch each
  with the opposite-direction relation populated): discussion resolves its
  author/category/replies, category resolves its discussions back. Same
  code path the admin UI's create screens call, so the admin click-through
  is expected to behave identically — worth a quick manual click to be
  sure, but not re-verifying the engine. `npm run typecheck` and
  `npm run lint` clean in `apps/cms`.

**Phase 2 — Permissions & auth plumbing** ✅
- [x] Bootstrap permissions script (§3.6), author-injection controllers for
      Discussion/Reply `create`, `repliesCount` lifecycle hook, indexes
      migration (§3.9).
- DoD: `curl -X POST /api/discussions` with no token → `401`; with a token
  and a spoofed `author` → response author is the token's own user;
  posting a reply increments the parent discussion's `repliesCount` by 1.
  **Verified, with one corrected expectation** — no-token create is `403`,
  not `401` (§3.5/§3.10 explain why; `401` is real but reserved for a
  present-but-invalid token, also confirmed via curl). Author-spoofing
  defense confirmed against the live DB: authenticated as user A, sending
  `author: <user B's id>` in the payload, the persisted row's author link
  is A, not B — same for replies. `repliesCount` confirmed 0 → 1 after
  posting a reply to a fresh discussion. The originally planned
  `is-authenticated` policy was dropped (dead code — see §3.5); the
  originally planned 401 DoD was corrected to 403 for the same reason. The
  permissions matrix needed one unplanned addition
  (`plugin::users-permissions.user.find` for Authenticated) to let the
  author-injection controllers write the relation at all — also in §3.5.
  Idempotency confirmed directly: the bootstrap ran across ~8 dev-server
  restarts during this phase and the permission row count never grew past
  16. `npm run typecheck` and `npm run lint` clean in `apps/cms`.

**Phase 3 — Seed data** ✅
- [x] Idempotent seed: categories, demo users, sample discussions+replies
      (§3.11).
- DoD: `npm run seed` twice on a fresh DB → no duplicates, no errors; data
  visible in the admin. **Verified** — `apps/cms/scripts/seed.js`, run via
  `compileStrapi`/`createStrapi` (same boot pattern used to verify Phases
  1–2), find-or-create by `username`/`slug`/`title`/`content` before every
  write. First run against an empty DB: 5 users, 7 categories, 14
  discussions, 24 replies. Second run immediately after: zero `created
  ...` log lines, identical row counts in Postgres — confirmed idempotent
  by inspection, not inferred from "no errors thrown". Discussions created
  through the Document Service (not raw SQL), so the Phase 2
  `repliesCount` lifecycle hook ran for real on every seeded reply — every
  discussion's `repliesCount` matches its actual reply count, checked
  directly against Postgres. 7 categories and the 5-demo-user count match
  §1 assumption 7 and §3.11 exactly; discussion/reply copy adapted from the
  mockup's `TOPICS` array, reassigned across only the 5 seeded users
  (dropping the mockup's `LaRedaction`/editorial-staff persona, out of
  scope per §1) rather than seeding its full ~20-user cast. Demo
  credentials documented in `README.md`, not `.env.example` — fixtures,
  not secrets. `npm run typecheck` and `npm run lint` clean in `apps/cms`.

**Phase 4 — Strapi automated tests** ✅
- [x] Jest+Supertest suite covering the 10 cases in §5.
- DoD: `npm test` green in `apps/cms`. **Verified** — `apps/cms/tests/
  api.test.ts`, one file/one Strapi boot per §5's revised rationale, run
  against a fresh sqlite DB wiped by `tests/jest.setup.js` before every
  run. All 10 cases pass, confirmed twice in a row (not just "didn't
  error once"). Running against a genuinely fresh database — never
  actually exercised before this phase — caught two real bugs no amount
  of re-reading would have: the `discussions.created_at` index migration
  assumed the table already existed (§3.9, fixed by moving it into
  `bootstrap()`), and Strapi's REST create actually returns `201`, not
  the `200` assumed everywhere else in this plan from memory (test
  assertions corrected to match; nothing else in the app depended on the
  wrong number). `npm run typecheck` and `npm run lint` clean in
  `apps/cms`, including the new `tests/`, `jest.config.js` files. New
  devDependencies: `jest`, `ts-jest`, `@types/jest`, `supertest`,
  `@types/supertest`, `better-sqlite3` (sqlite driver Strapi's database
  layer requires for the `sqlite` client — test-only, production stays
  Postgres).

**Phase 5 — Next.js data layer** ✅
- [x] `lib/strapi/*` typed client, Zod schemas, `qs`-based query builder,
      error mapper; `app/providers.tsx` (`QueryClientProvider`,
      per-request `QueryClient`), `lib/queryKeys.ts`, the Route
      Handlers (§4.4 — three, not two, see below), `stores/useSessionStore`,
      `stores/useToastStore`, and the custom hooks (`useDiscussions`,
      `useDiscussion`, `useReplies`, `useCreateReply`, `useSession`,
      `useToast`).
- DoD: a throwaway debug page proves a typed, parsed fetch against seeded
  data through both paths — server-side via `lib/strapi` directly, and
  client-side via a Route Handler + `useDiscussions` — and shows the
  session store correctly reflecting a logged-in vs logged-out cookie
  (deleted before Phase 11 hardening, or converted into Phase 6's real
  page — in the end, deleted in Phase 9, once login/logout gave the
  session-store check a real page to live in instead). **Verified** —
  `apps/web/src/app/debug/page.tsx`: the server-side
  list (direct `lib/strapi` call) and the client-side list
  (`useDiscussions` through the Route Handler) both render the seeded
  discussions independently; a "login as vincent_etf"/"logout" pair of
  throwaway Server Actions flips the httpOnly cookie, and the session
  display (`useSession`) correctly tracks it both ways. `npm run
  typecheck` (now `next typegen && tsc --noEmit`, see §7) and `npm run
  lint` clean in `apps/web`. Two corrections already folded into §4.4/§7
  above: a third Route Handler was needed (`useDiscussion` has nowhere
  else to fetch from), and the session-store hydration moved out of
  `app/providers.tsx` into two new small files
  (`session-boundary.tsx`/`session-sync.tsx`) once Cache Components made
  reading the cookie at the layout root block every route's static shell.

**Phase 6 — Home page (brief §2.A)** ✅
- [x] DiscussionFeed/DiscussionCard (Server shell + Client Component
      island per §4.2), category filter, date sort, loading/error/empty
      states, Tailwind tokens, responsive layout.
- DoD: manual check against seeded data — filtering and sorting both work
  *without a full page reload* (confirm in the Network tab: a filter
  change hits the Route Handler, not a full RSC navigation), switching
  back to a previously-selected filter is instant (served from the
  TanStack Query cache), visually consistent with the mockup's
  card/typography language. **Server-side half verified directly** — `curl`
  against the live dev server confirms all 14 seeded discussions render
  (Server Component shell → `listDiscussions`/`listCategories` directly),
  the category filter and both sort directions produce correct results
  through `/api/discussions` (the same Route Handler the client hook
  calls), and an unmatched category correctly renders `EmptyState`. The
  Network-tab/instant-cache/visual checks are inherently browser-only —
  left for you to confirm by hand, as the DoD itself already frames this
  as a manual check.
  - `DiscussionFeed` keeps filter state in local `useState` and mirrors it
    to the URL via `window.history.replaceState` directly, **not**
    `next/navigation`'s router — confirmed necessary: `router.replace`
    triggers a soft RSC re-render for the route, which is exactly the
    "full page reload"-adjacent behavior the DoD's Network-tab check is
    there to catch.
  - Design tokens landed in `globals.css`'s `@theme inline` block, not a
    `tailwind.config.ts` — this scaffold uses Tailwind v4's CSS-first
    config (confirmed: no config file was generated by `create-next-app`),
    which §4.8 didn't anticipate when it assumed a JS config file.
  - Two Phase 5 files renamed for consistency with the component-naming
    rule (`providers.tsx` → `Providers.tsx`, same for
    `SessionBoundary`/`SessionSync`) — caught while adding the first real
    batch of components this phase, not deferred.
  - A static (non-session-aware) `Header` landed in `layout.tsx` now,
    ahead of its Phase 9 "session-aware" upgrade — the page looked
    structurally incomplete against the mockup without one, and every
    future page needs it regardless.

**Phase 7 — Discussion detail (brief §2.B)** ✅
- [x] Clean `documentId` route, Server Component static post content,
      ReplyThread + ReplyForm wired to `useCreateReply`.
- DoD: logged in as a demo user, post a reply, see it appear
  *immediately* (optimistic — confirm it renders before the network
  request in the dev tools resolves), the discussion's reply count bumps
  in the same render; kill the network mid-request (devtools offline) and
  confirm the optimistic reply rolls back and an error toast appears.
  **Server-side half verified directly via `curl`** against seeded data:
  the post, author, category, type tag, and body all render correctly for
  discussions with and without replies; the "N réponse(s)" /
  "Aucune réponse pour l'instant" heading matches the actual reply count;
  an unknown `documentId` returns a real `404`; the logged-out prompt
  (`.reply-login` equivalent) renders when there's no session. Also
  confirmed end-to-end, server-side only, that a JWT obtained from
  Strapi's own `/api/auth/local` correctly resolves through this app's
  `getMe` → `SessionBoundary` path. The optimistic-update timing, rollback,
  and toast checks are irreducibly browser-only (the DoD's own wording —
  "in the dev tools", "devtools offline" — already says so); left for you.
  - Three real things caught and fixed, not just noted. (1) The discussion
    detail page originally awaited `getDiscussion` directly in the page
    body with no `<Suspense>` above it — confirmed via the dev server's
    own console as `Next.js encountered uncached data during
    prerendering`. First attempt wrapped it in Suspense like the home
    feed; that broke `notFound()`'s status code instead (see (2)), so the
    final version keeps this one fetch unwrapped on purpose — a deliberate
    trade-off, not an oversight, documented directly in the page's own
    comment. (2) Discovered while fixing (1): once a Suspense fallback's
    `200` shell has already streamed, a `notFound()` thrown later from
    inside that boundary swaps the *body* to the not-found UI but can't
    retroactively change the already-sent status code — confirmed
    empirically (`curl` showed the correct "page not found" markup at
    `200`, not `404`). §3.10's error contract commits to a real `404` for
    an unknown `documentId`, which outweighs this one route's otherwise-
    avoidable dev warning — so `getDiscussion` (and the `notFound()` check)
    stayed outside Suspense, while only the independent replies fetch
    underneath it is Suspense-wrapped. **The same investigation also
    caught this bug already present in Phase 6's home page** — `HomePage`
    was awaiting `searchParams` directly in the page body too, for the
    exact same reason, just never checked for until now; fixed the same
    way Next's own docs recommend (pass the `searchParams`/`params`
    *promise* down, await it inside the Suspense-wrapped child, page
    component itself no longer `async`). No status-code trade-off applies
    there — the home page always returns `200` regardless of filters — so
    it's fully Suspense-wrapped with no warning at all now. (3) A
    `curl`-based session test looked broken (`getMe` resolving the right
    user server-side, but the page still read "Déconnecté") — turned out
    to be a test-methodology artifact, not a bug: `curl` never executes
    client JS, so it can never observe `SessionSync`'s post-hydration
    `useEffect`; it only ever sees the correct pre-hydration default.
    Confirmed by checking the server-rendered values directly instead of
    inferring intent from static HTML.
  - New this phase: `lib/formatBody.ts` (the mockup's markdown-lite —
    `**bold**` and `- ` lists only, escaped first per §1 assumption 2) and
    `components/Prose.tsx` (its one `dangerouslySetInnerHTML` consumer —
    safe because `formatBody` only ever emits a fixed, attribute-less tag
    set around already-escaped text); `components/Toaster.tsx`, wired into
    `layout.tsx`, giving `useCreateReply`'s existing toast calls (written
    in Phase 5, unused until now) somewhere to actually render; a
    `shadow-card-lg` utility for it (§4.8's `--shadow-lg` finally has a
    consumer). Also dropped `globals.css`'s leftover `prefers-color-scheme`
    override and `body`'s stray Arial fallback from the `create-next-app`
    scaffold — both silently contradicted §4.8's "single light theme,
    Geist body font" decision from Phase 6.

**Phase 8 — Create discussion (brief §2.C)** ✅
- [x] Form with client validation, Strapi `400` → field-error mapping,
      redirect to the new discussion on success.
- DoD: a <10-char title shows an inline error instantly (client check);
  temporarily disable the client check and resubmit — the same error now
  comes from Strapi's `400`, proving the two layers are independent.
  **Built together with Phase 9** — the form needs a real session to
  reach at all, and Phase 9's own DoD text requires this page to exist
  first, so implementing in roadmap order wasn't actually possible.
  `DiscussionForm.tsx`'s submit button disables on the same `< 10`
  check as Strapi's schema; the DoD's "disable the client check" step is
  a code edit for independent verification, not a UI toggle — building a
  real toggle into the shipped form would be scope creep for a one-time
  review step. Verified server-side via `curl` with a real token: the
  category `<select>` populates with the 7 seeded categories through
  `listCategories()`, confirming the route's data loading works; the
  actual submit → field-error-display → redirect loop needs a browser
  (Server Actions can't be invoked through `curl` — they use Next's own
  action-id POST protocol, not a plain form post).

**Phase 9 — Auth (brief §2.D)** ✅
- [x] Login page/Server Action/httpOnly cookie, logout, route guards on
      `/discussions/new` and the reply form, session-aware Header.
- DoD: full manual loop — logged out → login → create discussion → logout
  — works end to end; attempting to reach `/discussions/new` while logged
  out redirects to `/login`. **Route guard verified directly**: `curl` on
  `/discussions/new` with no cookie returns a real `307` to
  `/login?next=/discussions/new` (not a 200 with login content inlined —
  see the bug below); with a valid token it returns `200` with the real
  form. Header's session-awareness confirmed server-side: renders
  "Se connecter" logged out, the username + "Se déconnecter" logged in
  (via `getMe`, wrapped in React's `cache()` so Header and
  `SessionBoundary` share one Strapi call per request instead of two).
  The reply thread's logged-out prompt (Phase 7) now links to
  `/login?next=/discussions/{id}` instead of just displaying text. The
  actual login-submit → cookie-set → redirect loop and logout need a
  browser, same `curl`-can't-invoke-Server-Actions limit as Phase 8.
  - **A second, more serious redirect bug, same root cause as Phase 7's
    `notFound()` finding, caught before it shipped**: the route guard was
    first written as an async Server Component wrapped in
    `<Suspense fallback={null}>`, calling `redirect()` from inside. `curl`
    showed a `200` with the *login page's own content* inlined into the
    `/discussions/new` response — once the `null` fallback's `200` shell
    streams, a `redirect()` fired later can only become a client-side
    script-tag redirect (invisible to `curl`, and to anything else that
    doesn't execute JS), not a real HTTP redirect. Fixed by moving the
    cookie check and `redirect()` call back to the top of the page
    component, outside any Suspense boundary — the same trade-off as
    Phase 7: accept the route's "uncached data" dev warning rather than
    risk a wrong HTTP response. **Generalizes the Phase 7 finding**:
    it's not just `notFound()` — any response-status-changing call
    (`notFound()`, `redirect()`) needs to run before the first byte
    streams, full stop.

**Phase 10 — Next.js tests**
- [x] Vitest+RTL suite per §5.
- DoD: `npm test` green in `apps/web`.
- Added `vitest`, `@testing-library/react`, `@testing-library/jest-dom`,
  `@testing-library/user-event`, `jsdom`, `@vitejs/plugin-react` as
  devDependencies; `vitest.config.mts` (jsdom env, `@/*` alias, 20s
  `testTimeout` — this machine's cold Vite transform of a test file's
  first case runs ~8s, not a hang); `src/test/setup.ts` (jest-dom
  matchers, resets `useSessionStore`/`useToastStore` in `afterEach`);
  `src/test/renderWithProviders.tsx` (fresh `QueryClient` per call,
  `gcTime: 0`/`retry: false`). `useCreateReply.test.tsx` needed its own
  QueryClient factory *without* `gcTime: 0` — that hook never mounts a
  `useQuery` observer for the keys it pokes (`onMutate`/`onError` write
  straight to the cache), so a zero-gcTime client garbage-collects the
  manually-seeded data before the mutation ever reads it back.
  `DiscussionForm`'s tests mock `./actions`'s `createDiscussionAction`
  directly rather than exercising the real Server Action (which needs
  `next/headers`/a live Strapi) — a true 400 is already covered by
  `apps/cms`'s Jest suite; this suite only verifies the component maps
  whatever `fieldErrors` the action resolves with onto the right field.

**Phase 11 — Hardening**
- [ ] README finalized (install, run, seed, test, architecture choices,
      demo user credentials); `.env.example` double-checked for zero
      secrets; `npm run lint` and `npm run typecheck` clean in both apps;
      a literal fresh-clone install test.
- DoD: `rm -rf` a fresh checkout into a scratch dir, follow `README.md`
  verbatim, app runs.

**Bonuses (after Phase 11, each independent, pick in this order)**
- [ ] B1. Pagination UI (backend from Phase 1 already supports it).
- [ ] B2. Search — Strapi `$containsi` filter on `title`, search input on
      home.
- [ ] B3. "Utile" votes — new `Vote` relation/content type, one per
      user-per-post, not on one's own post (ownership + uniqueness policy).
- [ ] B4. Best answer — `isBestAnswer` boolean on Reply, policy restricting
      the action to the discussion's own author.
- [ ] B5. User profile page — username + their discussions list.
- [ ] B6. Docker Compose — web + cms + postgres, one-command local run.
- [ ] B7. Playwright E2E (§5).

---

## 7. Risks and pitfalls to watch (Strapi v5, and the TanStack Query / Zustand layer)

- **Flattened response shape.** v5 returns `{ id, documentId, title, ... }`
  directly — no `data.attributes.title` nesting from v4. A lot of
  still-circulating Strapi examples/tutorials show the v4 shape; don't
  copy them blindly, and make the Zod schemas in `lib/strapi` the thing
  that catches a mismatch immediately if this is wrong.
- **`documentId` vs numeric `id` confusion.** `documentId` identifies a
  logical entry across locales/draft-published versions; numeric `id`
  identifies one DB row. Every public URL, every stored foreign reference
  the frontend keeps, uses `documentId`. Never leak a numeric `id` into a
  URL or a `data-*` attribute.
- **`strapi.entityService` is deprecated in v5** in favor of
  `strapi.documents(...)` — don't let autocomplete or an old example pull
  in the old API.
- **Populate requires an explicit `fields` allowlist on `author`** (§3.7) —
  the easiest way to accidentally leak plugin-internal user fields through
  a public read endpoint is a bare `populate: ['author']`.
- **Policies vs middlewares.** A policy is a boolean gate that runs before
  the controller and can't mutate the request; a middleware runs earlier in
  the route pipeline and can transform request/response. The author-
  injection logic belongs in the controller (it needs to actually write
  `ctx.request.body.data.author`), not a policy — using a policy for that
  would be reaching for the wrong tool.
- **A custom policy can't turn a permission-denial into a different status
  code — confirmed, not assumed, by reading `@strapi/core`'s
  `compose-endpoint.js`.** The composed per-route handler order is
  `authenticate → authorize → policies → middlewares → controller`.
  `authorize` (Strapi's own RBAC check) runs *before* any custom policy and
  already throws on a denied permission — a request with no token is
  evaluated as the Public role there, and if Public lacks the permission
  (as designed, §3.6) the request 403s before a custom policy ever runs.
  Phase 2 planned a policy specifically to produce `401` for "no identity at
  all" and it was unreachable for exactly this reason — removed rather than
  kept as dead code (§3.5). The real, confirmed split: `403` = no token *or*
  a role lacking permission; `401` = a token was sent but is invalid/
  expired.
- **Writing a relation to a content type requires `find` on that type's
  target, independent of the route's own permissions — confirmed via
  `@strapi/utils`'s `throwRestrictedRelations` input validator.** Granting
  `discussion.create`/`reply.create` was not enough for the author-injection
  controllers to actually set `author`; the writer's role also needs
  `plugin::users-permissions.user.find`, or the request 400s with `Invalid
  key author` regardless of the value being written. Not mentioned in any
  Strapi guide skimmed while planning this — found by testing against a
  live instance after the "obviously correct" version kept failing (§3.5).
- **users-permissions sanitization isn't a blank check.** It strips
  password/reset-token by default; it does not guarantee email is hidden
  from every populate path depending on plugin config — hence the explicit
  `fields` allowlist rule, not reliance on defaults.
- **Postgres connection config**: standard v5 env vars
  (`DATABASE_CLIENT=postgres`, `DATABASE_HOST/PORT/NAME/USERNAME/PASSWORD/SSL`)
  — expected unchanged from v4, **verify in docs** before trusting from
  memory, especially the SSL flag shape if the eventual deploy target
  requires it.
- **Node version support window for Strapi v5 moves between minor
  releases — confirmed, not hypothetical.** Phase 0 scaffolding installed
  `5.59.0`, whose `undici@8` dependency needs Node `≥22.19.0` at runtime
  despite the package's own `engines` field still saying `>=20.0.0`. The
  project is pinned to Node 22 (§1 assumption 3, §2) because of this, not
  as a precaution — re-check `engines` / install warnings again if
  `apps/cms`'s Strapi version is ever bumped.
- **Next.js 16's caching model, resolved in Phase 5 as flagged (was
  "verify by Phase 5/6" since Phase 0).** Read
  `node_modules/next/dist/docs/01-app/01-getting-started/08-caching.md`
  and `.../15-route-handlers.md` directly against the installed `16.4.2`.
  Confirmed: Cache Components treats any runtime API read (`cookies()`,
  `headers()`) or uncached network call as blocking prerendering unless
  it's wrapped in `<Suspense>` or the function carries `'use cache'` +
  `cacheLife(...)`. The old `next: { revalidate: N }` fetch-config model
  §4.5 originally described doesn't apply under Cache Components at all —
  caching is now a property of the *function*, not the `fetch()` call.
  Concretely, this phase hit it twice: (1) `app/layout.tsx` can't read the
  session cookie directly without making every route dynamic, fixed by
  isolating that read in `app/session-boundary.tsx` behind its own
  `<Suspense>` (§4.4/§4.6); (2) a `GET` Route Handler that touches
  `cookies()` or makes a network call is automatically treated as dynamic
  — confirmed from the docs, no `export const dynamic = 'force-dynamic'`
  needed, which is good because the three Route Handlers in §4.4 do
  exactly that. `lib/strapi`'s own functions stay uncached for now;
  applying `'use cache'`/`cacheLife` to them is still deferred (now past
  Phase 6 *and* 7, both of which shipped real pages without needing it —
  the trade-off from §4.5 holds: this app's scale doesn't demand it yet).
- **The same "runtime read outside Suspense blocks prerendering" rule bit
  twice more in Phase 7 — and uncovered why "just wrap it in Suspense"
  isn't always the right fix.** `HomePage` (Phase 6) was awaiting
  `searchParams` directly in the page body the whole time, same root cause
  as the session-cookie issue from Phase 5, just never checked for until
  Phase 7's investigation went looking. Fixed per Next's own documented
  pattern: pass the `searchParams`/`params` *promise* down as a prop,
  await it inside the Suspense-wrapped child, keep the page component
  itself non-`async`. **But** the discussion detail page showed this isn't
  a blind rule to always apply: wrapping `getDiscussion` (and its
  `notFound()` call) in Suspense fixed the warning but broke the `404`
  status code — once a Suspense fallback's `200` shell has streamed,
  `notFound()` thrown later from inside it can only swap the body, not the
  already-sent status. Where a route needs `notFound()`'s HTTP status to
  be correct, the existence-checking fetch has to stay outside Suspense,
  accepting the dev warning as the cost — confirmed by testing the actual
  status code with `curl`, not by trusting the rendered HTML. Worth
  checking explicitly for Phase 8's create-discussion form and anywhere
  else a fetch result decides between a normal render and a redirect/404.
  **It did bite again, immediately, in Phase 9** — the `/discussions/new`
  route guard (an async Server Component calling `redirect()`, wrapped in
  `<Suspense fallback={null}>`) hit the exact same failure mode:
  `redirect()` thrown after a flushed `200` shell only becomes a
  client-side script-tag redirect, invisible to `curl` and to anything
  else that doesn't execute JS — caught because `curl` on the guarded
  route returned `200` with the *login page's own markup* inlined, not a
  redirect. Confirms the rule is general, not `notFound()`-specific: any
  call that needs to change the HTTP response itself — `notFound()`,
  `redirect()`, setting a header, anything — has to run before the first
  byte streams, which means outside Suspense, full stop.
- **`RouteContext<'...'>` types don't exist until generated — confirmed,
  not a flaky error.** Next 16's typed dynamic-route params
  (`ctx.params: Promise<{...}>` via the global `RouteContext<'/path/
  [param]'>` helper) come from `.next/types/`, which only exists after
  `next dev`, `next build`, or `next typegen` has run at least once.
  `tsc --noEmit` on a clean checkout with new dynamic routes failed with a
  confusing `does not satisfy the constraint '"/favicon.ico"'` error (the
  only route that existed before this phase) the first time it ran.
  Fixed at the source rather than just documented: `apps/web/package.
  json`'s `typecheck` script is now `next typegen && tsc --noEmit`, so
  `npm run typecheck` is self-sufficient on a bare fresh clone — confirmed
  by running it standalone.
- **`QueryClient` as a module-level singleton is an SSR data leak, not
  just a style nit.** If `new QueryClient()` is created at module scope
  instead of inside `app/providers.tsx` with `useState(() => new
  QueryClient())`, the same client — and its cache — is shared across
  every concurrent request the Next.js server handles, which can leak one
  user's fetched data into another user's response. Per-request
  instantiation is not optional here.
- **A Zustand store touched during server rendering is the same class of
  bug.** `useSessionStore`/`useToastStore` must only ever be read or
  written from inside a Client Component, after hydration — never
  imported into a Server Component or called during the server render
  pass. The session value they hold is *seeded* from a server-read cookie
  (§4.6), but the store itself lives entirely client-side.

---

## 8. Review prep — likely questions, short answers

**Why Server Components for the list/detail pages?**
No interactivity needed to render them; keeps the Strapi base URL and any
server-only env off the client bundle; free SEO/first-paint upside as a
side effect of the right default, not a requirement chased for its own
sake.

**How is author spoofing actually prevented?**
Two independent layers: the Public role has zero write permission on
Discussion/Reply (defense in depth), and the create controller overwrites
`data.author` with `ctx.state.user.id` from the verified JWT unconditionally
— whatever `author` the client sent is discarded before the core action
ever sees it.

**How would you scale reply counts?**
Already denormalized specifically so the list's hot path never joins or
counts at read time (§3.3) — O(1) regardless of thread size. The trade-off
is counter drift if a hook fails mid-write; in real production that's
mitigated by wrapping the reply write and the counter update in one DB
transaction, or a periodic reconciliation job — not built here since
nothing in scope exercises that failure mode, but it's the obvious next
hardening step.

**Why `documentId` and not a slug in the URL?**
See §3.2 — it's the brief's own explicit steer, and it avoids a uniqueness
constraint on title edits for zero asked-for benefit.

**Why an httpOnly cookie instead of localStorage for the JWT?**
XSS protection — httpOnly cookies aren't readable by injected scripts,
localStorage is. CSRF is handled by Next.js Server Actions' built-in origin
check, since every mutation goes through one and nothing exposes a plain
cross-origin-postable endpoint. See §4.6.

**Why both Server Components and TanStack Query — isn't that redundant?**
They operate at different moments. Server Components own the *first*
render of a page — fast first paint, no client-only token exposure, free
for content that doesn't change without a navigation (the post body, the
header). TanStack Query owns *everything after that first render* inside
the two subtrees where the user actually interacts without navigating
(filtering the feed, posting a reply) — it's seeded from the server's own
data via `initialData`, so there's no duplicate fetch on load, just a
handoff at hydration. Using only RSC would mean a full page reload to
change a filter; using only TanStack Query would mean a client-only
waterfall on first load and shipping the Strapi token to the browser. See
§4.2/§4.4.

**Why both TanStack Query and Zustand — isn't that redundant?**
They hold different *kinds* of state, not the same state twice: TanStack
Query owns server state (discussions, replies — anything that could be
answered by a Strapi query); Zustand owns the two bits of client-only UI
state that have no server representation at all (the session echo used by
nested Client Components, the toast queue). Filter/sort state is in the
URL, not either store; optimistic mutation data lives in TanStack Query's
own cache, not duplicated into Zustand. See §4.4 for the explicit list of
what's deliberately *not* in a Zustand store.

**What would you do next, given more time?**
Bonuses in the order listed in §6, then editing/deleting one's own
discussion/reply (an ownership policy — same shape as the author-injection
controller, just checking `entity.author.id === ctx.state.user.id` before
allowing `update`/`delete`), then a real category landing page, then i18n,
then swapping the demo users-permissions users for actual lerevenu.com SSO.

**What's the biggest thing deliberately left out, and why?**
The entire gamification layer (points/badges/leaderboard) — it's the
single largest part of the mockup by surface area, and none of it is in
the brief's feature list. Building it would have traded scope-depth on the
four core flows for scope-breadth on something nobody asked for, which the
brief explicitly warns against (§8 of the brief).
