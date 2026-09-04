import { mysqlTable, serial, varchar, text, tinyint, timestamp, bigint, mysqlEnum } from "drizzle-orm/mysql-core";
import { clients } from "./clients";
import { users } from "./users";

export const serviceTickets = mysqlTable("service_tickets", {
  id: serial("id").primaryKey(),
  ticketNo: varchar("ticket_no", { length: 50 }).notNull().unique(),
  taskType: varchar("task_type", { length: 100 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  natureOfWork: text("nature_of_work"),
  serialNo: varchar("serial_no", { length: 100 }),
  equipmentType: varchar("equipment_type", { length: 100 }),
  equipmentTypeOthers: varchar("equipment_type_others", { length: 255 }),
  defectsFound: text("defects_found"),
  serviceRendered: text("service_rendered"),
  serviceStatus: mysqlEnum("service_status", ["open", "in_progress", "resolved", "closed", "cancelled"])
    .default("open")
    .notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"])
    .default("low")
    .notNull(),
  remarks: text("remarks"),
  adminRemarks: text("admin_remarks"),
  rating: tinyint("rating", { unsigned: true }),
  ratingComment: text("rating_comment"),
  clientId: bigint("client_id", { mode: "number", unsigned: true }).references(() => clients.id, { onDelete: "set null" }),
  serviceEngineerId: bigint("service_engineer_id", { mode: "number", unsigned: true }).references(() => users.id, { onDelete: "set null" }),
  createdById: bigint("created_by_id", { mode: "number", unsigned: true }).references(() => users.id, { onDelete: "set null" }),
  updatedById: bigint("updated_by_id", { mode: "number", unsigned: true }).references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type ServiceTicket = typeof serviceTickets.$inferSelect;
export type NewServiceTicket = typeof serviceTickets.$inferInsert;
