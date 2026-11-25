# Multi-stage build for VibeCare.
#
# Stage 1 (web-build): install full deps, build the client (Vite) and the
#                      server (tsc) so the runtime image doesn't need build
#                      tools or node_modules for the workspace.
# Stage 2 (runtime):   node:22-alpine + only the artifacts + production
#                      server deps. The SQLite database lives on a volume.

FROM node:22-alpine AS web-build
WORKDIR /repo

# Match the pnpm version pinned in package.json.
RUN npm install -g pnpm@11.7.0

# Copy the bits pnpm needs to resolve the workspace.
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* .npmrc ./

# Server + web workspace manifests so deps are resolved before source.
COPY server/package.json ./server/package.json
COPY tsconfig.json tsconfig.app.json tsconfig.node.json ./
COPY components.json postcss.config.js tailwind.config.ts vite.config.ts index.html ./

# Install the entire workspace (dev deps included) once, cache it.
RUN apk add --no-cache python3 make g++ \
    && pnpm install --frozen-lockfile

# Now copy the rest of the source.
COPY server/ ./server/
COPY src/ ./src/
COPY public/ ./public/

# Build client + server.
RUN pnpm --filter @vibecare/server build
RUN pnpm build:web

# Stage 2: runtime image. Only production server deps + the built artifacts.
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN npm install -g pnpm@11.7.0

# Server manifest + production deps only.
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml .npmrc ./
COPY server/package.json ./server/package.json
RUN apk add --no-cache --virtual .build-deps python3 make g++ \
    && pnpm install --prod --frozen-lockfile --filter @vibecare/server... \
    && apk del .build-deps

# Bring in the compiled server and the built client.
COPY --from=web-build /repo/server/dist ./server/dist
COPY --from=web-build /repo/dist ./dist

# SQLite file + AI-key passphrase file live outside the image.
RUN mkdir -p /app/server/data
COPY server/.env.example /app/server/.env.example

EXPOSE 8787
ENV PORT=8787
ENV HOST=0.0.0.0
ENV STATIC_DIR=/app/dist

# Healthcheck relies on /api/health returning JSON.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --quiet --spider http://127.0.0.1:8787/api/health || exit 1

CMD ["node", "server/dist/index.js"]
