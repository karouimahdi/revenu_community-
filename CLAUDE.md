# CLAUDE.md — Communauté Le Revenu

Forum-style community for Le Revenu: Next.js (App Router) frontend, Strapi
v5 backend, PostgreSQL. Take-home technical test — read `PLAN.md` first,
it's the actual spec (brief analysis, schemas, roadmap, test cases). This
file is the standing rules that keep every session consistent with it.

---

## Repo map

```
apps/web/                  Next.js App Router, TypeScript, Tailwind (code lives under src/)
  src/app/api/               Route Handlers — proxy browser → lib/strapi, read the httpOnly cookie
  src/app/Providers.tsx      'use client' — QueryClientProvider only, per-request QueryClient
  src/app/SessionBoundary.tsx  server, async — the one place that reads the session cookie,
                                 Suspense-wrapped in layout.tsx (Cache Components: a runtime
                                 read at the layout root would make every route dynamic)
  src/app/SessionSync.tsx    'use client' — hydrates useSessionStore from SessionBoundary's value
  src/app/Header.tsx         server; session-aware via a small async sub-component in its own
                                 local Suspense boundary, not the whole header
  src/app/actions.ts         logoutAction — shared, not colocated with /login (used by Header)
  src/app/page.tsx           home page — Server Component shell, Suspense-wrapped data fetch
  src/app/DiscussionFeed.tsx 'use client' — the filter/sort/card-list island (§4.2/§4.4)
  src/app/DiscussionCard.tsx, FeedSkeleton.tsx  home-page-only, colocated rather than shared
  src/app/discussions/[documentId]/  detail route — DiscussionPost (server, static),
                                 ReplyThread/ReplyForm/ReplyCard (client), RepliesSkeleton
  src/app/discussions/new/   create-discussion route — auth guard + redirect() stay outside
                                 Suspense (see the Next.js gotchas checklist below)
  src/app/login/             login route, styled as a popup (AuthModal) — toggles between
                                 LoginForm and SignupForm (real registration, added beyond the
                                 brief); both set the httpOnly cookie via a Server Action
  src/components/            shared across ≥2 routes: Avatar, CategoryTag, EmptyState,
                              ErrorState, Skeleton, Prose, Toaster
  src/hooks/                 useDiscussions, useDiscussion, useReplies, useCreateReply, useSession, useToast
  src/stores/                useSessionStore, useToastStore (Zustand)
  src/lib/strapi/            server-only — the only place that calls Strapi over HTTP
  src/lib/queryKeys.ts       TanStack Query key factory
  src/lib/apiFetch.ts        browser-side fetch helper for Route Handler calls (hooks only)
  src/lib/session.ts         SESSION_COOKIE_NAME — single source of truth for the cookie name
  src/lib/relativeDate.ts    ported from the mockup's ago() util
  src/lib/formatBody.ts      ported from the mockup's formatBody() — **bold** + `- ` lists only
apps/cms/             Strapi v5, TypeScript, PostgreSQL
package.json          npm workspaces root — orchestrates both apps
```

`apps/web/lib/strapi/` is the *only* place that talks to the Strapi REST
API — called from Server Components, Server Actions, **and** the Route
Handlers in `app/api/`, never bypassed by any of them. `apps/cms/src/api/*`
is the *only* place with business logic and DB access.

---

## Commands

```bash
npm install                 # once, at repo root — installs both workspaces
npm run dev                  # boots apps/web + apps/cms together (concurrently)
npm run dev:web              # apps/web only
npm run dev:cms              # apps/cms only
npm run seed                 # idempotent demo data — categories, users, discussions, replies
npm test                     # runs tests in both workspaces
npm run lint                 # both workspaces
npm run typecheck            # both workspaces
npm run build                 # both workspaces
npm run docker:up            # bonus — web + cms + postgres via docker-compose
```

---

## Git rules (strict)

- **NEVER** run `git commit`, `git push`, `git tag`, `git rebase`,
  `git reset --hard`, or any other history-changing command. The user
  commits and pushes themselves, always.
- Read-only git commands (`git status`, `git diff`, `git log`) are fine to
  run freely.
- At the end of a phase (or any discrete unit of work): propose a commit
  message (conventional commits, imperative mood, max 72 chars) and list
  the files to stage. Do not stage them.
- Never add `Co-Authored-By`, `Generated with`, or any tool attribution
  anywhere — commit messages, PR text, code, README.
- Never create or modify a **tracked** file that mentions Claude,
  Anthropic, or AI tooling — README, `package.json`, source comments,
  docs. `PLAN.md` and `CLAUDE.md` are gitignored specifically so this file
  and the planning doc can talk about the AI-assisted workflow freely
  without that leaking into what gets pushed; every other tracked file
  stays clean of it.

