// Usage: pnpm tsx scripts/check-concepts.tsx — prints topic counts and exits 1 if a topic links to a heading id the
// chapter page doesn't render, or a kept topic breaks the curation rules.
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { BOOKS, getBookBySlug } from "../lib/books";
import { getBookStructure, getChapterMarkdown } from "../lib/content";
import { CONCEPT_DEFS, getAllConcepts, getConceptsForChapter, getDroppedConcepts } from "../lib/concepts";
import { slugify } from "../lib/utils";

// Same derivation as extractText + BookmarkableHeading in components/markdown-renderer.tsx.
const textOf = (node: ReactNode): string =>
  typeof node === "string" || typeof node === "number"
    ? String(node)
    : Array.isArray(node)
      ? node.map(textOf).join("")
      : node && typeof node === "object" && "props" in node
        ? textOf((node.props as { children?: ReactNode }).children)
        : "";

const components = Object.fromEntries(
  (["h1", "h2", "h3", "h4", "h5", "h6"] as const).map((Tag) => [
    Tag,
    ({ children }: { children?: ReactNode }) => <Tag id={slugify(textOf(children))}>{children}</Tag>,
  ])
) as Components;

const renderedIds = new Map<string, Set<string>>();
function idsOn(bookSlug: string, chapterSlug: string): Set<string> {
  const key = `${bookSlug}/${chapterSlug}`;
  if (!renderedIds.has(key)) {
    const html = renderToStaticMarkup(
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={components}>
        {getChapterMarkdown(getBookBySlug(bookSlug)!.dirName, chapterSlug)}
      </ReactMarkdown>
    );
    renderedIds.set(key, new Set([...html.matchAll(/<h[1-6] id="([^"]*)"/g)].map((m) => m[1])));
  }
  return renderedIds.get(key)!;
}

const concepts = getAllConcepts();
const errors: string[] = [];
let links = 0;
let noExcerpt = 0;

for (const c of concepts) {
  if (c.bookCount < 2) errors.push(`${c.slug}: only ${c.bookCount} book`);
  const words = c.summary.split(/\s+/).length;
  if (words > 25) errors.push(`${c.slug}: summary is ${words} words`);
  const perChapter = new Map<string, number>();
  for (const s of c.sections) {
    const key = `${s.bookSlug}/${s.chapterSlug}`;
    perChapter.set(key, (perChapter.get(key) ?? 0) + 1);
    if (s.bookSlug === "100-rust-projects") errors.push(`${c.slug}: links 100 Rust Projects`);
    links++;
    if (!s.excerpt) noExcerpt++;
    if (!idsOn(s.bookSlug, s.chapterSlug).has(s.headingId)) errors.push(`${c.slug}: /books/${key}#${s.headingId} not on page`);
  }
  for (const [key, n] of perChapter) if (n > 2) errors.push(`${c.slug}: ${n} sections in ${key}`);
}

let chipChapters = 0;
for (const book of BOOKS) {
  for (const ch of getBookStructure(book.dirName).flatChapters) {
    const chips = getConceptsForChapter(book.slug, ch.slug);
    if (chips.length > 4) errors.push(`${book.slug}/${ch.slug}: ${chips.length} chips`);
    if (chips.length) chipChapters++;
  }
}

const sections = concepts.reduce((n, c) => n + c.sections.length, 0);
console.log(`${concepts.length} topics kept of ${CONCEPT_DEFS.length} curated, ${sections} sections, ${chipChapters} chapters with topic chips`);
for (const c of concepts) {
  const books = [...new Set(c.sections.map((s) => s.bookSlug))].join(", ");
  console.log(`  ${c.slug}: ${c.sections.length} sections in ${c.bookCount} books (${books})`);
}
const dropped = getDroppedConcepts();
console.log(`${dropped.length} dropped${dropped.length ? ":" : ""}`);
for (const d of dropped) console.log(`  ${d.slug}: ${d.reason}`);
console.log(`${links} section links checked against rendered heading ids, ${errors.length} problems; ${noExcerpt} sections without excerpt`);
for (const e of errors) console.log(`  ${e}`);
process.exitCode = errors.length ? 1 : 0;
