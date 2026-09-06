import type { Response, NextFunction } from "express";
import { ticketService } from "../services/ticket.service";
import { clientService } from "../services/client.service";
import { formatSuccess, formatPaginated } from "../responses/envelope";
import { mapTicketResponse, mapTicketListResponse } from "../responses/ticket.response";
import { ForbiddenError, NotFoundError } from "../types/errors";
import { requireUser } from "../authorization/roles";
import {
  canUpdateTicket,
  canChangeTicketStatus,
  canAssignServiceEngineer,
  canSubmitTicketFeedback,
  canViewAllTickets,
  canViewTicket,
  canViewTicketInternals,
  type TicketPrincipals,
} from "../authorization/ticket.authorization";
import type { AuthenticatedUser, AuthRequest } from "../types/auth";
import type {
  CreateTicketInput,
  UpdateTicketInput,
  TicketQueryInput,
  UpdateTicketStatusInput,
  AssignEngineerInput,
  TicketFeedbackInput,
} from "../validators/ticket.validator";

/** Whether the actor is the user behind the client this ticket was filed for. */
async function actorOwnsTicketClient(
  actor: AuthenticatedUser,
  ticket: TicketPrincipals
): Promise<boolean> {
  if (ticket.clientId === null) {
    return false;
  }
  return clientService.isClientOwnedByUser(ticket.clientId, actor.id);
}

