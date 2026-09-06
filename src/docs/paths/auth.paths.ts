import { z } from "zod";
import {
  registry,
  bearerAuth,
  successEnvelope,
  errorResponses,
  jsonBody,
  okResponse,
} from "../registry";
import { loginSchema } from "../../validators/auth.validator";
import { authTokenSchema, authenticatedUserSchema } from "../schemas";

const tags = ["Auth"];

registry.registerPath({
  method: "post",
  path: "/api/v1/auth/login",
  tags,
  summary: "Sign in",
  description:
    "Issues a short-lived bearer token (15-60 minutes). There is no refresh endpoint: on a 401 the client clears its auth state and signs in again. Rate limited to 5 attempts per IP per 5 minutes.",
  request: jsonBody(loginSchema),
  responses: {
    200: okResponse(successEnvelope(authTokenSchema, "Logged in successfully."), "Signed in."),
    ...errorResponses({ validation: true, rateLimited: true }),
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/auth/me",
  tags,
  summary: "Current user",
  security: [{ [bearerAuth.name]: [] }],
  responses: {
    200: okResponse(
      successEnvelope(authenticatedUserSchema, "User profile retrieved successfully."),
      "The account behind the bearer token."
    ),
    ...errorResponses(),
  },
});

registry.registerPath({
  method: "delete",
  path: "/api/v1/auth/logout",
  tags,
  summary: "Sign out",
  description:
    "Revokes only the token used on this request. The account's other sessions stay signed in.",
  security: [{ [bearerAuth.name]: [] }],
  responses: {
    200: okResponse(successEnvelope(z.null(), "Logged out successfully."), "Token revoked."),
    ...errorResponses(),
  },
});
