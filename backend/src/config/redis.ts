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

export const createRedisConnection = (): IORedis =>
  new IORedis(env.REDIS_URL, baseOptions);