export class TicketController {
  async index(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const actor = requireUser(req.user);
      const query = req.query as unknown as TicketQueryInput;

      // A plain user only ever sees tickets they filed, or that were filed for
      // a client profile they own.
      const requesterScope = canViewAllTickets(actor)
        ? undefined
        : { userId: actor.id, clientIds: await clientService.findClientIdsForUser(actor.id) };

      const result = await ticketService.listTickets(query, requesterScope);
      res.status(200).json(
        formatPaginated(
          mapTicketListResponse(result.tickets, actor),
          {
            currentPage: result.page,
            lastPage: result.lastPage,
            perPage: result.limit,
            total: result.total,
          },
          "Service tickets retrieved successfully."
        )
      );
    } catch (error) {
      next(error);
    }
  }

  async totalServiceStatus(_req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await ticketService.getTotalServiceStatuses();
      res.status(200).json({
        ...result,
        ...formatSuccess(result, "Total service statuses retrieved successfully."),
      });
    } catch (error) {
      next(error);
    }
  }

  async totalTaskType(_req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await ticketService.getTotalTaskTypes();
      res.status(200).json({
        ...result,
        ...formatSuccess(result, "Total task types retrieved successfully."),
      });
    } catch (error) {
      next(error);
    }
  }

  async totalEquipmentType(_req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await ticketService.getTotalEquipmentTypes();
      res.status(200).json({
        ...result,
        ...formatSuccess(result, "Total equipment types retrieved successfully."),
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
        throw new NotFoundError(`Service ticket with ID ${req.params.id} not found.`);
      }
      const ticket = await ticketService.getTicketById(id);

      const actorClientIds = canViewAllTickets(actor)
        ? []
        : await clientService.findClientIdsForUser(actor.id);

      if (!canViewTicket(actor, ticket, actorClientIds)) {
        throw new ForbiddenError("You may only view your own service tickets.");
      }

      res
        .status(200)
        .json(formatSuccess(mapTicketResponse(ticket, actor), "Service ticket retrieved successfully."));
    } catch (error) {
      next(error);
    }
  }

  async store(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const actor = requireUser(req.user);
      const input = req.body as CreateTicketInput;

      // `adminRemarks` is the service desk's own field. Filing a ticket is open
      // to everyone, so the requester must not be able to author it.
      const setsAdminRemarks =
        input.adminRemarks !== undefined && input.adminRemarks !== null && input.adminRemarks !== "";
      if (setsAdminRemarks && !canViewTicketInternals(actor)) {
        throw new ForbiddenError("Only the service desk can set admin remarks.");
      }

      const created = await ticketService.createTicket(input, actor.id);
      res
        .status(201)
        .json(formatSuccess(mapTicketResponse(created, actor), "Service ticket created successfully."));
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const actor = requireUser(req.user);
      const id = Number(req.params.id);
      if (isNaN(id) || id <= 0 || !Number.isInteger(id)) {
        throw new NotFoundError(`Service ticket with ID ${req.params.id} not found.`);
      }
      const input = req.body as UpdateTicketInput;
      const ticket = await ticketService.getTicketById(id);

      if (!canUpdateTicket(actor, ticket)) {
        throw new ForbiddenError("Only administrators and the assigned engineer can update this ticket.");
      }

      // This endpoint accepts every field the granular endpoints do, so it has
      // to enforce the same rules or it becomes a way around them.
      if (input.serviceEngineerId !== undefined && !canAssignServiceEngineer(actor)) {
        throw new ForbiddenError("Only administrators can assign a service engineer.");
      }

      if (input.rating !== undefined || input.ratingComment !== undefined) {
        const ownsClient = await actorOwnsTicketClient(actor, ticket);
        if (!canSubmitTicketFeedback(actor, ticket, ownsClient)) {
          throw new ForbiddenError("Only the requester can rate this service.");
        }
      }

      const updated = await ticketService.updateTicket(id, input, actor.id);
      res
        .status(200)
        .json(formatSuccess(mapTicketResponse(updated, actor), "Service ticket updated successfully."));
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const actor = requireUser(req.user);
      const id = Number(req.params.id);
      if (isNaN(id) || id <= 0 || !Number.isInteger(id)) {
        throw new NotFoundError(`Service ticket with ID ${req.params.id} not found.`);
      }
      const { serviceStatus, notes } = req.body as UpdateTicketStatusInput;
      const ticket = await ticketService.getTicketById(id);

      if (!canChangeTicketStatus(actor, ticket)) {
        throw new ForbiddenError("Only administrators and the assigned engineer can change this ticket's status.");
      }

      const updated = await ticketService.updateStatus(id, serviceStatus, notes, actor.id);
      res
        .status(200)
        .json(
          formatSuccess(mapTicketResponse(updated, actor), "Service ticket status updated successfully.")
        );
    } catch (error) {
      next(error);
    }
  }

  async assign(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const actor = requireUser(req.user);
      if (!canAssignServiceEngineer(actor)) {
        throw new ForbiddenError("Only administrators can assign a service engineer.");
      }

      const id = Number(req.params.id);
      if (isNaN(id) || id <= 0 || !Number.isInteger(id)) {
        throw new NotFoundError(`Service ticket with ID ${req.params.id} not found.`);
      }
      const { serviceEngineerId, notes } = req.body as AssignEngineerInput;
      const updated = await ticketService.assignEngineer(id, serviceEngineerId, notes, actor.id);
      res
        .status(200)
        .json(formatSuccess(mapTicketResponse(updated, actor), "Service engineer assigned successfully."));
    } catch (error) {
      next(error);
    }
  }

  async feedback(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const actor = requireUser(req.user);
      const id = Number(req.params.id);
      if (isNaN(id) || id <= 0 || !Number.isInteger(id)) {
        throw new NotFoundError(`Service ticket with ID ${req.params.id} not found.`);
      }
      const { rating, ratingComment } = req.body as TicketFeedbackInput;
      const ticket = await ticketService.getTicketById(id);

      const ownsClient = await actorOwnsTicketClient(actor, ticket);
      if (!canSubmitTicketFeedback(actor, ticket, ownsClient)) {
        throw new ForbiddenError("Only the requester can rate this service.");
      }

      const updated = await ticketService.submitFeedback(id, rating, ratingComment);
      res
        .status(200)
        .json(formatSuccess(mapTicketResponse(updated, actor), "Feedback submitted successfully."));
    } catch (error) {
      next(error);
    }
  }

  async destroy(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (isNaN(id) || id <= 0 || !Number.isInteger(id)) {
        throw new NotFoundError(`Service ticket with ID ${req.params.id} not found.`);
      }
      await ticketService.deleteTicket(id);
      res.status(200).json(formatSuccess(null, "Service ticket deleted successfully."));
    } catch (error) {
      next(error);
    }
  }
}

export const ticketController = new TicketController();
