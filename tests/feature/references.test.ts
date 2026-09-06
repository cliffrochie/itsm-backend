import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import { createApp } from "../../src/app";
import { officeService } from "../../src/services/office.service";
import { designationService } from "../../src/services/designation.service";

describe("Reference Data Endpoints (/api/v1/offices, /api/v1/designations)", () => {
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

  it("GET /api/v1/offices returns all offices", async () => {
    const app = createApp();
    vi.spyOn(officeService, "listOffices").mockResolvedValue([
      { id: 1, name: "IT Support Office", code: "ITSO", createdAt: new Date(), updatedAt: new Date() },
    ]);

    const res = await request(app)
      .get("/api/v1/offices")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].code).toBe("ITSO");
    expect(res.body.errors).toBeNull();
  });

  it("POST /api/v1/offices validates input and returns 201 on success", async () => {
    const app = createApp();
    vi.spyOn(officeService, "createOffice").mockResolvedValue({
      id: 2,
      name: "Human Resources",
      code: "HR",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await request(app)
      .post("/api/v1/offices")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Human Resources", code: "HR" });

    expect(res.status).toBe(201);
    expect(res.body.data.code).toBe("HR");
  });

  it("GET /api/v1/designations returns all designations", async () => {
    const app = createApp();
    vi.spyOn(designationService, "listDesignations").mockResolvedValue([
      { id: 1, name: "IT Specialist", createdAt: new Date(), updatedAt: new Date() },
    ]);

    const res = await request(app)
      .get("/api/v1/designations")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].name).toBe("IT Specialist");
  });

  it("POST /api/v1/designations validates input and returns 201 on success", async () => {
    const app = createApp();
    vi.spyOn(designationService, "createDesignation").mockResolvedValue({
      id: 2,
      name: "Systems Analyst",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await request(app)
      .post("/api/v1/designations")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Systems Analyst" });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe("Systems Analyst");
  });

  it("POST /api/v1/designations accepts title as an alias for name and returns 201", async () => {
    const app = createApp();
    const createSpy = vi.spyOn(designationService, "createDesignation").mockResolvedValue({
      id: 3,
      name: "Network Engineer",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await request(app)
      .post("/api/v1/designations")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ title: "Network Engineer" });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe("Network Engineer");
    expect(createSpy).toHaveBeenCalledWith({ name: "Network Engineer" });
  });

  it("POST /api/v1/offices forbids a non-administrator from adding reference data", async () => {
    const app = createApp();
    const createOffice = vi.spyOn(officeService, "createOffice");

    const res = await request(app)
      .post("/api/v1/offices")
      .set("Authorization", `Bearer ${staffToken}`)
      .send({ name: "Rogue Office", code: "ROGUE" });

    expect(res.status).toBe(403);
    expect(createOffice).not.toHaveBeenCalled();
  });

  it("DELETE /api/v1/designations/:id forbids a non-administrator", async () => {
    const app = createApp();
    const deleteDesignation = vi.spyOn(designationService, "deleteDesignation");

    const res = await request(app)
      .delete("/api/v1/designations/1")
      .set("Authorization", `Bearer ${staffToken}`);

    expect(res.status).toBe(403);
    expect(deleteDesignation).not.toHaveBeenCalled();
  });
});
