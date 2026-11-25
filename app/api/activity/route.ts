import { sql } from "kysely";
import { db } from "@/db";

const KINDS = new Set([
  "exercise_solved",
  "quiz_answered",
  "quiz_correct",
  "review_graded",
  "playground_run",
  "page_view",
  "visit",
]);

/** Anonymous daily totals: no user id, IP or cookie is stored. */
export async function POST(request: Request) {
  let body: { kind?: unknown };
  try {
    body = JSON.parse(await request.text());
  } catch {
    return new Response(null, { status: 400 });
  }
  const kind = body?.kind;
  if (typeof kind !== "string" || !KINDS.has(kind)) {
    return new Response(null, { status: 400 });
  }

  await db
    .insertInto("activity_daily")
    .values({ day: new Date().toISOString().slice(0, 10), kind, count: 1 })
    .onConflict((oc) => oc.columns(["day", "kind"]).doUpdateSet({ count: sql`count + 1` }))
    .execute();

  return new Response(null, { status: 204 });
}
