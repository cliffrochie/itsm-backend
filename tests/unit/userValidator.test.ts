import { describe, it, expect } from "vitest";
import { changePasswordSchema } from "../../src/validators/user.validator";

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
