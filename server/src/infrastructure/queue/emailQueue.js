import { Queue, Worker, Job } from "bullmq";
import { REDIS_CONNECTION } from "../../config/redis.config.js";
import { sendWelcomeEmail } from "../utils/email.utils.js";
import { ConflictError } from "../../errors/conflictError.js";

const QUEUE_NAME = "emailQueue";

// Export Queue only - for controllers to add jobs
export const emailQueue = new Queue(QUEUE_NAME, {
  connection: REDIS_CONNECTION,
  defaultJobOptions: {
    attempts: 1,
    backoff: { type: "exponential", delay: 5000 },
    timeout: 60000,
    removeOnComplete: true,
    removeOnFail: false,
  },
});

// Export function to create Worker - only called in worker.js
export function createEmailWorker() {
  const emailWorker = new Worker(
    QUEUE_NAME,
    async (job) => {
      const { email, username } = job.data;

      if (!email || !username) {
        throw new ConflictError("username or email not found");
      }

      console.log("Attempting to send email to " + email);

      const result = await sendWelcomeEmail(email, username);

      return result;
    },
    { connection: REDIS_CONNECTION }
  );

  emailWorker.on("completed", (job) => {
    console.log({
      jobData: job.data,
      message: "JOB COMPLETED",
    });
  });
  emailWorker.on("failed", (job) => {
    console.log({
      jobData: job,
      message: "JOB FAILED",
    });
  });
  emailWorker.on("error", (job) => {
    console.log(`JOB error ${job}`);
  });

  return emailWorker;
} 