import { z } from "zod";

export const createDesignationSchema = z.object({
  name: z.string().min(1, "Name is required").max(150),
});

export const updateDesignationSchema = createDesignationSchema.partial();

export type CreateDesignationInput = z.infer<typeof createDesignationSchema>;
export type UpdateDesignationInput = z.infer<typeof updateDesignationSchema>;
