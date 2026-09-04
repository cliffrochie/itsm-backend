import type { Response, NextFunction } from "express";
import { authService } from "../services/auth.service";
import { formatSuccess } from "../responses/envelope";
import type { AuthRequest } from "../types/auth";
import type { LoginInput } from "../validators/auth.validator";

export class AuthController {
  async login(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const input: LoginInput = req.body;
      const result = await authService.login(input);
      res.status(200).json(formatSuccess(result, "Logged in successfully."));
    } catch (error) {
      next(error);
    }
  }

  async me(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      res.status(200).json(formatSuccess(req.user, "User profile retrieved successfully."));
    } catch (error) {
      next(error);
    }
  }

  async logout(_req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await authService.logout();
      res.status(200).json(formatSuccess(null, "Logged out successfully."));
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
