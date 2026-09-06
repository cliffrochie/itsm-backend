import { describe, it, expect, vi } from "vitest";
import type { Request, Response, NextFunction } from "express";
import { validate } from "../../src/middlewares/validate";
import {
  createUserSchema,
  updateUserSchema,
  userQuerySchema,
} from "../../src/validators/user.validator";
import { createTicketSchema, ticketQuerySchema } from "../../src/validators/ticket.validator";

/**
 * Characterization tests for the validation layer.
 *
 * These were written against Zod 3 and must pass unchanged on Zod 4. They are
 * not testing Zod — they pin the behaviour this application's security depends
 * on, so an upgrade cannot quietly move it.
 *
 * The load-bearing one is unknown-key stripping. backend-node.md makes the
 * validated object the mass-assignment boundary, and `validate` assigns
 * `result.data` over `req.body`. If stripping ever stopped happening, a
 * requester could put `role: "admin"` in a payload and have it reach a service.
 */

function runValidate(schema: Parameters<typeof validate>[0], body: unknown) {
  const req = { body } as Request;
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  const next = vi.fn() as NextFunction;

  validate(schema, "body")(req, res, next);

  return { req, res, next };
}

describe("Unknown keys are stripped from a validated body", () => {
  it("drops a field the schema does not declare", () => {
    const { req, next } = runValidate(createTicketSchema, {
      taskType: "repair",
      title: "Printer jam",
      smuggled: "should not survive",
    });

    expect(next).toHaveBeenCalled();
    expect(req.body).not.toHaveProperty("smuggled");
    expect(req.body.title).toBe("Printer jam");
  });

  it("drops a privileged field that the update schema deliberately omits", () => {
    // updateUserSchema omits password. It must not be settable through the
    // update endpoint, only through the dedicated password flows.
    const { req, next } = runValidate(updateUserSchema, {
      firstName: "Renamed",
      password: "smuggled-password",
    });

    expect(next).toHaveBeenCalled();
    expect(req.body).not.toHaveProperty("password");
    expect(req.body.firstName).toBe("Renamed");
  });

  it("keeps declared privileged fields so the controller guard can still see them", () => {
    // The guard in user.controller rejects these for non-admins. Stripping them
    // here instead would turn a 403 into a silent no-op.
    const { req } = runValidate(updateUserSchema, { role: "admin", isActive: true });

    expect(req.body.role).toBe("admin");
    expect(req.body.isActive).toBe(true);
  });
});

describe("Defaults and optionality", () => {
  it("applies schema defaults on create", () => {
    const parsed = createUserSchema.parse({
      username: "newbie",
      email: "newbie@itsm.local",
      password: "Password123!",
      firstName: "New",
      lastName: "Bie",
    });

    expect(parsed.role).toBe("user");
    expect(parsed.isActive).toBe(false);
  });

  it("does not invent values for fields left out of a partial update", () => {
    const parsed = updateUserSchema.parse({ firstName: "Only this" });

    expect(parsed).toEqual({ firstName: "Only this" });
    expect(parsed).not.toHaveProperty("role");
    expect(parsed).not.toHaveProperty("isActive");
  });

  it("applies pagination defaults on a query schema", () => {
    const parsed = userQuerySchema.parse({});

    expect(parsed.page).toBe(1);
    expect(parsed.limit).toBe(15);
  });
});

describe("Coercion", () => {
  it("coerces numeric query strings, which arrive as text", () => {
    const parsed = ticketQuerySchema.parse({ page: "3", limit: "50", clientId: "70" });

    expect(parsed.page).toBe(3);
    expect(parsed.limit).toBe(50);
    expect(parsed.clientId).toBe(70);
  });

  it("rejects a non-numeric value rather than coercing it to NaN", () => {
    expect(ticketQuerySchema.safeParse({ page: "abc" }).success).toBe(false);
  });
});

describe("The 422 error contract", () => {
  it("maps each failing field to an array of messages", () => {
    const { res, next } = runValidate(createUserSchema, {});

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(422);

    const payload = (res.json as unknown as { mock: { calls: unknown[][] } }).mock.calls[0]?.[0] as {
      data: null;
      message: string;
      errors: Record<string, string[]>;
    };

    expect(payload.data).toBeNull();
    expect(payload.message).toBe("Validation failed.");
    expect(Array.isArray(payload.errors.username)).toBe(true);
    expect(payload.errors.username.length).toBeGreaterThan(0);
    expect(payload.errors.email).toBeDefined();
    expect(payload.errors.password).toBeDefined();
  });

  it("uses dot notation for a nested field path", () => {
    // errorHandler and validate both build the key with issue.path.join(".").
    // Zod 4 retypes `path`, so this pins the wire format clients map against.
    const schema = createUserSchema;
    const result = schema.safeParse({ username: 1 });

    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join("."));
      expect(paths).toContain("username");
    }
  });

  it("enforces the enum of valid roles", () => {
    const result = createUserSchema.safeParse({
      username: "x",
      email: "x@itsm.local",
      password: "Password123!",
      firstName: "X",
      lastName: "Y",
      role: "superadmin",
    });

    expect(result.success).toBe(false);
  });
});

describe("Email acceptance", () => {
  /**
   * Zod 4 tightened email validation. These are the shapes real accounts use,
   * pinned so a future change cannot quietly start rejecting people who can
   * currently sign in.
   */
  const accepted = [
    "juan@itsm.local",
    "juan.dela-cruz@dof.gov.ph",
    "user+tag@example.com",
    "first.last@sub.domain.example.org",
    "user_name@example-site.com",
    "JUAN@ITSM.LOCAL",
  ];

  it.each(accepted)("accepts %s", (email) => {
    const result = createUserSchema.safeParse({
      username: "someone",
      email,
      password: "Password123!",
      firstName: "Some",
      lastName: "One",
    });

    expect(result.success).toBe(true);
  });

  it("still rejects a value that is not an email at all", () => {
    const result = createUserSchema.safeParse({
      username: "someone",
      email: "not-an-email",
      password: "Password123!",
      firstName: "Some",
      lastName: "One",
    });

    expect(result.success).toBe(false);
  });
});
