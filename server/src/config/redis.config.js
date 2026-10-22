import { config } from "./server.config.js"

/**
 * BullMQ / ioredis connection.
 * Production (pick one):
 *   - REDIS_URL=rediss://default:password@host:6379
 *   - REDIS_HOST + REDIS_PORT + REDIS_PASSWORD + REDIS_TLS=true (Upstash)
 * Local: REDIS_HOST + REDIS_PORT (Docker)
 */
function buildRedisConnection() {
  const rawUrl = config.redis.URL?.trim()
  if (rawUrl) {
    let url = rawUrl
    if (url.includes("upstash.io") && url.startsWith("redis://")) {
      url = url.replace("redis://", "rediss://")
    }
    return url
  }

  const connection = {
    host: config.redis.HOST,
    port: config.redis.PORT,
  }

  if (config.redis.PASSWORD) {
    connection.password = config.redis.PASSWORD
  }

  const useTls =
    config.redis.TLS ||
    String(config.redis.HOST).includes("upstash.io")

  if (useTls) {
    connection.tls = {}
  }

  return connection
}

export const REDIS_CONNECTION = buildRedisConnection()

/** Safe startup log — no passwords. */
export function logRedisBootDiagnostics() {
  const hasUrl = Boolean(config.redis.URL?.trim())
  const mode = typeof REDIS_CONNECTION === "string" ? "url" : "host-port"

  const info = {
    mode,
    hasRedisUrlEnv: hasUrl,
    redisUrlEnvLength: config.redis.URL?.length ?? 0,
  }

  if (mode === "host-port") {
    info.host = REDIS_CONNECTION.host
    info.port = REDIS_CONNECTION.port
    info.tls = Boolean(REDIS_CONNECTION.tls)
    info.hasPassword = Boolean(REDIS_CONNECTION.password)
  } else {
    info.hostHint = config.redis.URL.includes("@")
      ? config.redis.URL.split("@").pop()?.split(":")[0]
      : "(parse failed)"
  }

  if (!hasUrl && info.host === "127.0.0.1") {
    console.warn(
      "[redis] REDIS_URL is not set — using localhost. On Render, set REDIS_URL or REDIS_HOST/PORT/PASSWORD."
    )
  }

  console.log("[redis] boot", info)
}
