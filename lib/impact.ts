import { sql } from "kysely";
import { db } from "@/db";
import { BOOKS } from "@/lib/books";
import { getBookStructure } from "@/lib/content";

export interface Impact {
  launch: string | null;
  totals: Partial<Record<"page_view" | "visit" | "quiz_answered" | "exercise_solved" | "playground_run", number>>;
  weekly: { week: string; visits: number }[];
  finishers: number;
  challengeByMonth: { month: string; started: number; finished: number }[];
  helpful: { title: string; href: string; yes: number; total: number }[];
  quotes: { comment: string; name: string | null; date: string }[];
}

const MIN_VOTES = 3;

function chapterTitle(bookSlug: string, chapterSlug: string): string | null {
  const book = BOOKS.find((b) => b.slug === bookSlug);
  const ch = book && getBookStructure(book.dirName).flatChapters.find((c) => c.slug === chapterSlug);
  return ch ? `${book.shortTitle}: ${ch.title}` : null;
}

export async function getImpact(): Promise<Impact | null> {
  try {
    const [launch, totals, weekly, challenge, helpful, quotes] = await Promise.all([
      db.selectFrom("activity_daily").select((eb) => eb.fn.min("day").as("first")).executeTakeFirst(),
      db.selectFrom("activity_daily").select(["kind", (eb) => eb.fn.sum<number>("count").as("n")]).groupBy("kind").execute(),
      db
        .selectFrom("activity_daily")
        .select([sql<string>`date(day, 'weekday 1', '-7 days')`.as("week"), (eb) => eb.fn.sum<number>("count").as("n")])
        .where("kind", "=", "visit")
        .groupBy("week")
        .orderBy("week")
        .execute(),
      db
        .selectFrom("challenge_enrollment")
        .select([sql<string>`substr(started_at, 1, 7)`.as("month"), (eb) => eb.fn.countAll<number>().as("started"), sql<number>`count(completed_at)`.as("finished")])
        .groupBy("month")
        .orderBy("month", "desc")
        .limit(6)
        .execute(),
      db
        .selectFrom("chapter_feedback")
        .select(["book_slug", "chapter_slug", sql<number>`sum(helpful)`.as("yes"), (eb) => eb.fn.countAll<number>().as("total")])
        .groupBy(["book_slug", "chapter_slug"])
        .having((eb) => eb.fn.countAll(), ">=", MIN_VOTES)
        .orderBy(sql`sum(helpful) * 1.0 / count(*)`, "desc")
        .orderBy("total", "desc")
        .limit(3)
        .execute(),
      db
        .selectFrom("chapter_feedback")
        .leftJoin("user", "user.id", "chapter_feedback.user_id")
        .select(["chapter_feedback.comment", "chapter_feedback.show_public", "chapter_feedback.created_at", "user.name"])
        .where("chapter_feedback.status", "=", "approved")
        .where("chapter_feedback.ok_to_quote", "=", 1)
        .where("chapter_feedback.comment", "is not", null)
        .orderBy("chapter_feedback.created_at", "desc")
        .limit(6)
        .execute(),
    ]);
    const finishers = challenge.reduce((n, m) => n + Number(m.finished), 0);
    return {
      launch: (launch?.first as string | null) ?? null,
      totals: Object.fromEntries(totals.map((r) => [r.kind, Number(r.n)])),
      // The current week is still filling up, so it would read as a drop.
      weekly: weekly.filter((w) => Date.now() - Date.parse(w.week) >= 7 * 86_400_000).map((w) => ({ week: w.week, visits: Number(w.n) })),
      finishers,
      challengeByMonth: challenge.map((m) => ({ month: m.month, started: Number(m.started), finished: Number(m.finished) })),
      helpful: helpful.flatMap((h) => {
        const title = chapterTitle(h.book_slug, h.chapter_slug);
        return title ? [{ title, href: `/books/${h.book_slug}/${h.chapter_slug}`, yes: Number(h.yes), total: Number(h.total) }] : [];
      }),
      quotes: quotes.map((q) => ({ comment: q.comment!, name: q.show_public ? q.name : null, date: q.created_at.slice(0, 10) })),
    };
  } catch {
    return null;
  }
}
