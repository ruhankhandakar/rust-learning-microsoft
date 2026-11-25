import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getProgress, isValidRef, issueTicket, join, recordEvent, setShowOnWall, type ChallengeKind } from "@/lib/challenge";

async function userId(): Promise<string | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user.id ?? null;
}

export async function GET() {
  const id = await userId();
  if (!id) return NextResponse.json({ error: "Sign in to see your challenge" }, { status: 401 });
  return NextResponse.json(await getProgress(id));
}

/**
 * { action: "join" } starts the challenge; { action: "ticket", ref } timestamps opening a chapter;
 * { action: "event", kind, ref } logs a chapter read (with its ticket) or a quiz answer
 * ({ answer: compiles? }, graded on the server); { action: "wall", show } toggles the finishers wall.
 */
export async function POST(request: Request) {
  const id = await userId();
  if (!id) return NextResponse.json({ error: "Sign in to take the challenge" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (body.action === "join") return NextResponse.json(await join(id));

  if (body.action === "ticket") {
    if (typeof body.ref !== "string" || !isValidRef("chapter", body.ref)) {
      return NextResponse.json({ error: "Invalid chapter" }, { status: 400 });
    }
    if ((await getProgress(id)).status !== "active") return new Response(null, { status: 204 });
    return NextResponse.json(issueTicket(id, body.ref));
  }

  if (body.action === "event") {
    const kind = body.kind as ChallengeKind;
    if ((kind !== "chapter" && kind !== "quiz") || typeof body.ref !== "string" || !isValidRef(kind, body.ref)) {
      return NextResponse.json({ error: "Invalid event" }, { status: 400 });
    }
    return NextResponse.json(await recordEvent(id, kind, body.ref, { answer: body.answer, ticket: body.ticket }));
  }

  if (body.action === "wall" && typeof body.show === "boolean") {
    await setShowOnWall(id, body.show);
    return NextResponse.json(await getProgress(id));
  }

  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}
