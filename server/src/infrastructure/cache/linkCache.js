import { createCacheClient } from "../../config/redis.config.js";
import { logger } from "../logger/logger.js";

const KEY_PREFIX = "link:";
const TTL_SECONDS = 60 * 60 * 24;
const TIMEOUT_MS = 500;

/** Rejects if Redis hasn't answered in time, so a slow Redis can't hold up a redirect. */
function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`cache timed out after ${ms} ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/**
 * Cache-aside store for the redirect hot path: shortCode -> { linkId, linkOwner, shortCode, longUrl }.
 * Every method fails open — a Redis outage falls back to MongoDB instead of breaking redirects.
 */
export function createLinkCache(client, { ttlSeconds = TTL_SECONDS, timeoutMs = TIMEOUT_MS } = {}) {
  return {
    async get(shortCode) {
      try {
        const raw = await withTimeout(client.get(KEY_PREFIX + shortCode), timeoutMs);
        return raw ? JSON.parse(raw) : null;
      } catch (error) {
        logger.warn({ err: error }, "cache get failed");
        return null;
      }
    },

    async set(link) {
      try {
        const value = JSON.stringify({
          linkId: String(link._id),
          linkOwner: String(link.linkOwner),
          shortCode: link.shortCode,
          longUrl: link.longUrl,
        });
        await withTimeout(client.set(KEY_PREFIX + link.shortCode, value, "EX", ttlSeconds), timeoutMs);
      } catch (error) {
        logger.warn({ err: error }, "cache set failed");
      }
    },

    async invalidate(shortCode) {
      try {
        await withTimeout(client.del(KEY_PREFIX + shortCode), timeoutMs);
      } catch (error) {
        logger.warn({ err: error }, "cache invalidate failed");
      }
    },
  };
}

export const linkCache = createLinkCache(createCacheClient());
