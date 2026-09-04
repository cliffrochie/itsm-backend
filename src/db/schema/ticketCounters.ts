import { mysqlTable, serial, smallint, tinyint, int, timestamp, uniqueIndex } from "drizzle-orm/mysql-core";

export const ticketCounters = mysqlTable(
  "ticket_counters",
  {
    id: serial("id").primaryKey(),
    year: smallint("year", { unsigned: true }).notNull(),
    month: tinyint("month", { unsigned: true }).notNull(),
    lastCount: int("last_count", { unsigned: true }).default(0).notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    uniqueIndex("year_month_idx").on(table.year, table.month),
  ]
);

export type TicketCounter = typeof ticketCounters.$inferSelect;
export type NewTicketCounter = typeof ticketCounters.$inferInsert;
