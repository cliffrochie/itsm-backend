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

  const staffToken = jwt.sign(
    { id: 2, username: "staff", email: "staff@itsm.local", role: "staff", isActive: true },
    secret
  );

  const regularToken = jwt.sign(
    { id: 5, username: "regular", email: "regular@itsm.local", role: "user", isActive: true },
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

  it("POST /api/v1/clients rejects invalid email format with 422", async () => {
    const app = createApp();
    const res = await request(app)
      .post("/api/v1/clients")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        firstName: "John",
        lastName: "Doe",
        email: "not-a-valid-email",
      });

    expect(res.status).toBe(422);
    expect(res.body.errors.email).toBeDefined();
  });

  it("POST /api/v1/clients accepts valid email and returns it", async () => {
    const app = createApp();
    const mockCreated = {
      id: 3,
      firstName: "CHARLIE",
      middleName: null,
      lastName: "BROWN",
      extensionName: null,
      email: "charlie.brown@example.com",
      contactNo: null,
      officeId: null,
      designationId: null,
      userId: 10,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.spyOn(clientService, "createClient").mockResolvedValue(mockCreated as any);

    const res = await request(app)
      .post("/api/v1/clients")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        firstName: "Charlie",
        lastName: "Brown",
        email: "charlie.brown@example.com",
      });

    expect(res.status).toBe(201);
    expect(res.body.data.email).toBe("charlie.brown@example.com");
    expect(res.body.data.userId).toBe(10);
  });
  it("POST /api/v1/clients lets service desk staff add a client", async () => {
    const app = createApp();
    vi.spyOn(clientService, "createClient").mockResolvedValue({ id: 9, firstName: "NEW" } as any);

    const res = await request(app)
      .post("/api/v1/clients")
      .set("Authorization", `Bearer ${staffToken}`)
      .send({ firstName: "New", lastName: "Requester" });

    expect(res.status).toBe(201);
  });

  it("POST /api/v1/clients forbids a regular user from adding a client", async () => {
    const app = createApp();
    const createClient = vi.spyOn(clientService, "createClient");

    const res = await request(app)
      .post("/api/v1/clients")
      .set("Authorization", `Bearer ${regularToken}`)
      .send({ firstName: "New", lastName: "Requester" });

    expect(res.status).toBe(403);
    expect(createClient).not.toHaveBeenCalled();
  });

  it("DELETE /api/v1/clients/:id forbids staff, since tickets reference the client", async () => {
    const app = createApp();
    const deleteClient = vi.spyOn(clientService, "deleteClient");

    const res = await request(app)
      .delete("/api/v1/clients/1")
      .set("Authorization", `Bearer ${staffToken}`);

    expect(res.status).toBe(403);
    expect(deleteClient).not.toHaveBeenCalled();
  });
});
