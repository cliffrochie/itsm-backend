import { canViewTicketInternals } from "../authorization/ticket.authorization";
import type { ServiceTicket } from "../db/schema/serviceTickets";
import type { ServiceTicketHistory } from "../db/schema/serviceTicketHistories";
import type { AuthenticatedUser } from "../types/auth";

/**
 * Shapes a service ticket for the wire.
 *
 * A requester can read their own ticket, so the raw row must not go out as-is:
 * `adminRemarks` and the free-text `notes` on history entries are internal
 * service desk commentary. The history itself stays visible either way, so a
 * requester still gets a progress timeline of what happened and when.
 */

export type TicketWithHistories = ServiceTicket & { histories?: ServiceTicketHistory[] };

type PublicHistory = Omit<ServiceTicketHistory, "notes"> & { notes?: string | null };

export type PublicTicket = Omit<ServiceTicket, "adminRemarks"> & {
  adminRemarks?: string | null;
  histories?: PublicHistory[];
};

export function mapTicketResponse(
  ticket: TicketWithHistories,
  viewer: AuthenticatedUser
): PublicTicket {
  const { adminRemarks, histories, ...rest } = ticket;

  if (canViewTicketInternals(viewer)) {
    return { ...rest, adminRemarks, ...(histories ? { histories } : {}) };
  }

  if (!histories) {
    return { ...rest };
  }

  return {
    ...rest,
    histories: histories.map(({ notes: _notes, ...entry }) => entry),
  };
}

export function mapTicketListResponse(
  tickets: TicketWithHistories[],
  viewer: AuthenticatedUser
): PublicTicket[] {
  return tickets.map((ticket) => mapTicketResponse(ticket, viewer));
}
