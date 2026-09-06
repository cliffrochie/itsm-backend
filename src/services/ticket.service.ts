import { eq, sql, and, or, like, desc, inArray } from "drizzle-orm";
import { db } from "../db/client";
import { serviceTickets, type ServiceTicket } from "../db/schema/serviceTickets";
import { serviceTicketHistories, type ServiceTicketHistory } from "../db/schema/serviceTicketHistories";
import { ticketCounterService } from "./ticketCounter.service";
import { NotFoundError } from "../types/errors";
import type {
  CreateTicketInput,
  UpdateTicketInput,
  TicketQueryInput,
} from "../validators/ticket.validator";

export class TicketService {
  /**
   * `requesterScope` restricts the result set to one requester's own tickets.
   * Omit it for viewers entitled to the whole queue. Scoping happens in the
   * query, not after it, so pagination totals stay correct.
   */
  async listTickets(
    query: TicketQueryInput,
    requesterScope?: { userId: number; clientIds: number[] }
  ): Promise<{
    tickets: ServiceTicket[];
    total: number;
    page: number;
    limit: number;
    lastPage: number;
  }> {
    const page = query.page || 1;
    const limit = query.limit || 15;
    const offset = (page - 1) * limit;

    const conditions = [];

    if (query.serviceStatus) {
      conditions.push(eq(serviceTickets.serviceStatus, query.serviceStatus));
    }
    if (query.priority) {
      conditions.push(eq(serviceTickets.priority, query.priority));
    }
    if (query.clientId) {
      conditions.push(eq(serviceTickets.clientId, query.clientId));
    }
    if (query.serviceEngineerId) {
      conditions.push(eq(serviceTickets.serviceEngineerId, query.serviceEngineerId));
    }
    if (query.search) {
      const searchPattern = `%${query.search}%`;
      conditions.push(
        or(
          like(serviceTickets.ticketNo, searchPattern),
          like(serviceTickets.title, searchPattern),
          like(serviceTickets.equipmentType, searchPattern)
        )
      );
    }

    if (requesterScope) {
      const ownership = [eq(serviceTickets.createdById, requesterScope.userId)];
      if (requesterScope.clientIds.length > 0) {
        ownership.push(inArray(serviceTickets.clientId, requesterScope.clientIds));
      }
      conditions.push(or(...ownership));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(serviceTickets)
      .where(whereClause);

    const total = Number(totalResult?.count || 0);
    const lastPage = Math.ceil(total / limit) || 1;

    const rows = await db
      .select()
      .from(serviceTickets)
      .where(whereClause)
      .orderBy(desc(serviceTickets.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      tickets: rows,
      total,
      page,
      limit,
      lastPage,
    };
  }

  async getTicketById(id: number): Promise<ServiceTicket & { histories?: ServiceTicketHistory[] }> {
    const [ticket] = await db.select().from(serviceTickets).where(eq(serviceTickets.id, id)).limit(1);
    if (!ticket) {
      throw new NotFoundError(`Service ticket with ID ${id} not found.`);
    }

    const histories = await db
      .select()
      .from(serviceTicketHistories)
      .where(eq(serviceTicketHistories.serviceTicketId, id))
      .orderBy(desc(serviceTicketHistories.createdAt));

    return {
      ...ticket,
      histories,
    };
  }

  async createTicket(input: CreateTicketInput, creatorUserId?: number): Promise<ServiceTicket> {
    const ticketNo = await ticketCounterService.getNextTicketNo();

    const [inserted] = await db
      .insert(serviceTickets)
      .values({
        ticketNo,
        taskType: input.taskType,
        title: input.title,
        natureOfWork: input.natureOfWork || null,
        serialNo: input.serialNo || null,
        equipmentType: input.equipmentType || null,
        equipmentTypeOthers: input.equipmentTypeOthers || null,
        defectsFound: input.defectsFound || null,
        serviceRendered: input.serviceRendered || null,
        serviceStatus: "open",
        priority: input.priority,
        remarks: input.remarks || null,
        adminRemarks: input.adminRemarks || null,
        clientId: input.clientId || null,
        serviceEngineerId: input.serviceEngineerId || null,
        createdById: creatorUserId || null,
        updatedById: creatorUserId || null,
      })
      .$returningId();

    // Log initial creation in history
    await db.insert(serviceTicketHistories).values({
      serviceTicketId: inserted.id,
      performedById: creatorUserId || null,
      action: "Ticket Created",
      notes: `Ticket ${ticketNo} generated and marked as Open.`,
    });

    return this.getTicketById(inserted.id);
  }

  async updateTicket(id: number, input: UpdateTicketInput, updatedByUserId?: number): Promise<ServiceTicket> {
    await this.getTicketById(id);

    const updateValues: Record<string, unknown> = {
      updatedById: updatedByUserId || null,
    };

    if (input.taskType !== undefined) updateValues.taskType = input.taskType;
    if (input.title !== undefined) updateValues.title = input.title;
    if (input.natureOfWork !== undefined) updateValues.natureOfWork = input.natureOfWork;
    if (input.serialNo !== undefined) updateValues.serialNo = input.serialNo;
    if (input.equipmentType !== undefined) updateValues.equipmentType = input.equipmentType;
    if (input.equipmentTypeOthers !== undefined) updateValues.equipmentTypeOthers = input.equipmentTypeOthers;
    if (input.defectsFound !== undefined) updateValues.defectsFound = input.defectsFound;
    if (input.serviceRendered !== undefined) updateValues.serviceRendered = input.serviceRendered;
    if (input.priority !== undefined) updateValues.priority = input.priority;
    if (input.remarks !== undefined) updateValues.remarks = input.remarks;
    if (input.adminRemarks !== undefined) updateValues.adminRemarks = input.adminRemarks;
    if (input.clientId !== undefined) updateValues.clientId = input.clientId;
    if (input.serviceEngineerId !== undefined) updateValues.serviceEngineerId = input.serviceEngineerId;
    if (input.serviceStatus !== undefined) updateValues.serviceStatus = input.serviceStatus;
    if (input.rating !== undefined) updateValues.rating = input.rating;
    if (input.ratingComment !== undefined) updateValues.ratingComment = input.ratingComment;

    await db.update(serviceTickets).set(updateValues).where(eq(serviceTickets.id, id));

    return this.getTicketById(id);
  }

  async updateStatus(
    id: number,
    newStatus: "open" | "in_progress" | "resolved" | "closed" | "cancelled",
    notes?: string | null,
    performedByUserId?: number
  ): Promise<ServiceTicket> {
    const existing = await this.getTicketById(id);

    await db
      .update(serviceTickets)
      .set({
        serviceStatus: newStatus,
        updatedById: performedByUserId || null,
      })
      .where(eq(serviceTickets.id, id));

    await db.insert(serviceTicketHistories).values({
      serviceTicketId: id,
      performedById: performedByUserId || null,
      action: `Status changed: ${existing.serviceStatus} -> ${newStatus}`,
      notes: notes || null,
    });

    return this.getTicketById(id);
  }

  async assignEngineer(
    id: number,
    engineerId: number,
    notes?: string | null,
    performedByUserId?: number
  ): Promise<ServiceTicket> {
    await this.getTicketById(id);

    await db
      .update(serviceTickets)
      .set({
        serviceEngineerId: engineerId,
        updatedById: performedByUserId || null,
      })
      .where(eq(serviceTickets.id, id));

    await db.insert(serviceTicketHistories).values({
      serviceTicketId: id,
      performedById: performedByUserId || null,
      action: "Assigned Engineer",
      notes: notes || `Assigned to engineer ID: ${engineerId}`,
    });

    return this.getTicketById(id);
  }

  async submitFeedback(
    id: number,
    rating: number,
    ratingComment?: string | null
  ): Promise<ServiceTicket> {
    await this.getTicketById(id);

    await db
      .update(serviceTickets)
      .set({
        rating,
        ratingComment: ratingComment || null,
      })
      .where(eq(serviceTickets.id, id));

    await db.insert(serviceTicketHistories).values({
      serviceTicketId: id,
      action: "Feedback Submitted",
      notes: `Rated ${rating}/5. ${ratingComment || ""}`,
    });

    return this.getTicketById(id);
  }
}

export const ticketService = new TicketService();
