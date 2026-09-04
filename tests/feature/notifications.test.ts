import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import { createApp } from "../../src/app";
import { notificationService } from "../../src/services/notification.service";

describe("Notifications Endpoints (/api/v1/notifications)", () => {
  const secret = "this-is-a-valid-32-characters-jwt-secret-string";
  process.env.JWT_SECRET = secret;

  const userToken = jwt.sign(
    { id: 1, username: "user", email: "user@itsm.local", role: "user", isActive: true },
    secret
  );

  it("GET /api/v1/notifications returns user's notifications", async () => {
    const app = createApp();
    const mockNotifications = [
      {
        id: 1,
        userId: 1,
        ticketId: 1,
        title: "Ticket Status Updated",
        message: "Your ticket status was changed to in_progress",
        isRead: false,
        createdAt: new Date(),
      },
    ];

    vi.spyOn(notificationService, "getUserNotifications").mockResolvedValue({
      notifications: mockNotifications as any,
      total: 1,
      page: 1,
      limit: 15,
      lastPage: 1,
      unreadCount: 1,
    });

    const res = await request(app)
      .get("/api/v1/notifications")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].title).toBe("Ticket Status Updated");
    expect(res.body.meta.total).toBe(1);
  });

  it("PATCH /api/v1/notifications/:id/read marks notification as read", async () => {
    const app = createApp();
    vi.spyOn(notificationService, "markAsRead").mockResolvedValue({
      id: 1,
      isRead: true,
    } as any);

    const res = await request(app)
      .patch("/api/v1/notifications/1/read")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.isRead).toBe(true);
  });

  it("PATCH /api/v1/notifications/read-all marks all as read", async () => {
    const app = createApp();
    vi.spyOn(notificationService, "markAllAsRead").mockResolvedValue();

    const res = await request(app)
      .patch("/api/v1/notifications/read-all")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toContain("All notifications marked as read");
  });
});
