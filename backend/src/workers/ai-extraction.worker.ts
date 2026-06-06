import { Worker } from "bullmq";
import { redis } from "../config/redis";
import {
  AI_EXTRACTION_QUEUE,
  type AiExtractionJobData,
} from "../queues/ai-extraction.queue";
import { extractTaskFromEvent } from "../services/ai/extractor";
import { logger } from "../utils/logger";

export function createAiExtractionWorker(): Worker<AiExtractionJobData> {
  return new Worker<AiExtractionJobData>(
    AI_EXTRACTION_QUEUE,
    async (job) => {
      const { eventId, userId } = job.data;
      logger.debug({ eventId, userId }, "ai extraction start");
      const result = await extractTaskFromEvent(eventId);
      logger.debug(
        { eventId, taskId: result?.taskId, confidence: result?.confidence },
        "ai extraction done",
      );
      return result;
    },
    {
      connection: redis,
      concurrency: 3,
    },
  );
}
