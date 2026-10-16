# Shortly

URL shortener with a React frontend and Express backend.

```
short_url/
  client/   → React (Vite) — http://localhost:5173
  server/   → Express API  — http://localhost:3000
```

## Setup

```bash
npm run install:all
```

Ensure `server/.env` has MongoDB, Redis, and JWT settings.

## Run (separate terminals)

```bash
npm run dev:server
npm run worker
npm run dev:client
```

Open **http://localhost:5173**

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
