import type { Request, Response, NextFunction } from "express";
import type { ZodType, ZodError } from "zod";
import { formatError } from "../responses/envelope";

export function validate(schema: ZodType, source: "body" | "query" | "params" = "body") {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of (result.error as ZodError).issues) {
        const path = issue.path.join(".") || "general";
        if (!fieldErrors[path]) {
          fieldErrors[path] = [];
        }
        fieldErrors[path].push(issue.message);
      }
      res.status(422).json(formatError("Validation failed.", fieldErrors));
      return;
    }
    // Update target with coerced/cleaned data
    if (source === "body") {
      req.body = result.data;
    } else {
      const target = req[source] as Record<string, unknown>;
      for (const key of Object.keys(target)) {
        delete target[key];
      }
      Object.assign(target, result.data);
    }
    next();
  };
}
