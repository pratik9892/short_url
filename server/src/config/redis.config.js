import Redis from "ioredis"
import { config } from "./server.config.js"

/** See server/docs/redis-flow.md */
function toUpstashTlsUrl(url) {
  if (url.includes("upstash.io") && url.startsWith("redis://")) {
    return url.replace("redis://", "rediss://")
  }
  return url
}

/** BullMQ needs an ioredis instance — a plain URL string defaults to localhost. */
function createRedisClient() {
  const url = config.redis.URL?.trim()
  const shared = { maxRetriesPerRequest: null }

  if (url) {
    return new Redis(toUpstashTlsUrl(url), shared)
  }

  const host = config.redis.HOST
  const needsTls = config.redis.TLS || host.includes("upstash.io")

  return new Redis({
    host,
    port: config.redis.PORT,
    password: config.redis.PASSWORD || undefined,
    ...(needsTls && { tls: {} }),
    ...shared,
  })
}

export const REDIS_CONNECTION = createRedisClient()

/** Workers in the same process should not share one blocking connection. */
export function redisDuplicate() {
  return REDIS_CONNECTION.duplicate()
}

export function logRedisConfig() {
  const url = config.redis.URL?.trim()
  const usingUrl = Boolean(url)

  console.log("[redis] config", {
    REDIS_URL_present: usingUrl,
    REDIS_URL_length: url?.length ?? 0,
    ioredis_host: REDIS_CONNECTION.options?.host,
    ioredis_port: REDIS_CONNECTION.options?.port,
    tls: Boolean(REDIS_CONNECTION.options?.tls),
  })

  if (!usingUrl && config.redis.HOST === "127.0.0.1") {
    console.warn(
      "[redis] No REDIS_URL — using localhost. Set REDIS_URL on Render."
    )
  }
}
