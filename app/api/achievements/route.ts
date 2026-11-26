import { NextResponse } from "next/server";
import { isSameOriginJson } from "@/lib/utils";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getAchievements, setPublic } from "@/lib/achievements";

async function userId(): Promise<string | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user.id ?? null;
}

export async function GET() {
  const id = await userId();
  if (!id) return NextResponse.json({ error: "Sign in to see your achievements" }, { status: 401 });
  return NextResponse.json({ id, ...(await getAchievements(id)) });
}

/** { action: "public", value } toggles the public profile. Quiz answers go through /api/quiz. */
export async function POST(request: Request) {
  if (!isSameOriginJson(request)) return NextResponse.json({ error: "Invalid request" }, { status: 403 });
  const id = await userId();
  if (!id) return NextResponse.json({ error: "Sign in first" }, { status: 401 });
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (body.action === "public" && typeof body.value === "boolean") {
    await setPublic(id, body.value);
    return NextResponse.json({ id, ...(await getAchievements(id)) });
  }
  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}
