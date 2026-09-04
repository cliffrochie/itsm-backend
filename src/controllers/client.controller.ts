import type { Response, NextFunction } from "express";
import { clientService } from "../services/client.service";
import { formatSuccess, formatPaginated } from "../responses/envelope";
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
      const input = req.body as CreateClientInput;
      const created = await clientService.createClient(input);
      res.status(201).json(formatSuccess(created, "Client created successfully."));
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
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
      const id = Number(req.params.id);
      await clientService.deleteClient(id);
      res.status(200).json(formatSuccess(null, "Client deleted successfully."));
    } catch (error) {
      next(error);
    }
  }
}

export const clientController = new ClientController();
