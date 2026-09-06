import { UnauthorizedError } from "../types/errors";
import type { AuthenticatedUser } from "../types/auth";

/**
 * Role predicates shared by every domain's guards.
 *
 * These are authoritative: role-aware routing in the web and mobile clients is
 * UX only.
 */

export function requireUser(actor: AuthenticatedUser | undefined): AuthenticatedUser {
  if (!actor) {
    throw new UnauthorizedError("Unauthenticated.");
  }
  return actor;
}

export function isAdmin(actor: AuthenticatedUser): boolean {
  return actor.role === "admin";
}

export function isStaff(actor: AuthenticatedUser): boolean {
  return actor.role === "staff";
}

export function isServiceEngineer(actor: AuthenticatedUser): boolean {
  return actor.role === "service_engineer";
}
