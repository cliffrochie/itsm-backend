import { describe, it, expect, vi } from "vitest";
import { recordAudit } from "../../src/audit/recordAudit";
import { actionLogService } from "../../src/services/actionLog.service";
import type { AuthRequest } from "../../src/types/auth";

const request = (overrides: Partial<AuthRequest> = {}) =>
  ({
    ip: "203.0.113.7",
    user: {
      id: 1,
      username: "admin",
      email: "admin@itsm.local",
      role: "admin" as const,
      isActive: true,
    },
    ...overrides,
  }) as AuthRequest;

describe("recordAudit", () => {
  it("records the actor, the target and the caller's address", async () => {
    const log = vi.spyOn(actionLogService, "log").mockResolvedValue();

    await recordAudit(request(), {
      action: "status_changed",
      entity: "user",
      entityId: 42,
      details: { isActive: false },
    });

    expect(log).toHaveBeenCalledWith({
      userId: 1,
      action: "status_changed",
      entity: "user",
      entityId: "42",
      details: { isActive: false },
      ipAddress: "203.0.113.7",
    });
  });

  it("still records an entry for an unauthenticated action such as a failed login", async () => {
    const log = vi.spyOn(actionLogService, "log").mockResolvedValue();

    await recordAudit(request({ user: undefined }), {
      action: "login_failed",
      entity: "auth",
      details: { identifier: "admin" },
    });

    expect(log).toHaveBeenCalledWith(
      expect.objectContaining({ userId: null, entityId: null, action: "login_failed" })
    );
  });

  it("does not fail the operation it is describing when the audit write fails", async () => {
    vi.spyOn(actionLogService, "log").mockRejectedValue(new Error("table is gone"));

    await expect(
      recordAudit(request(), { action: "deleted", entity: "client", entityId: 3 })
    ).resolves.toBeUndefined();
  });
});

describe("Audit entries carry no secrets", () => {
  /**
   * The predecessor of this table stored plaintext passwords, because a
   * middleware logged req.body wholesale. These pin the replacement's contract:
   * details are hand-built at the call site, so a password can only appear if
   * someone puts it there deliberately.
   */
  it("password_changed records who and whether it was self-service, not the passwords", async () => {
    const log = vi.spyOn(actionLogService, "log").mockResolvedValue();

    await recordAudit(request(), {
      action: "password_changed",
      entity: "user",
      entityId: 42,
      details: { self: false },
    });

    const entry = log.mock.calls[0]?.[0];

    expect(entry?.action).toBe("password_changed");
    expect(entry?.entityId).toBe("42");
    // The whole payload is that one key — there is nowhere for a secret to sit.
    expect(Object.keys(entry?.details as object)).toEqual(["self"]);
  });

  it("never carries a request body, because it is never given one", async () => {
    const log = vi.spyOn(actionLogService, "log").mockResolvedValue();
    const req = request();
    (req as unknown as { body: unknown }).body = {
      currentPassword: "old-secret",
      newPassword: "new-secret",
    };

    await recordAudit(req, { action: "password_reset", entity: "user", entityId: 42 });

    const written = JSON.stringify(log.mock.calls[0]?.[0]);

    expect(written).not.toContain("old-secret");
    expect(written).not.toContain("new-secret");
    expect(log.mock.calls[0]?.[0]?.details).toBeNull();
  });
});
