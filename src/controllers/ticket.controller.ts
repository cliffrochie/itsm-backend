import type { Response, NextFunction } from "express";
import { ticketService } from "../services/ticket.service";
import { clientService } from "../services/client.service";
import { formatSuccess, formatPaginated } from "../responses/envelope";
import { ForbiddenError } from "../types/errors";
import { requireUser } from "../authorization/roles";
import {
  canUpdateTicket,
  canChangeTicketStatus,
  canAssignServiceEngineer,
  canSubmitTicketFeedback,
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
      const query = req.query as unknown as TicketQueryInput;
      const result = await ticketService.listTickets(query);
      res.status(200).json(
        formatPaginated(
          result.tickets,
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

  async show(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      const ticket = await ticketService.getTicketById(id);
      res.status(200).json(formatSuccess(ticket, "Service ticket retrieved successfully."));
    } catch (error) {
      next(error);
    }
  }

  async store(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as CreateTicketInput;
      const created = await ticketService.createTicket(input, req.user?.id);
      res.status(201).json(formatSuccess(created, "Service ticket created successfully."));
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const actor = requireUser(req.user);
      const id = Number(req.params.id);
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
      res.status(200).json(formatSuccess(updated, "Service ticket updated successfully."));
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const actor = requireUser(req.user);
      const id = Number(req.params.id);
      const { serviceStatus, notes } = req.body as UpdateTicketStatusInput;
      const ticket = await ticketService.getTicketById(id);

      if (!canChangeTicketStatus(actor, ticket)) {
        throw new ForbiddenError("Only administrators and the assigned engineer can change this ticket's status.");
      }

      const updated = await ticketService.updateStatus(id, serviceStatus, notes, actor.id);
      res.status(200).json(formatSuccess(updated, "Service ticket status updated successfully."));
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
      const { serviceEngineerId, notes } = req.body as AssignEngineerInput;
      const updated = await ticketService.assignEngineer(id, serviceEngineerId, notes, actor.id);
      res.status(200).json(formatSuccess(updated, "Service engineer assigned successfully."));
    } catch (error) {
      next(error);
    }
  }

  async feedback(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const actor = requireUser(req.user);
      const id = Number(req.params.id);
      const { rating, ratingComment } = req.body as TicketFeedbackInput;
      const ticket = await ticketService.getTicketById(id);

      const ownsClient = await actorOwnsTicketClient(actor, ticket);
      if (!canSubmitTicketFeedback(actor, ticket, ownsClient)) {
        throw new ForbiddenError("Only the requester can rate this service.");
      }

      const updated = await ticketService.submitFeedback(id, rating, ratingComment);
      res.status(200).json(formatSuccess(updated, "Feedback submitted successfully."));
    } catch (error) {
      next(error);
    }
  }
}

export const ticketController = new TicketController();
