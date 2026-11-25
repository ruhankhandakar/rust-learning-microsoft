import { type Kysely, sql } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS challenge_enrollment (
      user_id TEXT PRIMARY KEY REFERENCES user(id) ON DELETE CASCADE,
      started_at TEXT NOT NULL,
      completed_at TEXT,
      show_on_wall INTEGER NOT NULL DEFAULT 0
    )
  `.execute(db);
  await sql`
    CREATE TABLE IF NOT EXISTS challenge_log (
      user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
      kind TEXT NOT NULL,
      ref TEXT NOT NULL,
      at TEXT NOT NULL,
      PRIMARY KEY (user_id, kind, ref)
    )
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`DROP TABLE IF EXISTS challenge_log`.execute(db);
  await sql`DROP TABLE IF EXISTS challenge_enrollment`.execute(db);
}
