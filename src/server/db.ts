import { Kysely, SqliteDialect } from "kysely";
import Database from "better-sqlite3";
import { mkdirSync } from "fs";
import { dirname, resolve } from "path";
import type { Database as Schema } from "./schema.js";

const DB_PATH = resolve(process.env.DATABASE_PATH ?? "./data/brewrovision.db");
mkdirSync(dirname(DB_PATH), { recursive: true });

const sqlite = new Database(DB_PATH);
// WAL keeps reads non-blocking while the admin console writes ballots.
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = new Kysely<Schema>({
    dialect: new SqliteDialect({ database: sqlite }),
});
