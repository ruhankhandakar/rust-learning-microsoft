// Usage: pnpm check:challenge — asserts the 30-Day Challenge rules against a throwaway copy of local.db.
import { copyFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const copy = path.join(mkdtempSync(path.join(tmpdir(), "challenge-check-")), "check.db");
copyFileSync("local.db", copy);
process.env.TURSO_DATABASE_URL = `file:${copy}`;

let failed = 0;
const ok = (cond: boolean, msg: string) => { console.log(cond ? "ok  " : "FAIL", msg); if (!cond) failed++; };
const U = "challenge-test-user";
const realNow = Date.now;
async function main() {
  const { sql } = await import("kysely");
  const { db } = await import("../db");
  const { join, recordEvent, getProgress, issueTicket, requiredSeconds } = await import("../lib/challenge");
  const { getAllQuizzes } = await import("../lib/quizzes");
  const { BOOKS } = await import("../lib/books");
  const { getBookStructure } = await import("../lib/content");
  const ticketFrom = (ref: string, secondsAgo: number) => { Date.now = () => realNow() - secondsAgo * 1000; const t = issueTicket(U, ref).ticket; Date.now = realNow; return t; };

  await sql`INSERT OR IGNORE INTO user (id, name, email, emailVerified, createdAt, updatedAt) VALUES (${U}, 'Test', 'test@example.invalid', 0, datetime('now'), datetime('now'))`.execute(db);
  const chapters = BOOKS.filter((b) => b.slug !== "100-rust-projects").flatMap((b) => getBookStructure(b.dirName).flatChapters.map((c) => `${b.slug}/${c.slug}`));
  const quizzes = getAllQuizzes();

  let p = await join(U);
  ok(p.status === "active" && p.today === 1, "join starts day 1");
  const secs = requiredSeconds(chapters[0]);
  ok(secs >= 60 && secs <= 240, `required time is within 1 to 4 minutes (${secs}s)`);

  p = await recordEvent(U, "chapter", chapters[0], {});
  ok(p.chapters === 0, "chapter without a ticket does not count");
  p = await recordEvent(U, "chapter", chapters[0], { ticket: ticketFrom(chapters[0], 5) });
  ok(p.chapters === 0, "chapter after 5 seconds does not count");
  p = await recordEvent(U, "chapter", chapters[0], { ticket: ticketFrom(chapters[1], 300) });
  ok(p.chapters === 0, "ticket for another chapter does not count");
  const good = ticketFrom(chapters[0], 300);
  p = await recordEvent(U, "chapter", chapters[0], { ticket: good.slice(0, -2) + "xx" });
  ok(p.chapters === 0, "tampered ticket does not count");
  p = await recordEvent(U, "chapter", chapters[0], { ticket: good });
  ok(p.chapters === 1, "chapter read long enough counts");

  for (let i = 1; i <= 5; i++) p = await recordEvent(U, "chapter", chapters[i], { ticket: ticketFrom(chapters[i], 300) });
  ok(p.chapters === 5, `at most 5 chapters a day (${p.chapters})`);

  const unread = quizzes.find((q) => !chapters.slice(0, 5).includes(`${q.bookSlug}/${q.chapterSlug}`))!;
  p = await recordEvent(U, "quiz", unread.id, { answer: unread.compiles });
  ok(p.quizzes === 0, "quiz before its chapter is read does not count");
  const readQuiz = quizzes.filter((q) => chapters.slice(0, 5).includes(`${q.bookSlug}/${q.chapterSlug}`));
  ok(readQuiz.length >= 2, `found quizzes for the read chapters (${readQuiz.length})`);
  p = await recordEvent(U, "quiz", readQuiz[0].id, { answer: !readQuiz[0].compiles });
  p = await recordEvent(U, "quiz", readQuiz[0].id, { answer: readQuiz[0].compiles });
  ok(p.quizzes === 0 && p.misses === 1, "a miss blocks a later right answer");
  p = await recordEvent(U, "quiz", readQuiz[1].id, { answer: readQuiz[1].compiles });
  ok(p.quizzes === 1, "first right answer on a read chapter counts");

  // Near-finished attempt: 29 chapters over 15 days, 25 right, then decide by accuracy
  const start = new Date(realNow() - 16 * 86400000).toISOString();
  await db.updateTable("challenge_enrollment").set({ started_at: start }).where("user_id", "=", U).execute();
  await db.deleteFrom("challenge_log").where("user_id", "=", U).execute();
  for (let i = 0; i < 29; i++) await db.insertInto("challenge_log").values({ user_id: U, kind: "chapter", ref: chapters[i], at: new Date(Date.parse(start) + (i % 15) * 86400000 + 3600000).toISOString() }).execute();
  for (let i = 0; i < 25; i++) await db.insertInto("challenge_log").values({ user_id: U, kind: "quiz", ref: quizzes[i].id, at: start }).execute();
  for (let i = 25; i < 37; i++) await db.insertInto("challenge_log").values({ user_id: U, kind: "quiz_miss", ref: quizzes[i].id, at: start }).execute();
  p = await recordEvent(U, "chapter", chapters[29], { ticket: ticketFrom(chapters[29], 300) });
  ok(p.chapters === 30 && p.status === "active", `25 right of 37 (68%) does not finish (${Math.round(p.quizzes / (p.quizzes + p.misses) * 100)}%)`);
  await db.deleteFrom("challenge_log").where("user_id", "=", U).where("kind", "=", "quiz_miss").where("ref", "in", [quizzes[35].id, quizzes[36].id]).execute();
  p = await recordEvent(U, "chapter", chapters[30], { ticket: ticketFrom(chapters[30], 300) });
  ok(p.status === "complete" && !!p.completedAt, "25 right of 35 (71%) with 30+ chapters on 15 days finishes");
  p = await join(U);
  ok(p.status === "complete", "joining again never resets a finished challenge");

  await db.updateTable("challenge_enrollment").set({ started_at: new Date(realNow() - 31 * 86400000).toISOString(), completed_at: null }).where("user_id", "=", U).execute();
  p = await getProgress(U);
  ok(p.status === "expired", "an unfinished attempt expires after 30 days");
  p = await join(U);
  ok(p.status === "active" && p.chapters === 0, "starting again resets the log");
  console.log(failed ? `${failed} FAILED` : "all passed");
  process.exit(failed ? 1 : 0);
}
main();
