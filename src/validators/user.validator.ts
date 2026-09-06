import { z } from "zod";

export const userRoles = z.enum(["admin", "service_engineer", "staff", "user"]);

export const createUserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(50),
  email: z.email("Invalid email address format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(1, "First name is required"),
  middleName: z.string().optional().nullable(),
  lastName: z.string().min(1, "Last name is required"),
  extensionName: z.string().optional().nullable(),
  contactNo: z.string().optional().nullable(),
  avatar: z.string().optional().nullable(),
  role: userRoles.default("user"),
  isActive: z.boolean().default(false),
  officeId: z.coerce.number().int().positive().optional().nullable(),
  designationId: z.coerce.number().int().positive().optional().nullable(),
});

/**
 * Zod 4 keeps `.default()` through `.partial()`, so deriving this straight from
 * createUserSchema would inject role: "user" and isActive: false into every
 * update — silently demoting and deactivating anyone whose name was edited.
 * Both fields are redeclared here without their create-time defaults.
 */
export const updateUserSchema = createUserSchema
  .partial()
  .omit({ password: true, officeId: true, designationId: true })
  .extend({
    role: userRoles.optional(),
    isActive: z.boolean().optional(),
  });

export const userQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(15),
  search: z.string().optional(),
  role: userRoles.optional(),
  isActive: z
    .string()
    .transform((val) => val === "true")
    .optional(),
});

export const toggleStatusSchema = z.object({
  isActive: z.boolean(),
});

/**
 * Password rules for the self-service change flow (and the yardstick the
 * admin-reset temporary password is generated to meet): at least 8 characters
 * with a letter and a digit. Deliberately stricter than the min-6 used when an
 * admin provisions an account.
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "New password must be at least 8 characters")
    .regex(/[A-Za-z]/, "New password must contain at least one letter")
    .regex(/[0-9]/, "New password must contain at least one number"),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UserQueryInput = z.infer<typeof userQuerySchema>;
export type ToggleStatusInput = z.infer<typeof toggleStatusSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
