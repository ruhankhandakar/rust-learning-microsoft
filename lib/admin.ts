import { sql } from "kysely";
import { db } from "@/db";
import { BOOKS } from "@/lib/books";
import { getBookStructure } from "@/lib/content";
import { claimExpired, currentQuarter, eligibleFinishers } from "@/lib/swag";

/** The owner is the GitHub account in ADMIN_GITHUB_ID; without it nobody is admin. */
export async function isAdmin(userId: string | undefined): Promise<boolean> {
  const owner = process.env.ADMIN_GITHUB_ID;
  if (!owner || !userId) return false;
  const account = await db
    .selectFrom("account")
    .select("accountId")
    .where("userId", "=", userId)
    .where("providerId", "=", "github")
    .executeTakeFirst();
  return account?.accountId === owner;
}

function chapterTitle(bookSlug: string, chapterSlug: string): string {
  const book = BOOKS.find((b) => b.slug === bookSlug);
  const ch = book && getBookStructure(book.dirName).flatChapters.find((c) => c.slug === chapterSlug);
  return ch ? `${book.shortTitle}: ${ch.title}` : `${bookSlug}/${chapterSlug}`;
}

export async function listComments() {
  const rows = await db
    .selectFrom("chapter_feedback")
    .leftJoin("user", "user.id", "chapter_feedback.user_id")
    .leftJoin("challenge_enrollment", "challenge_enrollment.user_id", "chapter_feedback.user_id")
    .select([
      "chapter_feedback.id",
      "chapter_feedback.book_slug",
      "chapter_feedback.chapter_slug",
      "chapter_feedback.helpful",
      "chapter_feedback.comment",
      "chapter_feedback.show_public",
      "chapter_feedback.ok_to_quote",
      "chapter_feedback.status",
      "chapter_feedback.created_at",
      "user.name",
      "challenge_enrollment.draw_opt_in",
    ])
    .where("chapter_feedback.comment", "is not", null)
    .orderBy(sql`chapter_feedback.status = 'new'`, "desc")
    .orderBy("chapter_feedback.created_at", "desc")
    .limit(200)
    .execute();
  return rows.map((r) => ({
    id: r.id,
    where: chapterTitle(r.book_slug, r.chapter_slug),
    helpful: r.helpful === 1,
    comment: r.comment!,
    name: r.name ?? "Unknown",
    showPublic: r.show_public === 1,
    okToQuote: r.ok_to_quote === 1,
    drawEntrant: r.draw_opt_in === 1,
    status: r.status,
    date: r.created_at.slice(0, 10),
  }));
}

export async function setCommentStatus(id: number, status: "approved" | "hidden"): Promise<void> {
  await db.updateTable("chapter_feedback").set({ status }).where("id", "=", id).execute();
}

const DAY = 86_400_000;

export async function listFinishers() {
  const rows = await db
    .selectFrom("challenge_enrollment")
    .innerJoin("user", "user.id", "challenge_enrollment.user_id")
    .select([
      "user.id",
      "user.name",
      "user.createdAt",
      "challenge_enrollment.started_at as startedAt",
      "challenge_enrollment.completed_at as completedAt",
      "challenge_enrollment.revoked_at as revokedAt",
      "challenge_enrollment.flags_cleared_at as clearedAt",
    ])
    .where((eb) => eb.or([eb("challenge_enrollment.completed_at", "is not", null), eb("challenge_enrollment.revoked_at", "is not", null)]))
    .orderBy("challenge_enrollment.completed_at", "desc")
    .execute();
  const stats = await db
    .selectFrom("challenge_log")
    .select([
      "user_id",
      sql<number>`sum(kind = 'quiz')`.as("right"),
      sql<number>`sum(kind = 'quiz_miss')`.as("missed"),
      sql<number>`count(distinct case when kind = 'chapter' then substr(at, 1, 10) end)`.as("days"),
    ])
    .groupBy("user_id")
    .execute();
  const by = new Map(stats.map((s) => [s.user_id, s]));
  return rows.map((r) => {
    const s = by.get(r.id);
    const right = Number(s?.right ?? 0);
    const answered = right + Number(s?.missed ?? 0);
    const accuracy = answered ? right / answered : null;
    const daysTaken = r.completedAt ? Math.ceil((Date.parse(r.completedAt) - Date.parse(r.startedAt)) / DAY) : null;
    const accountAgeAtStart = Math.floor((Date.parse(r.startedAt) - Date.parse(r.createdAt)) / DAY);
    const flags = [
      daysTaken !== null && daysTaken < 17 ? `finished in ${daysTaken} days` : null,
      accuracy !== null && accuracy < 0.75 ? `${Math.round(accuracy * 100)}% quiz accuracy` : null,
      accountAgeAtStart < 30 ? `account ${accountAgeAtStart} days old at start` : null,
    ].filter(Boolean) as string[];
    return { id: r.id, name: r.name, accountAgeAtStart, daysTaken, readingDays: Number(s?.days ?? 0), accuracy, flags, revoked: !!r.revokedAt, cleared: !!r.clearedAt };
  });
}

