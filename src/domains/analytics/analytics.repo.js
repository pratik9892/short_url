import { Analytics } from "./analytics.model.js";

export class AnalyticsRepository {
  async createClickEvent(data) {
    try {
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
    } catch (error) {
      console.log(error);
      throw error
    }
  }

  async deleteAnalytics(linkId){
    try {
      const deletedAnalytics = await Analytics.deleteMany({ link: linkId });

    if (!deletedAnalytics) {
      throw new NotFound("Analytics", linkId);
    }

    return deletedAnalytics;
    } catch (error) {
      console.log(error);
      throw error
    }
  }

  async updateLongUrl(linkId, longUrl){
    try {
      const updatedAanalytics = await Analytics.updateMany({
        link: linkId
      }, {
        $set: {
          longUrl: longUrl
        }
      })

      return updatedAanalytics
    } catch (error) {
      console.log(error);
      throw error
    }
  }

  
}


