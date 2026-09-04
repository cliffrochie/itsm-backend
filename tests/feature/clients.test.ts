import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import { createApp } from "../../src/app";
import { clientService } from "../../src/services/client.service";

describe("Clients Endpoints (/api/v1/clients)", () => {
  const secret = "this-is-a-valid-32-characters-jwt-secret-string";
  process.env.JWT_SECRET = secret;

  const adminToken = jwt.sign(
    { id: 1, username: "admin", email: "admin@itsm.local", role: "admin", isActive: true },
    secret
  );

  it("GET /api/v1/clients returns paginated clients list", async () => {
    const app = createApp();
    const mockClients = [
      {
        id: 1,
        firstName: "ALICE",
        lastName: "SMITH",
        contactNo: "09181234567",
        officeId: 1,
        designationId: 1,
        userId: 2, // Linked user!
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    vi.spyOn(clientService, "listClients").mockResolvedValue({
      clients: mockClients as any,
      total: 1,
      page: 1,
      limit: 15,
      lastPage: 1,
    });

    const res = await request(app)
      .get("/api/v1/clients")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].userId).toBe(2);
    expect(res.body.meta.total).toBe(1);
  });

  it("POST /api/v1/clients validates input and returns 422 on invalid data", async () => {
    const app = createApp();
    const res = await request(app)
      .post("/api/v1/clients")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({});

    expect(res.status).toBe(422);
    expect(res.body.errors.firstName).toBeDefined();
    expect(res.body.errors.lastName).toBeDefined();
  });

  it("POST /api/v1/clients creates client with optional userId and uppercase names", async () => {
    const app = createApp();
    const mockCreated = {
      id: 2,
      firstName: "BOB",
      middleName: null,
      lastName: "JOHNSON",
      extensionName: null,
      contactNo: "09199887766",
      officeId: 1,
      designationId: 2,
      userId: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.spyOn(clientService, "createClient").mockResolvedValue(mockCreated as any);

    const res = await request(app)
      .post("/api/v1/clients")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        firstName: "Bob",
        lastName: "Johnson",
        contactNo: "09199887766",
        officeId: 1,
        designationId: 2,
        userId: 5,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.firstName).toBe("BOB");
    expect(res.body.data.userId).toBe(5);
    expect(res.body.message).toContain("Client created successfully");
  });
});
