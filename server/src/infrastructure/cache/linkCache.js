import { createCacheClient } from "../../config/redis.config.js";
import { logger } from "../logger/logger.js";

const KEY_PREFIX = "link:";
const TTL_SECONDS = 60 * 60 * 24;

/**
 * Cache-aside store for the redirect hot path: shortCode -> { linkId, linkOwner, shortCode, longUrl }.
 * Every method fails open — a Redis outage falls back to MongoDB instead of breaking redirects.
 */
export function createLinkCache(client, { ttlSeconds = TTL_SECONDS } = {}) {
  return {
    async get(shortCode) {
      try {
        const raw = await client.get(KEY_PREFIX + shortCode);
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
        await client.set(KEY_PREFIX + link.shortCode, value, "EX", ttlSeconds);
      } catch (error) {
        logger.warn({ err: error }, "cache set failed");
      }
    },

    async invalidate(shortCode) {
      try {
        await client.del(KEY_PREFIX + shortCode);
      } catch (error) {
        logger.warn({ err: error }, "cache invalidate failed");
      }
    },
  };
}

export const linkCache = createLinkCache(createCacheClient());
