import { AnalyticsRepository } from "./analytics.repo.js";

export class AnalyticsService {
  constructor(analyticsRepository = new AnalyticsRepository()) {
    this.analyticsRepository = analyticsRepository;
  }

  async trackClickEvent(data) {
    return this.analyticsRepository.createClickEvent(data);
  }
}


