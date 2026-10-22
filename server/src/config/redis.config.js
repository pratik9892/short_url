import { config } from "./server.config.js"

/**
 * BullMQ / ioredis connection.
 * Local: REDIS_HOST + REDIS_PORT
 * Production (Upstash): REDIS_URL=rediss://default:password@host:6379
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

  if (config.redis.TLS) {
    connection.tls = {}
  }

  return connection
}

export const REDIS_CONNECTION = buildRedisConnection()
