import { OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";
import { registry } from "./registry";

// Importing these registers every path against the shared registry.
import "./paths/auth.paths";
import "./paths/users.paths";
import "./paths/tickets.paths";
import "./paths/clients.paths";
import "./paths/reference.paths";
import "./paths/misc.paths";

export function buildOpenApiDocument() {
  return new OpenApiGeneratorV3(registry.definitions).generateDocument({
    openapi: "3.0.3",
    info: {
      title: "ITSM Service Ticket API",
      version: "2.0.0",
      description: [
        "Every response uses the shared envelope: `{ data, message, errors }` on success,",
        "`{ data: null, message, errors }` on failure, and a `meta` block alongside `data`",
        "on paginated endpoints.",
        "",
        "Authentication is a bearer token from `POST /api/v1/auth/login`, valid for 15-60",
        "minutes. There is no refresh endpoint: on a 401 the client clears its auth state",
        "and signs in again. `DELETE /api/v1/auth/logout` revokes only the token used on",
        "that request.",
        "",
        "Roles referenced throughout: `admin`, `staff`, `service_engineer`, `user`.",
        "Role checks in a client are UX only — the guards behind these endpoints are",
        "authoritative.",
      ].join("\n"),
    },
    servers: [{ url: "/", description: "This server" }],
    tags: [
      { name: "Auth", description: "Sign in, sign out, current user." },
      { name: "Users", description: "Accounts, roles, and password management." },
      { name: "Service tickets", description: "Filing, working and closing tickets." },
      { name: "Clients", description: "The people tickets are filed for." },
      { name: "Offices", description: "Reference data." },
      { name: "Designations", description: "Reference data." },
      { name: "Notifications", description: "Per-account notifications." },
      { name: "Audit", description: "The audit trail." },
      { name: "Health", description: "Liveness." },
    ],
  });
}
