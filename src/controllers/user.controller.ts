import type { Response, NextFunction } from "express";
import { userService } from "../services/user.service";
import { formatSuccess, formatPaginated } from "../responses/envelope";
import { ForbiddenError } from "../types/errors";
import { requireUser } from "../authorization/roles";
import {
  canCreateUser,
  canUpdateUser,
  canManageUserRole,
  canToggleUserStatus,
  canDeleteUser,
  canResetUserPassword,
  canChangeUserPassword,
} from "../authorization/user.authorization";
import type { AuthRequest } from "../types/auth";
import type {
  CreateUserInput,
  UpdateUserInput,
  UserQueryInput,
  ChangePasswordInput,
} from "../validators/user.validator";

export class UserController {
  async index(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query as unknown as UserQueryInput;
      const result = await userService.listUsers(query);
      res.status(200).json(
        formatPaginated(
          result.users,
          {
            currentPage: result.page,
            lastPage: result.lastPage,
            perPage: result.limit,
            total: result.total,
          },
          "Users retrieved successfully."
        )
      );
    } catch (error) {
      next(error);
    }
  }

  async show(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      const user = await userService.getUserById(id);
      res.status(200).json(formatSuccess(user, "User retrieved successfully."));
    } catch (error) {
      next(error);
    }
  }

  async store(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const actor = requireUser(req.user);
      if (!canCreateUser(actor)) {
        throw new ForbiddenError("Only administrators can create user accounts.");
      }

      const input = req.body as CreateUserInput;
      const created = await userService.createUser(input);
      res.status(201).json(formatSuccess(created, "User created successfully."));
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const actor = requireUser(req.user);
      const id = Number(req.params.id);
      if (!canUpdateUser(actor, id)) {
        throw new ForbiddenError("You may only update your own account.");
      }

      const input = req.body as UpdateUserInput;
      const changesPrivilege = input.role !== undefined || input.isActive !== undefined;
      if (changesPrivilege && !canManageUserRole(actor)) {
        throw new ForbiddenError("You are not allowed to change a role or account status.");
      }

      const updated = await userService.updateUser(id, input);
      res.status(200).json(formatSuccess(updated, "User updated successfully."));
    } catch (error) {
      next(error);
    }
  }

  async toggleStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const actor = requireUser(req.user);
      if (!canToggleUserStatus(actor)) {
        throw new ForbiddenError("Only administrators can change account status.");
      }

      const id = Number(req.params.id);
      const { isActive } = req.body;
      const updated = await userService.toggleStatus(id, isActive);
      res.status(200).json(formatSuccess(updated, "User status updated successfully."));
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const actor = requireUser(req.user);
      const id = Number(req.params.id);
      if (!canChangeUserPassword(actor, id)) {
        throw new ForbiddenError("You may only change your own password.");
      }

      const { currentPassword, newPassword } = req.body as ChangePasswordInput;
      await userService.changePassword(id, currentPassword, newPassword, req.token);
      res
        .status(200)
        .json(
          formatSuccess(null, "Password changed successfully. Other sessions have been signed out.")
        );
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const actor = requireUser(req.user);
      if (!canResetUserPassword(actor)) {
        throw new ForbiddenError("Only administrators can reset user passwords.");
      }

      const id = Number(req.params.id);
      const result = await userService.resetPassword(id);
      res
        .status(200)
        .json(
          formatSuccess(
            result,
            "Password reset. Share this temporary password with the user; it will not be shown again."
          )
        );
    } catch (error) {
      next(error);
    }
  }

  async destroy(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const actor = requireUser(req.user);
      if (!canDeleteUser(actor)) {
        throw new ForbiddenError("Only administrators can delete user accounts.");
      }

      const id = Number(req.params.id);
      await userService.deleteUser(id);
      res.status(200).json(formatSuccess(null, "User deleted successfully."));
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
