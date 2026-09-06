import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app";

describe("API reference (/api/v1/docs)", () => {
  it("serves the spec outside production without a token", async () => {
    const app = createApp();
    const res = await request(app).get("/api/v1/docs.json");

    expect(res.status).toBe(200);
    expect(res.body.openapi).toBe("3.0.3");
    expect(res.body.paths).toHaveProperty("/api/v1/auth/login");
  });

  it("serves the browsable reference", async () => {
    const app = createApp();
    const res = await request(app).get("/api/v1/docs/");

    expect(res.status).toBe(200);
    expect(res.text).toContain("swagger-ui");
  });

  it("does not shadow the real API routes it documents", async () => {
    const app = createApp();
    const res = await request(app).get("/api/v1/health");

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("ok");
  });
});
