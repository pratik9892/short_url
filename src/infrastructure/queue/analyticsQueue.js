import { Queue, Worker } from "bullmq";
import { REDIS_CONNECTION } from "../../config/redis.config.js";
import { AnalyticsService } from "../../domains/analytics/analytics.service.js";
import { AnalyticsRepository } from "../../domains/analytics/analytics.repo.js";
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
    },
    { connection: REDIS_CONNECTION }
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
