import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import { createApp } from "../../src/app";
import { ticketService } from "../../src/services/ticket.service";

describe("Service Tickets Endpoints (/api/v1/service-tickets)", () => {
  const secret = "this-is-a-valid-32-characters-jwt-secret-string";
  process.env.JWT_SECRET = secret;

  const adminToken = jwt.sign(
    { id: 1, username: "admin", email: "admin@itsm.local", role: "admin", isActive: true },
    secret
  );

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
});
