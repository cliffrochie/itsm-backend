import { createHash } from "node:crypto";
import { and, eq, isNull, lt } from "drizzle-orm";
import { db } from "../db/client";
import { personalAccessTokens } from "../db/schema/personalAccessTokens";
import { UnauthorizedError } from "../types/errors";

export class TokenService {
  /**
   * Tokens are stored as SHA-256 hashes, never in plaintext. The token itself
   * is high-entropy and already signed, so a salted KDF buys nothing here — the
   * hash exists so a leaked table cannot be replayed.
   */
  hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  async issue(userId: number, token: string, expiresAt: Date): Promise<void> {
    await db.insert(personalAccessTokens).values({
      userId,
      tokenHash: this.hashToken(token),
      expiresAt,
    });
  }

  /**
   * Confirms the token is one this server issued and has not revoked. The JWT
   * signature and `exp` are checked separately by the authenticate middleware;
   * this is the revocation half that a stateless JWT cannot provide.
   */
  async assertActive(token: string): Promise<void> {
    const rows = await db
      .select({ id: personalAccessTokens.id })
      .from(personalAccessTokens)
      .where(
        and(
          eq(personalAccessTokens.tokenHash, this.hashToken(token)),
          isNull(personalAccessTokens.revokedAt)
        )
      )
      .limit(1);

    if (!rows[0]) {
      throw new UnauthorizedError("Unauthenticated.");
    }
  }

  /** Revokes only the token supplied, leaving the user's other sessions alive. */
  async revoke(token: string): Promise<void> {
    await db
      .update(personalAccessTokens)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(personalAccessTokens.tokenHash, this.hashToken(token)),
          isNull(personalAccessTokens.revokedAt)
        )
      );
  }

  /** Housekeeping for tokens that are already past their expiry. */
  async pruneExpired(now: Date = new Date()): Promise<void> {
    await db.delete(personalAccessTokens).where(lt(personalAccessTokens.expiresAt, now));
  }
}

export const tokenService = new TokenService();
