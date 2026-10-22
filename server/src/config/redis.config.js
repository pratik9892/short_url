import { config } from "./server.config.js"

/** See server/docs/redis-flow.md */
function toUpstashTlsUrl(url) {
  if (url.includes("upstash.io") && url.startsWith("redis://")) {
    return url.replace("redis://", "rediss://")
  }
  return url
}

function buildRedisConnection() {
  const url = config.redis.URL?.trim()
  if (url) return toUpstashTlsUrl(url)

  const host = config.redis.HOST
  const needsTls = config.redis.TLS || host.includes("upstash.io")

  return {
    host,
    port: config.redis.PORT,
    ...(config.redis.PASSWORD && { password: config.redis.PASSWORD }),
    ...(needsTls && { tls: {} }),
  }
}

export const REDIS_CONNECTION = buildRedisConnection()

/** Logs whether REDIS_URL was loaded (no secrets). */
export function logRedisConfig() {
  const url = config.redis.URL?.trim()
  const usingUrl = Boolean(url)

  console.log("[redis] config", {
    REDIS_URL_present: usingUrl,
    REDIS_URL_length: url?.length ?? 0,
    connection: usingUrl ? "url" : "host+port",
    host: usingUrl ? "(from URL)" : config.redis.HOST,
    port: usingUrl ? "(from URL)" : config.redis.PORT,
  })

  if (!usingUrl && config.redis.HOST === "127.0.0.1") {
    console.warn(
      "[redis] No REDIS_URL — defaulting to localhost. Set REDIS_URL on Render."
    )
  }
}
