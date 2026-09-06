import { z } from "zod";
import {
  registry,
  bearerAuth,
  successEnvelope,
  paginatedEnvelope,
  errorResponses,
  okResponse,
  idParam,
} from "../registry";
import { notificationSchema, actionLogSchema } from "../schemas";

const security = [{ [bearerAuth.name]: [] }];

const paginationQuery = z.object({
  page: z.coerce.number().int().positive().optional().openapi({ example: 1 }),
  limit: z.coerce.number().int().positive().optional().openapi({ example: 15 }),
});

registry.registerPath({
  method: "get",
  path: "/api/v1/notifications",
  tags: ["Notifications"],
  security,
  summary: "List your notifications",
  description: "Always scoped to the authenticated account.",
  request: { query: paginationQuery },
  responses: {
    200: okResponse(
      paginatedEnvelope(notificationSchema, "Notifications retrieved successfully."),
      "A page of your notifications."
    ),
    ...errorResponses(),
  },
});

registry.registerPath({
  method: "patch",
  path: "/api/v1/notifications/read-all",
  tags: ["Notifications"],
  security,
  summary: "Mark all your notifications read",
  responses: {
    200: okResponse(
      successEnvelope(z.null(), "All notifications marked as read."),
      "All marked read."
    ),
    ...errorResponses(),
  },
});

registry.registerPath({
  method: "patch",
  path: "/api/v1/notifications/{id}/read",
  tags: ["Notifications"],
  security,
  summary: "Mark one notification read",
  description: "Only your own; another account's notification reads as not found.",
  request: { params: idParam },
  responses: {
    200: okResponse(
      successEnvelope(notificationSchema, "Notification marked as read."),
      "Marked read."
    ),
    ...errorResponses({ notFound: true }),
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/action-logs",
  tags: ["Audit"],
  security,
  summary: "Read the audit trail",
  description:
    "Administrators only. Records sign-ins and sign-outs, user and client changes, and reference data changes. Service tickets keep their own history on the ticket instead.",
  request: { query: paginationQuery },
  responses: {
    200: okResponse(
      paginatedEnvelope(actionLogSchema, "Action logs retrieved successfully."),
      "A page of audit entries."
    ),
    ...errorResponses({ forbidden: true }),
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/health",
  tags: ["Health"],
  summary: "Liveness check",
  description: "Unauthenticated.",
  responses: {
    200: okResponse(
      successEnvelope(
        z.object({
          status: z.string().openapi({ example: "ok" }),
          uptime: z.number().openapi({ example: 1234.5 }),
          timestamp: z.iso.datetime(),
        }),
        "Service is healthy."
      ),
      "The service is up."
    ),
  },
});
