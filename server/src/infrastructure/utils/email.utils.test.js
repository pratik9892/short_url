import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../../config/server.config.js", () => ({
  config: { server: { NODE_ENV: "test" }, email: { RESEND_API_KEY: "re_test", RESEND_FROM_EMAIL: "Shortly <hi@example.com>" } },
}));

const { sendWelcomeEmail } = await import("./email.utils.js");

function mockFetch(status, body) {
  const fetchMock = vi.fn().mockResolvedValue({ ok: status < 300, status, json: async () => body });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("sendWelcomeEmail", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("posts the welcome email to Resend with the API key and sender", async () => {
    const fetchMock = mockFetch(200, { id: "email_1" });

    await expect(sendWelcomeEmail("new@user.com", "newuser")).resolves.toBe("EmailSent");

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect(options.headers.Authorization).toBe("Bearer re_test");
    const sent = JSON.parse(options.body);
    expect(sent.to).toEqual(["new@user.com"]);
    expect(sent.from).toBe("Shortly <hi@example.com>");
    expect(sent.subject).toContain("newuser");
  });

  it("throws when Resend rejects the email", async () => {
    mockFetch(403, { name: "validation_error", message: "domain not verified" });

    await expect(sendWelcomeEmail("new@user.com", "newuser")).rejects.toThrow("Email not send");
  });

  it("throws when the request to Resend fails or times out", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("The operation was aborted due to timeout")));

    await expect(sendWelcomeEmail("new@user.com", "newuser")).rejects.toThrow("Email not send");
  });
});
