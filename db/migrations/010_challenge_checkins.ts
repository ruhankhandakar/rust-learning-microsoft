import { type Kysely, sql } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS challenge_checkins (
      user_id TEXT PRIMARY KEY REFERENCES user(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL,
      emailed_at TEXT
    )
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`DROP TABLE IF EXISTS challenge_checkins`.execute(db);
}
