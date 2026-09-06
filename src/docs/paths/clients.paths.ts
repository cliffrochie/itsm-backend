import { z } from "zod";
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
  createClientSchema,
  updateClientSchema,
  clientQuerySchema,
} from "../../validators/client.validator";
import { clientSchema } from "../schemas";

const tags = ["Clients"];
const security = [{ [bearerAuth.name]: [] }];

registry.registerPath({
  method: "get",
  path: "/api/v1/clients",
  tags,
  security,
  summary: "List clients",
  request: { query: clientQuerySchema },
  responses: {
    200: okResponse(
      paginatedEnvelope(clientSchema, "Clients retrieved successfully."),
      "A page of clients."
    ),
    ...errorResponses({ validation: true }),
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/clients",
  tags,
  security,
  summary: "Create a client",
  description:
    "Administrators and staff. Supplying an email links the client to a matching user account automatically.",
  request: jsonBody(createClientSchema),
  responses: {
    201: okResponse(successEnvelope(clientSchema, "Client created successfully."), "Created."),
    ...errorResponses({ validation: true, forbidden: true }),
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/clients/{id}",
  tags,
  security,
  summary: "Get a client",
  request: { params: idParam },
  responses: {
    200: okResponse(successEnvelope(clientSchema, "Client retrieved successfully."), "The client."),
    ...errorResponses({ notFound: true }),
  },
});

registry.registerPath({
  method: "put",
  path: "/api/v1/clients/{id}",
  tags,
  security,
  summary: "Update a client",
  description: "Administrators and staff.",
  request: { params: idParam, ...jsonBody(updateClientSchema) },
  responses: {
    200: okResponse(successEnvelope(clientSchema, "Client updated successfully."), "Updated."),
    ...errorResponses({ validation: true, forbidden: true, notFound: true }),
  },
});

registry.registerPath({
  method: "delete",
  path: "/api/v1/clients/{id}",
  tags,
  security,
  summary: "Delete a client",
  description:
    "Administrators only — every ticket the requester ever filed references this record.",
  request: { params: idParam },
  responses: {
    200: okResponse(successEnvelope(z.null(), "Client deleted successfully."), "Deleted."),
    ...errorResponses({ forbidden: true, notFound: true }),
  },
});
