import type { ConnectionOptions } from "bullmq";
import IORedis, { type RedisOptions } from "ioredis";
import { env } from "./env";

const baseOptions: RedisOptions = {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  lazyConnect: false,
};

function bullmqConnectionFromUrl(url: string): ConnectionOptions {
  const parsed = new URL(url);
  const db =
    parsed.pathname.length > 1 ? Number(parsed.pathname.slice(1)) : undefined;

  return {
    ...baseOptions,
    host: parsed.hostname,
    port: parsed.port ? Number(parsed.port) : 6379,
    username: parsed.username || undefined,
    password: parsed.password
      ? decodeURIComponent(parsed.password)
      : undefined,
    ...(db !== undefined && Number.isFinite(db) ? { db } : {}),
  };
}

/** BullMQ connection config — options object, not a shared IORedis instance. */
export const bullmqConnection = bullmqConnectionFromUrl(env.REDIS_URL);

/** Shared Redis client for app code (rate limits, health checks). */
export const redis = new IORedis(env.REDIS_URL, baseOptions);

redis.on("error", (err) => {
  console.error("[redis] error", err.message);
});
