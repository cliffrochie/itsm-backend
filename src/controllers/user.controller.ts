import type { Response, NextFunction } from "express";
import { userService } from "../services/user.service";
import { formatSuccess, formatPaginated } from "../responses/envelope";
import { mapUserResponse, mapUserListResponse } from "../responses/user.response";
import { ForbiddenError, NotFoundError } from "../types/errors";
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
import { recordAudit } from "../audit/recordAudit";
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
      const actor = requireUser(req.user);
      const query = req.query as unknown as UserQueryInput;
      const result = await userService.listUsers(query);
      res.status(200).json(
        formatPaginated(
          mapUserListResponse(result.users, actor),
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

  async totalUserRole(_req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await userService.getTotalUserRoles();
      res.status(200).json({
        ...result,
        ...formatSuccess(result, "Total user roles retrieved successfully."),
      });
    } catch (error) {
      next(error);
    }
  }

  async show(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const actor = requireUser(req.user);
      const id = Number(req.params.id);
      if (isNaN(id) || id <= 0 || !Number.isInteger(id)) {
        throw new NotFoundError(`User with ID ${req.params.id} not found.`);
      }
      const user = await userService.getUserById(id);
      res
        .status(200)
        .json(formatSuccess(mapUserResponse(user, actor), "User retrieved successfully."));
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

      await recordAudit(req, {
        action: "created",
        entity: "user",
        entityId: created.id,
        details: { username: created.username, role: created.role, isActive: created.isActive },
      });
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

      await recordAudit(req, {
        action: "updated",
        entity: "user",
        entityId: id,
        // Field names, plus the two values that carry privilege.
        details: { fields: Object.keys(input), role: input.role, isActive: input.isActive },
      });
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

      await recordAudit(req, {
        action: "status_changed",
        entity: "user",
        entityId: id,
        details: { isActive },
      });
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

      // Records that it happened and to whom. The passwords themselves are
      // deliberately absent.
      await recordAudit(req, {
        action: "password_changed",
        entity: "user",
        entityId: id,
        details: { self: actor.id === id },
      });
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

      // `result` carries the generated temporary password; it is never logged.
      await recordAudit(req, { action: "password_reset", entity: "user", entityId: id });
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

      await recordAudit(req, { action: "deleted", entity: "user", entityId: id });
      res.status(200).json(formatSuccess(null, "User deleted successfully."));
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
