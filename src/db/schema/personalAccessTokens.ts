import { mysqlTable, serial, varchar, timestamp, bigint, index } from "drizzle-orm/mysql-core";
import { users } from "./users";

/**
 * Issued access tokens, stored as SHA-256 hashes so a database leak does not
 * hand out usable bearer tokens. This is the Sanctum `personal_access_tokens`
 * equivalent that lets logout revoke exactly the token used in that request,
 * leaving the user's other sessions alone.
 */
export const personalAccessTokens = mysqlTable(
  "personal_access_tokens",
  {
    id: serial("id").primaryKey(),
    userId: bigint("user_id", { mode: "number", unsigned: true })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: varchar("token_hash", { length: 64 }).notNull().unique(),
    expiresAt: timestamp("expires_at").notNull(),
    revokedAt: timestamp("revoked_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("personal_access_tokens_user_id_idx").on(table.userId),
  })
);

export type PersonalAccessToken = typeof personalAccessTokens.$inferSelect;
export type NewPersonalAccessToken = typeof personalAccessTokens.$inferInsert;
