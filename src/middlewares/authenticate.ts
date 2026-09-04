import type { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UnauthorizedError } from "../types/errors";
import { env } from "../config/env";
import type { AuthRequest, AuthenticatedUser } from "../types/auth";

export function authenticate(req: AuthRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new UnauthorizedError("Unauthenticated.");
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    throw new UnauthorizedError("Unauthenticated.");
  }

  const jwtSecret = env.JWT_SECRET || process.env.JWT_SECRET || "default-secret-32-chars-long-fallback";

  try {
    const decoded = jwt.verify(token, jwtSecret) as AuthenticatedUser;
    req.user = decoded;
    next();
  } catch {
    throw new UnauthorizedError("Unauthenticated.");
  }
}
