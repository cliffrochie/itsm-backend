import { mysqlTable, serial, varchar, text, boolean, timestamp, bigint } from "drizzle-orm/mysql-core";
import { users } from "./users";
import { serviceTickets } from "./serviceTickets";

export const notifications = mysqlTable("notifications", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number", unsigned: true })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  ticketId: bigint("ticket_id", { mode: "number", unsigned: true })
    .references(() => serviceTickets.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
