import { describe, expect, it } from "vitest";
import { createLinkBodySchema } from "./link.validation.js";

describe("createLinkBodySchema", () => {
  it("accepts http(s) URLs and optional linkName", () => {
    const parsed = createLinkBodySchema.parse({
      longUrl: "https://example.com/path",
      linkName: "docs",
    });
    expect(parsed.longUrl).toBe("https://example.com/path");
    expect(parsed.linkName).toBe("docs");
  });

  it("treats empty linkName as omitted", () => {
    const parsed = createLinkBodySchema.parse({
      longUrl: "https://example.com",
      linkName: "",
    });
    expect(parsed.linkName).toBeUndefined();
  });

  it("rejects non-http(s) schemes", () => {
    const result = createLinkBodySchema.safeParse({
      longUrl: "ftp://files.example.com/a",
    });
    expect(result.success).toBe(false);
  });

  it("rejects javascript: URLs", () => {
    const result = createLinkBodySchema.safeParse({
      longUrl: "javascript:alert(1)",
    });
    expect(result.success).toBe(false);
  });

  it("rejects linkName longer than 20 characters", () => {
    const result = createLinkBodySchema.safeParse({
      longUrl: "https://example.com",
      linkName: "a".repeat(21),
    });
    expect(result.success).toBe(false);
  });
});
