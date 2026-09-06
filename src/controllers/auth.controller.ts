import type { Response, NextFunction } from "express";
import { authService } from "../services/auth.service";
import { userService } from "../services/user.service";
import { formatSuccess } from "../responses/envelope";
import { recordAudit } from "../audit/recordAudit";
import { UnauthorizedError } from "../types/errors";
import type { AuthRequest } from "../types/auth";
import type { LoginInput } from "../validators/auth.validator";

export class AuthController {
  async login(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const input: LoginInput = req.body;

      try {
        const result = await authService.login(input);

        await recordAudit(req, {
          action: "login_succeeded",
          entity: "auth",
          entityId: result.user.id,
          details: { identifier: input.identifier },
        });

        res.status(200).json(formatSuccess(result, "Logged in successfully."));
      } catch (error) {
        // A rejected credential is the single most useful thing in an audit
        // trail, so it is recorded before the error continues on its way.
        if (error instanceof UnauthorizedError) {
          await recordAudit(req, {
            action: "login_failed",
            entity: "auth",
            details: { identifier: input.identifier },
          });
        }
        throw error;
      }
    } catch (error) {
      next(error);
    }
  }

  async me(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError("Unauthenticated.");
      }
      try {
        const fullUser = await userService.getUserById(req.user.id);
        res.status(200).json(formatSuccess(fullUser, "User profile retrieved successfully."));
      } catch {
        res.status(200).json(formatSuccess(req.user, "User profile retrieved successfully."));
      }
    } catch (error) {
      next(error);
    }
  }

  async logout(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await authService.logout(req.token as string);

      await recordAudit(req, { action: "logged_out", entity: "auth", entityId: req.user?.id });

      res.status(200).json(formatSuccess(null, "Logged out successfully."));
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
