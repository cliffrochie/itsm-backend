import { describe, it, expect } from "vitest";
import {
  canViewAllTickets,
  canViewTicket,
  type TicketPrincipals,
} from "../../src/authorization/ticket.authorization";
import { canViewUserContactDetails } from "../../src/authorization/user.authorization";
import { mapUserResponse } from "../../src/responses/user.response";
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
const bystander = actor(6, "user");

const ticket: TicketPrincipals = {
  createdById: requester.id,
  clientId: 70,
  serviceEngineerId: engineer.id,
};

const row = {
  id: 5,
  username: "requester",
  email: "requester@itsm.local",
  firstName: "JUAN",
  middleName: null,
  lastName: "DELA CRUZ",
  extensionName: null,
  contactNo: "09123456789",
  avatar: null,
  role: "user",
  isActive: true,
  createdAt: null,
  updatedAt: null,
};

describe("Ticket read scoping", () => {
  it("gives the whole queue to everyone running the service desk", () => {
    expect(canViewAllTickets(admin)).toBe(true);
    expect(canViewAllTickets(staff)).toBe(true);
    expect(canViewAllTickets(engineer)).toBe(true);
    expect(canViewAllTickets(requester)).toBe(false);
  });

  it("lets a requester read the ticket they filed", () => {
    expect(canViewTicket(requester, ticket, [])).toBe(true);
  });

  it("lets the client the ticket was filed for read it", () => {
    const filedByStaff: TicketPrincipals = { ...ticket, createdById: staff.id };

    expect(canViewTicket(bystander, filedByStaff, [70])).toBe(true);
    expect(canViewTicket(bystander, filedByStaff, [71])).toBe(false);
  });

  it("keeps an unrelated user out of someone else's ticket", () => {
    expect(canViewTicket(bystander, ticket, [])).toBe(false);
  });
});

describe("User contact detail visibility", () => {
  it("is limited to administrators, staff, and the account owner", () => {
    expect(canViewUserContactDetails(admin, 5)).toBe(true);
    expect(canViewUserContactDetails(staff, 5)).toBe(true);
    expect(canViewUserContactDetails(requester, 5)).toBe(true);
    expect(canViewUserContactDetails(bystander, 5)).toBe(false);
    expect(canViewUserContactDetails(engineer, 5)).toBe(false);
  });
});

describe("User response mapping", () => {
  it("includes contact details for an entitled viewer", () => {
    const mapped = mapUserResponse(row, admin);

    expect(mapped.email).toBe("requester@itsm.local");
    expect(mapped.contactNo).toBe("09123456789");
  });

  it("omits contact details entirely for everyone else", () => {
    const mapped = mapUserResponse(row, bystander);

    expect(mapped).not.toHaveProperty("email");
    expect(mapped).not.toHaveProperty("contactNo");
  });

  it("still returns the directory fields a name label needs", () => {
    const mapped = mapUserResponse(row, bystander);

    expect(mapped.id).toBe(5);
    expect(mapped.firstName).toBe("JUAN");
    expect(mapped.lastName).toBe("DELA CRUZ");
    expect(mapped.role).toBe("user");
  });

  it("never carries a password field through, whoever is looking", () => {
    expect(mapUserResponse({ ...row, password: "hashed" } as never, admin)).not.toHaveProperty(
      "password"
    );
  });
});
