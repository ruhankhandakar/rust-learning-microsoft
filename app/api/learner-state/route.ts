import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { EMPTY_STATE, mergeStates, sanitizeState } from "@/lib/learner-merge";

const MAX_BYTES = 512_000;

async function loadState(userId: string) {
  const row = await db
    .selectFrom("learner_state")
    .select("state")
    .where("user_id", "=", userId)
    .executeTakeFirst();
  return row ? sanitizeState(JSON.parse(row.state)) : null;
}

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json((await loadState(session.user.id)) ?? EMPTY_STATE);
}

export async function PUT(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const text = await request.text();
  if (text.length > MAX_BYTES) {
    return NextResponse.json({ error: "Too large" }, { status: 413 });
  }
  let incoming;
  try {
    incoming = sanitizeState(JSON.parse(text));
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  // ponytail: read-merge-write without a transaction; two devices saving in the same instant can drop one write until the next save.
  const existing = await loadState(session.user.id);
  const merged = existing ? mergeStates(existing, incoming) : incoming;
  const state = JSON.stringify(merged);
  if (state.length > MAX_BYTES) {
    return NextResponse.json({ error: "Too large" }, { status: 413 });
  }
  const updated_at = new Date().toISOString();
  await db
    .insertInto("learner_state")
    .values({ user_id: session.user.id, state, updated_at })
    .onConflict((oc) => oc.column("user_id").doUpdateSet({ state, updated_at }))
    .execute();

  return NextResponse.json(merged);
}
