import { isAdmin, isStaff, isServiceEngineer } from "./roles";
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

/**
 * Everyone running the service desk sees the whole queue — engineers need to
 * see unassigned work to pick it up. A plain user sees only their own tickets.
 */
export function canViewAllTickets(actor: AuthenticatedUser): boolean {
  return isAdmin(actor) || isStaff(actor) || isServiceEngineer(actor);
}

/**
 * A ticket is the requester's own if they filed it, or if it was filed for a
 * client profile they own — staff routinely file on a client's behalf.
 */
export function canViewTicket(
  actor: AuthenticatedUser,
  ticket: TicketPrincipals,
  actorClientIds: number[]
): boolean {
  if (canViewAllTickets(actor)) {
    return true;
  }
  if (ticket.createdById !== null && ticket.createdById === actor.id) {
    return true;
  }
  return ticket.clientId !== null && actorClientIds.includes(ticket.clientId);
}
