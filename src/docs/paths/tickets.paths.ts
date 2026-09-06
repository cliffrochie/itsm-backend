import {
  registry,
  bearerAuth,
  successEnvelope,
  paginatedEnvelope,
  errorResponses,
  jsonBody,
  okResponse,
  idParam,
} from "../registry";
import {
  createTicketSchema,
  updateTicketSchema,
  updateTicketStatusSchema,
  assignEngineerSchema,
  ticketFeedbackSchema,
  ticketQuerySchema,
} from "../../validators/ticket.validator";
import { ticketSchema } from "../schemas";

const tags = ["Service tickets"];
const security = [{ [bearerAuth.name]: [] }];

registry.registerPath({
  method: "get",
  path: "/api/v1/service-tickets",
  tags,
  security,
  summary: "List service tickets",
  description:
    "Administrators, staff and service engineers see every ticket. A user sees only tickets they filed or that were filed for a client profile they own; the result set is scoped in the query, so `meta.total` reflects what the caller can actually see.",
  request: { query: ticketQuerySchema },
  responses: {
    200: okResponse(
      paginatedEnvelope(ticketSchema, "Service tickets retrieved successfully."),
      "A page of tickets."
    ),
    ...errorResponses({ validation: true }),
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/service-tickets",
  tags,
  security,
  summary: "File a service ticket",
  description: "Open to any authenticated account. `adminRemarks` is service desk only.",
  request: jsonBody(createTicketSchema),
  responses: {
    201: okResponse(
      successEnvelope(ticketSchema, "Service ticket created successfully."),
      "Filed, with a generated ticket number."
    ),
    ...errorResponses({ validation: true, forbidden: true }),
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/service-tickets/{id}",
  tags,
  security,
  summary: "Get a service ticket",
  description:
    "Includes the history timeline. `adminRemarks` and history `notes` are omitted for requesters.",
  request: { params: idParam },
  responses: {
    200: okResponse(
      successEnvelope(ticketSchema, "Service ticket retrieved successfully."),
      "The ticket."
    ),
    ...errorResponses({ forbidden: true, notFound: true }),
  },
});

registry.registerPath({
  method: "put",
  path: "/api/v1/service-tickets/{id}",
  tags,
  security,
  summary: "Update a service ticket",
  description:
    "Administrators, or the assigned engineer. `serviceEngineerId` is administrator-only and `rating` is requester-only, matching the dedicated endpoints below.",
  request: { params: idParam, ...jsonBody(updateTicketSchema) },
  responses: {
    200: okResponse(successEnvelope(ticketSchema, "Service ticket updated successfully."), "Updated."),
    ...errorResponses({ validation: true, forbidden: true, notFound: true }),
  },
});

registry.registerPath({
  method: "patch",
  path: "/api/v1/service-tickets/{id}/status",
  tags,
  security,
  summary: "Move a ticket through its workflow",
  description: "Administrators, or the assigned engineer. Writes a history entry.",
  request: { params: idParam, ...jsonBody(updateTicketStatusSchema) },
  responses: {
    200: okResponse(
      successEnvelope(ticketSchema, "Service ticket status updated successfully."),
      "Status changed."
    ),
    ...errorResponses({ validation: true, forbidden: true, notFound: true }),
  },
});

registry.registerPath({
  method: "patch",
  path: "/api/v1/service-tickets/{id}/assign",
  tags,
  security,
  summary: "Assign a service engineer",
  description: "Administrators only. Writes a history entry.",
  request: { params: idParam, ...jsonBody(assignEngineerSchema) },
  responses: {
    200: okResponse(
      successEnvelope(ticketSchema, "Service engineer assigned successfully."),
      "Assigned."
    ),
    ...errorResponses({ validation: true, forbidden: true, notFound: true }),
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/service-tickets/{id}/feedback",
  tags,
  security,
  summary: "Rate the service",
  description:
    "The requester only — the account that filed the ticket, or the user linked to its client profile.",
  request: { params: idParam, ...jsonBody(ticketFeedbackSchema) },
  responses: {
    200: okResponse(successEnvelope(ticketSchema, "Feedback submitted successfully."), "Recorded."),
    ...errorResponses({ validation: true, forbidden: true, notFound: true }),
  },
});
