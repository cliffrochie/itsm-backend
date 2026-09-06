import swaggerUi from "swagger-ui-express";
import type { Express, Request, Response, NextFunction } from "express";
import { buildOpenApiDocument } from "./openapi";
import { env } from "../config/env";
import { logger } from "../config/logger";
import { authenticate } from "../middlewares/authenticate";
import { requireUser, isAdmin } from "../authorization/roles";
import { ForbiddenError } from "../types/errors";
import type { AuthRequest } from "../types/auth";

/**
 * Mounts the API reference at /api/v1/docs, with the spec itself at
 * /api/v1/docs.json.
 *
 * security.md requires these docs to be disabled or auth-gated in production.
 * Outside production they are open, because that is the point of them. In
 * production they are off unless DOCS_ENABLED is set, and even then they are
 * behind a bearer token and an administrator check — a public spec hands an
 * attacker a map of every endpoint, its roles and its payloads.
 */
export function mountDocs(app: Express): void {
  const isProduction = (env.NODE_ENV || process.env.NODE_ENV) === "production";
  const enabled = !isProduction || env.DOCS_ENABLED === true;

  if (!enabled) {
    logger.info("API docs are disabled in production. Set DOCS_ENABLED=true to expose them.");
    return;
  }

  const guards: Array<(req: Request, res: Response, next: NextFunction) => void> = [];

  if (isProduction) {
    guards.push((req, res, next) => {
      void Promise.resolve(authenticate(req as AuthRequest, res, next)).catch(next);
    });
    guards.push((req, _res, next) => {
      const actor = requireUser((req as AuthRequest).user);
      if (!isAdmin(actor)) {
        throw new ForbiddenError("Only administrators can read the API reference.");
      }
      next();
    });
  }

  const document = buildOpenApiDocument();

  app.get("/api/v1/docs.json", ...guards, (_req: Request, res: Response) => {
    res.status(200).json(document);
  });

  app.use("/api/v1/docs", ...guards, swaggerUi.serve, swaggerUi.setup(document));

  logger.info(
    { authGated: isProduction },
    "API reference mounted at /api/v1/docs (spec at /api/v1/docs.json)"
  );
}
