# syntax=docker/dockerfile:1
#
# Build context is the repo root (npm workspaces need the root manifest +
# lockfile), not apps/web — see docker-compose.yml's build.context.

FROM node:22-alpine AS base
# Next's native SWC binary is glibc-built; Alpine's musl libc can't load it
# without this compat shim — Next's own Docker example applies the same fix.
RUN apk add --no-cache libc6-compat
WORKDIR /repo

FROM base AS deps
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/package.json
COPY apps/cms/package.json apps/cms/package.json
RUN npm ci --workspace=apps/web

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
