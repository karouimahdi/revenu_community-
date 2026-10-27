# syntax=docker/dockerfile:1
#
# Build context is the repo root (npm workspaces need the root manifest +
# lockfile), not apps/web — see docker-compose.yml's build.context.

FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /repo

FROM base AS deps
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/package.json
COPY apps/cms/package.json apps/cms/package.json
# --libc/--os/--cpu did nothing here (silently ignored) — both @next/swc
# and @tailwindcss/oxide need their musl binary installed by name instead.
RUN npm ci --workspace=apps/web && \
    npm install --workspace=apps/web --no-save \
      @next/swc-linux-x64-musl \
      @tailwindcss/oxide-linux-x64-musl

FROM deps AS build
COPY apps/web apps/web
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build --workspace=apps/web

# `output: 'standalone'` nests the bundle under apps/web/ because Next
# detects the npm-workspaces root above it — see next.config.ts.
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
COPY --from=build --chown=node:node /repo/apps/web/.next/standalone ./
COPY --from=build --chown=node:node /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=node:node /repo/apps/web/public ./apps/web/public
USER node
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
