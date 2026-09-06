import type { Response, NextFunction } from "express";
import { designationService } from "../services/designation.service";
import { formatSuccess } from "../responses/envelope";
import { ForbiddenError } from "../types/errors";
import { requireUser } from "../authorization/roles";
import { canManageReferenceData } from "../authorization/reference.authorization";
import { recordAudit } from "../audit/recordAudit";
import type { AuthRequest } from "../types/auth";
import type { CreateDesignationInput, UpdateDesignationInput } from "../validators/designation.validator";

export class DesignationController {
  async index(_req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const items = await designationService.listDesignations();
      res.status(200).json(formatSuccess(items, "Designations retrieved successfully."));
    } catch (error) {
      next(error);
    }
  }

  async show(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      const item = await designationService.getDesignationById(id);
      res.status(200).json(formatSuccess(item, "Designation retrieved successfully."));
    } catch (error) {
      next(error);
    }
  }

  async store(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const actor = requireUser(req.user);
      if (!canManageReferenceData(actor)) {
        throw new ForbiddenError("Only administrators can manage designations.");
      }

      const input = req.body as CreateDesignationInput;
      const created = await designationService.createDesignation(input);

      await recordAudit(req, { action: "created", entity: "designation", entityId: created.id });
      res.status(201).json(formatSuccess(created, "Designation created successfully."));
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const actor = requireUser(req.user);
      if (!canManageReferenceData(actor)) {
        throw new ForbiddenError("Only administrators can manage designations.");
      }

      const id = Number(req.params.id);
      const input = req.body as UpdateDesignationInput;
      const updated = await designationService.updateDesignation(id, input);

      await recordAudit(req, {
        action: "updated",
        entity: "designation",
        entityId: id,
        details: { fields: Object.keys(input) },
      });
      res.status(200).json(formatSuccess(updated, "Designation updated successfully."));
    } catch (error) {
      next(error);
    }
  }

  async destroy(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const actor = requireUser(req.user);
      if (!canManageReferenceData(actor)) {
        throw new ForbiddenError("Only administrators can manage designations.");
      }

      const id = Number(req.params.id);
      await designationService.deleteDesignation(id);

      await recordAudit(req, { action: "deleted", entity: "designation", entityId: id });
      res.status(200).json(formatSuccess(null, "Designation deleted successfully."));
    } catch (error) {
      next(error);
    }
  }
}

export const designationController = new DesignationController();
