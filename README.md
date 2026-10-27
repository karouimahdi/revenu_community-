# Communauté Le Revenu

Forum-style community space for Le Revenu readers: discussions, replies,
categories. Next.js (App Router) frontend, Strapi v5 + PostgreSQL backend.
Take-home technical test.

Status: all four core flows from the brief are done — home feed,
discussion detail with replies, create-discussion, and login/logout —
across both Strapi and Next.js, with both test suites green. Remaining:
hardening.

## Setup

Prerequisites: Node.js 22.x (see `.nvmrc`), npm 10+, Docker (for local
Postgres, or point at any PostgreSQL instance you already have).

```bash
npm install
```

Installs both workspaces (`apps/web`, `apps/cms`) from the repo root.

Local Postgres, if you don't already have one running:

```bash
docker run -d --name lerevenu-postgres \
  -e POSTGRES_USER=lerevenu \
  -e POSTGRES_PASSWORD=lerevenu_dev_pw \
  -e POSTGRES_DB=lerevenu \
  -p 5433:5432 \
  -v lerevenu_pgdata:/var/lib/postgresql/data \
  postgres:16-alpine
```

Environment:

```bash
cp apps/cms/.env.example apps/cms/.env
cp apps/web/.env.example apps/web/.env.local
```

Fill in `apps/cms/.env`'s secrets — each `APP_KEYS` entry and every
`*_SALT`/`*_SECRET`/`ENCRYPTION_KEY` needs a unique random value:

```bash
node -e "console.log(require('crypto').randomBytes(16).toString('base64'))"
```

Run that once per secret (four times for `APP_KEYS`). `DATABASE_*`
defaults already match the `docker run` command above (port `5433`).

## Run

```bash
npm run dev
```

Boots both apps: Next.js on <http://localhost:3000>, Strapi admin on
<http://localhost:1337/admin>.

```bash
npm run dev:web   # apps/web only
npm run dev:cms   # apps/cms only
```

Other commands: `npm run lint`, `npm run typecheck`, `npm run build`,
`npm run format` — all run across both workspaces.

## Docker (one-command alternative)

```bash
npm run docker:up
```

Builds and runs Postgres, Strapi, and Next.js together via
`docker-compose.yml` — no local Node/Postgres install needed. Next.js on
<http://localhost:3000>, Strapi admin on <http://localhost:1337/admin>,
Postgres exposed on `5434` (kept off the default `5432`/`5433` so it
can't collide with a native Postgres or the dev container above). First
boot seeds nothing — run `npm run docker:seed` once the stack is healthy.
`npm run docker:down` stops it. The secrets baked into `docker-compose.yml`
are intentionally fake placeholders for this throwaway local stack, same
spirit as `.env.example`'s `changeme` values — never meant to back a real
deployment; override any of them via a root-level `.env` if you need to.

## Test

```bash
npm test
```

Runs both workspaces. `apps/cms`: Jest + Supertest against a disposable
SQLite database (wiped before every run), covering input validation,
author-spoofing defense, and the home feed's pagination/sort/filter query
params. Production stays Postgres-only — SQLite is a test-speed trade-off,
not a second supported deployment target.

`apps/web`: Vitest + Testing Library — `DiscussionFeed` (card list, empty
state, pending skeleton), `DiscussionForm` (client-side validation, server
field-error mapping), and `useCreateReply`'s optimistic update/rollback.

### E2E (Playwright, bonus)

```bash
npx playwright install chromium   # once
npm run test:e2e
```

One happy-path spec (`e2e/happy-path.spec.ts`): log in as a seeded demo
user, create a discussion, land on its detail page, post a reply, confirm
it appears without a page reload. Boots Strapi and Next.js itself if
they're not already running (reuses them if they are).

## Demo accounts

```bash
npm run seed
```

Idempotent — safe to run again on the same database, won't duplicate
categories, users, discussions, or replies. Seeds 7 categories and 56
sample discussions (14 hand-written with replies, 42 generated — enough
volume to actually exercise the home feed's infinite scroll) across 5
demo users, all sharing the password below:

| username | password |
|---|---|
| vincent_etf | Demo1234! |
| papyboursier | Demo1234! |
| odile_retraite | Demo1234! |
| sophie_invest | Demo1234! |
| karim_immo | Demo1234! |

Log in with any of these at `/login` (identifier is the username), or
create a new account from the same popup — self-service registration
isn't in the brief, but it's a small, already-public Strapi endpoint
(`/api/auth/local/register`), added on request.

## Architecture decisions

- Next.js never talks to Postgres directly. Every read and write goes
  through Strapi's REST API via one typed client
  (`apps/web/src/lib/strapi/`).
- Public URLs use Strapi v5's `documentId`, not the numeric `id` — stable
  across drafts/locales, and the identifier Strapi itself expects for
  public-facing use.
- Draft & publish is off on every content type. No moderation workflow is
  needed here, and leaving it off keeps every read and permission rule
  single-path.
- `repliesCount` is denormalized on Discussion, kept in sync by a Reply
  lifecycle hook — the home feed's hot path stays a flat query instead of
  counting relations per row.
- The session JWT lives in an httpOnly cookie, set server-side by a
  Server Action that proxies Strapi's `/api/auth/local`. Unreadable by an
  injected script, unlike `localStorage`.
- Server Components render the first paint of every page; TanStack Query
  takes over inside two Client Component islands (the home feed, the
  reply thread) for everything after that — filtering without a reload,
  optimistic replies — without shipping the Strapi base URL or token to
  the client bundle.
- Zustand holds exactly two bits of state that have no server
  representation (session echo for nested components, a toast queue).
  Everything else is either in the URL or in TanStack Query's cache.
- Reading the session cookie happens in exactly one place
  (`app/SessionBoundary.tsx`), wrapped in its own `<Suspense>` instead of
  in the root layout directly — Next 16's Cache Components treats a
  runtime cookie read as blocking prerendering for whatever subtree
  touches it, and the layout wraps every route.
- The home feed's filter/sort state syncs to the URL via
  `window.history.replaceState` directly, not `next/navigation`'s router —
  `router.replace` triggers a soft RSC re-render, which would hit the
  server on every filter change and defeat the point of routing filtering
  through TanStack Query + the Route Handler instead.
- Design tokens live in `globals.css`'s `@theme inline` block, not a
  `tailwind.config.ts` — Tailwind v4 is CSS-first config, and
  `create-next-app` never generated a JS config file for this project.
- The discussion detail page's existence-check (`getDiscussion` +
  `notFound()`) deliberately stays outside any `<Suspense>` boundary,
  unlike the home feed — once a Suspense fallback's `200` shell has
  streamed, a later `notFound()` can't change the status code anymore,
  only the body. A real `404` for an unknown discussion matters more than
  this one route's static-shell optimization.
- Discussion/reply bodies render through a small hand-rolled markdown-lite
  (`**bold**` + `- ` lists only, ported from the mockup) via
  `dangerouslySetInnerHTML` — safe here because the renderer escapes the
  input first and only ever reintroduces a fixed, attribute-less set of
  tags around already-escaped text, never raw user HTML.
- Same rule, one call further: `/discussions/new`'s auth guard
  (`redirect()` to `/login` when logged out) also stays outside Suspense
  — a `redirect()` fired after a Suspense fallback's `200` shell has
  streamed only becomes a client-side script-tag redirect, not a real
  HTTP redirect. Confirmed with `curl`, which otherwise saw a `200` with
  the login page's markup inlined into the guarded route's response.
- `getMe` is wrapped in React's `cache()` (request-scoped, not Next's data
  cache) — both `Header` and `SessionBoundary` independently derive the
  session from the same cookie every render; without it they'd each hit
  Strapi once per request for identical data.
