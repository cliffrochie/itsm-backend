import { z } from "zod";

export const createClientSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  middleName: z.string().optional().nullable(),
  lastName: z.string().min(1, "Last name is required").max(100),
  extensionName: z.string().optional().nullable(),
  email: z.email("Invalid email address format").max(191).optional().nullable(),
  contactNo: z.string().optional().nullable(),
  officeId: z.coerce.number().int().positive().optional().nullable(),
  designationId: z.coerce.number().int().positive().optional().nullable(),
  userId: z.coerce.number().int().positive().optional().nullable(),
});

export const updateClientSchema = createClientSchema.partial();

export const clientQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(15),
  search: z.string().optional(),
  email: z.string().optional(),
  officeId: z.coerce.number().int().positive().optional(),
  designationId: z.coerce.number().int().positive().optional(),
  userId: z.coerce.number().int().positive().optional(),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
export type ClientQueryInput = z.infer<typeof clientQuerySchema>;
