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

  it("POST /api/v1/users forbids a non-admin from creating an account", async () => {
    const app = createApp();
    const createUser = vi.spyOn(userService, "createUser");

    const res = await request(app)
      .post("/api/v1/users")
      .set("Authorization", `Bearer ${regularToken}`)
      .send({
        username: "escalated",
        email: "escalated@itsm.local",
        password: "Password123!",
        firstName: "Esc",
        lastName: "Alated",
        role: "admin",
        isActive: true,
      });

    expect(res.status).toBe(403);
    expect(res.body.data).toBeNull();
    expect(createUser).not.toHaveBeenCalled();
  });

  it("PUT /api/v1/users/:id forbids a non-admin from updating another account", async () => {
    const app = createApp();
    const updateUser = vi.spyOn(userService, "updateUser");

    const res = await request(app)
      .put("/api/v1/users/99")
      .set("Authorization", `Bearer ${regularToken}`)
      .send({ firstName: "Taken" });

    expect(res.status).toBe(403);
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("PUT /api/v1/users/:id forbids a non-admin from promoting themselves", async () => {
    const app = createApp();
    const updateUser = vi.spyOn(userService, "updateUser");

    const res = await request(app)
      .put("/api/v1/users/2")
      .set("Authorization", `Bearer ${regularToken}`)
      .send({ role: "admin" });

    expect(res.status).toBe(403);
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("PUT /api/v1/users/:id still lets a user edit their own profile fields", async () => {
    const app = createApp();
    vi.spyOn(userService, "updateUser").mockResolvedValue({
      id: 2,
      username: "regular",
      firstName: "RENAMED",
    } as any);

    const res = await request(app)
      .put("/api/v1/users/2")
      .set("Authorization", `Bearer ${regularToken}`)
      .send({ firstName: "Renamed" });

    expect(res.status).toBe(200);
    expect(res.body.data.firstName).toBe("RENAMED");
  });

  it("PATCH /api/v1/users/:id/status forbids a non-admin from activating an account", async () => {
    const app = createApp();
    const toggleStatus = vi.spyOn(userService, "toggleStatus");

    const res = await request(app)
      .patch("/api/v1/users/99/status")
      .set("Authorization", `Bearer ${regularToken}`)
      .send({ isActive: true });

    expect(res.status).toBe(403);
    expect(toggleStatus).not.toHaveBeenCalled();
  });

  it("DELETE /api/v1/users/:id forbids a non-admin from deleting an account", async () => {
    const app = createApp();
    const deleteUser = vi.spyOn(userService, "deleteUser");

    const res = await request(app)
      .delete("/api/v1/users/99")
      .set("Authorization", `Bearer ${regularToken}`);

    expect(res.status).toBe(403);
    expect(deleteUser).not.toHaveBeenCalled();
  });

  describe("PATCH /api/v1/users/:id/change-password", () => {
    it("rejects unauthenticated requests with 401", async () => {
      const app = createApp();
      const res = await request(app)
        .patch("/api/v1/users/2/change-password")
        .send({ currentPassword: "old-one", newPassword: "Str0ngPass" });

      expect(res.status).toBe(401);
    });

    it("returns 422 when the new password fails the policy", async () => {
      const app = createApp();
      const changePassword = vi.spyOn(userService, "changePassword");

      const res = await request(app)
        .patch("/api/v1/users/2/change-password")
        .set("Authorization", `Bearer ${regularToken}`)
        .send({ currentPassword: "old-one", newPassword: "weak" });

      expect(res.status).toBe(422);
      expect(res.body.errors.newPassword).toBeDefined();
      expect(changePassword).not.toHaveBeenCalled();
    });

    it("forbids changing another user's password", async () => {
      const app = createApp();
      const changePassword = vi.spyOn(userService, "changePassword");

      const res = await request(app)
        .patch("/api/v1/users/1/change-password")
        .set("Authorization", `Bearer ${regularToken}`)
        .send({ currentPassword: "old-one", newPassword: "Str0ngPass" });

      expect(res.status).toBe(403);
      expect(changePassword).not.toHaveBeenCalled();
    });

    it("changes the caller's own password and passes the request token through", async () => {
      const app = createApp();
      const changePassword = vi
        .spyOn(userService, "changePassword")
        .mockResolvedValue(undefined);

      const res = await request(app)
        .patch("/api/v1/users/2/change-password")
        .set("Authorization", `Bearer ${regularToken}`)
        .send({ currentPassword: "old-one", newPassword: "Str0ngPass" });

      expect(res.status).toBe(200);
      expect(res.body.data).toBeNull();
      expect(changePassword).toHaveBeenCalledWith(2, "old-one", "Str0ngPass", regularToken);
    });
  });

  describe("POST /api/v1/users/:id/reset-password", () => {
    it("forbids a non-admin from resetting a password", async () => {
      const app = createApp();
      const resetPassword = vi.spyOn(userService, "resetPassword");

      const res = await request(app)
        .post("/api/v1/users/99/reset-password")
        .set("Authorization", `Bearer ${regularToken}`);

      expect(res.status).toBe(403);
      expect(resetPassword).not.toHaveBeenCalled();
    });

    it("lets an admin reset a password and returns the temporary password once", async () => {
      const app = createApp();
      const resetPassword = vi
        .spyOn(userService, "resetPassword")
        .mockResolvedValue({ temporaryPassword: "Tmp0raryPass" });

      const res = await request(app)
        .post("/api/v1/users/99/reset-password")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.temporaryPassword).toBe("Tmp0raryPass");
      expect(resetPassword).toHaveBeenCalledWith(99);
    });
  });
});