---

## Architecture rules (MUST / MUST NOT)

- Next.js **MUST NOT** import `pg`, any Postgres driver, or any ORM. It
  **MUST NOT** become a parallel business backend — no business validation
  lives in Next.js that isn't also enforced in Strapi; client-side checks
  are UX only, never the actual guard.
- Every Strapi call from Next.js **MUST** go through `apps/web/lib/strapi/`.
  No raw `fetch()` to a Strapi URL anywhere else — TanStack Query's
  `queryFn`/`mutationFn` **MUST** call a Route Handler (`app/api/...`),
  never `STRAPI_URL` directly; a Client Component fetching Strapi straight
  from the browser means the JWT and the base URL both had to leave the
  server.
- TanStack Query **MUST** own server state (anything from Strapi); Zustand
  **MUST** own only the client-only UI state with no server representation
  (currently: session echo, toast queue) — don't mirror one fact into both.
- `QueryClient` **MUST** be created per-request in `app/providers.tsx`
  (`useState(() => new QueryClient())`), never a module-level singleton
  (leaks cached data across concurrent users). Zustand stores **MUST NOT**
  be read or written during server rendering — Client Component /
  post-hydration only; the session store is *seeded* from a server-read
  cookie but lives entirely client-side.
- `author` on Discussion/Reply **MUST** be set from `ctx.state.user.id` in
  the Strapi controller, server-side, every time — never trust a
  client-sent `author`, even to validate it. Overwrite, don't just reject.
- Public URLs and any frontend-stored reference to a Discussion **MUST**
  use `documentId`, never the numeric `id`.
- Populating `author` on any response **MUST** carry an explicit
  `fields: ['username']` — never a bare `populate: ['author']`.
- Permissions **MUST** be set by the bootstrap script
  (`apps/cms/src/index.ts`), not by clicking through the Strapi admin. The
  admin UI is for inspecting state, not the source of truth for it.
- Use the **Document Service API** (`strapi.documents(...)`) for custom
  business operations. Don't use `strapi.entityService` — deprecated in v5.
- `.env.example` **MUST NOT** contain real secrets. Demo user passwords are
  fixtures, not secrets — they're documented in `README.md`, not `.env`.

---

## Coding conventions

- TypeScript `strict: true` in both apps. No `any` — if a Strapi response
  shape is genuinely unknown, model it with a Zod schema and let that be
  the boundary, not an `any` escape hatch.
- UI copy is **French**, matching the mockup's tone and vocabulary (e.g.
  "Publier", "Répondre", relative dates like "il y a 2 h" / "hier"). Code —
  identifiers, comments, commit messages — is **English**.
- Component/file naming: PascalCase components (`DiscussionCard.tsx`), one
  component per file, colocated with the route that owns it unless shared
  across ≥2 routes (then it moves to `apps/web/components/`).
- Tailwind only — no separate CSS files except the one global stylesheet
  that defines the design tokens from `PLAN.md` §4.8. No inline `style={}`
  except for genuinely dynamic values Tailwind can't express (e.g. an
  avatar's generated background color).
- Server Component shells by default; a subtree only becomes a Client
  Component island when it needs state, an effect, a browser API, or
  TanStack Query — not because it's "interactive-feeling" in the mockup,
  and not the whole page just because one piece of it needs to be a
  Client Component. See `PLAN.md` §4.2/§4.4 for the per-component
  reasoning already worked out — don't re-litigate it per feature.

---

## Comments and writing style

- Default to **no comments**. Code explains itself through naming and
  small functions.
- Write a comment only when it explains **why** something non-obvious is
  done — a Strapi v5 quirk, a security reason, a workaround with a link to
  the issue. Never explain *what* the code does.
- **Two physical lines, max, per comment.** If it needs more, the real fix
  is usually a better name or a smaller function, not a longer comment.
- Forbidden comment patterns:
  - restating the code (`// fetch discussions`, `// return the result`)
  - section banners (`// ===== Helpers =====`)
  - tutorial tone (`// Here we...`, `// Now let's...`, `// This function is
    responsible for...`)
  - change narration (`// Updated to...`, `// Fixed bug where...`, `// New:`)
  - filler adjectives (robust, seamless, comprehensive, ensure, leverage)
  - TODOs without a concrete reason
- No JSDoc on obvious functions. JSDoc only on exported utilities whose
  contract isn't obvious from types.
- No emojis — anywhere: code, comments, logs, README, commit messages.
- Error messages shown to users are in **French**, concise, and match the
  mockup's tone (see `PLAN.md` for the mockup's copy patterns).
