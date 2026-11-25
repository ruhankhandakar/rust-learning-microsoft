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
  // Achievements, badge visibility and the finishers wall
  const { getAchievements, recordQuizResult, setPublic } = await import("../lib/achievements");
  const { getFinisher, getFinishers } = await import("../lib/finishers");
  await db.deleteFrom("reading_progress").where("user_id", "=", U).execute();
  let a = await getAchievements(U);
  ok(a !== null && a.tier === null && !a.isPublic, "a new learner has no tier and a private profile");
  for (let i = 0; i < 15; i++) await db.insertInto("reading_progress").values({ user_id: U, book_slug: chapters[i].split("/")[0], chapter_slug: chapters[i].split("/")[1], read_at: start }).execute();
  a = await getAchievements(U);
  ok(a!.chapters === 15 && a!.tier === "Starter", `15 chapters and no quizzes is Starter (${a!.tier})`);
  ok(!(await recordQuizResult(U, "no-such-quiz", true)), "unknown quiz is rejected");
  for (let i = 0; i < 10; i++) await recordQuizResult(U, quizzes[i].id, quizzes[i].compiles);
  await recordQuizResult(U, quizzes[0].id, !quizzes[0].compiles);
  a = await getAchievements(U);
  ok(a!.quizzesRight === 10 && a!.quizzesAnswered === 10, "only the first answer per quiz is stored");
  ok(a!.tier === "Bronze", `15 chapters and 10 quizzes at 100% is Bronze (${a!.tier})`);
  for (let i = 10; i < 16; i++) await recordQuizResult(U, quizzes[i].id, !quizzes[i].compiles);
  a = await getAchievements(U);
  ok(a!.tier === "Starter", `accuracy under 70% drops back to Starter (${Math.round(a!.accuracy * 100)}%)`);
  await setPublic(U, true);
  ok((await getAchievements(U))!.isPublic, "profile can be made public");

  await db.updateTable("challenge_enrollment").set({ completed_at: new Date().toISOString(), show_on_wall: 0 }).where("user_id", "=", U).execute();
  ok((await getFinisher(U)) === null && !(await getFinishers()).some((f) => f.id === U), "a finisher who did not opt in stays off the wall");
  await db.updateTable("challenge_enrollment").set({ show_on_wall: 1 }).where("user_id", "=", U).execute();
  const f = await getFinisher(U);
  ok(f !== null && (await getFinishers()).some((x) => x.id === U), "an opted-in finisher is on the wall");

  // Swag draw, claims and revoking
  const { runDraw, eligibleFinishers, claim, parseAddress, markShipped, getWinnerByToken } = await import("../lib/swag");
  const { revoke, isAdmin } = await import("../lib/admin");
  const V = "challenge-test-other";
  await sql`INSERT OR IGNORE INTO user (id, name, email, emailVerified, createdAt, updatedAt) VALUES (${V}, 'Other', 'other@example.invalid', 0, datetime('now'), datetime('now'))`.execute(db);
  await db.updateTable("challenge_enrollment").set({ draw_opt_in: 0 }).where("user_id", "=", U).execute();
  ok(!(await eligibleFinishers()).some((e) => e.id === U), "a finisher without the draw switch is not eligible");
  await db.updateTable("challenge_enrollment").set({ draw_opt_in: 1 }).where("user_id", "=", U).execute();
  ok((await eligibleFinishers()).some((e) => e.id === U), "a finisher with the draw switch is eligible");
  const Y = "challenge-test-young", GH_AGE: Record<string, number> = {};
  const linkGitHub = async (userId: string, ageDays: number) => {
    const accountId = String(9000 + Object.keys(GH_AGE).length);
    GH_AGE[accountId] = ageDays;
    await sql`INSERT INTO account (id, accountId, providerId, userId, createdAt, updatedAt) VALUES (${"acc-" + userId}, ${accountId}, 'github', ${userId}, datetime('now'), datetime('now'))`.execute(db);
  };
  let githubDown = false;
  const revokedToken = "revoked-token";
  globalThis.fetch = (async (url: string, init?: RequestInit) => {
    if (githubDown) return new Response(null, { status: 503 });
    if ((init?.headers as Record<string, string> | undefined)?.Authorization === `Bearer ${revokedToken}`) return new Response(null, { status: 401 });
    const age = GH_AGE[String(url).split("/").pop()!];
    return age === undefined ? new Response(null, { status: 404 }) : Response.json({ created_at: new Date(realNow() - age * 86400000).toISOString() });
  }) as typeof fetch;
  await linkGitHub(U, 400);
  await sql`INSERT OR IGNORE INTO user (id, name, email, emailVerified, createdAt, updatedAt) VALUES (${Y}, 'Young', 'young@example.invalid', 0, datetime('now'), datetime('now'))`.execute(db);
  await db.insertInto("challenge_enrollment").values({ user_id: Y, started_at: new Date(realNow() - 40 * 86400000).toISOString(), completed_at: new Date(realNow() - 20 * 86400000).toISOString(), show_on_wall: 0, draw_opt_in: 1 }).execute();
  await linkGitHub(Y, 30);
  await db.updateTable("account").set({ accessToken: revokedToken }).where("userId", "=", U).execute();
  githubDown = true;
  const down = await runDraw();
  ok(!down.ok && !(await db.selectFrom("swag_draws").select("id").executeTakeFirst()), "if GitHub can't be reached, nothing is drawn");
  githubDown = false;
  const first = await runDraw();
  ok(first.ok, "the quarter's draw runs, even when an entrant revoked the site's GitHub access");
  ok(!(await db.selectFrom("swag_winners").select("id").where("user_id", "=", Y).executeTakeFirst()), "a GitHub account under 90 days old is never drawn");
  ok(!(await runDraw()).ok, "a quarter is drawn only once");
  const won = await db.selectFrom("swag_winners").selectAll().where("user_id", "=", U).executeTakeFirst();
  ok(!!won && !(await eligibleFinishers()).some((e) => e.id === U), "a winner can't win again");
  const address = { fullName: "Test Winner", line1: "1 Test Road", city: "Pune", state: "Maharashtra", postcode: "411001", phone: "+91 98765 43210", adult: true };
  ok(parseAddress({ ...address, postcode: "4110" }) === null && parseAddress({ ...address, adult: false }) === null, "bad PIN code or no 18+ box is rejected");
  ok(!(await claim(won!.claim_token, V, parseAddress(address)!)).ok, "another account can't claim the prize");
  ok((await claim(won!.claim_token, U, parseAddress(address)!)).ok, "the winner can claim");
  ok(!(await claim(won!.claim_token, U, parseAddress(address)!)).ok, "a prize can't be claimed twice");
  await markShipped(won!.id);
  const addr = await db.selectFrom("swag_addresses").selectAll().where("winner_id", "=", won!.id).executeTakeFirst();
  ok(!addr && (await getWinnerByToken(won!.claim_token))!.status === "shipped", "shipping deletes the address");
  const { redraw } = await import("../lib/swag");
  const W = "challenge-test-lapsed", X = "challenge-test-next", iso = (ms: number) => new Date(ms).toISOString();
  for (const id of [W, X]) {
    await sql`INSERT OR IGNORE INTO user (id, name, email, emailVerified, createdAt, updatedAt) VALUES (${id}, ${id}, ${id + "@example.invalid"}, 0, datetime('now'), datetime('now'))`.execute(db);
    await db.insertInto("challenge_enrollment").values({ user_id: id, started_at: iso(realNow() - 40 * 86400000), completed_at: iso(realNow() - 20 * 86400000), show_on_wall: 0, draw_opt_in: 1 }).execute();
    await linkGitHub(id, 400);
  }
  const past = await db.insertInto("swag_draws").values({ quarter: "2000-Q1", seed: "checkseed", drawn_at: iso(realNow()) }).returning("id").executeTakeFirstOrThrow();
  const lapsed = await db.insertInto("swag_winners").values({ draw_id: past.id, user_id: W, prize: "Sticker pack", claim_token: "lapsed-token", claim_by: iso(realNow() + 86400000) }).returning("id").executeTakeFirstOrThrow();
  ok(!(await redraw(lapsed.id)).ok, "a prize still inside its claim window can't be redrawn");
  await db.updateTable("swag_winners").set({ claim_by: iso(realNow() - 86400000) }).where("id", "=", lapsed.id).execute();
  ok((await redraw(lapsed.id)).ok, "an expired, unclaimed prize can be redrawn");
  const replacement = await db.selectFrom("swag_winners").selectAll().where("draw_id", "=", past.id).where("user_id", "=", X).executeTakeFirst();
  ok(replacement?.prize === "Sticker pack" && Date.parse(replacement.claim_by) > realNow(), "the redraw gives the same prize to another entrant with a fresh claim window");
  ok(!(await redraw(lapsed.id)).ok, "an expired prize is redrawn only once");
  ok(!(await claim("lapsed-token", W, parseAddress(address)!)).ok, "the lapsed winner's link no longer works");
  ok(!(await eligibleFinishers(past.id)).some((e) => e.id === W), "the lapsed winner isn't picked again in the same draw");
  ok((await eligibleFinishers()).some((e) => e.id === W), "the lapsed winner can enter later quarters");

  await revoke(U);
  ok((await getFinisher(U)) === null && (await getProgress(U)).status !== "complete", "revoking removes the finish and the wall listing");
  delete process.env.ADMIN_GITHUB_ID;
  ok(!(await isAdmin(U)), "without ADMIN_GITHUB_ID nobody is admin");

  // Launch date and check-ins
  const { challengeOpen } = await import("../lib/challenge-launch");
  ok(!challengeOpen(Date.parse("2026-11-30T18:29:59Z")) && challengeOpen(Date.parse("2026-11-30T18:30:00Z")), "the challenge opens at midnight India time on 1 December");
  const { setCheckIn } = await import("../lib/challenge");
  const { listCheckins, markCheckinsEmailed } = await import("../lib/admin");
  const C = "challenge-test-checkin";
  await sql`INSERT OR IGNORE INTO user (id, name, email, emailVerified, createdAt, updatedAt) VALUES (${C}, 'Early', 'early@example.invalid', 0, datetime('now'), datetime('now'))`.execute(db);
  await setCheckIn(C, true);
  await setCheckIn(C, true);
  ok((await getProgress(C)).checkedIn && (await listCheckins()).filter((c) => c.id === C).length === 1, "checking in twice keeps one reminder");
  await markCheckinsEmailed([C]);
  const emailed = (await listCheckins()).find((c) => c.id === C)?.emailedAt;
  await markCheckinsEmailed([C]);
  ok(!!emailed && (await listCheckins()).find((c) => c.id === C)?.emailedAt === emailed, "marking emailed records the first send only");
  await setCheckIn(C, false);
  ok(!(await getProgress(C)).checkedIn, "a reminder can be cancelled");

  console.log(failed ? `${failed} FAILED` : "all passed");
  process.exit(failed ? 1 : 0);
}
main();