- `/login` is a real route styled as a popup, not a true overlay-over-
  any-page modal — the server-side route guards (`redirect('/login?
  next=...')`) need an actual URL to send people to, and a real client-
  side modal would mean reworking those guards into something client-side
  instead.
- Zod validates every Strapi response at the `lib/strapi` boundary — a
  backend contract break becomes a loud parse error there instead of an
  `undefined.map is not a function` several components deep. `qs` builds
  the query strings — Strapi's bracket syntax for nested `filters`/
  `populate`/`fields` is error-prone to hand-write with string
  concatenation.
- Local dev Postgres runs in a disposable Docker container rather than
  reusing the machine's existing cluster — keeps this project's data
  isolated from anything else on the box.
- Strapi's test suite runs against SQLite (`better-sqlite3`), not the dev
  Postgres container — same query layer either way, zero external service
  needed to run `npm test`. Jest + `ts-jest` + Supertest: the natural fit
  for a TypeScript Strapi app and the stack Strapi's own community docs
  point to for API testing.
- Next.js tests use Vitest + Testing Library, not Jest — Vite's native ESM
  means no transform config to fight for a project that's already
  App-Router/Server-Component-first, and it's the pairing Next's own docs
  recommend over Jest for exactly this stack.
- "Utile" votes have no un-vote: a `Vote` row is created once (`user` +
  exactly one of `discussion`/`reply`, plus a `voteKey` Strapi already
  enforces as unique), no `update`/`delete` permission is granted to any
  role. `usefulCount` on Discussion/Reply is denormalized the same way as
  `repliesCount` — a lifecycle hook recomputes it from a `count()`, not a
  blind increment, so a missed event can't drift it permanently.
- Best answer is a dedicated controller action
  (`POST /api/replies/:documentId/best-answer`), not a core `update` —
  `update`/`delete` stay disabled on Reply everywhere else. The action
  checks the caller is the *discussion's* author (not the reply's) and
  unsets any other reply's flag on the same discussion first, so at most
  one best answer ever exists per discussion.
- Both Dockerfiles build from the repo root, not `apps/web`/`apps/cms` —
  npm workspaces need the root `package.json`/lockfile present to resolve
  either app's deps. `apps/web` builds with Next's `output: 'standalone'`;
  `apps/cms` runs `strapi build` once at image-build time and serves the
  compiled `dist/` via `strapi start`, never `strapi develop` inside a
  container that's supposed to just run.

## What I would do next

All four core flows from the brief are built: Strapi (content types,
relations, permissions, idempotent seed data, automated tests) and
Next.js (data layer, home feed, discussion detail with optimistic
replies, create-discussion with client+server validation, login/logout
with route guards and a session-aware header), each with its own test
suite green. The throwaway debug page from Phase 5
(`apps/web/src/app/debug/`) has been deleted — everything it was
proving has a real page covering it now.

All bonuses from PLAN.md §6 are done: pagination, search, "Utile"
votes, best-answer marking, a user profile page, Playwright E2E
coverage (one happy-path spec — see the Test section above), and Docker
Compose. `npm run docker:up` boots a verified-working stack — both
images build clean and a full `docker compose up` + seed + home-feed
render was confirmed end to end. The two Alpine-native-binding gotchas
that blocked it (`@next/swc` and Tailwind v4's `@tailwindcss/oxide`
both needed their musl variant installed by exact package name — see
PLAN.md §6 B6) are now just comments in `apps/web/Dockerfile`, not open
questions.

## License

All rights reserved — see [`LICENSE`](./LICENSE). This code is shared with
Le Revenu solely for evaluation as part of a hiring process; it is not
open source and no reuse/redistribution is licensed beyond that.
