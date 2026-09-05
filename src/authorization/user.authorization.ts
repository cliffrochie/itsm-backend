import { UnauthorizedError } from "../types/errors";
import type { AuthenticatedUser } from "../types/auth";

/**
 * Authorization guards for the user domain.
 *
 * These are authoritative: role-aware routing in the web and mobile clients is
 * UX only. Every user mutation must pass through a guard here.
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

export function canCreateUser(actor: AuthenticatedUser): boolean {
  return isAdmin(actor);
}

export function canUpdateUser(actor: AuthenticatedUser, targetUserId: number): boolean {
  return isAdmin(actor) || actor.id === targetUserId;
}

/** Gates the privileged `role` and `isActive` fields on a user update. */
export function canManageUserRole(actor: AuthenticatedUser): boolean {
  return isAdmin(actor);
}

export function canToggleUserStatus(actor: AuthenticatedUser): boolean {
  return isAdmin(actor);
}

export function canDeleteUser(actor: AuthenticatedUser): boolean {
  return isAdmin(actor);
}
