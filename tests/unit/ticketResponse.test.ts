import { describe, it, expect } from "vitest";
import { mapTicketResponse, mapTicketListResponse } from "../../src/responses/ticket.response";
import { canViewTicketInternals } from "../../src/authorization/ticket.authorization";
import type { AuthenticatedUser } from "../../src/types/auth";

const actor = (id: number, role: AuthenticatedUser["role"]): AuthenticatedUser => ({
  id,
  username: `user-${id}`,
  email: `user-${id}@itsm.local`,
  role,
  isActive: true,
});

const admin = actor(1, "admin");
const staff = actor(2, "staff");
const engineer = actor(3, "service_engineer");
const requester = actor(5, "user");

const ticket = {
  id: 1,
  ticketNo: "ST-202609-0001",
  title: "Printer will not feed paper",
  remarks: "Happens on every job",
  adminRemarks: "Third failure this quarter, escalate to procurement",
  serviceStatus: "in_progress",
  createdById: 5,
  clientId: 70,
  serviceEngineerId: 3,
  histories: [
    {
      id: 11,
      serviceTicketId: 1,
      performedById: 3,
      action: "status_changed",
      notes: "Unit is out of warranty, do not tell the client yet",
      createdAt: new Date("2026-09-01T02:00:00Z"),
    },
  ],
} as never;

describe("canViewTicketInternals", () => {
  it("covers the service desk and excludes the requester", () => {
    expect(canViewTicketInternals(admin)).toBe(true);
    expect(canViewTicketInternals(staff)).toBe(true);
    expect(canViewTicketInternals(engineer)).toBe(true);
    expect(canViewTicketInternals(requester)).toBe(false);
  });
});

describe("Ticket response mapping", () => {
  it("gives the service desk the internal fields", () => {
    const mapped = mapTicketResponse(ticket, engineer);

    expect(mapped.adminRemarks).toBe("Third failure this quarter, escalate to procurement");
    expect(mapped.histories?.[0]?.notes).toBe("Unit is out of warranty, do not tell the client yet");
  });

  it("withholds admin remarks from the requester", () => {
    const mapped = mapTicketResponse(ticket, requester);

    expect(mapped).not.toHaveProperty("adminRemarks");
  });

  it("withholds internal history notes from the requester", () => {
    const mapped = mapTicketResponse(ticket, requester);

    expect(mapped.histories?.[0]).not.toHaveProperty("notes");
  });

  it("still gives the requester their timeline and their own remarks", () => {
    const mapped = mapTicketResponse(ticket, requester);

    expect(mapped.remarks).toBe("Happens on every job");
    expect(mapped.histories).toHaveLength(1);
    expect(mapped.histories?.[0]?.action).toBe("status_changed");
    expect(mapped.histories?.[0]?.createdAt).toBeInstanceOf(Date);
  });

  it("handles a ticket with no histories, as returned by the list query", () => {
    const { histories: _h, ...listRow } = ticket as never as Record<string, unknown>;
    const mapped = mapTicketResponse(listRow as never, requester);

    expect(mapped).not.toHaveProperty("adminRemarks");
    expect(mapped).not.toHaveProperty("histories");
  });

  it("maps a whole list with the same rule", () => {
    const mapped = mapTicketListResponse([ticket, ticket], requester);

    expect(mapped).toHaveLength(2);
    expect(mapped.every((t) => !("adminRemarks" in t))).toBe(true);
  });
});
