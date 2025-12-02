import { AnalyticsRepository } from "./analytics.repo.js";

export class AnalyticsService {
  constructor(analyticsRepository = new AnalyticsRepository()) {
    this.analyticsRepository = analyticsRepository;
  }

  async trackClickEvent(data) {
    try {
      const analytics = await this.analyticsRepository.createClickEvent(data);

      return analytics;
    } catch (error) {
      console.log(error);
      throw error
    }
  }

  async onDeleteCascadeAanlytics(linkId){
    try {
      const deletedAnalytics = await this.analyticsRepository.deleteAnalytics(linkId);

      return deletedAnalytics;
    } catch (error) {
      console.log(error);
      throw error
    }
  }

  async updateLongUrl(linkId, longUrl){
    try {
      const updatedLongUrls = await this.analyticsRepository.updateLongUrl(linkId, longUrl);

      return updatedLongUrls;
    } catch (error) {
      console.log(error);
      throw error
    }
  }
}


