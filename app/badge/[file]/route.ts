import { getAchievements } from "@/lib/achievements";

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

function badge(label: string, message: string, color: string): string {
  const lw = Math.round(label.length * 6.6 + 12);
  const mw = Math.round(message.length * 6.6 + 12);
  const w = lw + mw;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="20" role="img" aria-label="${esc(label)}: ${esc(message)}">
<title>${esc(label)}: ${esc(message)}</title>
<clipPath id="r"><rect width="${w}" height="20" rx="3" fill="#fff"/></clipPath>
<g clip-path="url(#r)"><rect width="${lw}" height="20" fill="#3a3d44"/><rect x="${lw}" width="${mw}" height="20" fill="${color}"/></g>
<g fill="#fff" text-anchor="middle" font-family="Verdana,DejaVu Sans,sans-serif" font-size="11">
<text x="${lw / 2}" y="14">${esc(label)}</text><text x="${lw + mw / 2}" y="14">${esc(message)}</text></g>
</svg>`;
}

const TIER_COLOR: Record<string, string> = { Starter: "#6b7280", Bronze: "#b5541f", Silver: "#7c8696", Gold: "#b8860b" };

export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const id = file.replace(/\.svg$/, "");
  const a = file.endsWith(".svg") ? await getAchievements(id) : null;

  let svg: string;
  if (!a) svg = badge("rust.learningz.xyz", "not found", "#6b7280");
  else if (!a.isPublic) svg = badge("rust.learningz.xyz", "private", "#6b7280");
  else {
    const finished = a.books.filter((b) => b.total > 0 && b.read === b.total).length;
    const parts = [a.tier ?? `${a.chapters} chapters`, finished ? `${finished} book${finished === 1 ? "" : "s"} finished` : null, a.challengeFinished ? "30-day challenge" : null];
    svg = badge("rust.learningz.xyz", parts.filter(Boolean).join(", "), a.tier ? TIER_COLOR[a.tier] : "#b5541f");
  }

  return new Response(svg, {
    status: a ? 200 : 404,
    headers: { "Content-Type": "image/svg+xml; charset=utf-8", "Cache-Control": "public, max-age=3600, s-maxage=3600" },
  });
}
