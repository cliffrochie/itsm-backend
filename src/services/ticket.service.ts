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
    if (!id || isNaN(id) || id <= 0) {
      throw new NotFoundError(`Service ticket with ID ${id} not found.`);
    }

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

  async deleteTicket(id: number): Promise<void> {
    await this.getTicketById(id);
    await db.delete(serviceTickets).where(eq(serviceTickets.id, id));
  }

  async getTotalServiceStatuses(): Promise<{
    totalTickets: number;
    totalOpenedTickets: number;
    totalAssignedTickets: number;
    totalInProgressTickets: number;
    totalOnHoldTickets: number;
    totalEscalatedTickets: number;
    totalCanceledTickets: number;
    totalReOpenedTickets: number;
    totalResolvedTickets: number;
    totalClosedTickets: number;
  }> {
    const [result] = await db
      .select({
        totalTickets: sql<number>`count(*)`,
        totalOpenedTickets: sql<number>`count(case when ${serviceTickets.serviceStatus} = 'open' then 1 end)`,
        totalAssignedTickets: sql<number>`count(case when ${serviceTickets.serviceEngineerId} is not null then 1 end)`,
        totalInProgressTickets: sql<number>`count(case when ${serviceTickets.serviceStatus} = 'in_progress' then 1 end)`,
        totalOnHoldTickets: sql<number>`0`,
        totalEscalatedTickets: sql<number>`0`,
        totalCanceledTickets: sql<number>`count(case when ${serviceTickets.serviceStatus} = 'cancelled' then 1 end)`,
        totalReOpenedTickets: sql<number>`0`,
        totalResolvedTickets: sql<number>`count(case when ${serviceTickets.serviceStatus} = 'resolved' then 1 end)`,
        totalClosedTickets: sql<number>`count(case when ${serviceTickets.serviceStatus} = 'closed' then 1 end)`,
      })
      .from(serviceTickets);

    return {
      totalTickets: Number(result?.totalTickets || 0),
      totalOpenedTickets: Number(result?.totalOpenedTickets || 0),
      totalAssignedTickets: Number(result?.totalAssignedTickets || 0),
      totalInProgressTickets: Number(result?.totalInProgressTickets || 0),
      totalOnHoldTickets: Number(result?.totalOnHoldTickets || 0),
      totalEscalatedTickets: Number(result?.totalEscalatedTickets || 0),
      totalCanceledTickets: Number(result?.totalCanceledTickets || 0),
      totalReOpenedTickets: Number(result?.totalReOpenedTickets || 0),
      totalResolvedTickets: Number(result?.totalResolvedTickets || 0),
      totalClosedTickets: Number(result?.totalClosedTickets || 0),
    };
  }

  async getTotalTaskTypes(): Promise<{
    totalTickets: number;
    totalIncident: number;
    totalServiceRequest: number;
    totalAssetRequest: number;
    totalMaintenance: number;
    totalConsultation: number;
    totalAccessibility: number;
  }> {
    const [result] = await db
      .select({
        totalTickets: sql<number>`count(*)`,
        totalIncident: sql<number>`count(case when lower(${serviceTickets.taskType}) like '%incident%' then 1 end)`,
        totalServiceRequest: sql<number>`count(case when lower(${serviceTickets.taskType}) like '%service request%' then 1 end)`,
        totalAssetRequest: sql<number>`count(case when lower(${serviceTickets.taskType}) like '%asset request%' then 1 end)`,
        totalMaintenance: sql<number>`count(case when lower(${serviceTickets.taskType}) like '%maintenance%' or lower(${serviceTickets.taskType}) like '%maintenace%' then 1 end)`,
        totalConsultation: sql<number>`count(case when lower(${serviceTickets.taskType}) like '%consultation%' then 1 end)`,
        totalAccessibility: sql<number>`count(case when lower(${serviceTickets.taskType}) like '%accessibility%' then 1 end)`,
      })
      .from(serviceTickets);

    return {
      totalTickets: Number(result?.totalTickets || 0),
      totalIncident: Number(result?.totalIncident || 0),
      totalServiceRequest: Number(result?.totalServiceRequest || 0),
      totalAssetRequest: Number(result?.totalAssetRequest || 0),
      totalMaintenance: Number(result?.totalMaintenance || 0),
      totalConsultation: Number(result?.totalConsultation || 0),
      totalAccessibility: Number(result?.totalAccessibility || 0),
    };
  }

  async getTotalEquipmentTypes(): Promise<{
    totalTickets: number;
    totalComputer: number;
    totalPrinter: number;
    totalScanner: number;
    totalMobileDevice: number;
    totalNetworkRelated: number;
    totalSoftwareApplication: number;
    totalOthers: number;
  }> {
    const [result] = await db
      .select({
        totalTickets: sql<number>`count(*)`,
        totalComputer: sql<number>`count(case when lower(${serviceTickets.equipmentType}) like '%computer%' or lower(${serviceTickets.equipmentType}) like '%desktop%' or lower(${serviceTickets.equipmentType}) like '%laptop%' then 1 end)`,
        totalPrinter: sql<number>`count(case when lower(${serviceTickets.equipmentType}) like '%printer%' then 1 end)`,
        totalScanner: sql<number>`count(case when lower(${serviceTickets.equipmentType}) like '%scanner%' then 1 end)`,
        totalMobileDevice: sql<number>`count(case when lower(${serviceTickets.equipmentType}) like '%mobile%' or lower(${serviceTickets.equipmentType}) like '%phone%' or lower(${serviceTickets.equipmentType}) like '%tablet%' then 1 end)`,
        totalNetworkRelated: sql<number>`count(case when lower(${serviceTickets.equipmentType}) like '%network%' then 1 end)`,
        totalSoftwareApplication: sql<number>`count(case when lower(${serviceTickets.equipmentType}) like '%software%' or lower(${serviceTickets.equipmentType}) like '%application%' then 1 end)`,
        totalOthers: sql<number>`count(case when lower(${serviceTickets.equipmentType}) like '%other%' or (${serviceTickets.equipmentTypeOthers} is not null and ${serviceTickets.equipmentTypeOthers} != '') then 1 end)`,
      })
      .from(serviceTickets);

    return {
      totalTickets: Number(result?.totalTickets || 0),
      totalComputer: Number(result?.totalComputer || 0),
      totalPrinter: Number(result?.totalPrinter || 0),
      totalScanner: Number(result?.totalScanner || 0),
      totalMobileDevice: Number(result?.totalMobileDevice || 0),
      totalNetworkRelated: Number(result?.totalNetworkRelated || 0),
      totalSoftwareApplication: Number(result?.totalSoftwareApplication || 0),
      totalOthers: Number(result?.totalOthers || 0),
    };
  }
}

export const ticketService = new TicketService();
