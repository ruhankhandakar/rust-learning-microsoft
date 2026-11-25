import { type Kysely, sql } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS chapter_feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      book_slug TEXT NOT NULL,
      chapter_slug TEXT NOT NULL,
      helpful INTEGER NOT NULL,
      edit_token TEXT NOT NULL,
      comment TEXT,
      user_id TEXT REFERENCES user(id) ON DELETE SET NULL,
      show_public INTEGER NOT NULL DEFAULT 0,
      ok_to_quote INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'new',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `.execute(db);
  await sql`
    CREATE INDEX IF NOT EXISTS chapter_feedback_chapter
    ON chapter_feedback (book_slug, chapter_slug)
  `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql`DROP TABLE IF EXISTS chapter_feedback`.execute(db);
}
