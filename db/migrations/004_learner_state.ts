import { type Kysely, sql } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS learner_state (
      user_id TEXT PRIMARY KEY REFERENCES user(id) ON DELETE CASCADE,
      state TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `.execute(db);
  await sql`
    CREATE TABLE IF NOT EXISTS activity_daily (
      day TEXT NOT NULL,
      kind TEXT NOT NULL,
      count INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (day, kind)
    )
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`DROP TABLE IF EXISTS activity_daily`.execute(db);
  await sql`DROP TABLE IF EXISTS learner_state`.execute(db);
}
