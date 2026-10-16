import { Analytics } from "./analytics.model.js"

function normalizeOwnerId(userId) {
  if (!userId) return userId
  return typeof userId === "object" && userId._id != null ? userId._id : userId
}

export class AnalyticsRepository {
  async createClickEvent(data) {
    try {
      return await Analytics.create({
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
      })
    } catch (error) {
      console.log(error)
      throw error
    }
  }

  async deleteAnalytics(linkId) {
    try {
      return await Analytics.deleteMany({ link: linkId })
    } catch (error) {
      console.log(error)
      throw error
    }
  }

  async updateLongUrl(linkId, longUrl) {
    try {
      return await Analytics.updateMany({ link: linkId }, { $set: { longUrl } })
    } catch (error) {
      console.log(error)
      throw error
    }
  }

  async getAnalyticsForLink(linkId, userId) {
    try {
      const ownerId = normalizeOwnerId(userId)
      return await Analytics.find({ link: linkId, linkOwner: ownerId }).sort({
        clickedAt: -1,
      })
    } catch (error) {
      console.log(error)
      throw error
    }
  }

  async getAnalyticsForAllLinks(userId) {
    try {
      const ownerId = normalizeOwnerId(userId)
      return await Analytics.find({ linkOwner: ownerId }).sort({ clickedAt: -1 })
    } catch (error) {
      console.log(error)
      throw error
    }
  }
}
