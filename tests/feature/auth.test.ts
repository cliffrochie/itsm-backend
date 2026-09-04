import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import { createApp } from "../../src/app";
import { authService } from "../../src/services/auth.service";

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
});
