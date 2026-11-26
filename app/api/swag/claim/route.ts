import { NextResponse } from "next/server";
import { isSameOriginJson } from "@/lib/utils";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { claim, parseAddress } from "@/lib/swag";

export async function POST(request: Request) {
  if (!isSameOriginJson(request)) return NextResponse.json({ error: "Invalid request" }, { status: 403 });
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Sign in with the GitHub account that won." }, { status: 401 });
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const address = parseAddress(body);
  if (typeof body.token !== "string" || !address) {
    return NextResponse.json({ error: "Check every field: a postcode, a country and a phone number." }, { status: 400 });
  }
  const result = await claim(body.token, session.user.id, address);
  return result.ok ? new Response(null, { status: 204 }) : NextResponse.json({ error: result.error }, { status: 409 });
}
