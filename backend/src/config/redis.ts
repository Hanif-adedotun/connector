import type { ConnectionOptions } from "bullmq";
import IORedis, { type RedisOptions } from "ioredis";
import { env } from "./env";

const baseOptions: RedisOptions = {
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
  lazyConnect: false,
};

export const redis = new IORedis(env.REDIS_URL, baseOptions);

redis.on("error", (err) => {
  console.error("[redis] error", err.message);
});

/** BullMQ connection config — options object, not an IORedis instance. */
export function createRedisConnection(): ConnectionOptions {
  return {
    url: env.REDIS_URL,
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    lazyConnect: false,
  };
}
