import { describe, it, expect } from "vitest";
import { buildOpenApiDocument } from "../../src/docs/openapi";
import { envSchema } from "../../src/config/env";

const document = buildOpenApiDocument();

const base = {
  DATABASE_URL: "mysql://root:password@localhost:3306/itsm_db",
  JWT_SECRET: "this-is-a-valid-32-characters-jwt-secret-string",
};

describe("OpenAPI document", () => {
  it("generates a valid 3.0 document", () => {
    expect(document.openapi).toBe("3.0.3");
    expect(document.info.title).toBe("ITSM Service Ticket API");
  });

  it("documents every route the application actually serves", () => {
    // Kept in step with src/routes/v1 by hand; a missing entry here means the
    // reference has drifted from the API.
    const expected = [
      "/api/v1/auth/login",
      "/api/v1/auth/me",
      "/api/v1/auth/logout",
      "/api/v1/users",
      "/api/v1/users/{id}",
      "/api/v1/users/{id}/status",
      "/api/v1/users/{id}/change-password",
      "/api/v1/users/{id}/reset-password",
      "/api/v1/service-tickets",
      "/api/v1/service-tickets/{id}",
      "/api/v1/service-tickets/{id}/status",
      "/api/v1/service-tickets/{id}/assign",
      "/api/v1/service-tickets/{id}/feedback",
      "/api/v1/clients",
      "/api/v1/clients/{id}",
      "/api/v1/offices",
      "/api/v1/offices/{id}",
      "/api/v1/designations",
      "/api/v1/designations/{id}",
      "/api/v1/notifications",
      "/api/v1/notifications/read-all",
      "/api/v1/notifications/{id}/read",
      "/api/v1/action-logs",
      "/api/v1/health",
    ];

    for (const path of expected) {
      expect(document.paths, `missing ${path}`).toHaveProperty([path]);
    }
  });

  it("declares bearer authentication", () => {
    expect(document.components?.securitySchemes?.bearerAuth).toMatchObject({
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT",
    });
  });

  it("requires a token on protected endpoints and not on the open ones", () => {
    expect(document.paths?.["/api/v1/users"]?.get?.security).toBeTruthy();
    expect(document.paths?.["/api/v1/auth/login"]?.post?.security).toBeFalsy();
    expect(document.paths?.["/api/v1/health"]?.get?.security).toBeFalsy();
  });

  it("describes the shared success envelope, not a bare payload", () => {
    const schema = document.paths?.["/api/v1/auth/me"]?.get?.responses?.["200"]?.content?.[
      "application/json"
    ]?.schema as { properties?: Record<string, unknown> };

    expect(Object.keys(schema.properties ?? {})).toEqual(["data", "message", "errors"]);
  });

  it("describes the paginated envelope with the contract's meta keys", () => {
    const schema = document.paths?.["/api/v1/users"]?.get?.responses?.["200"]?.content?.[
      "application/json"
    ]?.schema as { properties?: { meta?: { properties?: Record<string, unknown> } } };

    expect(Object.keys(schema.properties?.meta?.properties ?? {})).toEqual([
      "current_page",
      "last_page",
      "per_page",
      "total",
    ]);
  });

  it("documents the login rate limit and validation failures", () => {
    const login = document.paths?.["/api/v1/auth/login"]?.post?.responses;

    expect(login).toHaveProperty("422");
    expect(login).toHaveProperty("429");
  });

  it("documents 403 on the endpoints that carry a role guard", () => {
    expect(document.paths?.["/api/v1/users"]?.post?.responses).toHaveProperty("403");
    expect(document.paths?.["/api/v1/offices"]?.post?.responses).toHaveProperty("403");
    expect(document.paths?.["/api/v1/service-tickets/{id}/assign"]?.patch?.responses).toHaveProperty(
      "403"
    );
  });

  it("documents officeId and designationId in POST /api/v1/users request schema", () => {
    const postUserBody = document.paths?.["/api/v1/users"]?.post?.requestBody as any;
    const properties = postUserBody?.content?.["application/json"]?.schema?.properties;
    expect(properties).toHaveProperty("officeId");
    expect(properties).toHaveProperty("designationId");
  });
});

describe("DOCS_ENABLED configuration", () => {
  it("is off unless explicitly set to true", () => {
    expect(envSchema.parse(base).DOCS_ENABLED).toBe(false);
    expect(envSchema.parse({ ...base, DOCS_ENABLED: "false" }).DOCS_ENABLED).toBe(false);
    expect(envSchema.parse({ ...base, DOCS_ENABLED: "" }).DOCS_ENABLED).toBe(false);
  });

  it("can be turned on", () => {
    expect(envSchema.parse({ ...base, DOCS_ENABLED: "true" }).DOCS_ENABLED).toBe(true);
  });
});
