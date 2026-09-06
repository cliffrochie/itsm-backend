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
  createUserSchema,
  updateUserSchema,
  userQuerySchema,
  toggleStatusSchema,
  changePasswordSchema,
} from "../../validators/user.validator";
import { userSchema, temporaryPasswordSchema } from "../schemas";

const tags = ["Users"];
const security = [{ [bearerAuth.name]: [] }];

registry.registerPath({
  method: "get",
  path: "/api/v1/users",
  tags,
  security,
  summary: "List users",
  description:
    "`email` and `contactNo` are returned only to administrators, staff, and the account owner.",
  request: { query: userQuerySchema },
  responses: {
    200: okResponse(
      paginatedEnvelope(userSchema, "Users retrieved successfully."),
      "A page of users."
    ),
    ...errorResponses({ validation: true }),
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/users",
  tags,
  security,
  summary: "Create a user",
  description: "Administrators only.",
  request: jsonBody(createUserSchema),
  responses: {
    201: okResponse(successEnvelope(userSchema, "User created successfully."), "Created."),
    ...errorResponses({ validation: true, forbidden: true }),
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/users/{id}",
  tags,
  security,
  summary: "Get a user",
  request: { params: idParam },
  responses: {
    200: okResponse(successEnvelope(userSchema, "User retrieved successfully."), "The user."),
    ...errorResponses({ notFound: true }),
  },
});

registry.registerPath({
  method: "put",
  path: "/api/v1/users/{id}",
  tags,
  security,
  summary: "Update a user",
  description:
    "Administrators, or the account owner. `role` and `isActive` are administrator-only, so a self-update cannot escalate.",
  request: { params: idParam, ...jsonBody(updateUserSchema) },
  responses: {
    200: okResponse(successEnvelope(userSchema, "User updated successfully."), "Updated."),
    ...errorResponses({ validation: true, forbidden: true, notFound: true }),
  },
});

registry.registerPath({
  method: "patch",
  path: "/api/v1/users/{id}/status",
  tags,
  security,
  summary: "Activate or deactivate a user",
  description: "Administrators only.",
  request: { params: idParam, ...jsonBody(toggleStatusSchema) },
  responses: {
    200: okResponse(successEnvelope(userSchema, "User status updated successfully."), "Updated."),
    ...errorResponses({ validation: true, forbidden: true, notFound: true }),
  },
});

registry.registerPath({
  method: "patch",
  path: "/api/v1/users/{id}/change-password",
  tags,
  security,
  summary: "Change your own password",
  description:
    "Requires the current password. On success every other session for the account is signed out; the calling session stays active.",
  request: { params: idParam, ...jsonBody(changePasswordSchema) },
  responses: {
    200: okResponse(
      successEnvelope(z.null(), "Password changed successfully."),
      "Changed; other sessions revoked."
    ),
    ...errorResponses({ validation: true, forbidden: true, notFound: true }),
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/users/{id}/reset-password",
  tags,
  security,
  summary: "Reset another user's password",
  description:
    "Administrators only. Returns a temporary password shown once — it is not stored in the audit trail.",
  request: { params: idParam },
  responses: {
    200: okResponse(
      successEnvelope(temporaryPasswordSchema, "Password reset."),
      "Reset; share the temporary password with the user."
    ),
    ...errorResponses({ forbidden: true, notFound: true }),
  },
});

registry.registerPath({
  method: "delete",
  path: "/api/v1/users/{id}",
  tags,
  security,
  summary: "Delete a user",
  description: "Administrators only.",
  request: { params: idParam },
  responses: {
    200: okResponse(successEnvelope(z.null(), "User deleted successfully."), "Deleted."),
    ...errorResponses({ forbidden: true, notFound: true }),
  },
});
