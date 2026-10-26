# syntax=docker/dockerfile:1
#
# Build context is the repo root (npm workspaces need the root manifest +
# lockfile), not apps/cms — see docker-compose.yml's build.context.

FROM node:22-alpine AS base
WORKDIR /repo

FROM base AS deps
COPY package.json package-lock.json ./
COPY apps/cms/package.json apps/cms/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm ci --workspace=apps/cms

FROM deps AS build
COPY apps/cms apps/cms
RUN npm run build --workspace=apps/cms

FROM base AS runner
ENV NODE_ENV=production
COPY --from=build --chown=node:node /repo/node_modules ./node_modules
COPY --from=build --chown=node:node /repo/apps/cms ./apps/cms
WORKDIR /repo/apps/cms
USER node
EXPOSE 1337
CMD ["npm", "run", "start"]
