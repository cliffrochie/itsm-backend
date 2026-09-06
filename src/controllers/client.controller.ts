import type { Response, NextFunction } from "express";
import { clientService } from "../services/client.service";
import { formatSuccess, formatPaginated } from "../responses/envelope";
import { ForbiddenError } from "../types/errors";
import { requireUser } from "../authorization/roles";
import {
  canCreateClient,
  canUpdateClient,
  canDeleteClient,
} from "../authorization/client.authorization";
import type { AuthRequest } from "../types/auth";
import type { CreateClientInput, UpdateClientInput, ClientQueryInput } from "../validators/client.validator";

export class ClientController {
  async index(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query as unknown as ClientQueryInput;
      const result = await clientService.listClients(query);
      res.status(200).json(
        formatPaginated(
          result.clients,
          {
            currentPage: result.page,
            lastPage: result.lastPage,
            perPage: result.limit,
            total: result.total,
          },
          "Clients retrieved successfully."
        )
      );
    } catch (error) {
      next(error);
    }
  }

  async show(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      const client = await clientService.getClientById(id);
      res.status(200).json(formatSuccess(client, "Client retrieved successfully."));
    } catch (error) {
      next(error);
    }
  }

  async store(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const actor = requireUser(req.user);
      if (!canCreateClient(actor)) {
        throw new ForbiddenError("Only administrators and staff can create client records.");
      }

      const input = req.body as CreateClientInput;
      const created = await clientService.createClient(input);
      res.status(201).json(formatSuccess(created, "Client created successfully."));
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const actor = requireUser(req.user);
      if (!canUpdateClient(actor)) {
        throw new ForbiddenError("Only administrators and staff can update client records.");
      }

      const id = Number(req.params.id);
      const input = req.body as UpdateClientInput;
      const updated = await clientService.updateClient(id, input);
      res.status(200).json(formatSuccess(updated, "Client updated successfully."));
    } catch (error) {
      next(error);
    }
  }

  async destroy(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const actor = requireUser(req.user);
      if (!canDeleteClient(actor)) {
        throw new ForbiddenError("Only administrators can delete client records.");
      }

      const id = Number(req.params.id);
      await clientService.deleteClient(id);
      res.status(200).json(formatSuccess(null, "Client deleted successfully."));
    } catch (error) {
      next(error);
    }
  }
}

export const clientController = new ClientController();
