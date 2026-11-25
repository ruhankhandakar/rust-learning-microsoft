import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { getBookBySlug } from "@/lib/books";
import { getBookStructure } from "@/lib/content";

const MAX_COMMENT = 2000;

function isChapter(bookSlug: unknown, chapterSlug: unknown): boolean {
  if (typeof bookSlug !== "string" || typeof chapterSlug !== "string") return false;
  const book = getBookBySlug(bookSlug);
  return !!book && getBookStructure(book.dirName).flatChapters.some((c) => c.slug === chapterSlug);
}

async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const body = await request.json();
    return body && typeof body === "object" ? body : null;
  } catch {
    return null;
  }
}

/** An anonymous yes/no vote. Returns a token that lets the same reader attach a comment. */
export async function POST(request: Request) {
  const body = await readJson(request);
  if (!body || !isChapter(body.bookSlug, body.chapterSlug) || typeof body.helpful !== "boolean") {
    return NextResponse.json({ error: "Invalid feedback" }, { status: 400 });
  }
  const token = randomBytes(16).toString("hex");
  const row = await db
    .insertInto("chapter_feedback")
    .values({
      book_slug: body.bookSlug as string,
      chapter_slug: body.chapterSlug as string,
      helpful: body.helpful ? 1 : 0,
      edit_token: token,
    })
    .returning("id")
    .executeTakeFirstOrThrow();
  return NextResponse.json({ id: row.id, token }, { status: 201 });
}

/** Attach a comment to a vote. Signed-in readers only; comments wait for review. */
export async function PATCH(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Sign in to comment" }, { status: 401 });
  }
  const body = await readJson(request);
  const comment = typeof body?.comment === "string" ? body.comment.trim() : "";
  if (!body || typeof body.id !== "number" || typeof body.token !== "string" || !comment || comment.length > MAX_COMMENT) {
    return NextResponse.json({ error: "Invalid comment" }, { status: 400 });
  }
  const result = await db
    .updateTable("chapter_feedback")
    .set({
      comment,
      user_id: session.user.id,
      show_public: body.showPublic === true ? 1 : 0,
      ok_to_quote: body.okToQuote === true ? 1 : 0,
    })
    .where("id", "=", body.id)
    .where("edit_token", "=", body.token)
    .where("comment", "is", null)
    .executeTakeFirst();
  if (!result.numUpdatedRows) {
    return NextResponse.json({ error: "Feedback not found" }, { status: 404 });
  }
  return new Response(null, { status: 204 });
}
