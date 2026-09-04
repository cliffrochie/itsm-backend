import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app";

describe("GET /api/v1/health", () => {
  it("returns 200 with standard success envelope", async () => {
    const app = createApp();
    const response = await request(app).get("/api/v1/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      data: {
        status: "ok",
        uptime: expect.any(Number),
        timestamp: expect.any(String),
      },
      message: "Service is healthy.",
      errors: null,
    });
  });

  it("handles 404 for unknown routes with error envelope", async () => {
    const app = createApp();
    const response = await request(app).get("/api/v1/unknown-endpoint");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      data: null,
      message: "Route not found.",
      errors: null,
    });
  });
});
