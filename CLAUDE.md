# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project

Shortly, a URL shortener with click analytics and AI dashboard insights.

- `server/`: Express 5 API + BullMQ worker (Node 22, ES modules, MongoDB via Mongoose, Redis via ioredis)
- `client/`: React 19 + Vite SPA (react-router, Google OAuth)
- `docker-compose.yml`: full local stack (mongo, redis, api, worker, web). See `docs/docker.md`.
- Deployed on Render (API + worker in one instance via `start:with-worker`) with Upstash Redis.

## Commands

```bash
npm run install:all                 # install server + client deps
npm run dev:server                  # API with nodemon (port 3000)
npm run dev:client                  # Vite dev server (port 5173)
npm run worker                      # BullMQ worker (analytics + email queues)
npm test --prefix server            # Vitest
npm run build --prefix client       # production build
npm run lint --prefix client        # oxlint
```

CI (`.github/workflows/ci.yml`) runs server tests and the client build on every PR to `main`.

## Server architecture

Domain-based layout under `server/src/domains/<domain>/` (`link`, `analytics`, `user`, `ai`):

`*.route.js` → `*.validation.js` (Zod, via `middleware/validate.middleware.js`) → `*.contoller.js` → `*.service.js` → `*.repo.js` → `*.model.js`

- Controller filenames are spelled `contoller`. Keep the existing spelling when adding to a domain.
- Controllers wrap logic in `try/catch` and call `next(error)`. Services throw typed errors from `src/errors/` (all extend `baseError`); `utils/error.util.js` turns them into the JSON response.
- Response shape: `{ status/success, message, error, data }`.
- Routes are mounted under `/api/v1` (`routes/v1/index.js`). `GET /:shortCode` in `app.js` is the redirect.
- `infrastructure/` holds the cross-cutting pieces: Redis link cache (`cache/`), BullMQ queues and workers (`queue/`), and helpers (`utils/`: geoip, user-agent, email).
- The redirect path is cache-aside (Redis, then Mongo) and enqueues the click to `analyticsQueue`; the worker (`src/worker.js`) does the analytics write so the redirect never waits on it.
- `app.set("trust proxy", 1)`: use `req.ip` for client IPs, never raw `X-Forwarded-For`.
- Tests sit next to the code as `*.test.js` (Vitest).
- Config comes from env vars via `config/*.config.js`. Document new vars in `server/.env.example`.

## Workflow rules (must follow)

The full rules are in `CONTRIBUTING.md`. In short:

1. Never commit to `main`. Start every task with `git checkout main && git pull && git checkout -b <type>/<name>`. Types: `feat/`, `fix/`, `chore/`, `docs/`, `refactor/`.
2. One branch = one task.
3. Commit messages: `type(scope): what changed`.
4. Run `npm test --prefix server` (and the client build if `client/` changed) before opening a PR.
5. After a PR merges, delete the branch locally and on GitHub and pull `main`, so only `main` remains.
6. Explain each proposed change and its architectural impact, and wait for the user's OK before editing code.
