import { type Kysely, sql } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`ALTER TABLE swag_addresses ADD COLUMN country TEXT NOT NULL DEFAULT 'India'`.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`ALTER TABLE swag_addresses DROP COLUMN country`.execute(db);
}
