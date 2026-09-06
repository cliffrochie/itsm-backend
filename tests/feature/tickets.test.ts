import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import { createApp } from "../../src/app";
import { ticketService } from "../../src/services/ticket.service";
import { clientService } from "../../src/services/client.service";

describe("Service Tickets Endpoints (/api/v1/service-tickets)", () => {
  const secret = "this-is-a-valid-32-characters-jwt-secret-string";
  process.env.JWT_SECRET = secret;

  const adminToken = jwt.sign(
    { id: 1, username: "admin", email: "admin@itsm.local", role: "admin", isActive: true },
    secret
  );

  const assignedEngineerToken = jwt.sign(
    { id: 3, username: "tech", email: "tech@itsm.local", role: "service_engineer", isActive: true },
    secret
  );

  const otherEngineerToken = jwt.sign(
    { id: 4, username: "tech2", email: "tech2@itsm.local", role: "service_engineer", isActive: true },
    secret
  );

  const requesterToken = jwt.sign(
    { id: 5, username: "requester", email: "req@itsm.local", role: "user", isActive: true },
    secret
  );

  /** Filed by user 5 for client 70, being worked by engineer 3. */
  const assignedTicket = {
    id: 1,
    ticketNo: "ST-202609-0001",
    createdById: 5,
    clientId: 70,
    serviceEngineerId: 3,
  };

  it("POST /api/v1/service-tickets returns 422 on invalid payload", async () => {
    const app = createApp();
    const res = await request(app)
      .post("/api/v1/service-tickets")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({});

    expect(res.status).toBe(422);
    expect(res.body.errors.taskType).toBeDefined();
    expect(res.body.errors.title).toBeDefined();
  });

  it("POST /api/v1/service-tickets creates ticket with sequential ticket_no and returns 201", async () => {
    const app = createApp();
    const mockCreated = {
      id: 1,
      ticketNo: "ST-202609-0001",
      taskType: "Hardware",
      title: "Printer malfunctioning",
      natureOfWork: "Paper jam issue",
      serialNo: "HP-12345",
      equipmentType: "Printer",
      equipmentTypeOthers: null,
      defectsFound: null,
      serviceRendered: null,
      serviceStatus: "open" as const,
      priority: "medium" as const,
      remarks: "Urgent for accounting",
      adminRemarks: null,
      rating: null,
      ratingComment: null,
      clientId: 1,
      serviceEngineerId: null,
      createdById: 1,
      updatedById: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.spyOn(ticketService, "createTicket").mockResolvedValue(mockCreated as any);

    const res = await request(app)
      .post("/api/v1/service-tickets")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        taskType: "Hardware",
        title: "Printer malfunctioning",
        natureOfWork: "Paper jam issue",
        serialNo: "HP-12345",
        equipmentType: "Printer",
        priority: "medium",
        clientId: 1,
        remarks: "Urgent for accounting",
      });

    expect(res.status).toBe(201);
    expect(res.body.data.ticketNo).toBe("ST-202609-0001");
    expect(res.body.message).toContain("Service ticket created successfully");
  });

  it("PATCH /api/v1/service-tickets/:id/status updates status and creates history", async () => {
    const app = createApp();
    const mockUpdated = {
      id: 1,
      ticketNo: "ST-202609-0001",
      serviceStatus: "in_progress" as const,
    };

    vi.spyOn(ticketService, "getTicketById").mockResolvedValue(assignedTicket as any);
    vi.spyOn(ticketService, "updateStatus").mockResolvedValue(mockUpdated as any);

    const res = await request(app)
      .patch("/api/v1/service-tickets/1/status")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ serviceStatus: "in_progress", notes: "Technician began inspection" });

    expect(res.status).toBe(200);
    expect(res.body.data.serviceStatus).toBe("in_progress");
  });

  it("PATCH /api/v1/service-tickets/:id/assign assigns service engineer", async () => {
    const app = createApp();
    const mockAssigned = {
      id: 1,
      ticketNo: "ST-202609-0001",
      serviceEngineerId: 3,
    };

    vi.spyOn(ticketService, "assignEngineer").mockResolvedValue(mockAssigned as any);

    const res = await request(app)
      .patch("/api/v1/service-tickets/1/assign")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ serviceEngineerId: 3, notes: "Assigned to Lead Tech" });

    expect(res.status).toBe(200);
    expect(res.body.data.serviceEngineerId).toBe(3);
  });
  it("PATCH /:id/status lets the assigned engineer move their own ticket", async () => {
    const app = createApp();
    vi.spyOn(ticketService, "getTicketById").mockResolvedValue(assignedTicket as any);
    vi.spyOn(ticketService, "updateStatus").mockResolvedValue({
      id: 1,
      serviceStatus: "resolved",
    } as any);

    const res = await request(app)
      .patch("/api/v1/service-tickets/1/status")
      .set("Authorization", `Bearer ${assignedEngineerToken}`)
      .send({ serviceStatus: "resolved" });

    expect(res.status).toBe(200);
  });

  it("PATCH /:id/status forbids an engineer who is not assigned to the ticket", async () => {
    const app = createApp();
    vi.spyOn(ticketService, "getTicketById").mockResolvedValue(assignedTicket as any);
    const updateStatus = vi.spyOn(ticketService, "updateStatus");

    const res = await request(app)
      .patch("/api/v1/service-tickets/1/status")
      .set("Authorization", `Bearer ${otherEngineerToken}`)
      .send({ serviceStatus: "closed" });

    expect(res.status).toBe(403);
    expect(updateStatus).not.toHaveBeenCalled();
  });

  it("PATCH /:id/assign forbids a non-administrator from reassigning work", async () => {
    const app = createApp();
    const assignEngineer = vi.spyOn(ticketService, "assignEngineer");

    const res = await request(app)
      .patch("/api/v1/service-tickets/1/assign")
      .set("Authorization", `Bearer ${assignedEngineerToken}`)
      .send({ serviceEngineerId: 4 });

    expect(res.status).toBe(403);
    expect(assignEngineer).not.toHaveBeenCalled();
  });

  it("PUT /:id cannot be used to reassign a ticket around the assign guard", async () => {
    const app = createApp();
    vi.spyOn(ticketService, "getTicketById").mockResolvedValue(assignedTicket as any);
    const updateTicket = vi.spyOn(ticketService, "updateTicket");

    const res = await request(app)
      .put("/api/v1/service-tickets/1")
      .set("Authorization", `Bearer ${assignedEngineerToken}`)
      .send({ serviceEngineerId: 4 });

    expect(res.status).toBe(403);
    expect(res.body.message).toContain("assign a service engineer");
    expect(updateTicket).not.toHaveBeenCalled();
  });

  it("POST /:id/feedback lets the user who filed the ticket rate it", async () => {
    const app = createApp();
    vi.spyOn(ticketService, "getTicketById").mockResolvedValue(assignedTicket as any);
    vi.spyOn(clientService, "isClientOwnedByUser").mockResolvedValue(false);
    vi.spyOn(ticketService, "submitFeedback").mockResolvedValue({ id: 1, rating: 5 } as any);

    const res = await request(app)
      .post("/api/v1/service-tickets/1/feedback")
      .set("Authorization", `Bearer ${requesterToken}`)
      .send({ rating: 5, ratingComment: "Sorted quickly" });

    expect(res.status).toBe(200);
  });

  it("POST /:id/feedback forbids the engineer from rating their own work", async () => {
    const app = createApp();
    vi.spyOn(ticketService, "getTicketById").mockResolvedValue(assignedTicket as any);
    vi.spyOn(clientService, "isClientOwnedByUser").mockResolvedValue(false);
    const submitFeedback = vi.spyOn(ticketService, "submitFeedback");

    const res = await request(app)
      .post("/api/v1/service-tickets/1/feedback")
      .set("Authorization", `Bearer ${assignedEngineerToken}`)
      .send({ rating: 5 });

    expect(res.status).toBe(403);
    expect(submitFeedback).not.toHaveBeenCalled();
  });
  it("GET / passes no scope for staff-side roles, so they see the whole queue", async () => {
    const app = createApp();
    const listTickets = vi.spyOn(ticketService, "listTickets").mockResolvedValue({
      tickets: [], total: 0, page: 1, limit: 15, lastPage: 1,
    } as any);

    const res = await request(app)
      .get("/api/v1/service-tickets")
      .set("Authorization", `Bearer ${assignedEngineerToken}`);

    expect(res.status).toBe(200);
    expect(listTickets).toHaveBeenCalledWith(expect.anything(), undefined);
  });

  it("GET / scopes the query itself for a plain user, so totals stay honest", async () => {
    const app = createApp();
    vi.spyOn(clientService, "findClientIdsForUser").mockResolvedValue([70]);
    const listTickets = vi.spyOn(ticketService, "listTickets").mockResolvedValue({
      tickets: [], total: 0, page: 1, limit: 15, lastPage: 1,
    } as any);

    const res = await request(app)
      .get("/api/v1/service-tickets")
      .set("Authorization", `Bearer ${requesterToken}`);

    expect(res.status).toBe(200);
    expect(listTickets).toHaveBeenCalledWith(expect.anything(), {
      userId: 5,
      clientIds: [70],
    });
  });

  it("GET /:id refuses a user reading someone else's ticket", async () => {
    const app = createApp();
    vi.spyOn(ticketService, "getTicketById").mockResolvedValue({
      ...assignedTicket,
      createdById: 999,
      clientId: 888,
    } as any);
    vi.spyOn(clientService, "findClientIdsForUser").mockResolvedValue([70]);

    const res = await request(app)
      .get("/api/v1/service-tickets/1")
      .set("Authorization", `Bearer ${requesterToken}`);

    expect(res.status).toBe(403);
  });

  it("GET /:id still lets the requester read their own ticket", async () => {
    const app = createApp();
    vi.spyOn(ticketService, "getTicketById").mockResolvedValue(assignedTicket as any);
    vi.spyOn(clientService, "findClientIdsForUser").mockResolvedValue([]);

    const res = await request(app)
      .get("/api/v1/service-tickets/1")
      .set("Authorization", `Bearer ${requesterToken}`);

    expect(res.status).toBe(200);
  });
  it("GET /:id does not leak admin remarks to the requester", async () => {
    const app = createApp();
    vi.spyOn(ticketService, "getTicketById").mockResolvedValue({
      ...assignedTicket,
      remarks: "Happens every time",
      adminRemarks: "Escalate to procurement",
      histories: [{ id: 11, action: "status_changed", notes: "Out of warranty", createdAt: new Date() }],
    } as any);
    vi.spyOn(clientService, "findClientIdsForUser").mockResolvedValue([]);

    const res = await request(app)
      .get("/api/v1/service-tickets/1")
      .set("Authorization", `Bearer ${requesterToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).not.toHaveProperty("adminRemarks");
    expect(res.body.data.remarks).toBe("Happens every time");
    expect(res.body.data.histories[0]).not.toHaveProperty("notes");
    expect(res.body.data.histories[0].action).toBe("status_changed");
  });

  it("GET /:id still shows admin remarks to the assigned engineer", async () => {
    const app = createApp();
    vi.spyOn(ticketService, "getTicketById").mockResolvedValue({
      ...assignedTicket,
      adminRemarks: "Escalate to procurement",
    } as any);

    const res = await request(app)
      .get("/api/v1/service-tickets/1")
      .set("Authorization", `Bearer ${assignedEngineerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.adminRemarks).toBe("Escalate to procurement");
  });

  it("POST / refuses a requester trying to author admin remarks", async () => {
    const app = createApp();
    const createTicket = vi.spyOn(ticketService, "createTicket");

    const res = await request(app)
      .post("/api/v1/service-tickets")
      .set("Authorization", `Bearer ${requesterToken}`)
      .send({ taskType: "repair", title: "Printer jam", adminRemarks: "Mark as urgent please" });

    expect(res.status).toBe(403);
    expect(createTicket).not.toHaveBeenCalled();
  });

  it("POST / still lets a requester file a normal ticket", async () => {
    const app = createApp();
    vi.spyOn(ticketService, "createTicket").mockResolvedValue({
      id: 2,
      ticketNo: "ST-202609-0002",
      title: "Printer jam",
      adminRemarks: null,
    } as any);

    const res = await request(app)
      .post("/api/v1/service-tickets")
      .set("Authorization", `Bearer ${requesterToken}`)
      .send({ taskType: "repair", title: "Printer jam" });

    expect(res.status).toBe(201);
    expect(res.body.data).not.toHaveProperty("adminRemarks");
  });

  it("GET /api/v1/service-tickets/invalid-id returns 404 instead of server error", async () => {
    const app = createApp();
    const res = await request(app)
      .get("/api/v1/service-tickets/not-a-number")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
    expect(res.body.data).toBeNull();
    expect(res.body.message).toContain("not found");
  });

  it("GET /api/v1/service-tickets/total-service-status returns 200 with status metrics", async () => {
    const app = createApp();
    const mockTotals = {
      totalTickets: 10,
      totalOpenedTickets: 4,
      totalAssignedTickets: 3,
      totalInProgressTickets: 2,
      totalOnHoldTickets: 0,
      totalEscalatedTickets: 0,
      totalCanceledTickets: 1,
      totalReOpenedTickets: 0,
      totalResolvedTickets: 1,
      totalClosedTickets: 2,
    };

    vi.spyOn(ticketService, "getTotalServiceStatuses").mockResolvedValue(mockTotals);

    const res = await request(app)
      .get("/api/v1/service-tickets/total-service-status")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.totalTickets).toBe(10);
    expect(res.body.totalOpenedTickets).toBe(4);
    expect(res.body.data.totalTickets).toBe(10);
  });

  it("GET /api/v1/service-tickets/total-task-type returns 200 with task type metrics", async () => {
    const app = createApp();
    const mockTotals = {
      totalTickets: 5,
      totalIncident: 3,
      totalServiceRequest: 2,
      totalAssetRequest: 0,
      totalMaintenance: 0,
      totalConsultation: 0,
      totalAccessibility: 0,
    };

    vi.spyOn(ticketService, "getTotalTaskTypes").mockResolvedValue(mockTotals);

    const res = await request(app)
      .get("/api/v1/service-tickets/total-task-type")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.totalIncident).toBe(3);
    expect(res.body.data.totalIncident).toBe(3);
  });

  it("GET /api/v1/service-tickets/total-equipment-type returns 200 with equipment type metrics", async () => {
    const app = createApp();
    const mockTotals = {
      totalTickets: 5,
      totalComputer: 2,
      totalPrinter: 1,
      totalScanner: 0,
      totalMobileDevice: 1,
      totalNetworkRelated: 1,
      totalSoftwareApplication: 0,
      totalOthers: 0,
    };

    vi.spyOn(ticketService, "getTotalEquipmentTypes").mockResolvedValue(mockTotals);

    const res = await request(app)
      .get("/api/v1/service-tickets/total-equipment-type")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.totalComputer).toBe(2);
    expect(res.body.data.totalComputer).toBe(2);
  });
});
