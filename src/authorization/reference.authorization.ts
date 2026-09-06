import { isAdmin } from "./roles";
import type { AuthenticatedUser } from "../types/auth";

/**
 * Guards for the reference data domains (offices, designations).
 *
 * These are lookup tables the whole system depends on — a wrong or deleted
 * office silently reshapes every client and ticket that points at it — so
 * writes are administrator-only. Reads stay open to any authenticated user
 * because the clients feed the frontend's select inputs.
 */

export function canManageReferenceData(actor: AuthenticatedUser): boolean {
  return isAdmin(actor);
}
