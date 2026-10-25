import { UAParser } from "ua-parser-js";

export function getDeviceFromUserAgent(userAgent) {
  if (!userAgent) return {};

  try {
    const { browser, os, device } = new UAParser(userAgent).getResult();

    return {
      browser: browser.name || undefined,
      os: os.name || undefined,
      // ua-parser leaves device.type empty for desktops; smart TVs, consoles etc. also count as desktop
      deviceType:
        device.type === "mobile" || device.type === "tablet"
          ? device.type
          : "desktop",
    };
  } catch (error) {
    console.error("User-agent parsing failed", error);
    return {};
  }
}
