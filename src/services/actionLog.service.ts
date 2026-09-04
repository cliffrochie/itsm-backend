import { sql, desc } from "drizzle-orm";
import { db } from "../db/client";
import { actionLogs, type ActionLog } from "../db/schema/actionLogs";

export class ActionLogService {
  async log(params: {
    userId?: number | null;
    action: string;
    entity: string;
    entityId?: string | null;
    details?: unknown;
    ipAddress?: string | null;
  }): Promise<void> {
    await db.insert(actionLogs).values({
      userId: params.userId || null,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId || null,
      details: params.details || null,
      ipAddress: params.ipAddress || null,
    });
  }

  async listLogs(
    page = 1,
    limit = 15
  ): Promise<{
    logs: ActionLog[];
    total: number;
    page: number;
    limit: number;
    lastPage: number;
  }> {
    const offset = (page - 1) * limit;

    const [totalResult] = await db.select({ count: sql<number>`count(*)` }).from(actionLogs);
    const total = Number(totalResult?.count || 0);
    const lastPage = Math.ceil(total / limit) || 1;

    const rows = await db
      .select()
      .from(actionLogs)
      .orderBy(desc(actionLogs.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      logs: rows,
      total,
      page,
      limit,
      lastPage,
    };
  }
}

export const actionLogService = new ActionLogService();
