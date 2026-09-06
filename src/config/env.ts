import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(5000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  // Blueprint: access tokens are short-lived (15-60 minutes) with no silent
  // refresh. The client re-authenticates when it receives a 401.
  JWT_EXPIRES_IN: z.string().default("60m"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  // Optional. When unset, error monitoring stays off — development, CI and the
  // test suite must never reach an external service.
  // An empty value counts as unset: .env.example ships `SENTRY_DSN=` and dotenv
  // reads that as "", which a bare .url() would reject and take the boot down.
  SENTRY_DSN: z.union([z.string().url(), z.literal("")]).optional(),
  // Number of reverse proxy hops in front of the app. 0 means the app is
  // exposed directly. Behind one nginx, set 1 — otherwise every request looks
  // like it came from the proxy, which both blanks the audit trail's IP column
  // and makes the login rate limiter count the whole internet as one client.
  // Never set this higher than the real hop count: it lets clients forge
  // X-Forwarded-For.
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(rawEnv: Record<string, unknown> = process.env): Env {
  const result = envSchema.safeParse(rawEnv);
  if (!result.success) {
    const errorDetails = result.error.flatten().fieldErrors;
    console.error("Environment validation error:", errorDetails);
    throw new Error(`Invalid environment configuration: ${JSON.stringify(errorDetails)}`);
  }
  return result.data;
}

export const env = process.env.NODE_ENV === "test" ? ({} as Env) : validateEnv(process.env);

/**
 * Single resolution point for the JWT signing secret.
 *
 * Application code must never reach for `process.env` itself, and must never
 * fall back to a literal default — a hardcoded secret is a publicly known
 * secret. Under NODE_ENV=test `env` is deliberately empty, so the raw
 * environment is the only source there.
 */
export function getJwtSecret(): string {
  const secret = env.JWT_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured.");
  }
  return secret;
}

/** Token lifetime, expressed the way `jsonwebtoken` expects it. */
export function getJwtExpiresIn(): string {
  return env.JWT_EXPIRES_IN || process.env.JWT_EXPIRES_IN || "60m";
}
