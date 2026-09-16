import { Kysely, PostgresDialect } from "kysely";
import pg from "pg";
import type { Database } from "./schema.js";

const DATABASE_URL =
    process.env.DATABASE_URL ??
    "postgres://brewro:brewro@localhost:5432/brewrovision";

const pool = new pg.Pool({ connectionString: DATABASE_URL });

export const db = new Kysely<Database>({
    dialect: new PostgresDialect({ pool }),
});
