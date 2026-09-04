import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema/index";
import { env } from "../config/env";

const connectionUri = env.DATABASE_URL || process.env.DATABASE_URL || "mysql://root:password@localhost:3306/itsm_db";

export const poolConnection = mysql.createPool(connectionUri);

export const db = drizzle(poolConnection, {
  schema,
  mode: "default",
});

export type Database = typeof db;
