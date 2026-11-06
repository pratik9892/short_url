import Redis from "ioredis"
import { config } from "./server.config.js"
import { logger } from "../infrastructure/logger/logger.js"

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

/**
 * Logs "redis connected" on every (re)connect and the first error of each outage.
 * ioredis retries every few seconds while Redis is down, so logging every error would flood the logs.
 */
function watchConnection(client, name) {
  let down = false
  client.on("ready", () => {
    down = false
    logger.info({ connection: name }, "redis connected")
  })
  client.on("error", (err) => {
    if (down) return
    down = true
    logger.warn({ connection: name, reason: err.message }, "redis unavailable")
  })
  return client
}

export const REDIS_CONNECTION = watchConnection(createRedisClient(), "queue")

/** Workers in the same process should not share one blocking connection. */
export function redisDuplicate(name = "worker") {
  return watchConnection(REDIS_CONNECTION.duplicate(), name)
}

/**
 * Cache connection that fails fast. The BullMQ connection uses maxRetriesPerRequest: null,
 * which queues commands until Redis returns — fine for jobs, but it would hang redirects.
 * No commandTimeout here: ioredis applies it to AUTH and INFO while connecting too, and a
 * 250 ms limit never let the TLS connection to Upstash finish. linkCache.js times each
 * operation instead.
 */
export function createCacheClient() {
  return watchConnection(
    REDIS_CONNECTION.duplicate({
      maxRetriesPerRequest: 0,
      enableOfflineQueue: false,
    }),
    "cache"
  )
}

export function logRedisConfig() {
  const url = config.redis.URL?.trim()
  const usingUrl = Boolean(url)

  logger.info({
    REDIS_URL_present: usingUrl,
    REDIS_URL_length: url?.length ?? 0,
    ioredis_host: REDIS_CONNECTION.options?.host,
    ioredis_port: REDIS_CONNECTION.options?.port,
    tls: Boolean(REDIS_CONNECTION.options?.tls),
  }, "Redis config")

  if (!usingUrl && config.redis.HOST === "127.0.0.1") {
    logger.warn("No REDIS_URL — using localhost. Set REDIS_URL on Render.")
  }
}
