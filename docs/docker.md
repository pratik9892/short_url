# Docker guide (Shortly)

Shortly can run **without Docker** in production (what you use today) or **with Docker** for local dev, demos, and optional container hosting.

## What you already use (keep this)

| Piece | Where | Role |
|--------|--------|------|
| **API** | [Render](https://render.com) Web Service (`server/`, `npm run start:with-worker` or `npm start` + worker) | Express API, short-link redirects |
| **Redis** | [Upstash](https://upstash.com) (`REDIS_URL` / `rediss://…`) | BullMQ queues (email, analytics) |
| **Database** | MongoDB Atlas (`MONGO_URI`) | Users, links, analytics |
| **Frontend** | Vercel (or similar) | React static app (`VITE_API_*` → Render URL) |

Docker does **not** replace Upstash or Atlas unless you choose to run Mongo/Redis inside containers locally or on your own VM.

```text
Production (current)
  Browser → Vercel (client)
         → Render (API) → Atlas (Mongo)
                         → Upstash (Redis)
```

## What Docker adds

| Use case | Tool |
|----------|------|
| **Run full stack on your laptop** without installing Node/Mongo/Redis globally | `docker compose up` |
| **Same setup for teammates / interviews** | One command + `server/.env` |
| **Resume / README** | “Containerized with Docker” |
| **Optional: host API as a container** | Render **Docker** deploy, Fly.io, Railway, etc. |

```text
Local Docker (docker-compose.yml)
  Browser → :8080 web (nginx + React build)
         → :3000 api (Express)
         → mongo + redis (containers on your machine)
```

For local Docker you can still point the API at **Atlas + Upstash** by setting `MONGO_URI` and `REDIS_URL` in `server/.env` and removing or overriding the compose `environment:` entries for Mongo/Redis.

## Files in the repo

| File | Purpose |
|------|---------|
| `server/Dockerfile` | Production-style **API** image (Node 22, `npm run start:with-worker` by default) |
| `server/.dockerignore` | Keeps secrets and `node_modules` out of the image |
| `client/Dockerfile` | Builds Vite app, serves with **nginx** |
| `client/nginx.conf` | SPA routing + proxy `/api` → `api:3000` |
| `docker-compose.yml` | **mongo**, **redis**, **api**, **worker**, **web** for local full stack |
| `.dockerignore` | Root ignore rules |

## Quick start (local full stack)

1. Copy env template and add secrets (JWT, Groq, SendGrid, Google, etc.):

   ```bash
   cp server/.env.example server/.env
   ```

2. Edit `server/.env` — for **compose defaults**, Mongo/Redis hosts are overridden to `mongo` and `redis`. For **Atlas + Upstash**, set `MONGO_URI` and `REDIS_URL` and adjust `docker-compose.yml` `environment` so they are not overwritten.

3. Build and run:

   ```bash
   docker compose up --build
   ```

4. Open:

   - **App UI:** http://localhost:8080  
   - **API / short links:** http://localhost:3000  
   - **Health:** http://localhost:3000/health  

5. Stop:

   ```bash
   docker compose down
   ```

## API image only (similar to Render)

Build and run the server image alone (use your real Atlas + Upstash env):

```bash
docker build -t shortly-api ./server
docker run --rm -p 3000:3000 --env-file server/.env shortly-api
```

Override command:

- API only: `docker run … shortly-api npm run start`
- Worker only: `docker run … shortly-api npm run worker`

## Deploy API on Render **using Docker** (optional)

You can keep Vercel + Upstash + Atlas and only change how the API runs on Render:

1. Render → your service → **Settings**
2. **Environment:** Docker (not Node)
3. **Dockerfile path:** `server/Dockerfile` (set **Root directory** to `server` if required)
4. **Start command** (if Render asks): leave default or `npm run start:with-worker`
5. Keep the same env vars: `MONGO_URI`, `REDIS_URL`, `CLIENT_ORIGIN`, `GROQ_*`, etc.

Upstash stays **external** — do not run Redis in Docker on Render’s free tier unless you accept managing it yourself.

## Deploy frontend with Docker (optional)

Production usually stays on **Vercel** (CDN, easy env for `VITE_*`).

To run the client container elsewhere, build with your API URL:

```bash
docker build -t shortly-web ./client \
  --build-arg VITE_API_BASE=https://YOUR-API.onrender.com/api/v1 \
  --build-arg VITE_API_ORIGIN=https://YOUR-API.onrender.com \
  --build-arg VITE_GOOGLE_CLIENT_ID=your-client-id
```

## What to put on your resume

- **Live:** Vercel URL + GitHub  
- **Backend:** Render, MongoDB Atlas, Upstash Redis  
- **Optional line:** “Dockerized API and local `docker compose` stack for reproducible development”

## Troubleshooting

| Issue | Check |
|--------|--------|
| CORS from UI on :8080 | `CLIENT_ORIGIN` includes `http://localhost:8080` |
| Short links wrong host | `VITE_API_ORIGIN` must be the API URL (`http://localhost:3000` in compose) |
| Worker not processing jobs | `worker` service running; `REDIS_URL` or `REDIS_HOST` correct |
| Groq errors | `GROQ_MODEL=openai/gpt-oss-20b` (Llama 3.1 8B retired on free tier) |
