export class AnalyticsService {
  constructor(analyticsRepository) {
    this.analyticsRepository = analyticsRepository
  }

  async trackClickEvent(data) {
    return this.analyticsRepository.createClickEvent(data)
  }

  async onDeleteCascadeAanlytics(linkId) {
    return this.analyticsRepository.deleteAnalytics(linkId)
  }

  async updateLongUrl(linkId, longUrl) {
    return this.analyticsRepository.updateLongUrl(linkId, longUrl)
  }

  async getAnalyticsForLink(linkId, userId) {
    return this.analyticsRepository.getAnalyticsForLink(linkId, userId)
  }

  async getAnalyticsForAllLinks(userId) {
    return this.analyticsRepository.getAnalyticsForAllLinks(userId)
  }
}
