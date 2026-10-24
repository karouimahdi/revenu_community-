# Communauté Le Revenu

Forum-style community space for Le Revenu readers: discussions, replies,
categories. Next.js (App Router) frontend, Strapi v5 + PostgreSQL backend.
Take-home technical test.

Status: Phase 0 (scaffolding) complete. Content types, auth, and the
actual pages land in the phases below.

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

Not wired yet. Lands with the test phases: Jest + Supertest against a
running Strapi instance on a disposable SQLite DB for the API, Vitest +
Testing Library for the frontend.

## Demo accounts

Not available yet — lands with the seeding phase, alongside sample
categories and discussions. Credentials will be listed here once seeded.

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

## What I would do next

Remaining core work: Strapi content types and relations, permissions
locked down server-side (unauthenticated users can't publish, nobody can
publish as someone else), idempotent seeding, then the four pages — home
feed with category filter and date sort, discussion detail with replies,
create-discussion form with server-side validation, login with seeded
demo users.

After that, in priority order if time allows: pagination, search, "Utile"
votes and best-answer marking, a user profile page, Playwright E2E
coverage, Docker Compose for a one-command local run.

## License

All rights reserved — see [`LICENSE`](./LICENSE). This code is shared with
Le Revenu solely for evaluation as part of a hiring process; it is not
open source and no reuse/redistribution is licensed beyond that.
