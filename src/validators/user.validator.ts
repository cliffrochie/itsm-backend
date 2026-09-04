import { z } from "zod";

export const createUserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(50),
  email: z.string().email("Invalid email address format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(1, "First name is required"),
  middleName: z.string().optional().nullable(),
  lastName: z.string().min(1, "Last name is required"),
  extensionName: z.string().optional().nullable(),
  contactNo: z.string().optional().nullable(),
  avatar: z.string().optional().nullable(),
  role: z.enum(["admin", "service_engineer", "staff", "user"]).default("user"),
  isActive: z.boolean().default(false),
});

export const updateUserSchema = createUserSchema.partial().omit({ password: true });

export const userQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(15),
  search: z.string().optional(),
  role: z.enum(["admin", "service_engineer", "staff", "user"]).optional(),
  isActive: z
    .string()
    .transform((val) => val === "true")
    .optional(),
});

export const toggleStatusSchema = z.object({
  isActive: z.boolean(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UserQueryInput = z.infer<typeof userQuerySchema>;
export type ToggleStatusInput = z.infer<typeof toggleStatusSchema>;