- README stays short and factual, written like a developer's own notes:
  setup, run, test, demo accounts, architecture decisions (one or two
  lines each, no file-link citations — it must stand alone), what's next.
  No marketing tone, no "This project leverages...".
- Before finishing a phase: re-read the diff and delete any comment that
  fails the rules above.

---

## Strapi v5 gotchas checklist

Check these before trusting memory or an old (v4) example — see `PLAN.md`
§7 for the full writeup:
- [ ] Response is flattened (`{ id, documentId, title }`), not nested under
      `data.attributes`.
- [ ] `documentId` (string) vs numeric `id` — public-facing always
      `documentId`.
- [ ] `strapi.documents(...)`, not `strapi.entityService`.
- [ ] Default permission-denial is `403` — no token and an insufficient
      role both land here. `401` is only a present-but-invalid token; no
      custom policy can change this (confirmed: `authorize` runs before any
      policy in the route pipeline).
- [ ] users-permissions sanitization strips password/token by default —
      doesn't guarantee email is hidden; allowlist `fields` anyway.
- [ ] Policies can't mutate the request (boolean gate only); author
      injection belongs in the controller.
- [ ] Writing a relation requires `find` on *that relation's target type*,
      regardless of the route's own permissions — grant it or the write
      400s with `Invalid key <field>`.
- [ ] `QueryClient` is per-request (`useState` in `app/Providers.tsx`) and
      Zustand stores (`stores/`) are Client-Component-only — neither ever
      lives at module scope or touches a server render.

## Next.js 16 / Cache Components gotchas checklist

Found the hard way across Phases 5–9 — see `PLAN.md` §7 for the full
writeup:
- [ ] A page/layout component that `await`s `cookies()`, `headers()`,
      `searchParams`, or `params` directly in its own body — instead of
      passing the promise down and awaiting it inside a `<Suspense>`-
      wrapped child — blocks the whole route from prerendering. Dev-only
      console warning, not a type error, easy to miss.
- [ ] That rule has one exception, confirmed twice (`notFound()` in Phase
      7, `redirect()` in Phase 9 — same failure, not `notFound()`-specific):
      if a call changes the HTTP response itself — status code, a
      redirect — keep it **outside** Suspense. Once a Suspense fallback's
      `200` shell has streamed, `notFound()`/`redirect()` thrown later can
      only swap the *body* (or, for `redirect()`, fall back to an
      invisible-to-`curl` client-side script-tag redirect) — never the
      already-sent status/headers. Confirmed both times by checking the
      actual HTTP response with `curl`, not by trusting the rendered HTML.
- [ ] `next typegen` (or `next dev`/`build`) must run at least once before
      `tsc` knows about `RouteContext<'...'>`/`PageProps<'...'>` for any
      route — `apps/web`'s `typecheck` script already does this
      (`next typegen && tsc --noEmit`), don't drop it.

---

## Workflow rules

- Work **one roadmap phase at a time** (`PLAN.md` §6). Don't start Phase
  N+1 before Phase N's definition of done is actually met.
- Before declaring a phase done: run its DoD command(s) for real — `npm
  run typecheck`, `npm test` — don't report success from reading the code.
- After a phase lands, check its box in `PLAN.md` §6. If a decision changes
  mid-build (a field, a route, an auth detail), update the relevant section
  of `PLAN.md` in the same change — it must stay accurate, not just the
  roadmap checkboxes.
- Never commit secrets. `.env` is gitignored; only `.env.example` is
  tracked, and it's a template, not a backup.
- **Adding a dependency**: ask first; when approved, add one sentence to
  `README.md`'s architecture-choices section justifying it (see `PLAN.md`
  §4.3/§4.4 for the bar each existing dependency clears).
- One phase's worth of work per logical commit, not one giant commit at
  the end — but see Git rules above: propose the conventional-commit
  message (`feat:`, `fix:`, `test:`, `chore:`, `docs:`) and the file list,
  never run `git commit` directly.
- Bonuses (`PLAN.md` §6, after Phase 11) are not started until Phase 11's
  fresh-clone hardening check actually passes.

---

## Definition of done (any feature)

1. Matches the relevant `PLAN.md` section — schema, permissions, component
   split, as planned (or `PLAN.md` was updated first if the plan changed).
2. Business validation enforced in Strapi, independent of whatever the
   frontend also checks.
3. Loading, error, and empty states handled if the feature renders data.
4. `npm run typecheck` and `npm run lint` clean in every touched workspace.
5. Relevant tests written and passing (`npm test`) — at minimum the cases
   already named for that feature in `PLAN.md` §5.
6. No secret, token, or real credential anywhere in a tracked file.
