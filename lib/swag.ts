import { createHash, randomBytes } from "crypto";
import { db } from "@/db";

// Internal only: sized to the yearly swag budget, never shown on the site.
const PRIZES = ["T-shirt bundle", "Sticker pack", "Sticker pack"];
const CLAIM_DAYS = 14;

export function currentQuarter(now = new Date()): string {
  return `${now.getUTCFullYear()}-Q${Math.floor(now.getUTCMonth() / 3) + 1}`;
}

/** Finished, opted in, never got a prize. A winner who let a claim expire may enter later draws, but not a redraw of the same one. */
export async function eligibleFinishers(drawId?: number) {
  return db
    .selectFrom("challenge_enrollment")
    .innerJoin("user", "user.id", "challenge_enrollment.user_id")
    .select(["user.id", "user.name", "user.email", "challenge_enrollment.completed_at as completedAt"])
    .where("challenge_enrollment.completed_at", "is not", null)
    .where("challenge_enrollment.revoked_at", "is", null)
    .where("challenge_enrollment.draw_opt_in", "=", 1)
    .where(({ not, exists, selectFrom }) =>
      not(
        exists(
          selectFrom("swag_winners")
            .select("swag_winners.id")
            .whereRef("swag_winners.user_id", "=", "user.id")
            .where((w) => w.or([w("swag_winners.status", "!=", "expired"), ...(drawId ? [w("swag_winners.draw_id", "=", drawId)] : [])])),
        ),
      ),
    )
    .execute();
}

const rank = (seed: string, userId: string) => createHash("sha256").update(`${seed}:${userId}`).digest("hex");

/** Draws this quarter's winners. The seed is stored so anyone can re-rank the same entrants and check. */
export async function runDraw(): Promise<{ ok: true } | { ok: false; error: string }> {
  const quarter = currentQuarter();
  const existing = await db.selectFrom("swag_draws").select("id").where("quarter", "=", quarter).executeTakeFirst();
  if (existing) return { ok: false, error: `The ${quarter} draw already happened.` };
  const entrants = await eligibleFinishers();
  if (entrants.length === 0) return { ok: false, error: "No eligible finishers yet." };

  const seed = randomBytes(16).toString("hex");
  const now = new Date();
  const winners = byRank(seed, entrants).slice(0, PRIZES.length);
  const draw = await db
    .insertInto("swag_draws")
    .values({ quarter, seed, drawn_at: now.toISOString() })
    .returning("id")
    .executeTakeFirstOrThrow();
  await db
    .insertInto("swag_winners")
    .values(
      winners.map((w, i) => ({
        draw_id: draw.id,
        user_id: w.id,
        prize: PRIZES[i],
        ...claimFields(now),
      })),
    )
    .execute();
  return { ok: true };
}

const byRank = <T extends { id: string }>(seed: string, entrants: T[]) => [...entrants].sort((a, b) => rank(seed, a.id).localeCompare(rank(seed, b.id)));
const claimFields = (now: Date) => ({ claim_token: randomBytes(24).toString("base64url"), claim_by: new Date(+now + CLAIM_DAYS * 86_400_000).toISOString() });

/** Gives an unclaimed, expired prize to the next entrant in the same seed's ranking. */
export async function redraw(winnerId: number): Promise<{ ok: true } | { ok: false; error: string }> {
  const w = await db
    .selectFrom("swag_winners")
    .innerJoin("swag_draws", "swag_draws.id", "swag_winners.draw_id")
    .select(["swag_winners.status", "swag_winners.claim_by", "swag_winners.prize", "swag_winners.draw_id", "swag_draws.seed"])
    .where("swag_winners.id", "=", winnerId)
    .executeTakeFirst();
  if (!w || w.status !== "drawn" || !claimExpired(w.claim_by)) return { ok: false, error: "Only an unclaimed prize past its claim date can be redrawn." };
  const next = byRank(w.seed, await eligibleFinishers(w.draw_id))[0];
  await db.updateTable("swag_winners").set({ status: "expired" }).where("id", "=", winnerId).execute();
  if (!next) return { ok: false, error: "Marked expired. Nobody else is eligible, so the prize stays unawarded." };
  await db
    .insertInto("swag_winners")
    .values({ draw_id: w.draw_id, user_id: next.id, prize: w.prize, ...claimFields(new Date()) })
    .execute();
  return { ok: true };
}

export const claimExpired = (claimBy: string) => Date.parse(claimBy) < Date.now();

export async function getWinnerByToken(token: string) {
  return db
    .selectFrom("swag_winners")
    .innerJoin("user", "user.id", "swag_winners.user_id")
    .innerJoin("swag_draws", "swag_draws.id", "swag_winners.draw_id")
    .select([
      "swag_winners.id",
      "swag_winners.user_id as userId",
      "swag_winners.prize",
      "swag_winners.status",
      "swag_winners.claim_by as claimBy",
      "swag_draws.quarter",
      "user.name",
    ])
    .where("swag_winners.claim_token", "=", token)
    .executeTakeFirst();
}

export interface Address {
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postcode: string;
  phone: string;
  size?: string;
  colour?: string;
}

const text = (v: unknown, max = 120) => (typeof v === "string" && v.trim() && v.length <= max ? v.trim() : null);

export function parseAddress(body: Record<string, unknown>): Address | null {
  const a = {
    fullName: text(body.fullName),
    line1: text(body.line1),
    line2: typeof body.line2 === "string" ? body.line2.trim().slice(0, 120) : "",
    city: text(body.city, 60),
    state: text(body.state, 60),
    postcode: typeof body.postcode === "string" && /^\d{6}$/.test(body.postcode.trim()) ? body.postcode.trim() : null,
    phone: typeof body.phone === "string" && /^[+\d][\d\s-]{7,15}$/.test(body.phone.trim()) ? body.phone.trim() : null,
    size: typeof body.size === "string" ? body.size.slice(0, 8) : undefined,
    colour: typeof body.colour === "string" ? body.colour.slice(0, 20) : undefined,
  };
  if (!a.fullName || !a.line1 || !a.city || !a.state || !a.postcode || !a.phone || body.adult !== true) return null;
  return a as Address;
}

export async function claim(token: string, userId: string, address: Address): Promise<{ ok: true } | { ok: false; error: string }> {
  const w = await getWinnerByToken(token);
  if (!w || w.userId !== userId) return { ok: false, error: "This claim link isn't for your account." };
  if (w.status === "drawn" && claimExpired(w.claimBy)) return { ok: false, error: "The claim window has closed." };
  if (w.status !== "drawn") return { ok: false, error: w.status === "expired" ? "The claim window has closed." : "This prize was already claimed." };
  await db
    .insertInto("swag_addresses")
    .values({
      winner_id: w.id,
      full_name: address.fullName,
      line1: address.line1,
      line2: address.line2 || null,
      city: address.city,
      state: address.state,
      postcode: address.postcode,
      phone: address.phone,
      size: address.size ?? null,
      colour: address.colour ?? null,
      created_at: new Date().toISOString(),
    })
    .execute();
  await db.updateTable("swag_winners").set({ status: "claimed", claimed_at: new Date().toISOString() }).where("id", "=", w.id).execute();
  return { ok: true };
}

/** Marks a parcel shipped and deletes the address, as the rules promise. */
export async function markShipped(winnerId: number): Promise<void> {
  await db.deleteFrom("swag_addresses").where("winner_id", "=", winnerId).execute();
  await db.updateTable("swag_winners").set({ status: "shipped", shipped_at: new Date().toISOString() }).where("id", "=", winnerId).execute();
}
