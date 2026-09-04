import { mysqlTable, serial, varchar, timestamp, bigint } from "drizzle-orm/mysql-core";
import { offices } from "./offices";
import { designations } from "./designations";
import { users } from "./users";

export const clients = mysqlTable("clients", {
  id: serial("id").primaryKey(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  middleName: varchar("middle_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  extensionName: varchar("extension_name", { length: 50 }),
  email: varchar("email", { length: 191 }).unique(),
  contactNo: varchar("contact_no", { length: 50 }),
  officeId: bigint("office_id", { mode: "number", unsigned: true }).references(() => offices.id, { onDelete: "set null" }),
  designationId: bigint("designation_id", { mode: "number", unsigned: true }).references(() => designations.id, { onDelete: "set null" }),
  userId: bigint("user_id", { mode: "number", unsigned: true }).references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type Client = typeof clients.$inferSelect;
export type NewClient = typeof clients.$inferInsert;
