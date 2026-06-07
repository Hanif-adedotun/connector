import IORedis, { type RedisOptions } from "ioredis";
import { env } from "./env";

const baseOptions: RedisOptions = {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  lazyConnect: false,
};

/** Shared Redis client for app code, BullMQ queues, and workers. */
export const redis = new IORedis(env.REDIS_URL, baseOptions);

redis.on("error", (err) => {
  console.error("[redis] error", err.message);
});
