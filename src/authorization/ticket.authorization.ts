import { isAdmin } from "./roles";
import type { AuthenticatedUser } from "../types/auth";

/**
 * Guards for the service ticket domain.
 *
 * A ticket carries three people: the account that filed it (`createdById`), the
 * client it was filed for (`clientId`), and the engineer working it
 * (`serviceEngineerId`). Authority follows those relationships rather than role
 * alone, so an engineer can drive their own queue without being able to reach
 * into anyone else's.
 */

/** The subset of a ticket the guards actually read. */
export interface TicketPrincipals {
  createdById: number | null;
  clientId: number | null;
  serviceEngineerId: number | null;
}

function isAssignedEngineer(actor: AuthenticatedUser, ticket: TicketPrincipals): boolean {
  return ticket.serviceEngineerId !== null && ticket.serviceEngineerId === actor.id;
}

/** Editing ticket content: administrators, or the engineer working it. */
export function canUpdateTicket(actor: AuthenticatedUser, ticket: TicketPrincipals): boolean {
  return isAdmin(actor) || isAssignedEngineer(actor, ticket);
}

/** Moving a ticket through its workflow: administrators, or the assigned engineer. */
export function canChangeTicketStatus(
  actor: AuthenticatedUser,
  ticket: TicketPrincipals
): boolean {
  return isAdmin(actor) || isAssignedEngineer(actor, ticket);
}

/** Choosing who works a ticket is an administrator decision. */
export function canAssignServiceEngineer(actor: AuthenticatedUser): boolean {
  return isAdmin(actor);
}

/**
 * Rating the service belongs to the requester — either the account that filed
 * the ticket, or the user whose client profile it was filed for, since staff
 * routinely file on a client's behalf. Administrators may correct a rating.
 */
export function canSubmitTicketFeedback(
  actor: AuthenticatedUser,
  ticket: TicketPrincipals,
  actorOwnsTicketClient: boolean
): boolean {
  if (isAdmin(actor)) {
    return true;
  }
  if (ticket.createdById !== null && ticket.createdById === actor.id) {
    return true;
  }
  return actorOwnsTicketClient;
}
