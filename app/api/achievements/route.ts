import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getAchievements, recordQuizResult, setPublic } from "@/lib/achievements";

async function userId(): Promise<string | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user.id ?? null;
}

export async function GET() {
  const id = await userId();
  if (!id) return NextResponse.json({ error: "Sign in to see your achievements" }, { status: 401 });
  return NextResponse.json({ id, ...(await getAchievements(id)) });
}

/** { action: "quiz", quizId, answer } records a first quiz answer; { action: "public", value } toggles the public profile. */
export async function POST(request: Request) {
  const id = await userId();
  if (!id) return NextResponse.json({ error: "Sign in first" }, { status: 401 });
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (body.action === "quiz" && typeof body.quizId === "string") {
    const ok = await recordQuizResult(id, body.quizId, body.answer);
    return ok ? new Response(null, { status: 204 }) : NextResponse.json({ error: "Invalid quiz" }, { status: 400 });
  }
  if (body.action === "public" && typeof body.value === "boolean") {
    await setPublic(id, body.value);
    return NextResponse.json({ id, ...(await getAchievements(id)) });
  }
  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}
