// Usage: pnpm tsx scripts/check-chapter-links.ts — exits 1 if any in-book link points at a missing chapter or heading.
import { BOOKS } from "../lib/books";
import { getBookStructure, getChapterMarkdown } from "../lib/content";
import { slugify } from "../lib/utils";

const FENCE = /^[ \t]*```[\s\S]*?^[ \t]*```/gm;
const LINK = /(?:\]\(|href=")([^)\s"]+)/g;

const headingIds = (md: string) =>
  new Set(
    [...md.replace(FENCE, "").matchAll(/^#{1,6}\s+(.+)$/gm)].map((m) =>
      slugify(m[1].replace(/\[([^\]]*)\]\([^)]*\)/g, "$1"))
    )
  );

const chapters = new Map<string, Set<string>>();
for (const book of BOOKS) {
  for (const ch of getBookStructure(book.dirName).flatChapters) {
    chapters.set(`${book.slug}/${ch.slug}`, headingIds(getChapterMarkdown(book.dirName, ch.slug)));
  }
}

let checked = 0;
const broken: string[] = [];
for (const book of BOOKS) {
  for (const ch of getBookStructure(book.dirName).flatChapters) {
    const md = getChapterMarkdown(book.dirName, ch.slug).replace(FENCE, "").replace(/`[^`\n]*`/g, "");
    for (const [, href] of md.matchAll(LINK)) {
      if (/^[a-z]+:/i.test(href) || href.startsWith("./") || /\.(png|svg|jpe?g|gif)$/i.test(href)) continue;
      const [target, hash] = href.split("#", 2);
      const key = !target
        ? `${book.slug}/${ch.slug}`
        : target.startsWith("/books/")
          ? target.slice("/books/".length)
          : `${book.slug}/${target}`;
      checked++;
      const isBookIndex = BOOKS.some((b) => b.slug === key);
      if (isBookIndex && !hash) continue;
      const ids = chapters.get(key);
      if (!ids) broken.push(`${book.slug}/${ch.slug}: ${href} (no such chapter)`);
      else if (hash && !ids.has(hash)) broken.push(`${book.slug}/${ch.slug}: ${href} (no such heading)`);
    }
  }
}

console.log(`${checked} internal links checked, ${broken.length} broken`);
for (const b of broken) console.log(`  ${b}`);
process.exitCode = broken.length ? 1 : 0;
