import { Analytics } from "./analytics.model.js";

export class AnalyticsRepository {
  async createClickEvent(data) {
    const doc = await Analytics.create({
      link: data.linkId,
      linkOwner: data.linkOwnerId,
      shortCode: data.shortCode,
      longUrl: data.longUrl,
      ip: data.ip,
      userAgent: data.userAgent,
      referer: data.referer,
      country: data.country,
      region: data.region,
      city: data.city,
      deviceType: data.deviceType,
      browser: data.browser,
      os: data.os,
      clickedAt: data.clickedAt || new Date(),
    });

    return doc;
  }
}


