import { type Kysely, sql } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`ALTER TABLE challenge_enrollment ADD COLUMN draw_opt_in INTEGER NOT NULL DEFAULT 0`.execute(db);
  await sql`ALTER TABLE challenge_enrollment ADD COLUMN revoked_at TEXT`.execute(db);
  await sql`
    CREATE TABLE IF NOT EXISTS swag_draws (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quarter TEXT NOT NULL UNIQUE,
      seed TEXT NOT NULL,
      drawn_at TEXT NOT NULL
    )
  `.execute(db);
  await sql`
    CREATE TABLE IF NOT EXISTS swag_winners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      draw_id INTEGER NOT NULL REFERENCES swag_draws(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
      prize TEXT NOT NULL,
      claim_token TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'drawn',
      claim_by TEXT NOT NULL,
      claimed_at TEXT,
      shipped_at TEXT
    )
  `.execute(db);
  await sql`CREATE INDEX IF NOT EXISTS swag_winners_user ON swag_winners(user_id)`.execute(db);
  await sql`
    CREATE TABLE IF NOT EXISTS swag_addresses (
      winner_id INTEGER PRIMARY KEY REFERENCES swag_winners(id) ON DELETE CASCADE,
      full_name TEXT NOT NULL,
      line1 TEXT NOT NULL,
      line2 TEXT,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      postcode TEXT NOT NULL,
      phone TEXT NOT NULL,
      size TEXT,
      colour TEXT,
      created_at TEXT NOT NULL
    )
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`DROP TABLE IF EXISTS swag_addresses`.execute(db);
  await sql`DROP TABLE IF EXISTS swag_winners`.execute(db);
  await sql`DROP TABLE IF EXISTS swag_draws`.execute(db);
  await sql`ALTER TABLE challenge_enrollment DROP COLUMN revoked_at`.execute(db);
  await sql`ALTER TABLE challenge_enrollment DROP COLUMN draw_opt_in`.execute(db);
}
