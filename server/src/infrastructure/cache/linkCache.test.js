import { describe, expect, it, vi } from "vitest";

// avoid opening a real Redis connection when the module is imported
vi.mock("../../config/redis.config.js", () => ({ createCacheClient: () => ({}) }));

const { createLinkCache } = await import("./linkCache.js");

describe("createLinkCache", () => {
  it("stores a link under link:<shortCode> with a TTL and reads it back", async () => {
    const data = {};
    const client = {
      set: vi.fn(async (key, value) => {
        data[key] = value;
      }),
      get: vi.fn(async (key) => data[key] ?? null),
    };
    const cache = createLinkCache(client, { ttlSeconds: 60 });

    await cache.set({ _id: "id1", linkOwner: "owner1", shortCode: "abc", longUrl: "https://x.com", visits: 9 });

    expect(client.set).toHaveBeenCalledWith("link:abc", expect.any(String), "EX", 60);
    expect(await cache.get("abc")).toEqual({
      linkId: "id1",
      linkOwner: "owner1",
      shortCode: "abc",
      longUrl: "https://x.com",
    });
  });

  it("fails open when Redis errors", async () => {
    const boom = vi.fn().mockRejectedValue(new Error("ECONNREFUSED"));
    const cache = createLinkCache({ get: boom, set: boom, del: boom });
    vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(cache.get("abc")).resolves.toBeNull();
    await expect(cache.set({ _id: "1", shortCode: "abc" })).resolves.toBeUndefined();
    await expect(cache.invalidate("abc")).resolves.toBeUndefined();
  });
});
