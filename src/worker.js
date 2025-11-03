// import { config } from "dotenv"
// config()
// import "./infrastructure/queue/emailQueue.js"

// worker.js: The dedicated entry point for the BullMQ Worker process.

// 1. Load Environment Variables (using the clean ESM pattern)
// This makes process.env.SENDGRID_API_KEY available.
import 'dotenv/config'; 

// 2. Import the Queue Logic
// This import executes the 'new Worker(...)' definition inside emailQueue.js, 
// causing the worker process to connect to Redis and start listening.
import './src/infrastructure/queue/emailQueue.js'; 

// 3. Import Application Config (using an alias to prevent conflict)
import { config as appConfig } from "./config/server.config.js"; 
// Note: We use appConfig here, not just 'config', to prevent shadowing the dotenv function.

// 4. Start Function
function startWorker() {
    console.log("-----------------------------------------");
    console.log(`✅ Background Worker Process Started.`);
    console.log(`Redis Host: ${appConfig.redis.HOST}:${appConfig.redis.PORT}`);
    console.log("Listening for jobs on 'emailQueue'...");
    console.log("-----------------------------------------");
}

startWorker();