import "./config/nodePolyfills";
import express, { type Express, type Request, type Response } from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import { errorHandler } from "./middlewares/errorHandler";
import { formatSuccess } from "./responses/envelope";
import { NotFoundError } from "./types/errors";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { mountDocs } from "./docs/serveDocs";

import authRouter from "./routes/v1/auth.routes";
import usersRouter from "./routes/v1/users.routes";
import officesRouter from "./routes/v1/offices.routes";
import designationsRouter from "./routes/v1/designations.routes";
import clientsRouter from "./routes/v1/clients.routes";
import ticketsRouter from "./routes/v1/tickets.routes";
import notificationsRouter from "./routes/v1/notifications.routes";
import actionLogsRouter from "./routes/v1/actionLogs.routes";

export function createApp(): Express {
  const app: Express = express();

  // Governs what req.ip resolves to, which both the audit trail and the login
  // rate limiter depend on. See TRUST_PROXY in config/env.ts.
  app.set("trust proxy", env.TRUST_PROXY ?? 0);

  // Structured request logging. Mounted first so every request is accounted
  // for, including ones rejected by the security middlewares below.
  app.use(pinoHttp({ logger }));

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

  mountDocs(app);

  // API v1 routes
  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/users", usersRouter);
  app.use("/api/v1/offices", officesRouter);
  app.use("/api/v1/designations", designationsRouter);
  app.use("/api/v1/clients", clientsRouter);
  app.use("/api/v1/service-tickets", ticketsRouter);
  app.use("/api/v1/notifications", notificationsRouter);
  app.use("/api/v1/action-logs", actionLogsRouter);

  // 404 catch-all
  app.use((_req: Request, _res: Response) => {
    throw new NotFoundError("Route not found.");
  });

  // Central error handler
  app.use(errorHandler);

  return app;
}
