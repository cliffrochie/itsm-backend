import type { Response, NextFunction } from "express";
import { notificationService } from "../services/notification.service";
import { formatSuccess, formatPaginated } from "../responses/envelope";
import type { AuthRequest } from "../types/auth";
import { UnauthorizedError } from "../types/errors";

export class NotificationController {
  async index(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 15;

      const result = await notificationService.getUserNotifications(req.user.id, page, limit);

      res.status(200).json(
        formatPaginated(
          result.notifications,
          {
            currentPage: result.page,
            lastPage: result.lastPage,
            perPage: result.limit,
            total: result.total,
          },
          "Notifications retrieved successfully."
        )
      );
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      const id = Number(req.params.id);
      const updated = await notificationService.markAsRead(id, req.user.id);
      res.status(200).json(formatSuccess(updated, "Notification marked as read."));
    } catch (error) {
      next(error);
    }
  }

  async markAllAsRead(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError();
      await notificationService.markAllAsRead(req.user.id);
      res.status(200).json(formatSuccess(null, "All notifications marked as read."));
    } catch (error) {
      next(error);
    }
  }
}

export const notificationController = new NotificationController();
