import { eq, and, sql, desc } from "drizzle-orm";
import { db } from "../db/client";
import { notifications, type Notification } from "../db/schema/notifications";
import { NotFoundError } from "../types/errors";
import { emitToUser } from "../realtime/socket";

export class NotificationService {
  async getUserNotifications(
    userId: number,
    page = 1,
    limit = 15
  ): Promise<{
    notifications: Notification[];
    total: number;
    page: number;
    limit: number;
    lastPage: number;
    unreadCount: number;
  }> {
    const offset = (page - 1) * limit;

    const [totalResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(eq(notifications.userId, userId));

    const total = Number(totalResult?.count || 0);
    const lastPage = Math.ceil(total / limit) || 1;

    const [unreadResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));

    const unreadCount = Number(unreadResult?.count || 0);

    const rows = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      notifications: rows,
      total,
      page,
      limit,
      lastPage,
      unreadCount,
    };
  }

  async markAsRead(id: number, userId: number): Promise<Notification> {
    const [notification] = await db
      .select()
      .from(notifications)
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
      .limit(1);

    if (!notification) {
      throw new NotFoundError(`Notification with ID ${id} not found.`);
    }

    await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));

    return {
      ...notification,
      isRead: true,
    };
  }

  async markAllAsRead(userId: number): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId));
  }

  async createNotification(
    userId: number,
    title: string,
    message: string,
    ticketId?: number | null
  ): Promise<Notification> {
    const [inserted] = await db
      .insert(notifications)
      .values({
        userId,
        ticketId: ticketId || null,
        title,
        message,
        isRead: false,
      })
      .$returningId();

    const [created] = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, inserted.id))
      .limit(1);

    emitToUser(userId, "notification:new", created);

    return created!;
  }
}

export const notificationService = new NotificationService();
