import geoip from "geoip-lite";
import { logger } from "../logger/logger.js";

export function getGeoFromIp(ip) {
  if (!ip) return {};

  try {
    const geo = geoip.lookup(ip);

    if (!geo) {
      return {};
    }

    return {
      country: geo.country || undefined,
      region: Array.isArray(geo.region)
        ? geo.region[0]
        : geo.region || undefined,
      city: geo.city || undefined,
    };
  } catch (error) {
    logger.warn({ err: error }, "GeoIP lookup failed");
    return {};
  }
}


