import type { Response, NextFunction } from "express";
import { ticketService } from "../services/ticket.service";
import { formatSuccess, formatPaginated } from "../responses/envelope";
import type { AuthRequest } from "../types/auth";
import type {
  CreateTicketInput,
  UpdateTicketInput,
  TicketQueryInput,
  UpdateTicketStatusInput,
  AssignEngineerInput,
  TicketFeedbackInput,
} from "../validators/ticket.validator";

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
      const id = Number(req.params.id);
      const input = req.body as UpdateTicketInput;
      const updated = await ticketService.updateTicket(id, input, req.user?.id);
      res.status(200).json(formatSuccess(updated, "Service ticket updated successfully."));
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      const { serviceStatus, notes } = req.body as UpdateTicketStatusInput;
      const updated = await ticketService.updateStatus(id, serviceStatus, notes, req.user?.id);
      res.status(200).json(formatSuccess(updated, "Service ticket status updated successfully."));
    } catch (error) {
      next(error);
    }
  }

  async assign(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      const { serviceEngineerId, notes } = req.body as AssignEngineerInput;
      const updated = await ticketService.assignEngineer(id, serviceEngineerId, notes, req.user?.id);
      res.status(200).json(formatSuccess(updated, "Service engineer assigned successfully."));
    } catch (error) {
      next(error);
    }
  }

  async feedback(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      const { rating, ratingComment } = req.body as TicketFeedbackInput;
      const updated = await ticketService.submitFeedback(id, rating, ratingComment);
      res.status(200).json(formatSuccess(updated, "Feedback submitted successfully."));
    } catch (error) {
      next(error);
    }
  }
}

export const ticketController = new TicketController();
