import { z } from "zod";

export const ticketPriorities = z.enum(["low", "medium", "high", "urgent"]);

export const createTicketSchema = z.object({
  taskType: z.string().min(1, "Task type is required").max(100),
  title: z.string().min(1, "Title is required").max(255),
  natureOfWork: z.string().optional().nullable(),
  serialNo: z.string().optional().nullable(),
  equipmentType: z.string().optional().nullable(),
  equipmentTypeOthers: z.string().optional().nullable(),
  defectsFound: z.string().optional().nullable(),
  serviceRendered: z.string().optional().nullable(),
  priority: ticketPriorities.default("low"),
  remarks: z.string().optional().nullable(),
  adminRemarks: z.string().optional().nullable(),
  clientId: z.coerce.number().int().positive().optional().nullable(),
  serviceEngineerId: z.coerce.number().int().positive().optional().nullable(),
});

/**
 * `priority` is redeclared without its create-time default: Zod 4 keeps
 * `.default()` through `.partial()`, which would otherwise reset every updated
 * ticket back to "low".
 */
export const updateTicketSchema = createTicketSchema.partial().extend({
  priority: ticketPriorities.optional(),
  serviceStatus: z.enum(["open", "in_progress", "resolved", "closed", "cancelled"]).optional(),
  rating: z.coerce.number().int().min(1).max(5).optional().nullable(),
  ratingComment: z.string().optional().nullable(),
});

export const updateTicketStatusSchema = z.object({
  serviceStatus: z.enum(["open", "in_progress", "resolved", "closed", "cancelled"]),
  notes: z.string().optional().nullable(),
});

export const assignEngineerSchema = z.object({
  serviceEngineerId: z.coerce.number().int().positive(),
  notes: z.string().optional().nullable(),
});

export const ticketFeedbackSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  ratingComment: z.string().optional().nullable(),
});

export const ticketQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(15),
  search: z.string().optional(),
  serviceStatus: z.enum(["open", "in_progress", "resolved", "closed", "cancelled"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  clientId: z.coerce.number().int().positive().optional(),
  serviceEngineerId: z.coerce.number().int().positive().optional(),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
export type UpdateTicketStatusInput = z.infer<typeof updateTicketStatusSchema>;
export type AssignEngineerInput = z.infer<typeof assignEngineerSchema>;
export type TicketFeedbackInput = z.infer<typeof ticketFeedbackSchema>;
export type TicketQueryInput = z.infer<typeof ticketQuerySchema>;
