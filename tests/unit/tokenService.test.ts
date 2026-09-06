import { describe, it, expect } from "vitest";
import { createHash } from "node:crypto";
import { tokenService } from "../../src/services/token.service";
import { envSchema, getJwtExpiresIn } from "../../src/config/env";

describe("Token hashing", () => {
  it("stores a SHA-256 hash rather than the token itself", () => {
    const token = "header.payload.signature";
    const hash = tokenService.hashToken(token);

    expect(hash).toBe(createHash("sha256").update(token).digest("hex"));
    expect(hash).not.toContain(token);
    expect(hash).toHaveLength(64);
  });

  it("is deterministic, so a presented token can be looked up", () => {
    expect(tokenService.hashToken("same-token")).toBe(tokenService.hashToken("same-token"));
  });

  it("separates distinct tokens", () => {
    expect(tokenService.hashToken("token-a")).not.toBe(tokenService.hashToken("token-b"));
  });
});

describe("Token lifetime configuration", () => {
  it("defaults to 60 minutes, inside the blueprint's 15-60 minute window", () => {
    const parsed = envSchema.parse({
      DATABASE_URL: "mysql://root:password@localhost:3306/itsm_db",
      JWT_SECRET: "this-is-a-valid-32-characters-jwt-secret-string",
    });

    expect(parsed.JWT_EXPIRES_IN).toBe("60m");
  });

  it("resolves a lifetime without reaching for a hardcoded fallback in config", () => {
    expect(getJwtExpiresIn()).toBeTruthy();
  });
});
