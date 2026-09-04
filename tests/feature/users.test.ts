import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import { createApp } from "../../src/app";
import { userService } from "../../src/services/user.service";

describe("Users Endpoints (/api/v1/users)", () => {
  const secret = "this-is-a-valid-32-characters-jwt-secret-string";
  process.env.JWT_SECRET = secret;

  const adminToken = jwt.sign(
    { id: 1, username: "admin", email: "admin@itsm.local", role: "admin", isActive: true },
    secret
  );

  const regularToken = jwt.sign(
    { id: 2, username: "regular", email: "user@itsm.local", role: "user", isActive: true },
    secret
  );

  it("GET /api/v1/users rejects unauthenticated requests with 401", async () => {
    const app = createApp();
    const res = await request(app).get("/api/v1/users");

    expect(res.status).toBe(401);
  });

  it("GET /api/v1/users returns paginated list of users for authenticated admin", async () => {
    const app = createApp();
    const mockUsers = [
      {
        id: 1,
        username: "admin",
        email: "admin@itsm.local",
        firstName: "ADMIN",
        lastName: "USER",
        role: "admin" as const,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    vi.spyOn(userService, "listUsers").mockResolvedValue({
      users: mockUsers as any,
      total: 1,
      page: 1,
      limit: 15,
      lastPage: 1,
    });

    const res = await request(app)
      .get("/api/v1/users")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.meta.total).toBe(1);
    expect(res.body.errors).toBeNull();
  });

  it("POST /api/v1/users validates request body and returns 422 on invalid data", async () => {
    const app = createApp();
    const res = await request(app)
      .post("/api/v1/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({});

    expect(res.status).toBe(422);
    expect(res.body.errors.username).toBeDefined();
    expect(res.body.errors.email).toBeDefined();
    expect(res.body.errors.password).toBeDefined();
  });

  it("POST /api/v1/users creates user and returns 201 with success envelope", async () => {
    const app = createApp();
    const mockCreated = {
      id: 2,
      username: "techjohn",
      email: "john@itsm.local",
      firstName: "JOHN",
      middleName: null,
      lastName: "DOE",
      extensionName: null,
      contactNo: "09123456789",
      avatar: null,
      role: "service_engineer" as const,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.spyOn(userService, "createUser").mockResolvedValue(mockCreated as any);

    const res = await request(app)
      .post("/api/v1/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        username: "techjohn",
        email: "john@itsm.local",
        password: "Password123!",
        firstName: "John",
        lastName: "Doe",
        contactNo: "09123456789",
        role: "service_engineer",
        isActive: true,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.username).toBe("techjohn");
    expect(res.body.data.firstName).toBe("JOHN"); // Auto-uppercased
    expect(res.body.message).toContain("User created successfully");
  });

  it("PATCH /api/v1/users/:id/status toggles user active status", async () => {
    const app = createApp();
    vi.spyOn(userService, "toggleStatus").mockResolvedValue({
      id: 2,
      username: "techjohn",
      isActive: false,
    } as any);

    const res = await request(app)
      .patch("/api/v1/users/2/status")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ isActive: false });

    expect(res.status).toBe(200);
    expect(res.body.data.isActive).toBe(false);
  });
});
