import { describe, expect, it, beforeEach, vi } from "vitest";
import { createRateLimiter } from "./rateLimit.middleware.js";
import { tooManyRequests } from "../errors/tooManyRequests.js";

function mockRes() {
  const headers = {};
  return {
    headers,
    setHeader(k, v) {
      headers[k] = v;
    },
  };
}

describe("createRateLimiter", () => {
  let limiter;

  beforeEach(() => {
    limiter = createRateLimiter({
      windowMs: 60_000,
      max: 3,
      keyGenerator: () => "test-key",
    });
  });

  it("allows requests under the max", () => {
    const res = mockRes();
    const next = vi.fn();
    limiter({ ip: "1.1.1.1" }, res, next);
    expect(next).toHaveBeenCalledWith();
    expect(res.headers["X-RateLimit-Limit"]).toBe("3");
    expect(res.headers["X-RateLimit-Remaining"]).toBe("2");
  });

  it("blocks the request after max is exceeded", () => {
    const res = mockRes();
    for (let i = 0; i < 3; i++) {
      limiter({ ip: "1.1.1.1" }, res, vi.fn());
    }
    const next = vi.fn();
    limiter({ ip: "1.1.1.1" }, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(tooManyRequests);
    expect(err.statuscode).toBe(429);
    expect(res.headers["X-RateLimit-Remaining"]).toBe("0");
  });

  it("tracks keys separately", () => {
    const limiterByIp = createRateLimiter({
      windowMs: 60_000,
      max: 1,
      keyGenerator: (req) => req.ip,
    });
    const nextA = vi.fn();
    const nextB = vi.fn();
    limiterByIp({ ip: "a" }, mockRes(), nextA);
    limiterByIp({ ip: "b" }, mockRes(), nextB);
    expect(nextA).toHaveBeenCalledWith();
    expect(nextB).toHaveBeenCalledWith();

    const nextA2 = vi.fn();
    limiterByIp({ ip: "a" }, mockRes(), nextA2);
    expect(nextA2.mock.calls[0][0]).toBeInstanceOf(tooManyRequests);
  });
});
