import { beforeEach, vi } from "vitest";
import { tokenService } from "../src/services/token.service";

/**
 * The auth flow now persists and checks issued tokens, so every authenticated
 * request and every logout would otherwise need a database. Feature tests run
 * without one: treat any correctly signed token as active, and make revocation
 * a no-op by default.
 *
 * Tests that exercise revocation override these with their own spies.
 */
beforeEach(() => {
  vi.spyOn(tokenService, "assertActive").mockResolvedValue(undefined);
  vi.spyOn(tokenService, "revoke").mockResolvedValue(undefined);
});
