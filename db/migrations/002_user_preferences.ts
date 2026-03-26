import { type Kysely, sql } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS user_preferences (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      user_id TEXT NOT NULL UNIQUE REFERENCES user(id) ON DELETE CASCADE,
      font_family TEXT NOT NULL DEFAULT 'geist',
      font_size TEXT NOT NULL DEFAULT 'base',
      theme TEXT NOT NULL DEFAULT 'light',
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`DROP TABLE IF EXISTS user_preferences`.execute(db);
}
