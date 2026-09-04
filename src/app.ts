import "./config/nodePolyfills";
import express, { type Express, type Request, type Response } from "express";
import cors from "cors";
import helmet from "helmet";
import { errorHandler } from "./middlewares/errorHandler";
import { formatSuccess } from "./responses/envelope";
import { NotFoundError } from "./types/errors";
import { env } from "./config/env";

import authRouter from "./routes/v1/auth.routes";
import usersRouter from "./routes/v1/users.routes";

export function createApp(): Express {
  const app: Express = express();

  // Security & standard middlewares
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN || "*",
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );
  app.use(express.json());

  // Health check endpoint
  app.get("/api/v1/health", (_req: Request, res: Response) => {
    res.status(200).json(
      formatSuccess(
        {
          status: "ok",
          uptime: process.uptime(),
          timestamp: new Date().toISOString(),
        },
        "Service is healthy."
      )
    );
  });

  // API v1 routes
  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/users", usersRouter);

  // 404 catch-all
  app.use((_req: Request, _res: Response) => {
    throw new NotFoundError("Route not found.");
  });

  // Central error handler
  app.use(errorHandler);

  return app;
}
