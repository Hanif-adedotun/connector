import { Queue } from "bullmq";
import { createRedisConnection } from "../config/redis";

export const AI_EXTRACTION_QUEUE = "ai-extraction";

export interface AiExtractionJobData {
  eventId: string;
  userId: string;
}

export const aiExtractionQueue = new Queue<AiExtractionJobData>(
  AI_EXTRACTION_QUEUE,
  {
    connection: createRedisConnection(),
    defaultJobOptions: {
      attempts: 2,
      backoff: { type: "exponential", delay: 2000 },
      removeOnComplete: { count: 200 },
      removeOnFail: { count: 500 },
    },
  },
);
