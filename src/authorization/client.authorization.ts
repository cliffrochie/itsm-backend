import { isAdmin, isStaff } from "./roles";
import type { AuthenticatedUser } from "../types/auth";

/**
 * Guards for the client domain.
 *
 * Client records are created and corrected constantly as new requesters appear,
 * so service desk staff can maintain them. Deletion is administrator-only: a
 * client is referenced by every ticket that requester ever filed.
 */

export function canCreateClient(actor: AuthenticatedUser): boolean {
  return isAdmin(actor) || isStaff(actor);
}

export function canUpdateClient(actor: AuthenticatedUser): boolean {
  return isAdmin(actor) || isStaff(actor);
}

export function canDeleteClient(actor: AuthenticatedUser): boolean {
  return isAdmin(actor);
}
