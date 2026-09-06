import { describe, it, expect, vi } from "vitest";
import bcrypt from "bcrypt";
import { tokenService } from "../../src/services/token.service";
import { userService } from "../../src/services/user.service";
import { db } from "../../src/db/client";
import { NotFoundError, UnauthorizedError } from "../../src/types/errors";

function mockSelectOnce(row: unknown) {
  vi.spyOn(db, "select").mockReturnValue({
    from: () => ({
      where: () => ({
        limit: () => Promise.resolve(row === undefined ? [] : [row]),
      }),
    }),
  } as never);
}

function captureUpdate() {
  const setSpy = vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) });
  vi.spyOn(db, "update").mockReturnValue({ set: setSpy } as never);
  return setSpy;
}

describe("TokenService.revokeAllForUser", () => {
  it("marks the user's tokens revoked with a timestamp", async () => {
    const setSpy = vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) });
    vi.spyOn(db, "update").mockReturnValue({ set: setSpy } as never);

    await tokenService.revokeAllForUser(5);

    expect(setSpy).toHaveBeenCalledWith({ revokedAt: expect.any(Date) });
  });

  it("hashes the supplied current token so it can be excluded from the revocation", async () => {
    vi.spyOn(db, "update").mockReturnValue({
      set: () => ({ where: vi.fn().mockResolvedValue(undefined) }),
    } as never);
    const hashSpy = vi.spyOn(tokenService, "hashToken");

    await tokenService.revokeAllForUser(5, "current.jwt.token");

    expect(hashSpy).toHaveBeenCalledWith("current.jwt.token");
  });

  it("does not hash anything when no current token is supplied", async () => {
    vi.spyOn(db, "update").mockReturnValue({
      set: () => ({ where: vi.fn().mockResolvedValue(undefined) }),
    } as never);
    const hashSpy = vi.spyOn(tokenService, "hashToken");

    await tokenService.revokeAllForUser(5);

    expect(hashSpy).not.toHaveBeenCalled();
  });
});

describe("UserService.changePassword", () => {
  it("throws NotFoundError when the user does not exist", async () => {
    mockSelectOnce(undefined);

    await expect(
      userService.changePassword(99, "whatever", "Brandnew1", undefined)
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("rejects an incorrect current password with UnauthorizedError", async () => {
    const passwordHash = await bcrypt.hash("Correct1pw", 10);
    mockSelectOnce({ id: 1, password: passwordHash });

    await expect(
      userService.changePassword(1, "WrongGuess1", "Brandnew1", undefined)
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("stores a bcrypt hash of the new password, never the plaintext", async () => {
    const passwordHash = await bcrypt.hash("Correct1pw", 10);
    mockSelectOnce({ id: 1, password: passwordHash });
    const setSpy = captureUpdate();
    vi.spyOn(tokenService, "revokeAllForUser").mockResolvedValue(undefined);

    await userService.changePassword(1, "Correct1pw", "Brandnew1", undefined);

    const stored = setSpy.mock.calls[0]![0] as { password: string };
    expect(stored.password).not.toBe("Brandnew1");
    expect(await bcrypt.compare("Brandnew1", stored.password)).toBe(true);
  });

  it("revokes the user's other sessions while keeping the current token", async () => {
    const passwordHash = await bcrypt.hash("Correct1pw", 10);
    mockSelectOnce({ id: 1, password: passwordHash });
    captureUpdate();
    const revokeSpy = vi.spyOn(tokenService, "revokeAllForUser").mockResolvedValue(undefined);

    await userService.changePassword(1, "Correct1pw", "Brandnew1", "this.request.token");

    expect(revokeSpy).toHaveBeenCalledWith(1, "this.request.token");
  });
});

describe("UserService.resetPassword", () => {
  it("throws NotFoundError when the user does not exist", async () => {
    mockSelectOnce(undefined);

    await expect(userService.resetPassword(99)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("returns a temporary password that satisfies the strong-password policy", async () => {
    mockSelectOnce({ id: 1, username: "u", email: "u@x.io", password: "old" });
    captureUpdate();
    vi.spyOn(tokenService, "revokeAllForUser").mockResolvedValue(undefined);

    const { temporaryPassword } = await userService.resetPassword(1);

    expect(temporaryPassword.length).toBeGreaterThanOrEqual(8);
    expect(temporaryPassword).toMatch(/[A-Za-z]/);
    expect(temporaryPassword).toMatch(/[0-9]/);
  });

  it("stores a hash of the temporary password and revokes every session", async () => {
    mockSelectOnce({ id: 1, username: "u", email: "u@x.io", password: "old" });
    const setSpy = captureUpdate();
    const revokeSpy = vi.spyOn(tokenService, "revokeAllForUser").mockResolvedValue(undefined);

    const { temporaryPassword } = await userService.resetPassword(1);

    const stored = setSpy.mock.calls[0]![0] as { password: string };
    expect(stored.password).not.toBe(temporaryPassword);
    expect(await bcrypt.compare(temporaryPassword, stored.password)).toBe(true);
    expect(revokeSpy).toHaveBeenCalledWith(1);
  });
});
