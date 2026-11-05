import { configDotenv } from "dotenv";
import { createEmailWorker } from "./infrastructure/queue/emailQueue.js";
import { createAnalyticsWorker } from "./infrastructure/queue/analyticsQueue.js";

import { config as appConfig } from "./config/server.config.js";
import { logRedisConfig } from "./config/redis.config.js";
import { connectToDB } from "./config/mongodb.config.js";
import { logger } from "./infrastructure/logger/logger.js";

configDotenv();

async function startWorker() {
  logger.info("worker starting");
  logRedisConfig();

  await connectToDB();

  // Create Workers - only happens in this process
  createEmailWorker();
  createAnalyticsWorker();

  logger.info({ queues: ["emailQueue", "analyticsQueue"] }, "workers ready");
}

startWorker().catch((err) => {
  logger.fatal({ err }, "worker startup failed");
  process.exit(1);
});