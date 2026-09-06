import rateLimit from "express-rate-limit";
import type { Request, Response } from "express";
import { formatError } from "../responses/envelope";

const FIVE_MINUTES = 5 * 60 * 1000;

/**
 * Blueprint limit for login: 5 attempts per IP with a 5-minute lockout.
 * `standardHeaders` emits `RateLimit-*` so clients can honour retry-after
 * instead of hammering the endpoint.
 */
export const loginRateLimiter = rateLimit({
  windowMs: FIVE_MINUTES,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response): void => {
    res.status(429).json(formatError("Too many login attempts. Please try again later.", null));
  },
});
