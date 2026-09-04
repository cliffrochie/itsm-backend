import { mysqlTable, serial, varchar, text, timestamp, bigint } from "drizzle-orm/mysql-core";
import { serviceTickets } from "./serviceTickets";
import { users } from "./users";

export const serviceTicketHistories = mysqlTable("service_ticket_histories", {
  id: serial("id").primaryKey(),
  serviceTicketId: bigint("service_ticket_id", { mode: "number", unsigned: true })
    .notNull()
    .references(() => serviceTickets.id, { onDelete: "cascade" }),
  performedById: bigint("performed_by_id", { mode: "number", unsigned: true })
    .references(() => users.id, { onDelete: "set null" }),
  action: varchar("action", { length: 100 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ServiceTicketHistory = typeof serviceTicketHistories.$inferSelect;
export type NewServiceTicketHistory = typeof serviceTicketHistories.$inferInsert;
