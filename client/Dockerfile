# Vite React SPA → nginx (proxy /api to backend in docker-compose)
FROM node:22-bookworm-slim AS build
WORKDIR /app

ARG VITE_API_BASE=/api/v1
ARG VITE_API_ORIGIN=http://localhost:3000
ARG VITE_GOOGLE_CLIENT_ID=
ENV VITE_API_BASE=$VITE_API_BASE
ENV VITE_API_ORIGIN=$VITE_API_ORIGIN
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID

COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS runner
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
