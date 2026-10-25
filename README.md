# Communauté Le Revenu

Forum-style community space for Le Revenu readers: discussions, replies,
categories. Next.js (App Router) frontend, Strapi v5 + PostgreSQL backend.
Take-home technical test.

Status: the Strapi side is done (content types, permissions, seed data,
tests). On the Next.js side, the data layer, home feed, and discussion
detail (with replies) are done; create-discussion and login land next.

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

## Test

```bash
npm test --workspace=apps/cms
```

Jest + Supertest against a disposable SQLite database (wiped before every
run), covering input validation, author-spoofing defense, and the home
feed's pagination/sort/filter query params. Production stays Postgres-only
— SQLite is a test-speed trade-off, not a second supported deployment
target.

Next.js side (Vitest + Testing Library) lands with its own test phase.

## Demo accounts

```bash
npm run seed
```

Idempotent — safe to run again on the same database, won't duplicate
categories, users, discussions, or replies. Seeds 7 categories and 14
sample discussions (with replies) across 5 demo users, all sharing the
password below:

| username | password |
|---|---|
| vincent_etf | Demo1234! |
| papyboursier | Demo1234! |
| odile_retraite | Demo1234! |
| sophie_invest | Demo1234! |
| karim_immo | Demo1234! |

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

## What I would do next

The Strapi side is done: content types, relations, permissions
(unauthenticated users can't publish, nobody can publish as someone else),
idempotent seed data, and an automated test suite. On Next.js: the data
layer, the home feed (category filter, date sort, loading/error/empty
states), and discussion detail (post content, replies, optimistic reply
posting with rollback, toasts) are all done. The throwaway debug page
(`apps/web/src/app/debug/`) is still there, pending deletion once
create-discussion and login exist to replace what it's proving. Remaining
core work: create-discussion form with server-side validation, login with
the seeded demo users.

After that, in priority order if time allows: pagination, search, "Utile"
votes and best-answer marking, a user profile page, Playwright E2E
coverage, Docker Compose for a one-command local run.

## License

All rights reserved — see [`LICENSE`](./LICENSE). This code is shared with
Le Revenu solely for evaluation as part of a hiring process; it is not
open source and no reuse/redistribution is licensed beyond that.
