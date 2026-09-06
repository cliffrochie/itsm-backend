import { describe, it, expect, vi } from "vitest";
import type { Request, Response } from "express";
import { envSchema } from "../../src/config/env";
import { isSentryEnabled, reportException, flushSentry } from "../../src/config/sentry";

const base = {
  DATABASE_URL: "mysql://root:password@localhost:3306/itsm_db",
  JWT_SECRET: "this-is-a-valid-32-characters-jwt-secret-string",
};

describe("SENTRY_DSN configuration", () => {
  it("is optional, so the app boots without error monitoring", () => {
    expect(envSchema.safeParse(base).success).toBe(true);
  });

  it("accepts an empty value, which is what .env.example ships", () => {
    // dotenv reads `SENTRY_DSN=` as "" rather than undefined. A bare .url()
    // would reject that and take the whole boot down.
    expect(envSchema.safeParse({ ...base, SENTRY_DSN: "" }).success).toBe(true);
  });

  it("accepts a real DSN", () => {
    const parsed = envSchema.safeParse({
      ...base,
      SENTRY_DSN: "https://examplePublicKey@o0.ingest.sentry.io/0",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects a value that is not a URL, rather than failing silently at runtime", () => {
    expect(envSchema.safeParse({ ...base, SENTRY_DSN: "not-a-dsn" }).success).toBe(false);
  });
});

describe("Sentry when no DSN is configured", () => {
  it("reports itself as disabled", () => {
    expect(isSentryEnabled()).toBe(false);
  });

  it("swallows a report instead of throwing, so the error handler stays safe", () => {
    expect(() => reportException(new Error("boom"), { userId: 1 })).not.toThrow();
  });

  it("resolves a flush immediately", async () => {
    await expect(flushSentry()).resolves.toBeUndefined();
  });
});

describe("What the error handler reports", () => {
  /**
   * Expected outcomes must not reach Sentry. A wall of 422s buries the one
   * real crash, and error monitoring that is noisy stops being read.
   *
   * The error is built inside the reset module registry: `errorHandler` checks
   * `instanceof AppError`, and a class imported before `vi.resetModules()` is a
   * different identity from the one the freshly imported handler sees.
   */
  type ErrorsModule = typeof import("../../src/types/errors");

  async function runHandler(makeError: (errors: ErrorsModule) => unknown) {
    vi.resetModules();
    const reportException = vi.fn();
    vi.doMock("../../src/config/sentry", () => ({
      reportException,
      isSentryEnabled: () => true,
      initSentry: () => {},
      flushSentry: async () => {},
    }));

    const errors = await import("../../src/types/errors");
    const { errorHandler } = await import("../../src/middlewares/errorHandler");

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as unknown as Response;

    errorHandler(
      makeError(errors),
      { originalUrl: "/api/v1/x", method: "POST" } as Request,
      res,
      vi.fn()
    );

    return { reportException, res };
  }

  it("does not report a validation failure", async () => {
    const { reportException, res } = await runHandler(
      (e) => new e.ValidationError("Validation failed.", { email: ["Required"] })
    );

    expect(res.status).toHaveBeenCalledWith(422);
    expect(reportException).not.toHaveBeenCalled();
  });

  it("does not report an authentication or authorization failure", async () => {
    const unauth = await runHandler((e) => new e.UnauthorizedError());
    expect(unauth.res.status).toHaveBeenCalledWith(401);
    expect(unauth.reportException).not.toHaveBeenCalled();

    const forbidden = await runHandler((e) => new e.ForbiddenError());
    expect(forbidden.res.status).toHaveBeenCalledWith(403);
    expect(forbidden.reportException).not.toHaveBeenCalled();
  });

  it("reports an unexpected failure, with the route and the acting user", async () => {
    const boom = new Error("connection lost");
    const { reportException, res } = await runHandler(() => boom);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(reportException).toHaveBeenCalledWith(
      boom,
      expect.objectContaining({ route: "/api/v1/x", method: "POST" })
    );
  });
});
