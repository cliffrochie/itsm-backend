import { OpenAPIRegistry, extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

export const bearerAuth = registry.registerComponent("securitySchemes", "bearerAuth", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
});

/**
 * Helpers for the shared response envelope in api-contract.md. Every endpoint
 * answers in one of these three shapes, so they are built once here rather than
 * spelled out at ~40 call sites where they could drift apart.
 */

export function successEnvelope(data: z.ZodTypeAny, message: string) {
  return z.object({
    data,
    message: z.string().openapi({ example: message }),
    errors: z.null(),
  });
}

export function paginatedEnvelope(item: z.ZodTypeAny, message: string) {
  return z.object({
    data: z.array(item),
    meta: z.object({
      current_page: z.number().openapi({ example: 1 }),
      last_page: z.number().openapi({ example: 5 }),
      per_page: z.number().openapi({ example: 15 }),
      total: z.number().openapi({ example: 72 }),
    }),
    message: z.string().openapi({ example: message }),
    errors: z.null(),
  });
}

export const errorEnvelope = z
  .object({
    data: z.null(),
    message: z.string().openapi({ example: "Forbidden." }),
    errors: z.record(z.array(z.string())).nullable(),
  })
  .openapi("ErrorEnvelope");

export const validationErrorEnvelope = z
  .object({
    data: z.null(),
    message: z.string().openapi({ example: "Validation failed." }),
    errors: z.record(z.array(z.string())).openapi({
      example: { email: ["Invalid email address format"] },
    }),
  })
  .openapi("ValidationErrorEnvelope");

interface JsonResponse {
  description: string;
  content: { "application/json": { schema: z.ZodTypeAny } };
}

function errorResponse(description: string): JsonResponse {
  return { description, content: { "application/json": { schema: errorEnvelope } } };
}

interface ErrorOptions {
  auth?: boolean;
  forbidden?: boolean;
  notFound?: boolean;
  validation?: boolean;
  rateLimited?: boolean;
}

/** The error responses an endpoint can produce, spelled out per endpoint. */
export function errorResponses(options: ErrorOptions = {}) {
  const responses: Record<string, JsonResponse> = {};

  if (options.validation) {
    responses["422"] = {
      description: "Validation failed.",
      content: { "application/json": { schema: validationErrorEnvelope } },
    };
  }
  if (options.auth !== false) {
    responses["401"] = errorResponse("Unauthenticated — missing, invalid or revoked token.");
  }
  if (options.forbidden) {
    responses["403"] = errorResponse("Forbidden — authenticated but not permitted.");
  }
  if (options.notFound) {
    responses["404"] = errorResponse("Resource not found.");
  }
  if (options.rateLimited) {
    responses["429"] = errorResponse("Too many attempts. Respect the RateLimit-* headers.");
  }

  return responses;
}

export function jsonBody(schema: z.ZodTypeAny) {
  return { body: { content: { "application/json": { schema } } } };
}

export function okResponse(schema: z.ZodTypeAny, description: string) {
  return { description, content: { "application/json": { schema } } };
}

export const idParam = z.object({
  id: z.coerce.number().int().positive().openapi({ param: { name: "id", in: "path" }, example: 1 }),
});
