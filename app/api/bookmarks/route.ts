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
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const entries: {
    book_slug: string;
    chapter_slug: string;
    heading_id: string;
    heading_text: string;
    note?: string;
  }[] = Array.isArray(body) ? body : [body];

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
