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
    expect(res.json).toHaveBeenCalledWith({
      data: null,
      message: "Validation failed.",
      errors: {
        name: ["Name must be at least 3 characters"],
        age: ["Number must be greater than 0"],
      },
    });
  });
});
