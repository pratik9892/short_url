import { describe, expect, it } from "vitest";
import { getDeviceFromUserAgent } from "./ua.util.js";

const IPHONE_SAFARI =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1";
const ANDROID_CHROME =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36";
const IPAD_SAFARI =
  "Mozilla/5.0 (iPad; CPU OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1";
const WINDOWS_CHROME =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

describe("getDeviceFromUserAgent", () => {
  it("detects an iPhone", () => {
    expect(getDeviceFromUserAgent(IPHONE_SAFARI)).toEqual({
      browser: "Mobile Safari",
      os: "iOS",
      deviceType: "mobile",
    });
  });

  it("detects an Android phone", () => {
    expect(getDeviceFromUserAgent(ANDROID_CHROME)).toEqual({
      browser: "Chrome",
      os: "Android",
      deviceType: "mobile",
    });
  });

  it("detects a tablet", () => {
    expect(getDeviceFromUserAgent(IPAD_SAFARI).deviceType).toBe("tablet");
  });

  it("treats a desktop browser as desktop", () => {
    expect(getDeviceFromUserAgent(WINDOWS_CHROME)).toEqual({
      browser: "Chrome",
      os: "Windows",
      deviceType: "desktop",
    });
  });

  it("returns {} when there is no user-agent", () => {
    expect(getDeviceFromUserAgent(undefined)).toEqual({});
    expect(getDeviceFromUserAgent("")).toEqual({});
  });
});
