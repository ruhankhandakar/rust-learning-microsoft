import { db } from "@/db";
import { BOOKS } from "@/lib/books";
import { getBookStructure } from "@/lib/content";
import { getAllQuizzes } from "@/lib/quizzes";
import { TIERS, meetsTier, type Achievements } from "@/lib/achievements-rules";

export { TIERS, meetsTier, type Achievements };

let totals: Map<string, number> | undefined;
function bookTotals(): Map<string, number> {
  totals ??= new Map(BOOKS.map((b) => [b.slug, getBookStructure(b.dirName).flatChapters.length]));
  return totals;
}


export async function getAchievements(userId: string): Promise<Achievements | null> {
  const user = await db.selectFrom("user").select(["name", "createdAt"]).where("id", "=", userId).executeTakeFirst();
  if (!user) return null;

  const [reads, quizzes, challenge, profile] = await Promise.all([
    db.selectFrom("reading_progress").select(["book_slug", "chapter_slug"]).where("user_id", "=", userId).execute(),
    db.selectFrom("quiz_results").select(["correct"]).where("user_id", "=", userId).execute(),
    db.selectFrom("challenge_enrollment").select("completed_at").where("user_id", "=", userId).executeTakeFirst(),
    db.selectFrom("learner_profile").select("is_public").where("user_id", "=", userId).executeTakeFirst(),
  ]);

  const perBook = new Map<string, number>();
  for (const r of reads) perBook.set(r.book_slug, (perBook.get(r.book_slug) ?? 0) + 1);
  const books = BOOKS.map((b) => ({
    slug: b.slug,
    title: b.title,
    read: Math.min(perBook.get(b.slug) ?? 0, bookTotals().get(b.slug) ?? 0),
    total: bookTotals().get(b.slug) ?? 0,
  }));

  const quizzesRight = quizzes.filter((q) => q.correct === 1).length;
  const base = {
    chapters: books.reduce((n, b) => n + b.read, 0),
    booksStarted: books.filter((b) => b.read > 0).length,
    quizzesRight,
    quizzesAnswered: quizzes.length,
    accuracy: quizzes.length ? quizzesRight / quizzes.length : 0,
  };
  const tier = [...TIERS].reverse().find((t) => meetsTier(base, t))?.name ?? null;

  return {
    name: user.name,
    ...base,
    tier,
    books,
    challengeFinished: challenge?.completed_at ?? null,
    isPublic: profile?.is_public === 1,
    since: user.createdAt ? new Date(user.createdAt).toISOString() : null,
  };
}

/** First answer per quiz, graded here. Returns false for an unknown quiz or a non-boolean answer. */
export async function recordQuizResult(userId: string, quizId: string, answer: unknown): Promise<boolean> {
  const quiz = getAllQuizzes().find((q) => q.id === quizId);
  if (!quiz || typeof answer !== "boolean") return false;
  await db
    .insertInto("quiz_results")
    .values({ user_id: userId, quiz_id: quizId, correct: quiz.compiles === answer ? 1 : 0, answered_at: new Date().toISOString() })
    .onConflict((oc) => oc.columns(["user_id", "quiz_id"]).doNothing())
    .execute();
  return true;
}

export async function setPublic(userId: string, isPublic: boolean): Promise<void> {
  await db
    .insertInto("learner_profile")
    .values({ user_id: userId, is_public: isPublic ? 1 : 0, updated_at: new Date().toISOString() })
    .onConflict((oc) => oc.column("user_id").doUpdateSet({ is_public: isPublic ? 1 : 0, updated_at: new Date().toISOString() }))
    .execute();
}
