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

interface LearnerStateTable {
  user_id: string;
  state: string;
  updated_at: Generated<string>;
}

interface ActivityDailyTable {
  day: string;
  kind: string;
  count: number;
}

interface ChapterFeedbackTable {
  id: Generated<number>;
  book_slug: string;
  chapter_slug: string;
  helpful: number;
  edit_token: string;
  comment: string | null;
  user_id: string | null;
  show_public: Generated<number>;
  ok_to_quote: Generated<number>;
  status: Generated<string>;
  created_at: Generated<string>;
}

interface ChallengeEnrollmentTable {
  user_id: string;
  started_at: string;
  completed_at: string | null;
  show_on_wall: Generated<number>;
  draw_opt_in: Generated<number>;
  revoked_at: string | null;
}

interface SwagDrawsTable {
  id: Generated<number>;
  quarter: string;
  seed: string;
  drawn_at: string;
}

interface SwagWinnersTable {
  id: Generated<number>;
  draw_id: number;
  user_id: string;
  prize: string;
  claim_token: string;
  status: Generated<string>;
  claim_by: string;
  claimed_at: string | null;
  shipped_at: string | null;
}

interface SwagAddressesTable {
  winner_id: number;
  full_name: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postcode: string;
  phone: string;
  size: string | null;
  colour: string | null;
  created_at: string;
}

interface AccountTable {
  id: string;
  userId: string;
  providerId: string;
  accountId: string;
}

interface ChallengeLogTable {
  user_id: string;
  kind: string;
  ref: string;
  at: string;
}

interface QuizResultsTable {
  user_id: string;
  quiz_id: string;
  correct: number;
  answered_at: string;
}

interface LearnerProfileTable {
  user_id: string;
  is_public: Generated<number>;
  updated_at: Generated<string>;
}

interface UserTable {
  id: string;
  name: string;
  email: string;
  image: string | null;
  createdAt: string;
}

interface Database {
  reading_progress: ReadingProgressTable;
  user_preferences: UserPreferencesTable;
  bookmarks: BookmarksTable;
  learner_state: LearnerStateTable;
  activity_daily: ActivityDailyTable;
  chapter_feedback: ChapterFeedbackTable;
  challenge_enrollment: ChallengeEnrollmentTable;
  challenge_log: ChallengeLogTable;
  quiz_results: QuizResultsTable;
  learner_profile: LearnerProfileTable;
  user: UserTable;
  account: AccountTable;
  swag_draws: SwagDrawsTable;
  swag_winners: SwagWinnersTable;
  swag_addresses: SwagAddressesTable;
}

export const db = new Kysely<Database>({
  dialect: new LibsqlDialect({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  }),
});
