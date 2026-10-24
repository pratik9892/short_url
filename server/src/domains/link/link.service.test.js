import { describe, expect, it, vi } from "vitest";
import { LinkService } from "./link.service.js";
import { InternalServerError } from "../../errors/internalServerError.js";
import { NotFound } from "../../errors/notFound.js";

function duplicateKeyError() {
  const err = new Error("E11000 duplicate key error");
  err.code = 11000;
  err.keyPattern = { shortCode: 1 };
  return err;
}

function fakeCache(initial = {}) {
  const store = { ...initial };
  return {
    store,
    get: vi.fn(async (code) => store[code] ?? null),
    set: vi.fn(async (link) => {
      store[link.shortCode] = link;
    }),
    invalidate: vi.fn(async (code) => {
      delete store[code];
    }),
  };
}

const dbLink = {
  _id: "64b000000000000000000001",
  linkOwner: "64b000000000000000000002",
  shortCode: "abc123",
  longUrl: "https://example.com",
};

function serviceWith(repo, cache) {
  const service = new LinkService(repo, cache);
  service.analyticsService = {
    updateLongUrl: vi.fn(),
    onDeleteCascadeAanlytics: vi.fn(),
  };
  return service;
}

describe("LinkService.createShortUrl", () => {
  const input = { longUrl: "https://example.com", linkOwner: "u1" };

  it("retries with a new code when the shortCode collides", async () => {
    const createLink = vi
      .fn()
      .mockRejectedValueOnce(duplicateKeyError())
      .mockImplementationOnce(async (data) => data);
    const service = serviceWith({ createLink });

    const created = await service.createShortUrl(input);

    expect(createLink).toHaveBeenCalledTimes(2);
    expect(created.longUrl).toBe("https://example.com");
  });

  it("gives up after repeated collisions", async () => {
    const createLink = vi.fn().mockRejectedValue(duplicateKeyError());
    const service = serviceWith({ createLink });

    await expect(service.createShortUrl(input)).rejects.toBeInstanceOf(InternalServerError);
    expect(createLink).toHaveBeenCalledTimes(5);
  });

  it("does not retry on unrelated errors", async () => {
    const createLink = vi.fn().mockRejectedValue(new Error("db down"));
    const service = serviceWith({ createLink });

    await expect(service.createShortUrl(input)).rejects.toThrow("db down");
    expect(createLink).toHaveBeenCalledTimes(1);
  });
});

describe("LinkService.getLinkByShortCode (cache-aside)", () => {
  it("serves a cache hit without touching MongoDB", async () => {
    const getShortUrl = vi.fn();
    const cached = { linkId: "1", linkOwner: "2", shortCode: "abc123", longUrl: "https://cached.com" };
    const service = serviceWith({ getShortUrl }, fakeCache({ abc123: cached }));

    const link = await service.getLinkByShortCode("abc123");

    expect(link).toEqual(cached);
    expect(getShortUrl).not.toHaveBeenCalled();
  });

  it("falls back to MongoDB on a miss and populates the cache", async () => {
    const getShortUrl = vi.fn().mockResolvedValue(dbLink);
    const cache = fakeCache();
    const service = serviceWith({ getShortUrl }, cache);

    const link = await service.getLinkByShortCode("abc123");

    expect(getShortUrl).toHaveBeenCalledWith("abc123");
    expect(cache.set).toHaveBeenCalledWith(dbLink);
    expect(link).toEqual({
      linkId: dbLink._id,
      linkOwner: dbLink.linkOwner,
      shortCode: "abc123",
      longUrl: "https://example.com",
    });
  });

  it("throws NotFound for an unknown code", async () => {
    const service = serviceWith({ getShortUrl: vi.fn().mockResolvedValue(null) }, fakeCache());

    await expect(service.getLinkByShortCode("nope")).rejects.toBeInstanceOf(NotFound);
  });

  it("works without a cache", async () => {
    const service = serviceWith({ getShortUrl: vi.fn().mockResolvedValue(dbLink) });

    const link = await service.getLinkByShortCode("abc123");

    expect(link.longUrl).toBe("https://example.com");
  });
});

describe("LinkService cache invalidation", () => {
  it("invalidates the cached redirect on update", async () => {
    const cache = fakeCache({ abc123: { longUrl: "https://old.com" } });
    const service = serviceWith(
      { updateShortUrl: vi.fn().mockResolvedValue({ ...dbLink, longUrl: "https://new.com" }) },
      cache
    );

    await service.updateUserShortUrl(dbLink._id, dbLink.linkOwner, { longUrl: "https://new.com" });

    expect(cache.invalidate).toHaveBeenCalledWith("abc123");
    expect(cache.store.abc123).toBeUndefined();
  });

  it("invalidates the cached redirect on delete", async () => {
    const cache = fakeCache({ abc123: { longUrl: "https://example.com" } });
    const service = serviceWith({ deleteShortUrl: vi.fn().mockResolvedValue(dbLink) }, cache);

    await service.deleteUserShortUrl(dbLink._id, dbLink.linkOwner);

    expect(cache.invalidate).toHaveBeenCalledWith("abc123");
  });
});
