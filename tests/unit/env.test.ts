import { describe, it, expect } from "vitest";
import { validateEnv } from "../../src/config/env";

describe("Environment Configuration (Zod)", () => {
  it("throws validation error if DATABASE_URL is missing", () => {
    expect(() =>
      validateEnv({
        PORT: 5000,
        JWT_SECRET: "12345678901234567890123456789012",
      })
    ).toThrow();
  });

  it("throws error if JWT_SECRET is less than 32 characters", () => {
    expect(() =>
      validateEnv({
        DATABASE_URL: "mysql://root:password@localhost:3306/itsm_test",
        PORT: 5000,
        JWT_SECRET: "short-key",
      })
    ).toThrow();
  });

  it("parses and validates valid environment variables correctly", () => {
    const validConfig = {
      DATABASE_URL: "mysql://root:password@localhost:3306/itsm_test",
      PORT: "5000",
      JWT_SECRET: "this-is-a-valid-32-characters-jwt-secret-string",
      JWT_EXPIRES_IN: "7d",
      CORS_ORIGIN: "http://localhost:5173",
      NODE_ENV: "test",
    };

    const parsed = validateEnv(validConfig);
    expect(parsed.PORT).toBe(5000);
    expect(parsed.DATABASE_URL).toBe("mysql://root:password@localhost:3306/itsm_test");
    expect(parsed.NODE_ENV).toBe("test");
    expect(parsed.JWT_SECRET).toBe("this-is-a-valid-32-characters-jwt-secret-string");
  });

  it("constructs DATABASE_URL from individual DATABASE_* variables when DATABASE_URL is not explicitly set", () => {
    const parsed = validateEnv({
      DATABASE_HOST: "localhost",
      DATABASE_NAME: "itsm",
      DATABASE_USER: "root",
      DATABASE_PASS: "blackhole",
      PORT: "5000",
      JWT_SECRET: "this-is-a-valid-32-characters-jwt-secret-string",
    });

    expect(parsed.DATABASE_URL).toBe("mysql://root:blackhole@localhost:3306/itsm");
  });
});

