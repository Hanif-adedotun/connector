import { type JobsOptions, Queue } from "bullmq";
import { redis } from "../config/redis";

export const AI_EXTRACTION_QUEUE = "ai-extraction";
export const AI_EXTRACTION_JOB_NAME = "extract" as const;

export interface AiExtractionJobData {
  eventId: string;
  userId: string;
}

export const aiExtractionQueue = new Queue<
  AiExtractionJobData,
  unknown,
  "extract"
>(
  AI_EXTRACTION_QUEUE,
  {
    connection: redis,
    defaultJobOptions: {
      attempts: 2,
      backoff: { type: "exponential", delay: 2000 },
      removeOnComplete: { count: 200 },
      removeOnFail: { count: 500 },
    },
  },
);

export function enqueueAiExtractionJob(
  data: AiExtractionJobData,
  opts?: JobsOptions,
) {
  return aiExtractionQueue.add(AI_EXTRACTION_JOB_NAME, data, opts);
}
