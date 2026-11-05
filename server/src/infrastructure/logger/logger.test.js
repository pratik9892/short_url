import { describe, expect, it } from "vitest";
import pino from "pino";
import { maskEmail, redact } from "./logger.js";

/** A pino instance with the app's redaction rules that writes into an array instead of stdout. */
function capture() {
  const lines = [];
  const log = pino({ redact }, { write: (line) => lines.push(JSON.parse(line)) });
  return { log, lines };
}

describe("maskEmail", () => {
  it("keeps the first character and the domain", () => {
    expect(maskEmail("pratik@gmail.com")).toBe("p***@gmail.com");
  });

  it("redacts values that are not emails", () => {
    expect(maskEmail(undefined)).toBe("[Redacted]");
    expect(maskEmail("not-an-email")).toBe("[Redacted]");
  });
});

describe("logger redaction", () => {
  it("redacts tokens and passwords", () => {
    const { log, lines } = capture();
    log.info({
      user: { password: "hunter2", refreshToken: "r.t.x", accessToken: "a.t.x" },
      body: { idToken: "g.t.x", apiKey: "gsk_123", newPassword: "n3w" },
    });

    expect(lines[0].user).toEqual({ password: "[Redacted]", refreshToken: "[Redacted]", accessToken: "[Redacted]" });
    expect(lines[0].body).toEqual({ idToken: "[Redacted]", apiKey: "[Redacted]", newPassword: "[Redacted]" });
  });

  it("masks emails instead of removing them", () => {
    const { log, lines } = capture();
    log.info({ job: { email: "pratik@gmail.com", username: "pratik" } });

    expect(lines[0].job).toEqual({ email: "p***@gmail.com", username: "pratik" });
  });

  it("redacts auth headers and cookies on requests", () => {
    const { log, lines } = capture();
    log.info({ req: { headers: { authorization: "Bearer a.b.c", cookie: "refreshToken=x", host: "api" } } });

    expect(lines[0].req.headers).toEqual({ authorization: "[Redacted]", cookie: "[Redacted]", host: "api" });
  });
});
