import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db
    .selectFrom("reading_progress")
    .select(["book_slug", "chapter_slug", "read_at"])
    .where("user_id", "=", session.user.id)
    .execute();

  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const entries: { bookSlug: string; chapterSlug: string; readAt?: string }[] =
    Array.isArray(body) ? body : [body];

  for (const entry of entries) {
    await db
      .insertInto("reading_progress")
      .values({
        user_id: session.user.id,
        book_slug: entry.bookSlug,
        chapter_slug: entry.chapterSlug,
        read_at: entry.readAt ?? new Date().toISOString(),
      })
      .onConflict((oc) =>
        oc.columns(["user_id", "book_slug", "chapter_slug"]).doNothing()
      )
      .execute();
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const bookSlug = body?.bookSlug as string | undefined;
  const chapterSlug = body?.chapterSlug as string | undefined;
  if (!bookSlug || !chapterSlug) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  await db
    .deleteFrom("reading_progress")
    .where("user_id", "=", session.user.id)
    .where("book_slug", "=", bookSlug)
    .where("chapter_slug", "=", chapterSlug)
    .execute();

  return NextResponse.json({ ok: true });
}
