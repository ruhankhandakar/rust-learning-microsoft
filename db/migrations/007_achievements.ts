import { type Kysely, sql } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS quiz_results (
      user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
      quiz_id TEXT NOT NULL,
      correct INTEGER NOT NULL,
      answered_at TEXT NOT NULL,
      PRIMARY KEY (user_id, quiz_id)
    )
  `.execute(db);
  await sql`
    CREATE TABLE IF NOT EXISTS learner_profile (
      user_id TEXT PRIMARY KEY REFERENCES user(id) ON DELETE CASCADE,
      is_public INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`DROP TABLE IF EXISTS learner_profile`.execute(db);
  await sql`DROP TABLE IF EXISTS quiz_results`.execute(db);
}
