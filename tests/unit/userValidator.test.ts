import { describe, it, expect } from "vitest";
import { changePasswordSchema, createUserSchema } from "../../src/validators/user.validator";

describe("changePasswordSchema", () => {
  const valid = { currentPassword: "whatever-old", newPassword: "Str0ngPass" };

  it("accepts a new password with a letter, a digit, and at least 8 characters", () => {
    expect(changePasswordSchema.safeParse(valid).success).toBe(true);
  });

  it("requires a non-empty current password", () => {
    const result = changePasswordSchema.safeParse({ ...valid, currentPassword: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a new password shorter than 8 characters", () => {
    const result = changePasswordSchema.safeParse({ ...valid, newPassword: "Ab1cd" });
    expect(result.success).toBe(false);
  });

  it("rejects a new password with no digit", () => {
    const result = changePasswordSchema.safeParse({ ...valid, newPassword: "OnlyLetters" });
    expect(result.success).toBe(false);
  });

  it("rejects a new password with no letter", () => {
    const result = changePasswordSchema.safeParse({ ...valid, newPassword: "12345678" });
    expect(result.success).toBe(false);
  });
});

describe("createUserSchema client attributes", () => {
  const baseUser = {
    username: "john_doe",
    email: "john@example.com",
    password: "Password123!",
    firstName: "John",
    lastName: "Doe",
  };

  it("preserves optional officeId and designationId when provided as numbers", () => {
    const result = createUserSchema.parse({
      ...baseUser,
      officeId: 2,
      designationId: 5,
    });
    expect(result.officeId).toBe(2);
    expect(result.designationId).toBe(5);
  });

  it("coerces string officeId and designationId to numbers", () => {
    const result = createUserSchema.parse({
      ...baseUser,
      officeId: "3",
      designationId: "7",
    });
    expect(result.officeId).toBe(3);
    expect(result.designationId).toBe(7);
  });

  it("allows officeId and designationId to be omitted or null", () => {
    const omitted = createUserSchema.parse(baseUser);
    expect(omitted.officeId).toBeUndefined();
    expect(omitted.designationId).toBeUndefined();

    const nulled = createUserSchema.parse({
      ...baseUser,
      officeId: null,
      designationId: null,
    });
    expect(nulled.officeId).toBeNull();
    expect(nulled.designationId).toBeNull();
  });

  it("rejects non-positive numbers for officeId and designationId", () => {
    const zeroOffice = createUserSchema.safeParse({ ...baseUser, officeId: 0 });
    expect(zeroOffice.success).toBe(false);

    const negativeDesignation = createUserSchema.safeParse({ ...baseUser, designationId: -1 });
    expect(negativeDesignation.success).toBe(false);
  });
});
