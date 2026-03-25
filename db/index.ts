import { Generated, Kysely } from "kysely";
import { LibsqlDialect } from "kysely-libsql";

interface ReadingProgressTable {
  id: Generated<string>;
  user_id: string;
  book_slug: string;
  chapter_slug: string;
  read_at: Generated<string>;
}

interface Database {
  reading_progress: ReadingProgressTable;
}

export const db = new Kysely<Database>({
  dialect: new LibsqlDialect({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  }),
});
