import { describe, it, expect } from "vitest";
import * as schema from "../../src/db/schema";

describe("Database Schema Definitions (Drizzle MySQL)", () => {
  it("exports all expected entities per blueprint", () => {
    expect(schema.users).toBeDefined();
    expect(schema.offices).toBeDefined();
    expect(schema.designations).toBeDefined();
    expect(schema.clients).toBeDefined();
    expect(schema.serviceTickets).toBeDefined();
    expect(schema.serviceTicketHistories).toBeDefined();
    expect(schema.ticketCounters).toBeDefined();
    expect(schema.notifications).toBeDefined();
    expect(schema.actionLogs).toBeDefined();
  });

  it("has correct table names following conventions", () => {
    expect(schema.users[Symbol.for("drizzle:Name")]).toBe("users");
    expect(schema.offices[Symbol.for("drizzle:Name")]).toBe("offices");
    expect(schema.designations[Symbol.for("drizzle:Name")]).toBe("designations");
    expect(schema.clients[Symbol.for("drizzle:Name")]).toBe("clients");
    expect(schema.serviceTickets[Symbol.for("drizzle:Name")]).toBe("service_tickets");
    expect(schema.serviceTicketHistories[Symbol.for("drizzle:Name")]).toBe("service_ticket_histories");
    expect(schema.ticketCounters[Symbol.for("drizzle:Name")]).toBe("ticket_counters");
    expect(schema.notifications[Symbol.for("drizzle:Name")]).toBe("notifications");
    expect(schema.actionLogs[Symbol.for("drizzle:Name")]).toBe("action_logs");
  });

  it("clients table includes optional unique email column", () => {
    expect((schema.clients as any).email).toBeDefined();
  });
});
