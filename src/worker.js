import "dotenv/config";

import "./infrastructure/queue/emailQueue.js";
import "./infrastructure/queue/analyticsQueue.js";

import { config as appConfig } from "./config/server.config.js";
import { connectToDB } from "./config/mongodb.config.js";

async function startWorker() {
  console.log("-----------------------------------------");
  console.log(`✅ Background Worker Process Started.`);
  console.log(`Redis Host: ${appConfig.redis.HOST}:${appConfig.redis.PORT}`);
  console.log("Listening for jobs on 'emailQueue' and 'analyticsQueue'...");

  await connectToDB();

  console.log("✅ Worker connected to MongoDB");
  console.log("-----------------------------------------");
}

startWorker().catch((err) => {
  console.error("Worker startup failed", err);
  process.exit(1);
});