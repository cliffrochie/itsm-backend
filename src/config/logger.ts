import pino from "pino";
import { env } from "./env";

/**
 * Application logger.
 *
 * The serializers below are an allowlist, not a blocklist. Request bodies and
 * headers are never serialized at all, so an Authorization header, a session
 * cookie or a password field cannot reach the logs by being forgotten in a
 * redaction list — the blueprint is explicit that tokens and sensitive
 * payloads must never be logged.
 *
 * Under NODE_ENV=test the level is `silent`, so the middleware still runs and
 * is exercised by the suite without writing anything to the test output.
 */

function resolveLevel(): pino.LevelWithSilent {
  if (process.env.NODE_ENV === "test") {
    return "silent";
  }
  return (env.LOG_LEVEL || process.env.LOG_LEVEL || "info") as pino.LevelWithSilent;
}

export const logger = pino({
  level: resolveLevel(),
  base: { service: "itsm-backend" },
  timestamp: pino.stdTimeFunctions.isoTime,
  serializers: {
    req(req: { id?: unknown; method?: string; url?: string; remoteAddress?: string }) {
      return {
        id: req.id,
        method: req.method,
        url: req.url,
        remoteAddress: req.remoteAddress,
      };
    },
    res(res: { statusCode?: number }) {
      return { statusCode: res.statusCode };
    },
    err: pino.stdSerializers.err,
  },
});
