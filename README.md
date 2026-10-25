# Communauté Le Revenu

Forum-style community space for Le Revenu readers: discussions, replies,
categories. Next.js (App Router) frontend, Strapi v5 + PostgreSQL backend.
Take-home technical test.

Status: content types, permissions, and seed data are in place on the
Strapi side. Frontend pages land in the phases below.

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
  through Strapi's REST API via one typed client (`apps/web/lib/strapi/`).
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
idempotent seed data, and an automated test suite. Remaining core work is
the four Next.js pages — home feed with category filter and date sort,
discussion detail with replies, create-discussion form with server-side
validation, login with the seeded demo users.

After that, in priority order if time allows: pagination, search, "Utile"
votes and best-answer marking, a user profile page, Playwright E2E
coverage, Docker Compose for a one-command local run.

## License

All rights reserved — see [`LICENSE`](./LICENSE). This code is shared with
Le Revenu solely for evaluation as part of a hiring process; it is not
open source and no reuse/redistribution is licensed beyond that.
