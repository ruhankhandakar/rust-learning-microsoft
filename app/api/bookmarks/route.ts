import { NextResponse } from "next/server";
import { isSameOriginJson } from "@/lib/utils";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { isChapter } from "@/lib/content";

const MAX_BOOKMARKS = 1000;
const MAX_NOTE = 2000;

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db
    .selectFrom("bookmarks")
    .select([
      "id",
      "book_slug",
      "chapter_slug",
      "heading_id",
      "heading_text",
      "note",
      "created_at",
    ])
    .where("user_id", "=", session.user.id)
    .orderBy("created_at", "desc")
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
  const entries = (Array.isArray(body) ? body : [body]).filter(
    (e): e is { book_slug: string; chapter_slug: string; heading_id: string; heading_text: string; note?: string | null } =>
      !!e &&
      isChapter(e.book_slug, e.chapter_slug) &&
      typeof e.heading_id === "string" && e.heading_id.length > 0 && e.heading_id.length <= 200 &&
      typeof e.heading_text === "string" && e.heading_text.length <= 300 &&
      (e.note == null || (typeof e.note === "string" && e.note.length <= MAX_NOTE))
  );
  const { count } = await db
    .selectFrom("bookmarks")
    .select((eb) => eb.fn.countAll<number>().as("count"))
    .where("user_id", "=", session.user.id)
    .executeTakeFirstOrThrow();
  if (Number(count) + entries.length > MAX_BOOKMARKS) {
    return NextResponse.json({ error: "Too many bookmarks" }, { status: 413 });
  }

  for (const entry of entries) {
    await db
      .insertInto("bookmarks")
      .values({
        user_id: session.user.id,
        book_slug: entry.book_slug,
        chapter_slug: entry.chapter_slug,
        heading_id: entry.heading_id,
        heading_text: entry.heading_text,
        note: entry.note ?? null,
      })
      .onConflict((oc) =>
        oc
          .columns(["user_id", "book_slug", "chapter_slug", "heading_id"])
          .doUpdateSet({ note: entry.note ?? null })
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

  const { searchParams } = new URL(request.url);
  const bookSlug = searchParams.get("book_slug");
  const chapterSlug = searchParams.get("chapter_slug");
  const headingId = searchParams.get("heading_id");

  if (!bookSlug || !chapterSlug || !headingId) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  await db
    .deleteFrom("bookmarks")
    .where("user_id", "=", session.user.id)
    .where("book_slug", "=", bookSlug)
    .where("chapter_slug", "=", chapterSlug)
    .where("heading_id", "=", headingId)
    .execute();

  return NextResponse.json({ ok: true });
}
