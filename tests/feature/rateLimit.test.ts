import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app";
import { authService } from "../../src/services/auth.service";
import { UnauthorizedError } from "../../src/types/errors";

/**
 * The login limiter is a module-level singleton, exactly as it is in
 * production, so its counter is shared by every request in this file. Kept in
 * its own file so the attempt count stays deterministic.
 */
describe("Login rate limiting (POST /api/v1/auth/login)", () => {
  it("allows 5 attempts per IP, then answers 429 in the standard envelope", async () => {
    const app = createApp();
    vi.spyOn(authService, "login").mockRejectedValue(new UnauthorizedError("Invalid credentials."));

    const attempt = () =>
      request(app).post("/api/v1/auth/login").send({ identifier: "admin", password: "wrong" });

    for (let i = 0; i < 5; i += 1) {
      const res = await attempt();
      expect(res.status).toBe(401);
    }

    const blocked = await attempt();

    expect(blocked.status).toBe(429);
    expect(blocked.body.message).toContain("Too many login attempts");
    expect(blocked.body.data).toBeNull();
    expect(blocked.body.errors).toBeNull();
    expect(blocked.headers["ratelimit-remaining"]).toBe("0");
  });
});
