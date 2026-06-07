import cors from "cors";
import express from "express";
import helmet from "helmet";
import { getAllowedOrigins } from "./config/cors";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware";
import { router } from "./routes";

export function createApp() {
  const app = express();
  const allowedOrigins = getAllowedOrigins();

  app.disable("x-powered-by");

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(null, false);
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "Accept"],
    }),
  );

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", uptime: process.uptime() });
  });

  app.use("/api", router);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export const app = createApp();
