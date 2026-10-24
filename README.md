# Shortly

URL shortener with a React frontend and Express backend.

```
short_url/
  client/   → React (Vite) — http://localhost:5173
  server/   → Express API  — http://localhost:3000
```

## Deployment overview

| Layer | Typical hosting |
|--------|------------------|
| Frontend | Vercel |
| API (+ worker) | Render |
| MongoDB | Atlas |
| Redis (queues) | Upstash |

**Docker** is for local full-stack runs and optional container deploys — it does not replace Upstash/Atlas unless you configure it that way. See **[docs/docker.md](docs/docker.md)**.

```bash
docker compose up --build   # UI :8080, API :3000, local mongo + redis
```

## Setup

```bash
npm run install:all
cp server/.env.example server/.env   # Windows: copy server\.env.example server\.env
```

Fill in `server/.env`: at minimum `MONGO_URI`, JWT secrets, and Redis (see below).

## Local run

Shortly needs **MongoDB**, **Redis** (BullMQ queues), the **API**, a **worker**, and the **Vite client**. Use **three terminals** (or `npm run start` + worker + client).

### 1. Redis

The API and worker connect to Redis for email and analytics jobs. Without Redis you will see `ECONNREFUSED 127.0.0.1:6379`.

**Option A — Docker (typical on your machine)**

```bash
docker run -d --name shortly-redis -p 6379:6379 redis:7-alpine
```

In `server/.env` (defaults from `.env.example`):

```env
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

Do **not** set `REDIS_URL` unless you intend to use Upstash instead.

**Option B — Upstash (same as production)**

```env
REDIS_URL=rediss://default:YOUR_PASSWORD@your-db.upstash.io:6379
```

Remove or ignore `REDIS_HOST` when `REDIS_URL` is set.

### 2. MongoDB

Use **MongoDB Atlas** (`MONGO_URI` in `server/.env`) or a local Mongo instance / `docker compose` (see [docs/docker.md](docs/docker.md)).

### 3. Start services (three terminals)

From the repo root:

```bash
# Terminal 1 — API (http://localhost:3000)
npm run dev:server

# Terminal 2 — BullMQ worker (email + analytics jobs)
npm run worker

# Terminal 3 — React app (http://localhost:5173)
npm run dev:client
```

Production-style API without nodemon:

```bash
cd server && npm run start
```

### 4. Open the app

| URL | What |
|-----|------|
| http://localhost:5173 | UI (Vite proxies `/api` → port 3000) |
| http://localhost:3000/health | API health check |
| http://localhost:3000/{shortCode} | Short-link redirect (same as production) |

Optional `client/.env` for Google sign-in: `VITE_GOOGLE_CLIENT_ID=...` (same value as `GOOGLE_CLIENT_ID` on the server).

### 5. Quick checks

- API logs: `MongoDB connected`, Redis host **not** stuck on failed localhost if Redis is running.
- Worker logs: `Workers initialized and listening for jobs`.
- After creating a link and opening it, worker should log analytics job activity.

## Google login

1. Create an OAuth client in [Google Cloud Console](https://console.cloud.google.com/apis/credentials) (type: **Web application**).
2. Authorized JavaScript origins:
   - `http://localhost:5173`
3. Authorized redirect URIs (GIS still expects an origin; redirect can be):
   - `http://localhost:5173`
4. Put the **Client ID** in both:
   - `server/.env` → `GOOGLE_CLIENT_ID=....apps.googleusercontent.com`
   - `client/.env` → `VITE_GOOGLE_CLIENT_ID=....apps.googleusercontent.com` (same value)
5. Restart API + Vite client.

Flow: Google button → ID token → `POST /api/v1/auth/google` → app JWTs (same as email login).