export async function clearFlags(userId: string): Promise<void> {
  await db.updateTable("challenge_enrollment").set({ flags_cleared_at: new Date().toISOString() }).where("user_id", "=", userId).execute();
}

export async function listCheckins() {
  return db
    .selectFrom("challenge_checkins")
    .innerJoin("user", "user.id", "challenge_checkins.user_id")
    .select(["user.id", "user.name", "user.email", "challenge_checkins.created_at as checkedInAt", "challenge_checkins.emailed_at as emailedAt"])
    .orderBy("challenge_checkins.created_at")
    .execute();
}

export async function markCheckinsEmailed(userIds: string[]): Promise<void> {
  if (userIds.length === 0) return;
  await db.updateTable("challenge_checkins").set({ emailed_at: new Date().toISOString() }).where("user_id", "in", userIds).where("emailed_at", "is", null).execute();
}

/** Removes a finish: the badge, the wall listing and draw entry go with it. They may start again. */
export async function revoke(userId: string): Promise<void> {
  await db
    .updateTable("challenge_enrollment")
    .set({ completed_at: null, show_on_wall: 0, draw_opt_in: 0, revoked_at: new Date().toISOString() })
    .where("user_id", "=", userId)
    .execute();
  const live = await db.selectFrom("swag_winners").select("id").where("user_id", "=", userId).where("status", "in", ["drawn", "claimed"]).execute();
  if (!live.length) return;
  const ids = live.map((w) => w.id);
  await db.deleteFrom("swag_addresses").where("winner_id", "in", ids).execute();
  // Closing the claim window now makes the prize redrawable at once; expired and shipped rows stay as they are.
  await db.updateTable("swag_winners").set({ status: "drawn", claimed_at: null, claim_by: new Date(Date.now() - 1000).toISOString() }).where("id", "in", ids).execute();
}

export async function drawState() {
  const quarter = currentQuarter();
  const [eligible, draw] = await Promise.all([
    eligibleFinishers(),
    db.selectFrom("swag_draws").selectAll().where("quarter", "=", quarter).executeTakeFirst(),
  ]);
  const winners = await db
    .selectFrom("swag_winners")
    .innerJoin("user", "user.id", "swag_winners.user_id")
    .innerJoin("swag_draws", "swag_draws.id", "swag_winners.draw_id")
    .leftJoin("swag_addresses", "swag_addresses.winner_id", "swag_winners.id")
    .select([
      "swag_winners.id",
      "swag_winners.prize",
      "swag_winners.status",
      "swag_winners.claim_token as token",
      "swag_winners.claim_by as claimBy",
      "swag_draws.quarter",
      "user.name",
      "user.email",
      "swag_addresses.full_name as fullName",
      "swag_addresses.line1",
      "swag_addresses.line2",
      "swag_addresses.city",
      "swag_addresses.state",
      "swag_addresses.postcode",
      "swag_addresses.phone",
      "swag_addresses.size",
      "swag_addresses.colour",
    ])
    .orderBy("swag_draws.quarter", "desc")
    .orderBy("swag_winners.id")
    .execute();
  return {
    quarter,
    eligible: eligible.length,
    drawnAt: draw?.drawn_at ?? null,
    seed: draw?.seed ?? null,
    winners: winners.map((w) => ({ ...w, unclaimed: w.status === "drawn" && claimExpired(w.claimBy) })),
  };
}
