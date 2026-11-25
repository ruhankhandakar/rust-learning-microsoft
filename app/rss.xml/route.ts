import { formatChangeDate, getChangelog, type ChangelogEntry } from "@/lib/changelog";

export const dynamic = "force-static";

const BASE_URL = "https://rust.learningz.xyz";

const escape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

const rfc822 = (date: string) => new Date(`${date}T00:00:00Z`).toUTCString();

function describe(entry: ChangelogEntry): string {
  return entry.books
    .map((book) => {
      const items = book.files.map((f) => {
        const label = f.status === "added" ? " (new)" : f.status === "deleted" ? " (removed)" : "";
        const title = f.href ? `<a href="${escape(BASE_URL + f.href)}">${escape(f.title)}</a>` : escape(f.title);
        return `<li>${title}${label} +${f.added} −${f.removed}</li>`;
      });
      const toc = book.tocChanged ? " (table of contents changed)" : "";
      return `<p><strong>${escape(book.title)}</strong>${toc}</p>${items.length ? `<ul>${items.join("")}</ul>` : ""}`;
    })
    .join("");
}

export function GET() {
  const entries = getChangelog().slice(0, 50);
  const items = entries.map((entry) => {
    const count = entry.books.reduce((n, b) => n + b.files.length, 0);
    const link = `${BASE_URL}/changes#${entry.date}`;
    return `    <item>
      <title>${escape(`Synced on ${formatChangeDate(entry.date)}: ${count} chapter${count === 1 ? "" : "s"} changed`)}</title>
      <link>${link}</link>
      <guid isPermaLink="false">${link}</guid>
      <pubDate>${rfc822(entry.date)}</pubDate>
      <description>${escape(describe(entry))}</description>
    </item>`;
  });

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Rust Training: what changed</title>
    <link>${BASE_URL}/changes</link>
    <description>Chapters that changed upstream in Microsoft's RustTraining books (CC BY 4.0) and 100 Rust Projects, by the date this unofficial reader synced them. Not affiliated with Microsoft.</description>
    <language>en-us</language>
    <atom:link href="${BASE_URL}/rss.xml" rel="self" type="application/rss+xml" />${
      entries[0] ? `\n    <lastBuildDate>${rfc822(entries[0].date)}</lastBuildDate>` : ""
    }
${items.join("\n")}
  </channel>
</rss>
`;

  return new Response(body, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
