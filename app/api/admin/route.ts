import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { clearFlags, isAdmin, markCheckinsEmailed, revoke, setCommentStatus } from "@/lib/admin";
import { markShipped, redraw, runDraw } from "@/lib/swag";

/** Owner-only actions: { action: "comment", id, status } | { action: "revoke", userId } | { action: "looks-fine", userId } | { action: "emailed", userIds } | { action: "draw" } | { action: "redraw", winnerId } | { action: "shipped", winnerId }. */
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!(await isAdmin(session?.user.id))) return new Response(null, { status: 404 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (body.action === "comment" && typeof body.id === "number" && (body.status === "approved" || body.status === "hidden")) {
    await setCommentStatus(body.id, body.status);
    revalidatePath("/impact");
    return new Response(null, { status: 204 });
  }
  if (body.action === "revoke" && typeof body.userId === "string") {
    await revoke(body.userId);
    revalidatePath("/finishers");
    revalidatePath(`/finishers/${body.userId}`);
    revalidatePath("/impact");
    return new Response(null, { status: 204 });
  }
  if (body.action === "looks-fine" && typeof body.userId === "string") {
    await clearFlags(body.userId);
    return new Response(null, { status: 204 });
  }
  if (body.action === "emailed" && Array.isArray(body.userIds) && body.userIds.every((u) => typeof u === "string")) {
    await markCheckinsEmailed(body.userIds as string[]);
    return new Response(null, { status: 204 });
  }
  if (body.action === "draw") {
    const result = await runDraw();
    return result.ok ? new Response(null, { status: 204 }) : NextResponse.json({ error: result.error }, { status: 409 });
  }
  if (body.action === "redraw" && typeof body.winnerId === "number") {
    const result = await redraw(body.winnerId);
    return result.ok ? new Response(null, { status: 204 }) : NextResponse.json({ error: result.error }, { status: 409 });
  }
  if (body.action === "shipped" && typeof body.winnerId === "number") {
    await markShipped(body.winnerId);
    return new Response(null, { status: 204 });
  }
  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}
