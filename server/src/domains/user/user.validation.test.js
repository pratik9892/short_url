import { describe, expect, it } from "vitest";
import {
  googleBodySchema,
  loginBodySchema,
  registerBodySchema,
} from "./user.validation.js";

describe("registerBodySchema", () => {
  const valid = {
    fullName: "Priya Shah",
    username: "priya_1",
    email: "priya@example.com",
    password: "password1",
  };

  it("accepts a valid payload and normalizes email/username", () => {
    const parsed = registerBodySchema.parse({
      ...valid,
      email: "  Priya@Example.COM ",
      username: "Priya_1",
    });
    expect(parsed.email).toBe("priya@example.com");
    expect(parsed.username).toBe("priya_1");
    expect(parsed.password).toBe("password1");
  });

  it("rejects password shorter than 8 characters", () => {
    const result = registerBodySchema.safeParse({ ...valid, password: "short" });
    expect(result.success).toBe(false);
    expect(result.error.issues[0].path).toContain("password");
  });

  it("rejects invalid username characters", () => {
    const result = registerBodySchema.safeParse({ ...valid, username: "priya!" });
    expect(result.success).toBe(false);
  });

  it("rejects unknown fields (strict)", () => {
    const result = registerBodySchema.safeParse({ ...valid, role: "admin" });
    expect(result.success).toBe(false);
  });
});

describe("loginBodySchema", () => {
  it("accepts valid login credentials", () => {
    const parsed = loginBodySchema.parse({
      email: "a@b.com",
      password: "x",
    });
    expect(parsed.email).toBe("a@b.com");
  });

  it("rejects missing password", () => {
    const result = loginBodySchema.safeParse({ email: "a@b.com" });
    expect(result.success).toBe(false);
  });
});

describe("googleBodySchema", () => {
  it("requires non-empty credential", () => {
    expect(googleBodySchema.safeParse({}).success).toBe(false);
    expect(googleBodySchema.safeParse({ credential: "  " }).success).toBe(false);
    expect(googleBodySchema.safeParse({ credential: "token" }).success).toBe(true);
  });
});
