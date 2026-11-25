# VibeCare

**A student-wellbeing product prototype that brings planning, reflection, peer connection, and AI-guided check-ins into one gentle daily experience.**

> VibeCare is a portfolio prototype, not a medical product, therapist, crisis service, or substitute for professional care.

![VibeCare landing page](docs/images/vibecare-hero.png)

## Case study

University life asks students to manage academic pressure, personal routines, social connection, and emotional wellbeing across tools that rarely speak to one another. VibeCare explores a more coherent experience: a calendar-first workspace where lightweight mood reflection and support appear in the context of a student's actual day.

The project began as a rapid collaborative build. This repository is a carefully reconstructed portfolio edition for presentation use: the strongest product direction is preserved, duplicate experiments and exposed configuration are removed, and the implementation is documented with clearer safety and privacy boundaries.

### My role

**Product Designer + Frontend Developer**

- Lead the brainstorming and shaped the product concept and key user flows.
- Designed and implemented the responsive React interface.
- Integrated mood reflection, planning, avatar rewards, and AI-assisted experiences.
- Reworked the original prototype into a safer, reproducible portfolio repository.

### Collaboration

VibeCare was created with 3 teammates.

The original collaboration and commit record are available in [vibe-care-buddy](https://github.com/tyh007/vibe-care-buddy).

## What this is

VibeCare is a React + TypeScript frontend backed by a local Hono + SQLite API. It started as a Supabase-backed collaborative prototype and was rebuilt into a self-contained, single-machine product: there is no third-party service required to run it.

The product covers three pillars:

1. **Calendar + mood reflection** — log a daily check-in (1–5 mood + wellness metrics), see trends, and connect the data to your calendar.
2. **Peer connection** — a community room with automated (deterministic) safety moderation and live updates.
3. **AI-guided conversations** — a supportive "Vibe Partner" companion and a CBT-informed reflection tool. These use deterministic templates by default. The API also supports an optional remote provider.

## Architecture

```
Browser (Vite dev server or static host)
   |
   |  fetch + EventSource
   v
Hono API service  (Node 22+ TS, port 8787)
   |-- /api/auth, /api/profile, /api/moods, /api/events,
   |   /api/notes, /api/community, /api/shop, /api/inventory,
   |   /api/settings, /api/health
   |-- SSE:  /api/community/stream
   |-- AI:   /api/ai/partner, /api/ai/cbt, /api/ai/moderate
   |
   |-- AI adapter layer (Template by default, Remote if user opts in)
   |
   v
SQLite file  server/data/vibecare.db  (better-sqlite3, WAL)
```

In development, Vite proxies `/api/*` to the Hono server on port 8787. In production (`pnpm build` + Docker), the Hono server serves both the API and the static client on a single port.

## Prerequisites

- Node.js 22.13 or newer
- pnpm 11.7.0, pinned in `package.json`

## Run locally

```bash
git clone https://github.com/tyh007/vibecare.git
cd vibecare
pnpm install

# 1. Configure the server
cp server/.env.example server/.env
# Edit server/.env — at minimum AUTH_SECRET and AI_KEY_PASSPHRASE need real values.

# 2. Start both the API server and the Vite dev server
pnpm dev
```

Open `http://127.0.0.1:5180` (Vite). API requests are proxied to `http://127.0.0.1:8787`.

`pnpm dev` runs both servers concurrently with `concurrently`. To run them separately:

```bash
pnpm dev:server   # tsx watch on server/src/index.ts
pnpm dev:web      # vite
```

## Run with Docker

```bash
docker compose up --build
```

This builds the multi-stage `Dockerfile`, copies the compiled server + client into a `node:22-alpine` runtime image, and serves everything from one container on port `8787`. SQLite and per-user AI-key material persist in `./server/data/` via the mounted volume.

Required env (set these in your shell before `docker compose up`):

```bash
export AUTH_SECRET="$(openssl rand -base64 48)"
export AI_KEY_PASSPHRASE="$(openssl rand -base64 48)"
```

`docker compose` will refuse to start if either is unset.

## Configure the AI provider

The default AI layer is **deterministic** — replies come from a set of curated templates (`server/src/ai/template.ts`) driven by keyword matching and a small banned-word list for moderation. Crisis-language detection runs locally against 6 regex patterns lifted from the original prototype's safety logic and is documented in `server/src/ai/crisis.ts`.

Remote configuration is currently available through the authenticated settings API. The server stores provider credentials through `PUT /api/settings/ai-key` and selects the adapter through `PUT /api/settings`. Provider keys are encrypted at rest.

If a remote call fails (network, bad key, gateway error), the server falls back to the template adapter and `POST /api/ai/moderate` returns `{ moderationUnavailable: true }` — the original prototype's degraded-mode semantic.

## Environment variables

### Server (`server/.env`)

| Variable | Required | Purpose |
| --- | --- | --- |
| `PORT` | no (default `8787`) | Bind port |
| `HOST` | no (default `127.0.0.1`) | Bind address. The Docker image listens on `0.0.0.0` inside the container. |
| `AUTH_SECRET` | **yes** | HS256 JWT signing secret. `openssl rand -base64 48` |
| `AI_KEY_PASSPHRASE` | **yes** | AES-256-GCM passphrase for encrypting AI provider keys at rest |
| `DB_PATH` | no | SQLite file path (relative to `server/`). Default `./data/vibecare.db` |
| `LOG_LEVEL` | no | One of `trace`, `debug`, `info`, `warn`, `error` |
| `STATIC_DIR` | production only | Absolute path to the built Vite `dist/` to serve |

### Client (root `.env`)

| Variable | Required | Purpose |
| --- | --- | --- |
| `VITE_API_BASE_URL` | no | Default `/api`. Set only if you proxy the API elsewhere. |
| `VITE_MAPBOX_TOKEN` | no | Optional. Enables the location visualization in the Mood Dashboard. |

## Quality checks

```bash
pnpm typecheck    # client + server
pnpm lint
pnpm test         # server tests (Vitest)
pnpm build        # client + server (production)
pnpm check        # all of the above, in order
```

## Dependency checks

The lockfile retains the portfolio dependency updates and the patched selector-parser override. Run `pnpm audit` to inspect the current advisory report. The earlier portfolio audit recorded [an unresolved advisory in the Tailwind build pipeline](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).

## Project layout

```
.
├── server/                  # @vibecare/server — Hono + SQLite API
│   ├── src/
│   │   ├── ai/              # ServerAiAdapter + template + remote + crisis regex
│   │   ├── auth/            # JWT, password hash, middleware, settings secrets
│   │   ├── db/              # client.ts + schema.sql + seed.ts
│   │   ├── realtime/        # SSE hub + streaming helper
│   │   ├── resources/       # auth/profile/moods/events/notes/community/shop/...
│   │   ├── util/errors.ts   # AppError + ZodError → 400
│   │   └── index.ts         # Hono app entry
│   ├── test/                # Vitest + supertest suites
│   ├── scripts/copy-assets.mjs
│   ├── data/                # SQLite + AI-key files (gitignored)
│   └── .env.example
├── src/
│   ├── auth/                # AuthProvider, AuthGuard, useAuth, tokenStore
│   ├── components/          # UI primitives + feature components
│   ├── data/                # cross-cutting constants (e.g. CBT_GREETING)
│   ├── hooks/               # useAuth, useEventSource, useRewardSystem
│   ├── pages/               # top-level route components
│   └── services/            # API service layer (auth, profile, moods, ...)
├── Dockerfile
├── docker-compose.yml
├── .github/workflows/ci.yml # typecheck + lint + test + build on every PR
└── pnpm-workspace.yaml
```

## Safety & privacy

- Server-side JWT auth. Sessions are revocable (a `revoked` flag in the `sessions` table is checked on every request).
- All ownership rules previously enforced by Supabase Row Level Security are now enforced by `requireUser` + `assertOwner` on every protected route, with CHECK constraints in SQLite as belt + braces.
- Per-user AI provider keys are encrypted at rest using AES-256-GCM. The encryption passphrase is derived from `AI_KEY_PASSPHRASE` and never sent to the client.
- AI moderation is **deterministic and offline by default**. The crisis regex set is documented in `server/src/ai/crisis.ts`. When remote AI is enabled, fallback to the template adapter preserves availability.
- Product copy and the community-room safety banner avoid unsupported claims about confidentiality, encryption, credentials, diagnosis, treatment, or guaranteed crisis detection.

**For crisis support in the United Kingdom, contact [NHS 111](https://www.nhs.uk/nhs-services/mental-health-services/where-to-get-urgent-help-for-mental-health/) and select the mental health option where available, or call [Samaritans](https://www.samaritans.org/) free on 116 123 for 24/7 emotional support. For immediate danger, call 999 or go to A&E. Outside the U.K., use an appropriate local crisis service.**

## Limitations

- No OAuth, magic links, or SSO — email + password only.
- No native mobile app.
- No internationalization.
- No Mapbox-backed features beyond the optional location visualization in the Mood Dashboard.
- The `supabase/` directory documents the original hosted prototype. The self-hosted runtime uses `server/src/db/schema.sql` and the routes in `server/src/resources/`.

## Status and usage

This repository is published for portfolio review and technical discussion. No open-source license has been added because contributor authorization has not yet been confirmed. All rights remain with the respective contributors unless a license is added later.
