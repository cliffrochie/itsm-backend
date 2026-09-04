import { mysqlTable, serial, varchar, timestamp } from "drizzle-orm/mysql-core";

export const offices = mysqlTable("offices", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 150 }).notNull(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type Office = typeof offices.$inferSelect;
export type NewOffice = typeof offices.$inferInsert;
