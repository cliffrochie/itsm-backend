import { isAdmin } from "./roles";
import type { AuthenticatedUser } from "../types/auth";

/**
 * Authorization guards for the user domain. Shared role predicates and
 * `requireUser` live in `./roles`.
 */

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
