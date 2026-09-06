import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import { createApp } from "../../src/app";
import { authService } from "../../src/services/auth.service";
import { tokenService } from "../../src/services/token.service";
import { actionLogService } from "../../src/services/actionLog.service";
import { UnauthorizedError } from "../../src/types/errors";

describe("Authentication Endpoints (/api/v1/auth)", () => {
  it("POST /api/v1/auth/login returns 422 on invalid payload", async () => {
    const app = createApp();
    const res = await request(app).post("/api/v1/auth/login").send({});

    expect(res.status).toBe(422);
    expect(res.body.errors).toBeDefined();
    expect(res.body.errors.identifier).toBeDefined();
    expect(res.body.errors.password).toBeDefined();
  });

  it("POST /api/v1/auth/login returns 200 with token and user on successful credentials", async () => {
    const app = createApp();
    const mockUser = {
      id: 1,
      username: "admin",
      email: "admin@itsm.local",
      role: "admin" as const,
      isActive: true,
      firstName: "ADMIN",
      lastName: "USER",
    };

    vi.spyOn(authService, "login").mockResolvedValue({
      token: "mock-valid-jwt-token",
      user: mockUser,
    });

    const res = await request(app).post("/api/v1/auth/login").send({
      identifier: "admin",
      password: "Password123!",
    });

    expect(res.status).toBe(200);
    expect(res.body.data.token).toBe("mock-valid-jwt-token");
    expect(res.body.data.user.username).toBe("admin");
    expect(res.body.errors).toBeNull();
  });

  it("GET /api/v1/auth/me returns 401 when unauthenticated", async () => {
    const app = createApp();
    const res = await request(app).get("/api/v1/auth/me");

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Unauthenticated.");
  });

  it("GET /api/v1/auth/me returns current user when valid Bearer token provided", async () => {
    const app = createApp();
    const token = jwt.sign(
      {
        id: 1,
        username: "admin",
        email: "admin@itsm.local",
        role: "admin",
        isActive: true,
      },
      "this-is-a-valid-32-characters-jwt-secret-string"
    );

    process.env.JWT_SECRET = "this-is-a-valid-32-characters-jwt-secret-string";

    const res = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.username).toBe("admin");
    expect(res.body.data.id).toBe(1);
  });

  it("DELETE /api/v1/auth/logout returns 200 success envelope", async () => {
    const app = createApp();
    const token = jwt.sign(
      { id: 1, username: "admin", email: "admin@itsm.local", role: "admin", isActive: true },
      "this-is-a-valid-32-characters-jwt-secret-string"
    );

    const res = await request(app)
      .delete("/api/v1/auth/logout")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);

    expect(res.body.message).toContain("Logged out");
  });
  it("DELETE /api/v1/auth/logout revokes the token used on that request", async () => {
    const app = createApp();
    const token = jwt.sign(
      { id: 1, username: "admin", email: "admin@itsm.local", role: "admin", isActive: true },
      "this-is-a-valid-32-characters-jwt-secret-string"
    );
    const revoke = vi.spyOn(tokenService, "revoke").mockResolvedValue();

    const res = await request(app)
      .delete("/api/v1/auth/logout")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(revoke).toHaveBeenCalledWith(token);
  });

  it("GET /api/v1/auth/me rejects a correctly signed but revoked token", async () => {
    const app = createApp();
    const token = jwt.sign(
      { id: 1, username: "admin", email: "admin@itsm.local", role: "admin", isActive: true },
      "this-is-a-valid-32-characters-jwt-secret-string"
    );
    vi.spyOn(tokenService, "assertActive").mockRejectedValue(
      new UnauthorizedError("Unauthenticated.")
    );

    const res = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Unauthenticated.");
  });
  it("records a failed login attempt without recording the password tried", async () => {
    const app = createApp();
    const log = vi.spyOn(actionLogService, "log").mockResolvedValue();
    vi.spyOn(authService, "login").mockRejectedValue(new UnauthorizedError("Invalid credentials."));

    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ identifier: "admin", password: "hunter2" });

    expect(res.status).toBe(401);
    expect(log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "login_failed",
        entity: "auth",
        userId: null,
        details: { identifier: "admin" },
      })
    );
    expect(JSON.stringify(log.mock.calls)).not.toContain("hunter2");
  });

  it("records a successful login against the account that signed in", async () => {
    const app = createApp();
    const log = vi.spyOn(actionLogService, "log").mockResolvedValue();
    vi.spyOn(authService, "login").mockResolvedValue({
      token: "mock-token",
      user: { id: 7, username: "admin" } as any,
    });

    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ identifier: "admin", password: "Password123!" });

    expect(res.status).toBe(200);
    expect(log).toHaveBeenCalledWith(
      expect.objectContaining({ action: "login_succeeded", entity: "auth", entityId: "7" })
    );
  });
});
