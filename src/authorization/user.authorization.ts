import { isAdmin, isStaff } from "./roles";
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

/** Admin-only: reset another user's password when they are locked out. */
export function canResetUserPassword(actor: AuthenticatedUser): boolean {
  return isAdmin(actor);
}

/**
 * A password change requires proving knowledge of the current password, so it
 * is always self-only — an admin who needs to act on someone else uses the
 * reset flow instead.
 */
export function canChangeUserPassword(actor: AuthenticatedUser, targetUserId: number): boolean {
  return actor.id === targetUserId;
}

export function canDeleteUser(actor: AuthenticatedUser): boolean {
  return isAdmin(actor);
}

/**
 * Email addresses and contact numbers are only for the people who need to
 * reach users — administrators and service desk staff — plus the account
 * owner. Everyone else sees the directory fields without the contact details.
 */
export function canViewUserContactDetails(
  actor: AuthenticatedUser,
  targetUserId: number
): boolean {
  return isAdmin(actor) || isStaff(actor) || actor.id === targetUserId;
}
