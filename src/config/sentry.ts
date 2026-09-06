import * as Sentry from "@sentry/node";
import { env } from "./env";
import { logger } from "./logger";

/**
 * Error monitoring.
 *
 * Disabled unless SENTRY_DSN is set, so development, CI and the test suite
 * never reach an external service. Everything below assumes the worst about
 * what a payload might contain: this codebase has previously leaked plaintext
 * passwords into its own audit table, and an error report is just another
 * place a request body can end up.
 */

let initialized = false;

export function initSentry(): void {
  const dsn = env.SENTRY_DSN || process.env.SENTRY_DSN;

  if (!dsn) {
    logger.info("Sentry DSN not configured; error monitoring is disabled.");
    return;
  }

  Sentry.init({
    dsn,
    environment: env.NODE_ENV || process.env.NODE_ENV || "development",
    // Never attach cookies, headers or request bodies to an event.
    sendDefaultPii: false,
    tracesSampleRate: 0,
    beforeSend(event) {
      // Belt and braces: even with sendDefaultPii off, drop anything that could
      // carry credentials before the event leaves the process.
      if (event.request) {
        delete event.request.data;
        delete event.request.cookies;
        delete event.request.headers;
        delete event.request.query_string;
      }
      return event;
    },
  });

  initialized = true;
  logger.info("Sentry error monitoring enabled.");
}

export function isSentryEnabled(): boolean {
  return initialized;
}

/**
 * Reports an unexpected failure. Expected outcomes — a rejected login, a
 * validation failure, a 404 — are deliberately not reported: they are normal
 * operation, and burying real crashes under them is how error monitoring stops
 * being read.
 */
export function reportException(
  error: unknown,
  context?: { userId?: number | null; route?: string; method?: string }
): void {
  if (!initialized) {
    return;
  }

  Sentry.withScope((scope) => {
    if (context?.userId != null) {
      // Id only. No email, no username.
      scope.setUser({ id: String(context.userId) });
    }
    if (context?.route) {
      scope.setTag("route", context.route);
    }
    if (context?.method) {
      scope.setTag("method", context.method);
    }
    Sentry.captureException(error);
  });
}

/** Gives queued events a chance to leave the process during shutdown. */
export async function flushSentry(timeoutMs = 2000): Promise<void> {
  if (!initialized) {
    return;
  }
  try {
    await Sentry.flush(timeoutMs);
  } catch (err) {
    logger.error({ err }, "Failed to flush Sentry events");
  }
}
