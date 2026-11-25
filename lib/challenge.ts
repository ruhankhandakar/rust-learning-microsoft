import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { db } from "@/db";
import { BOOKS } from "@/lib/books";
import { getBookBySlug } from "@/lib/books";
import { getBookStructure, getChapterMarkdown } from "@/lib/content";
import { getAllQuizzes } from "@/lib/quizzes";

export const CHALLENGE = { days: 30, chapters: 30, readingDays: 15, quizzes: 25, accuracy: 0.7, chaptersPerDay: 5 } as const;
const DAY_MS = 86_400_000;

export type ChallengeKind = "chapter" | "quiz";

export interface ChallengeDay {
  day: number;
  chapters: number;
  quizzes: number;
}

export interface ChallengeProgress {
  enrolled: boolean;
  startedAt: string | null;
  completedAt: string | null;
  showOnWall: boolean;
  status: "none" | "active" | "complete" | "expired";
  today: number;
  chapters: number;
  readingDays: number;
  quizzes: number;
  misses: number;
  days: ChallengeDay[];
}

let validRefs: Record<ChallengeKind, Set<string>> | undefined;

export function isValidRef(kind: ChallengeKind, ref: string): boolean {
  validRefs ??= {
    chapter: new Set(
      BOOKS.filter((b) => b.slug !== "100-rust-projects").flatMap((b) =>
        getBookStructure(b.dirName).flatChapters.map((c) => `${b.slug}/${c.slug}`),
      ),
    ),
    quiz: new Set(getAllQuizzes().map((q) => q.id)),
  };
  return validRefs[kind].has(ref);
}

/** Day number (1-based) of `at` within a challenge that started at `startedAt`. */
function dayOf(startedAt: string, at: string): number {
  return Math.floor((Date.parse(at) - Date.parse(startedAt)) / DAY_MS) + 1;
}

export async function getProgress(userId: string): Promise<ChallengeProgress> {
  const enrollment = await db
    .selectFrom("challenge_enrollment")
    .selectAll()
    .where("user_id", "=", userId)
    .executeTakeFirst();

  const empty: ChallengeProgress = {
    enrolled: false,
    startedAt: null,
    completedAt: null,
    showOnWall: false,
    status: "none",
    today: 0,
    chapters: 0,
    readingDays: 0,
    quizzes: 0,
    misses: 0,
    days: [],
  };
  if (!enrollment) return empty;

  const log = await db.selectFrom("challenge_log").select(["kind", "at"]).where("user_id", "=", userId).execute();
  const days: ChallengeDay[] = Array.from({ length: CHALLENGE.days }, (_, i) => ({ day: i + 1, chapters: 0, quizzes: 0 }));
  for (const row of log) {
    const d = days[dayOf(enrollment.started_at, row.at) - 1];
    if (!d) continue;
    if (row.kind === "chapter") d.chapters++;
    else if (row.kind === "quiz") d.quizzes++;
  }

  const today = Math.min(dayOf(enrollment.started_at, new Date().toISOString()), CHALLENGE.days + 1);
  const chapters = days.reduce((n, d) => n + d.chapters, 0);
  const quizzes = days.reduce((n, d) => n + d.quizzes, 0);
  const readingDays = days.filter((d) => d.chapters > 0).length;
  const misses = log.filter((r) => r.kind === "quiz_miss").length;

  return {
    enrolled: true,
    startedAt: enrollment.started_at,
    completedAt: enrollment.completed_at,
    showOnWall: enrollment.show_on_wall === 1,
    status: enrollment.completed_at ? "complete" : today > CHALLENGE.days ? "expired" : "active",
    today,
    chapters,
    readingDays,
    quizzes,
    misses,
    days,
  };
}

export function accuracy(p: Pick<ChallengeProgress, "quizzes" | "misses">): number {
  const answered = p.quizzes + p.misses;
  return answered ? p.quizzes / answered : 0;
}

function passed(p: ChallengeProgress): boolean {
  return (
    p.chapters >= CHALLENGE.chapters &&
    p.readingDays >= CHALLENGE.readingDays &&
    p.quizzes >= CHALLENGE.quizzes &&
    accuracy(p) >= CHALLENGE.accuracy
  );
}

const WORDS_PER_MINUTE = 230;

/** Seconds a chapter must stay open: a quarter of its reading time, between one and four minutes. */
export function requiredSeconds(ref: string): number {
  const [bookSlug, chapterSlug] = ref.split("/");
  const book = getBookBySlug(bookSlug);
  const words = book ? getChapterMarkdown(book.dirName, chapterSlug).split(/\s+/).length : 0;
  return Math.round(Math.min(240, Math.max(60, (words / WORDS_PER_MINUTE) * 60 * 0.25)));
}

