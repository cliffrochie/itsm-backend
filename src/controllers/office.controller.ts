import type { Response, NextFunction } from "express";
import { officeService } from "../services/office.service";
import { formatSuccess } from "../responses/envelope";
import { ForbiddenError } from "../types/errors";
import { requireUser } from "../authorization/roles";
import { canManageReferenceData } from "../authorization/reference.authorization";
import { recordAudit } from "../audit/recordAudit";
import type { AuthRequest } from "../types/auth";
import type { CreateOfficeInput, UpdateOfficeInput } from "../validators/office.validator";

export class OfficeController {
  async index(_req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const items = await officeService.listOffices();
      res.status(200).json(formatSuccess(items, "Offices retrieved successfully."));
    } catch (error) {
      next(error);
    }
  }

  async show(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      const item = await officeService.getOfficeById(id);
      res.status(200).json(formatSuccess(item, "Office retrieved successfully."));
    } catch (error) {
      next(error);
    }
  }

  async store(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const actor = requireUser(req.user);
      if (!canManageReferenceData(actor)) {
        throw new ForbiddenError("Only administrators can manage offices.");
      }

      const input = req.body as CreateOfficeInput;
      const created = await officeService.createOffice(input);

      await recordAudit(req, { action: "created", entity: "office", entityId: created.id });
      res.status(201).json(formatSuccess(created, "Office created successfully."));
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const actor = requireUser(req.user);
      if (!canManageReferenceData(actor)) {
        throw new ForbiddenError("Only administrators can manage offices.");
      }

      const id = Number(req.params.id);
      const input = req.body as UpdateOfficeInput;
      const updated = await officeService.updateOffice(id, input);

      await recordAudit(req, {
        action: "updated",
        entity: "office",
        entityId: id,
        details: { fields: Object.keys(input) },
      });
      res.status(200).json(formatSuccess(updated, "Office updated successfully."));
    } catch (error) {
      next(error);
    }
  }

  async destroy(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const actor = requireUser(req.user);
      if (!canManageReferenceData(actor)) {
        throw new ForbiddenError("Only administrators can manage offices.");
      }

      const id = Number(req.params.id);
      await officeService.deleteOffice(id);

      await recordAudit(req, { action: "deleted", entity: "office", entityId: id });
      res.status(200).json(formatSuccess(null, "Office deleted successfully."));
    } catch (error) {
      next(error);
    }
  }
}

export const officeController = new OfficeController();
