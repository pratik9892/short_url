import geoip from "geoip-lite";

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
    console.error("GeoIP lookup failed", error);
    return {};
  }
}


