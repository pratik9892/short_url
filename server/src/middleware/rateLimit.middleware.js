import { tooManyRequests } from "../errors/tooManyRequests.js";

/**
 * Fixed-window in-memory rate limiter.
 * Suitable for single-process local/dev; swap store for Redis in multi-instance deploys.
 */
export function createRateLimiter({
  windowMs = 60_000,
  max = 60,
  keyGenerator = (req) => req.ip || "unknown",
  message = "Rate limit exceeded. Try again later.",
} = {}) {
  const hits = new Map();

  function prune(now) {
    for (const [key, entry] of hits) {
      if (now >= entry.resetAt) hits.delete(key);
    }
  }

  function middleware(req, res, next) {
    const now = Date.now();
    if (hits.size > 10_000) prune(now);

    const key = String(keyGenerator(req) || "unknown");
    let entry = hits.get(key);
    if (!entry || now >= entry.resetAt) {
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(key, entry);
    }

    entry.count += 1;
    const remaining = Math.max(0, max - entry.count);
    res.setHeader("X-RateLimit-Limit", String(max));
    res.setHeader("X-RateLimit-Remaining", String(remaining));
    res.setHeader("X-RateLimit-Reset", String(Math.ceil(entry.resetAt / 1000)));

    if (entry.count > max) {
      return next(new tooManyRequests(message));
    }
    return next();
  }

  middleware.resetStore = () => hits.clear();
  return middleware;
}

/** Auth endpoints: stricter, keyed by IP */
export const authRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: "Too many auth attempts. Try again in a few minutes.",
});

/** Create-link: keyed by user id when available, else IP */
export const createLinkRateLimit = createRateLimiter({
  windowMs: 60 * 1000,
  max: 30,
  keyGenerator: (req) =>
    req.user?._id?.toString?.() || req.user?.id?.toString?.() || req.ip || "unknown",
  message: "Too many links created. Slow down and try again.",
});
