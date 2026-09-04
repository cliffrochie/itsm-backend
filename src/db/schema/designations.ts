import { mysqlTable, serial, varchar, timestamp } from "drizzle-orm/mysql-core";

export const designations = mysqlTable("designations", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 150 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type Designation = typeof designations.$inferSelect;
export type NewDesignation = typeof designations.$inferInsert;
