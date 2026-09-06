import { actionLogService } from "../services/actionLog.service";
import { logger } from "../config/logger";
import type { AuthRequest } from "../types/auth";

/**
 * Writes one entry to the audit trail.
 *
 * `details` is always constructed explicitly at the call site — never a request
 * body, and never a whole validated input object. That rule is the point: this
 * system previously persisted plaintext passwords into this very table by
 * logging `req.body` wholesale. Pass field names and the specific
 * security-relevant values worth keeping, nothing more.
 *
 * A failure to write the audit entry is reported through the application
 * logger and swallowed. Losing an audit line is bad; failing a password change
 * or a ticket assignment because the audit insert failed is worse, and the
 * operation it describes has already been committed by the time we get here.
 */

export interface AuditEntry {
  /** Verb, e.g. "created", "status_changed", "login_failed". */
  action: string;
  /** Domain noun, e.g. "user", "client", "auth". */
  entity: string;
  entityId?: string | number | null;
  details?: Record<string, unknown> | null;
}

export async function recordAudit(req: AuthRequest, entry: AuditEntry): Promise<void> {
  try {
    await actionLogService.log({
      userId: req.user?.id ?? null,
      action: entry.action,
      entity: entry.entity,
      entityId: entry.entityId == null ? null : String(entry.entityId),
      details: entry.details ?? null,
      ipAddress: req.ip ?? null,
    });
  } catch (err) {
    logger.error(
      { err, action: entry.action, entity: entry.entity, entityId: entry.entityId },
      "Failed to write audit log entry"
    );
  }
}
