import { describe, it, expect } from "vitest";
import { canManageReferenceData } from "../../src/authorization/reference.authorization";
import {
  canCreateClient,
  canUpdateClient,
  canDeleteClient,
} from "../../src/authorization/client.authorization";
import {
  canUpdateTicket,
  canChangeTicketStatus,
  canAssignServiceEngineer,
  canSubmitTicketFeedback,
  type TicketPrincipals,
} from "../../src/authorization/ticket.authorization";
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
const assignedEngineer = actor(3, "service_engineer");
const otherEngineer = actor(4, "service_engineer");
const requester = actor(5, "user");
const bystander = actor(6, "user");

const ticket: TicketPrincipals = {
  createdById: requester.id,
  clientId: 70,
  serviceEngineerId: assignedEngineer.id,
};

describe("Reference data guards", () => {
  it("restricts office and designation writes to administrators", () => {
    expect(canManageReferenceData(admin)).toBe(true);
    expect(canManageReferenceData(staff)).toBe(false);
    expect(canManageReferenceData(assignedEngineer)).toBe(false);
    expect(canManageReferenceData(requester)).toBe(false);
  });
});

describe("Client guards", () => {
  it("lets administrators and staff maintain client records", () => {
    expect(canCreateClient(admin)).toBe(true);
    expect(canCreateClient(staff)).toBe(true);
    expect(canCreateClient(assignedEngineer)).toBe(false);
    expect(canCreateClient(requester)).toBe(false);

    expect(canUpdateClient(staff)).toBe(true);
    expect(canUpdateClient(requester)).toBe(false);
  });

  it("restricts deletion to administrators, since tickets reference the client", () => {
    expect(canDeleteClient(admin)).toBe(true);
    expect(canDeleteClient(staff)).toBe(false);
  });
});

describe("Ticket guards", () => {
  it("lets the assigned engineer and administrators edit the ticket", () => {
    expect(canUpdateTicket(admin, ticket)).toBe(true);
    expect(canUpdateTicket(assignedEngineer, ticket)).toBe(true);
    expect(canUpdateTicket(otherEngineer, ticket)).toBe(false);
    expect(canUpdateTicket(staff, ticket)).toBe(false);
    expect(canUpdateTicket(requester, ticket)).toBe(false);
  });

  it("applies the same rule to status transitions", () => {
    expect(canChangeTicketStatus(assignedEngineer, ticket)).toBe(true);
    expect(canChangeTicketStatus(otherEngineer, ticket)).toBe(false);
  });

  it("treats an unassigned ticket as belonging to no engineer", () => {
    const unassigned: TicketPrincipals = { ...ticket, serviceEngineerId: null };

    expect(canUpdateTicket(assignedEngineer, unassigned)).toBe(false);
    expect(canUpdateTicket(admin, unassigned)).toBe(true);
  });

  it("restricts engineer assignment to administrators", () => {
    expect(canAssignServiceEngineer(admin)).toBe(true);
    expect(canAssignServiceEngineer(assignedEngineer)).toBe(false);
    expect(canAssignServiceEngineer(staff)).toBe(false);
  });

  it("lets the filer rate the service", () => {
    expect(canSubmitTicketFeedback(requester, ticket, false)).toBe(true);
  });

  it("lets the client the ticket was filed for rate it, even if staff filed it", () => {
    const filedByStaff: TicketPrincipals = { ...ticket, createdById: staff.id };

    expect(canSubmitTicketFeedback(bystander, filedByStaff, true)).toBe(true);
    expect(canSubmitTicketFeedback(bystander, filedByStaff, false)).toBe(false);
  });

  it("does not let an unrelated user or the working engineer rate the service", () => {
    expect(canSubmitTicketFeedback(bystander, ticket, false)).toBe(false);
    expect(canSubmitTicketFeedback(assignedEngineer, ticket, false)).toBe(false);
  });
});
