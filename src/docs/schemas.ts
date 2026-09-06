import { z } from "zod";
import "./registry";

/**
 * Response shapes, for documentation only.
 *
 * Request schemas are not duplicated here — the spec references the real Zod
 * validators in src/validators, so documented input can never drift from
 * enforced input.
 *
 * Responses have no such single source: they come out of the mappers in
 * src/responses, which are TypeScript types rather than Zod schemas. These
 * mirror those mappers by hand and must be updated alongside them.
 */

const timestamps = {
  createdAt: z.string().datetime().openapi({ example: "2026-09-01T02:00:00.000Z" }),
  updatedAt: z.string().datetime().openapi({ example: "2026-09-01T02:00:00.000Z" }),
};

export const userSchema = z
  .object({
    id: z.number().openapi({ example: 1 }),
    username: z.string().openapi({ example: "admin" }),
    firstName: z.string().openapi({ example: "JUAN" }),
    middleName: z.string().nullable(),
    lastName: z.string().openapi({ example: "DELA CRUZ" }),
    extensionName: z.string().nullable(),
    avatar: z.string().nullable(),
    role: z.enum(["admin", "service_engineer", "staff", "user"]),
    isActive: z.boolean(),
    ...timestamps,
    email: z.string().email().optional().openapi({
      description: "Present only for administrators, staff, and the account owner.",
    }),
    contactNo: z.string().nullable().optional().openapi({
      description: "Present only for administrators, staff, and the account owner.",
    }),
  })
  .openapi("User");

export const clientSchema = z
  .object({
    id: z.number().openapi({ example: 70 }),
    firstName: z.string(),
    middleName: z.string().nullable(),
    lastName: z.string(),
    extensionName: z.string().nullable(),
    email: z.string().email().nullable(),
    contactNo: z.string().nullable(),
    officeId: z.number().nullable(),
    designationId: z.number().nullable(),
    userId: z.number().nullable(),
    ...timestamps,
  })
  .openapi("Client");

export const officeSchema = z
  .object({
    id: z.number().openapi({ example: 1 }),
    name: z.string().openapi({ example: "IT Support Office" }),
    code: z.string().nullable().openapi({ example: "ITSO" }),
    ...timestamps,
  })
  .openapi("Office");

export const designationSchema = z
  .object({
    id: z.number().openapi({ example: 1 }),
    name: z.string().openapi({ example: "Administrative Officer" }),
    ...timestamps,
  })
  .openapi("Designation");

export const ticketHistorySchema = z
  .object({
    id: z.number(),
    serviceTicketId: z.number(),
    performedById: z.number().nullable(),
    action: z.string().openapi({ example: "status_changed" }),
    notes: z.string().nullable().optional().openapi({
      description: "Internal. Present only for administrators, staff and service engineers.",
    }),
    createdAt: z.string().datetime(),
  })
  .openapi("ServiceTicketHistory");

export const ticketSchema = z
  .object({
    id: z.number().openapi({ example: 1 }),
    ticketNo: z.string().openapi({ example: "ST-202609-0001" }),
    taskType: z.string().openapi({ example: "repair" }),
    title: z.string().openapi({ example: "Printer will not feed paper" }),
    natureOfWork: z.string().nullable(),
    serialNo: z.string().nullable(),
    equipmentType: z.string().nullable(),
    equipmentTypeOthers: z.string().nullable(),
    defectsFound: z.string().nullable(),
    serviceRendered: z.string().nullable(),
    serviceStatus: z.enum(["open", "in_progress", "resolved", "closed", "cancelled"]),
    priority: z.enum(["low", "medium", "high", "urgent"]),
    remarks: z.string().nullable(),
    adminRemarks: z.string().nullable().optional().openapi({
      description: "Internal. Present only for administrators, staff and service engineers.",
    }),
    rating: z.number().min(1).max(5).nullable(),
    ratingComment: z.string().nullable(),
    clientId: z.number().nullable(),
    serviceEngineerId: z.number().nullable(),
    createdById: z.number().nullable(),
    updatedById: z.number().nullable(),
    ...timestamps,
    histories: z.array(ticketHistorySchema).optional(),
  })
  .openapi("ServiceTicket");

export const notificationSchema = z
  .object({
    id: z.number(),
    userId: z.number(),
    ticketId: z.number().nullable(),
    title: z.string(),
    message: z.string(),
    isRead: z.boolean(),
    createdAt: z.string().datetime(),
  })
  .openapi("Notification");

export const actionLogSchema = z
  .object({
    id: z.number(),
    userId: z.number().nullable().openapi({ description: "Null for unauthenticated actions." }),
    action: z.string().openapi({ example: "password_changed" }),
    entity: z.string().openapi({ example: "user" }),
    entityId: z.string().nullable().openapi({ example: "42" }),
    details: z.record(z.string(), z.unknown()).nullable().openapi({
      description: "Hand-built per action. Never contains credentials or request bodies.",
    }),
    ipAddress: z.string().nullable(),
    createdAt: z.string().datetime(),
  })
  .openapi("ActionLog");

export const authTokenSchema = z
  .object({
    token: z.string().openapi({ example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }),
    user: userSchema,
  })
  .openapi("AuthToken");

export const authenticatedUserSchema = z
  .object({
    id: z.number(),
    username: z.string(),
    email: z.string().email(),
    role: z.enum(["admin", "service_engineer", "staff", "user"]),
    isActive: z.boolean(),
  })
  .openapi("AuthenticatedUser");

export const temporaryPasswordSchema = z
  .object({
    temporaryPassword: z.string().openapi({
      description: "Shown once, at reset time. Never stored in the audit trail.",
    }),
  })
  .openapi("TemporaryPassword");
