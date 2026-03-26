import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const row = await db
    .selectFrom("user_preferences")
    .select(["font_family", "font_size", "theme"])
    .where("user_id", "=", session.user.id)
    .executeTakeFirst();

  return NextResponse.json(
    row ?? { font_family: "geist", font_size: "base", theme: "light" }
  );
}

export async function PUT(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { font_family, font_size, theme } = body as {
    font_family?: string;
    font_size?: string;
    theme?: string;
  };

  const existing = await db
    .selectFrom("user_preferences")
    .select("id")
    .where("user_id", "=", session.user.id)
    .executeTakeFirst();

  if (existing) {
    await db
      .updateTable("user_preferences")
      .set({
        ...(font_family !== undefined && { font_family }),
        ...(font_size !== undefined && { font_size }),
        ...(theme !== undefined && { theme }),
        updated_at: new Date().toISOString(),
      })
      .where("user_id", "=", session.user.id)
      .execute();
  } else {
    await db
      .insertInto("user_preferences")
      .values({
        user_id: session.user.id,
        ...(font_family !== undefined && { font_family }),
        ...(font_size !== undefined && { font_size }),
        ...(theme !== undefined && { theme }),
      })
      .execute();
  }

  return NextResponse.json({ ok: true });
}
