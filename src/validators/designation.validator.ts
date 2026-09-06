import { z } from "zod";

const baseDesignationSchema = z.object({
  name: z.string().min(1, "Name is required").max(150),
});

export const createDesignationSchema = z.preprocess((val: unknown) => {
  if (val && typeof val === "object") {
    const obj = val as Record<string, unknown>;
    if (!obj.name && typeof obj.title === "string") {
      return { ...obj, name: obj.title };
    }
  }
  return val;
}, baseDesignationSchema);

export const updateDesignationSchema = z.preprocess((val: unknown) => {
  if (val && typeof val === "object") {
    const obj = val as Record<string, unknown>;
    if (!obj.name && typeof obj.title === "string") {
      return { ...obj, name: obj.title };
    }
  }
  return val;
}, baseDesignationSchema.partial());

export type CreateDesignationInput = z.infer<typeof baseDesignationSchema>;
export type UpdateDesignationInput = z.infer<typeof updateDesignationSchema>;
