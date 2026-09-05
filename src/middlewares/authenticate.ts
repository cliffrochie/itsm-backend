import type { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UnauthorizedError } from "../types/errors";
import { getJwtSecret } from "../config/env";
import { tokenService } from "../services/token.service";
import type { AuthRequest, AuthenticatedUser } from "../types/auth";

export async function authenticate(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new UnauthorizedError("Unauthenticated.");
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    throw new UnauthorizedError("Unauthenticated.");
  }

  let decoded: AuthenticatedUser;
  try {
    decoded = jwt.verify(token, getJwtSecret()) as AuthenticatedUser;
  } catch {
    throw new UnauthorizedError("Unauthenticated.");
  }

  // A valid signature is not enough: the token must also still be one this
  // server recognizes, so a logged-out token stops working immediately rather
  // than lingering until it expires.
  await tokenService.assertActive(token);

  req.user = decoded;
  req.token = token;
  next();
}
