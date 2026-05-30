import { app } from "./app";
import { env } from "./config/env";
import { redis } from "./config/redis";
import { logger } from "./utils/logger";
import { startWorkers, stopWorkers } from "./workers";
import { startScheduler, stopScheduler } from "./workers/scheduler";

async function main() {
  await redis.ping();
  logger.info("redis connected");

  const server = app.listen(env.PORT, () => {
    logger.info(`api listening on http://localhost:${env.PORT}`);
  });

  const workers = startWorkers();
  startScheduler();
  logger.info("workers + scheduler started");

  const shutdown = async (signal: string) => {
    logger.info({ signal }, "shutting down");
    server.close();
    await stopScheduler();
    await stopWorkers(workers);
    await redis.quit();
    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

main().catch((err) => {
  logger.error({ err }, "fatal boot error");
  process.exit(1);
});
