import { Generated, Kysely } from "kysely";
import { LibsqlDialect } from "kysely-libsql";

interface ReadingProgressTable {
  id: Generated<string>;
  user_id: string;
  book_slug: string;
  chapter_slug: string;
  read_at: Generated<string>;
}

interface UserPreferencesTable {
  id: Generated<string>;
  user_id: string;
  font_family: Generated<string>;
  font_size: Generated<string>;
  theme: Generated<string>;
  updated_at: Generated<string>;
}

interface BookmarksTable {
  id: Generated<string>;
  user_id: string;
  book_slug: string;
  chapter_slug: string;
  heading_id: string;
  heading_text: string;
  note: string | null;
  created_at: Generated<string>;
}

interface Database {
  reading_progress: ReadingProgressTable;
  user_preferences: UserPreferencesTable;
  bookmarks: BookmarksTable;
}

export const db = new Kysely<Database>({
  dialect: new LibsqlDialect({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  }),
});