// ponytail: without BETTER_AUTH_SECRET tickets only verify on the instance that issued them
const SECRET = process.env.BETTER_AUTH_SECRET || randomBytes(32).toString("hex");

function sign(payload: string): string {
  return createHmac("sha256", SECRET).update(payload).digest("base64url");
}

/** A signed, server-timestamped proof that `userId` opened chapter `ref`. */
export function issueTicket(userId: string, ref: string): { ticket: string; seconds: number } {
  const payload = Buffer.from(JSON.stringify({ u: userId, r: ref, t: Date.now() })).toString("base64url");
  return { ticket: `${payload}.${sign(payload)}`, seconds: requiredSeconds(ref) };
}

/** True when the ticket is ours, for this user and chapter, and enough server time has passed. */
function ticketReady(userId: string, ref: string, ticket: unknown): boolean {
  if (typeof ticket !== "string") return false;
  const [payload, mac] = ticket.split(".");
  if (!payload || !mac) return false;
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(mac);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return false;
  try {
    const { u, r, t } = JSON.parse(Buffer.from(payload, "base64url").toString());
    return u === userId && r === ref && Date.now() - t >= requiredSeconds(ref) * 1000;
  } catch {
    return false;
  }
}

/** Whether `answer` (compiles or not) is right for the quiz `ref`, graded here rather than trusted. */
function gradeQuiz(ref: string, answer: unknown): boolean | null {
  if (typeof answer !== "boolean") return null;
  const quiz = getAllQuizzes().find((q) => q.id === ref);
  return quiz ? quiz.compiles === answer : null;
}

/**
 * Records a chapter read or a quiz answer, timestamped by the server. Only a quiz's first
 * answer counts: a wrong one is logged as a miss and blocks a later right one.
 */
export async function recordEvent(
  userId: string,
  kind: ChallengeKind,
  ref: string,
  proof?: { answer?: unknown; ticket?: unknown },
): Promise<ChallengeProgress> {
  const before = await getProgress(userId);
  if (before.status !== "active") return before;

  let logKind: string = kind;
  if (kind === "chapter") {
    if (!ticketReady(userId, ref, proof?.ticket)) return before;
    if ((before.days[before.today - 1]?.chapters ?? 0) >= CHALLENGE.chaptersPerDay) return before;
  }
  if (kind === "quiz") {
    const right = gradeQuiz(ref, proof?.answer);
    if (right === null) return before;
    const quiz = getAllQuizzes().find((q) => q.id === ref)!;
    const chapterRead = await db
      .selectFrom("challenge_log")
      .select("ref")
      .where("user_id", "=", userId)
      .where("kind", "=", "chapter")
      .where("ref", "=", `${quiz.bookSlug}/${quiz.chapterSlug}`)
      .executeTakeFirst();
    if (!chapterRead) return before;
    const missed = await db
      .selectFrom("challenge_log")
      .select("ref")
      .where("user_id", "=", userId)
      .where("kind", "=", "quiz_miss")
      .where("ref", "=", ref)
      .executeTakeFirst();
    if (missed) return before;
    logKind = right ? "quiz" : "quiz_miss";
  }

  await db
    .insertInto("challenge_log")
    .values({ user_id: userId, kind: logKind, ref, at: new Date().toISOString() })
    .onConflict((oc) => oc.columns(["user_id", "kind", "ref"]).doNothing())
    .execute();

  const after = await getProgress(userId);
  if (passed(after)) {
    const completedAt = new Date().toISOString();
    await db.updateTable("challenge_enrollment").set({ completed_at: completedAt }).where("user_id", "=", userId).execute();
    return { ...after, completedAt, status: "complete" };
  }
  return after;
}

/** Joins, or starts over after an expired attempt. A finished challenge is never reset. */
export async function join(userId: string): Promise<ChallengeProgress> {
  const current = await getProgress(userId);
  if (current.status === "active" || current.status === "complete") return current;
  const startedAt = new Date().toISOString();
  await db.deleteFrom("challenge_log").where("user_id", "=", userId).execute();
  await db
    .insertInto("challenge_enrollment")
    .values({ user_id: userId, started_at: startedAt })
    .onConflict((oc) => oc.column("user_id").doUpdateSet({ started_at: startedAt, completed_at: null }))
    .execute();
  return getProgress(userId);
}

export async function setShowOnWall(userId: string, show: boolean): Promise<void> {
  await db.updateTable("challenge_enrollment").set({ show_on_wall: show ? 1 : 0 }).where("user_id", "=", userId).execute();
}
