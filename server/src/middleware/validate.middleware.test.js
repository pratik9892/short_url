import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { validateBody } from "./validate.middleware.js";
import { badRequest } from "../errors/badRequest.js";

describe("validateBody", () => {
  const schema = z.object({
    email: z.string().email("Invalid email"),
  });

  it("calls next() with parsed body on success", () => {
    const req = { body: { email: "  A@B.COM " } };
    // Note: this schema does not lowercase; only checks middleware wiring
    const simple = z.object({
      email: z.string().trim().email(),
    });
    const next = vi.fn();
    validateBody(simple)(req, {}, next);
    expect(next).toHaveBeenCalledWith();
    expect(req.body.email).toBe("A@B.COM");
  });

  it("calls next(badRequest) with field details on failure", () => {
    const req = { body: { email: "not-an-email" } };
    const next = vi.fn();
    validateBody(schema)(req, {}, next);
    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(badRequest);
    expect(err.details.email).toBe("Invalid email");
  });
});
