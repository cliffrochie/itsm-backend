import { describe, it, expect } from "vitest";
import { logger } from "../../src/config/logger";
import { envSchema } from "../../src/config/env";

/**
 * The audit log once persisted plaintext passwords. These tests pin the
 * property that made that possible: that anything other than an explicit
 * allowlist of request fields can reach a log line.
 */
describe("Logger request serialization", () => {
  const serializers = logger[Symbol.for("pino.serializers")] as {
    req: (value: unknown) => Record<string, unknown>;
    res: (value: unknown) => Record<string, unknown>;
  };

  it("keeps only method, url, id and remote address from a request", () => {
    const serialized = serializers.req({
      id: 7,
      method: "POST",
      url: "/api/v1/auth/login",
      remoteAddress: "127.0.0.1",
      headers: {
        authorization: "Bearer super-secret-token",
        cookie: "session=abc123",
      },
      body: { username: "admin", password: "hunter2" },
    });

    expect(serialized).toEqual({
      id: 7,
      method: "POST",
      url: "/api/v1/auth/login",
      remoteAddress: "127.0.0.1",
    });
  });

  it("cannot leak an authorization header, a cookie, or a request body", () => {
    const serialized = serializers.req({
      method: "POST",
      url: "/api/v1/users/1/change-password",
      headers: { authorization: "Bearer leaked" },
      body: { currentPassword: "old-secret", newPassword: "new-secret" },
    });

    const flattened = JSON.stringify(serialized);

    expect(serialized).not.toHaveProperty("headers");
    expect(serialized).not.toHaveProperty("body");
    expect(flattened).not.toContain("leaked");
    expect(flattened).not.toContain("old-secret");
    expect(flattened).not.toContain("new-secret");
  });

  it("keeps only the status code from a response", () => {
    const serialized = serializers.res({
      statusCode: 200,
      headers: { "set-cookie": "session=abc123" },
    });

    expect(serialized).toEqual({ statusCode: 200 });
  });

  it("is silent under NODE_ENV=test so the suite stays readable", () => {
    expect(process.env.NODE_ENV).toBe("test");
    expect(logger.level).toBe("silent");
  });
});

describe("LOG_LEVEL configuration", () => {
  it("defaults to info", () => {
    const parsed = envSchema.parse({
      DATABASE_URL: "mysql://root:password@localhost:3306/itsm_db",
      JWT_SECRET: "this-is-a-valid-32-characters-jwt-secret-string",
    });

    expect(parsed.LOG_LEVEL).toBe("info");
  });

  it("rejects a level pino would not understand", () => {
    const parsed = envSchema.safeParse({
      DATABASE_URL: "mysql://root:password@localhost:3306/itsm_db",
      JWT_SECRET: "this-is-a-valid-32-characters-jwt-secret-string",
      LOG_LEVEL: "chatty",
    });

    expect(parsed.success).toBe(false);
  });
});
