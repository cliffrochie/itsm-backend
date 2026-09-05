import { describe, it, expect } from "vitest";
import {
  requireUser,
  isAdmin,
  canCreateUser,
  canUpdateUser,
  canManageUserRole,
  canToggleUserStatus,
  canDeleteUser,
} from "../../src/authorization/user.authorization";
import { UnauthorizedError } from "../../src/types/errors";
import type { AuthenticatedUser } from "../../src/types/auth";

const admin: AuthenticatedUser = {
  id: 1,
  username: "admin",
  email: "admin@itsm.local",
  role: "admin",
  isActive: true,
};

const engineer: AuthenticatedUser = {
  id: 2,
  username: "engineer",
  email: "engineer@itsm.local",
  role: "service_engineer",
  isActive: true,
};

const regular: AuthenticatedUser = {
  id: 3,
  username: "regular",
  email: "user@itsm.local",
  role: "user",
  isActive: true,
};

describe("User authorization guards", () => {
  it("requireUser throws when the request carries no authenticated actor", () => {
    expect(() => requireUser(undefined)).toThrow(UnauthorizedError);
  });

  it("requireUser returns the actor when present", () => {
    expect(requireUser(admin)).toBe(admin);
  });

  it("recognizes only the admin role as administrative", () => {
    expect(isAdmin(admin)).toBe(true);
    expect(isAdmin(engineer)).toBe(false);
    expect(isAdmin(regular)).toBe(false);
  });

  it("restricts user creation to administrators", () => {
    expect(canCreateUser(admin)).toBe(true);
    expect(canCreateUser(engineer)).toBe(false);
    expect(canCreateUser(regular)).toBe(false);
  });

  it("allows a non-admin to update only their own account", () => {
    expect(canUpdateUser(regular, regular.id)).toBe(true);
    expect(canUpdateUser(regular, admin.id)).toBe(false);
    expect(canUpdateUser(engineer, regular.id)).toBe(false);
  });

  it("allows an administrator to update any account", () => {
    expect(canUpdateUser(admin, admin.id)).toBe(true);
    expect(canUpdateUser(admin, regular.id)).toBe(true);
  });

  it("restricts role and status changes to administrators", () => {
    expect(canManageUserRole(admin)).toBe(true);
    expect(canManageUserRole(engineer)).toBe(false);
    expect(canManageUserRole(regular)).toBe(false);
  });

  it("restricts status toggling to administrators", () => {
    expect(canToggleUserStatus(admin)).toBe(true);
    expect(canToggleUserStatus(regular)).toBe(false);
  });

  it("restricts deletion to administrators", () => {
    expect(canDeleteUser(admin)).toBe(true);
    expect(canDeleteUser(engineer)).toBe(false);
    expect(canDeleteUser(regular)).toBe(false);
  });
});
