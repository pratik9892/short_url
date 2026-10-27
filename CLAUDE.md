# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Shortly, a URL shortener with click analytics and AI dashboard insights.

- `server/`: Express 5 API + BullMQ worker (Node 22, ES modules, MongoDB via Mongoose, Redis via ioredis)
- `client/`: React 19 + Vite SPA (react-router, Google OAuth)
- `docker-compose.yml`: full local stack (mongo, redis, api, worker, web). See `docs/docker.md`.
- Deployment: frontend on Vercel, API + worker in one Render instance (`start:with-worker`), MongoDB on Atlas, Redis on Upstash.

## Commands

```bash
npm run install:all                 # install server + client deps
npm run dev:server                  # API with nodemon (port 3000)
npm run dev:client                  # Vite dev server (port 5173)
npm run worker                      # BullMQ worker (analytics + email queues)
npm test --prefix server            # Vitest
npm test --prefix server -- src/domains/link/link.service.test.js   # single file
npm test --prefix server -- -t "test name"                           # single test by name
npm run test:watch --prefix server  # watch mode
npm run build --prefix client       # production build
npm run lint --prefix client        # oxlint
```

The API and worker need Redis; without it they fail with `ECONNREFUSED 127.0.0.1:6379`. Locally: `docker run -d -p 6379:6379 redis:7-alpine`.

CI (`.github/workflows/ci.yml`) runs server tests and the client build on every PR to `main`.

## Server architecture

Domain-based layout under `server/src/domains/<domain>/` (`link`, `analytics`, `user`, `ai`):

`*.route.js` → `*.validation.js` (Zod, via `middleware/validate.middleware.js`) → `*.contoller.js` → `*.service.js` → `*.repo.js` → `*.model.js`

- Controller filenames are spelled `contoller` in `link`, `analytics` and `user`. Keep the existing spelling when adding to those domains. The exception is `ai/ai.controller.js`.
- The `ai` domain has no repo or model: `ai.config.js` + `ai.service.js` call an OpenAI-compatible chat-completions API (Groq by default; `GROQ_API_KEY`/`OPENAI_API_KEY`, `OPENAI_BASE_URL`).
- Controllers wrap logic in `try/catch` and call `next(error)`. Services throw typed errors from `src/errors/` (all extend `baseError`); `utils/error.util.js` turns them into the JSON response.
- Response shape: `{ status/success, message, error, data }`.
- Routes are mounted under `/api/v1` (`routes/v1/index.js`). `GET /:shortCode` in `app.js` is the redirect.
- `infrastructure/` holds the cross-cutting pieces: Redis link cache (`cache/`), BullMQ queues and workers (`queue/`), and helpers (`utils/`: geoip, user-agent, email).
- The redirect path is cache-aside (Redis, then Mongo) and enqueues the click to `analyticsQueue`; the worker (`src/worker.js`) does the analytics write so the redirect never waits on it.
- `app.set("trust proxy", 1)`: use `req.ip` for client IPs, never raw `X-Forwarded-For`.
- `middleware/rateLimit.middleware.js` is an in-memory fixed-window limiter: counts are per process, not shared across instances.
- Tests sit next to the code as `*.test.js` (Vitest).
- Config comes from env vars via `config/*.config.js`. Document new vars in `server/.env.example`.

### Redis connections (`config/redis.config.js`, see `server/docs/redis-flow.md`)

- `REDIS_URL` takes priority over `REDIS_HOST`/`REDIS_PORT`; Upstash URLs are upgraded to TLS automatically.
- BullMQ uses `REDIS_CONNECTION` (`maxRetriesPerRequest: null`); each worker gets its own `redisDuplicate()`.
- The link cache uses `createCacheClient()`, which fails fast (no offline queue, 250 ms timeout) so a Redis outage can't stall redirects. Don't use the BullMQ connection for the cache.

### Auth

- `verifyJWT` (`middleware/auth.middleware.js`) accepts a `Bearer` token or the `accessToken` cookie; the refresh token lives in a `refreshToken` cookie.
- Google sign-in: client gets an ID token → `POST /api/v1/auth/google` → same app JWTs as email login. `GOOGLE_CLIENT_ID` (server) and `VITE_GOOGLE_CLIENT_ID` (client) must be the same value.

## Client

- All API calls go through `request()` in `client/src/api.js`, which stores the access token in localStorage and sends it as a `Bearer` header.
- In dev, Vite proxies `/api` and `/health` to port 3000. In production, `VITE_API_BASE`/`VITE_API_ORIGIN` point the client at the API.

## Workflow rules (must follow)

The full rules are in `CONTRIBUTING.md`. In short:

1. Never commit to `main`. Start every task with `git checkout main && git pull && git checkout -b <type>/<name>`. Types: `feat/`, `fix/`, `chore/`, `docs/`, `refactor/`.
2. One branch = one task.
3. Commit messages: `type(scope): what changed`.
4. Run `npm test --prefix server` (and the client build if `client/` changed) before opening a PR.
5. After a PR merges, delete the branch locally and on GitHub and pull `main`, so only `main` remains.
6. Explain each proposed change and its architectural impact, and wait for the user's OK before editing code.
