import { Queue, Worker } from "bullmq";
import { REDIS_CONNECTION, redisDuplicate } from "../../config/redis.config.js";
import { AnalyticsService } from "../../domains/analytics/analytics.service.js";
import { AnalyticsRepository } from "../../domains/analytics/analytics.repo.js";
import { LinkService } from "../../domains/link/link.service.js";
import { LinkRepository } from "../../domains/link/link.repo.js";
import { getGeoFromIp } from "../utils/geoip.util.js";

const QUEUE_NAME = "analyticsQueue";

// Export Queue only - for controllers to add jobs
export const analyticsQueue = new Queue(QUEUE_NAME, {
  connection: REDIS_CONNECTION,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    timeout: 60000,
    removeOnComplete: true,
    removeOnFail: false,
  },
});

// Export function to create Worker - only called in worker.js
export function createAnalyticsWorker() {
  const analyticsService = new AnalyticsService(new AnalyticsRepository());
  const linkService = new LinkService(new LinkRepository());

  const analyticsWorker = new Worker(
    QUEUE_NAME,
    async (job) => {
      const { ip, ...rest } = job.data || {};
      
      const geo = getGeoFromIp(ip);
      
      await analyticsService.trackClickEvent({
        ...rest,
        ip,
        country: geo.country,
        region: geo.region,
        city: geo.city,
      });

      // moved off the redirect path: the worker owns every click-driven write
      await linkService.incrementVisits(rest.linkId);
    },
    { connection: redisDuplicate() }
  );

  analyticsWorker.on("completed", (job) => {
    console.log("Analytics job completed", { id: job.id, data: job.data });
  });

  analyticsWorker.on("failed", (job, err) => {
    console.error("Analytics job failed", { id: job?.id, err });
  });

  analyticsWorker.on("error", (err) => {
    console.error("Analytics worker error", err);
  });

  return analyticsWorker;
}
