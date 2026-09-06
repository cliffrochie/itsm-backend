import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AppError } from "../types/errors";
import { formatError } from "../responses/envelope";
import { logger } from "../config/logger";
import { reportException } from "../config/sentry";

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json(formatError(err.message, err.errors));
    return;
  }

  if (err instanceof ZodError) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of err.issues) {
      const path = issue.path.join(".") || "general";
      if (!fieldErrors[path]) {
        fieldErrors[path] = [];
      }
      fieldErrors[path].push(issue.message);
    }
    res.status(422).json(formatError("Validation failed.", fieldErrors));
    return;
  }

  if (err instanceof SyntaxError && "body" in err) {
    res.status(400).json(formatError("Malformed JSON payload.", null));
    return;
  }

  logger.error({ err }, "Unhandled server error");

  // Only genuinely unexpected failures reach Sentry. The branches above —
  // validation, auth, not-found, malformed JSON — returned already.
  reportException(err, {
    userId: (req as Request & { user?: { id?: number } }).user?.id ?? null,
    route: req.originalUrl,
    method: req.method,
  });
  res.status(500).json(formatError("Internal server error.", null));
}
