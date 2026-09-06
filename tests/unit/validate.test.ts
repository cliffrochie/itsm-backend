import { describe, it, expect, vi } from "vitest";
import { z } from "zod";
import { validate } from "../../src/middlewares/validate";
import type { Request, Response } from "express";

describe("Validation Middleware (Zod)", () => {
  const testSchema = z.object({
    name: z.string().min(3, "Name must be at least 3 characters"),
    age: z.number().int().positive(),
  });

  it("calls next() and preserves coerced data when payload is valid", () => {
    const req = {
      body: { name: "Antigravity", age: 25 },
    } as unknown as Request;

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;

    const next = vi.fn();

    const middleware = validate(testSchema, "body");
    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("returns 422 with formatted errors when payload is invalid", () => {
    const req = {
      body: { name: "a", age: -5 },
    } as unknown as Request;

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;

    const next = vi.fn();

    const middleware = validate(testSchema, "body");
    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(422);

    const payload = (res.json as unknown as { mock: { calls: unknown[][] } }).mock
      .calls[0]?.[0] as {
      data: null;
      message: string;
      errors: Record<string, string[]>;
    };

    expect(payload.data).toBeNull();
    expect(payload.message).toBe("Validation failed.");

    // The message this application wrote is asserted exactly.
    expect(payload.errors.name).toEqual(["Name must be at least 3 characters"]);

    // `age` has no custom message, so its text is Zod's own and changes between
    // Zod majors. The contract is that the field maps to a non-empty array of
    // strings, so that is what is pinned rather than upstream copy.
    expect(Array.isArray(payload.errors.age)).toBe(true);
    expect(payload.errors.age.length).toBeGreaterThan(0);
  });
});

describe("Client Validators", () => {
  it("createClientSchema validates email correctly", async () => {
    const { createClientSchema } = await import("../../src/validators/client.validator");

    // Invalid email
    const invalidRes = createClientSchema.safeParse({
      firstName: "John",
      lastName: "Doe",
      email: "not-an-email",
    });
    expect(invalidRes.success).toBe(false);

    // Valid email
    const validRes = createClientSchema.safeParse({
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@example.com",
    });
    expect(validRes.success).toBe(true);

    // Nullable / optional email
    const nullRes = createClientSchema.safeParse({
      firstName: "John",
      lastName: "Doe",
      email: null,
    });
    expect(nullRes.success).toBe(true);

    const omittedRes = createClientSchema.safeParse({
      firstName: "John",
      lastName: "Doe",
    });
    expect(omittedRes.success).toBe(true);
  });

  it("clientQuerySchema accepts optional email query parameter", async () => {
    const { clientQuerySchema } = await import("../../src/validators/client.validator");
    const parsed = clientQuerySchema.safeParse({ email: "john@example.com" });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect((parsed.data as any).email).toBe("john@example.com");
    }
  });
});
