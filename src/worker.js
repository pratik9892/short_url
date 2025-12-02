import { configDotenv } from "dotenv";
import { createEmailWorker } from "./infrastructure/queue/emailQueue.js";
import { createAnalyticsWorker } from "./infrastructure/queue/analyticsQueue.js";

import { config as appConfig } from "./config/server.config.js";
import { connectToDB } from "./config/mongodb.config.js";

configDotenv();

async function startWorker() {
  console.log(`Background Worker Process Started.`);
  console.log(`Redis Host: ${appConfig.redis.HOST}:${appConfig.redis.PORT}`);
  console.log("Listening for jobs on 'emailQueue' and 'analyticsQueue'...");

  await connectToDB();

  // Create Workers - only happens in this process
  createEmailWorker();
  createAnalyticsWorker();

  console.log("Worker connected to MongoDB");
  console.log("Workers initialized and listening for jobs");
}

startWorker().catch((err) => {
  console.error("Worker startup failed", err);
  process.exit(1);
});