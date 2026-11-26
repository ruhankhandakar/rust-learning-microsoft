import { NextResponse } from "next/server";
import { isSameOriginJson } from "@/lib/utils";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { isChapter } from "@/lib/content";

const MAX_ENTRIES = 1000;

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
  if (!isSameOriginJson(request)) return NextResponse.json({ error: "Invalid request" }, { status: 403 });
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const entries: unknown[] = Array.isArray(body) ? body : [body];
  if (entries.length > MAX_ENTRIES) {
    return NextResponse.json({ error: "Too many entries" }, { status: 413 });
  }

  const readAt = new Date().toISOString();
  for (const entry of entries as { bookSlug?: unknown; chapterSlug?: unknown }[]) {
    if (!entry || !isChapter(entry.bookSlug, entry.chapterSlug)) continue;
    await db
      .insertInto("reading_progress")
      .values({
        user_id: session.user.id,
        book_slug: entry.bookSlug as string,
        chapter_slug: entry.chapterSlug as string,
        read_at: readAt,
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

  const body = await request.json().catch(() => null);
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
