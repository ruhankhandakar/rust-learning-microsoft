import { type Kysely, sql } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS reading_progress (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
      book_slug TEXT NOT NULL,
      chapter_slug TEXT NOT NULL,
      read_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, book_slug, chapter_slug)
    )
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`DROP TABLE IF EXISTS reading_progress`.execute(db);
}
