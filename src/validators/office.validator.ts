import { z } from "zod";

export const createOfficeSchema = z.object({
  name: z.string().min(1, "Name is required").max(150),
  code: z.string().min(1, "Code is required").max(50),
});

export const updateOfficeSchema = createOfficeSchema.partial();

export type CreateOfficeInput = z.infer<typeof createOfficeSchema>;
export type UpdateOfficeInput = z.infer<typeof updateOfficeSchema>;
