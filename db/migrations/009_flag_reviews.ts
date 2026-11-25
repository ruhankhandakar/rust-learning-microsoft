import { type Kysely, sql } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`ALTER TABLE challenge_enrollment ADD COLUMN flags_cleared_at TEXT`.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`ALTER TABLE challenge_enrollment DROP COLUMN flags_cleared_at`.execute(db);
}
