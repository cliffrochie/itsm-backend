import type { Response, NextFunction } from "express";
import { userService } from "../services/user.service";
import { formatSuccess, formatPaginated } from "../responses/envelope";
import type { AuthRequest } from "../types/auth";
import type { CreateUserInput, UpdateUserInput, UserQueryInput } from "../validators/user.validator";

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
      const input = req.body as CreateUserInput;
      const created = await userService.createUser(input);
      res.status(201).json(formatSuccess(created, "User created successfully."));
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      const input = req.body as UpdateUserInput;
      const updated = await userService.updateUser(id, input);
      res.status(200).json(formatSuccess(updated, "User updated successfully."));
    } catch (error) {
      next(error);
    }
  }

  async toggleStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      const { isActive } = req.body;
      const updated = await userService.toggleStatus(id, isActive);
      res.status(200).json(formatSuccess(updated, "User status updated successfully."));
    } catch (error) {
      next(error);
    }
  }

  async destroy(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      await userService.deleteUser(id);
      res.status(200).json(formatSuccess(null, "User deleted successfully."));
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
