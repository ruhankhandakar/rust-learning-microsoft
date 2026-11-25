import { BOOKS, getBookBySlug, type BookMeta } from "./books";
import { getBookStructure, getChapterMarkdown } from "./content";

export interface ChapterTakeaways {
  bookSlug: string;
  chapterSlug: string;
  items: string[];
}

const MARKER = /^(?:#{2,6}\s+key takeaways\b.*|\*\*key takeaways\b[^*]*\*\*:?|[-*]\s+key takeaways:)$/i;
const FENCE = /^\s*(`{3,}(?!.*`)|~{3,})/;
const ITEM = /^(\s*)(?:[-*+]|\d+[.)])\s+(.*)$/;
const BLOCK_START = /^\s*(?:#|<|\||-{3,}|\*{3,}|_{3,})/;

const indentOf = (line: string) => line.length - line.trimStart().length;

/** List items after each "Key takeaways" marker (heading, bold line or list item), blockquoted or not; nested bullets fold into their parent. */
function extractTakeaways(markdown: string): string[] {
  const lines = markdown.split("\n").map((l) => l.replace(/^\s*(?:>\s?)+/, ""));
  const items: string[] = [];
  let fence = "";

  for (let i = 0; i < lines.length; i++) {
    const mark = lines[i].match(FENCE)?.[1];
    if (fence) {
      if (mark && mark[0] === fence[0] && mark.length >= fence.length) fence = "";
      continue;
    }
    if (mark) {
      fence = mark;
      continue;
    }
    if (!MARKER.test(lines[i].trim())) continue;

    const minIndent = ITEM.test(lines[i]) ? indentOf(lines[i]) + 1 : 0;
    let base = -1;
    const start = items.length;
    for (let j = i + 1; j < lines.length; j++) {
      const line = lines[j];
      if (!line.trim()) {
        if (base === -1) continue;
        const next = lines.slice(j + 1).find((l) => l.trim());
        if (next && ITEM.test(next) && indentOf(next) >= base) continue;
        break;
      }
      const item = line.match(ITEM);
      if (base === -1) {
        if (!item || item[1].length < minIndent) break;
        base = item[1].length;
      }
      if (item && item[1].length === base) items.push(item[2]);
      else if (item && item[1].length > base) items[items.length - 1] += `; ${item[2]}`;
      else if (item || BLOCK_START.test(line)) break;
      else items[items.length - 1] += ` ${line.trim()}`;
      i = j;
    }
    for (let k = start; k < items.length; k++) items[k] = items[k].replace(/\s+/g, " ").trim();
  }
  return [...new Set(items.filter(Boolean))];
}

const cache = new Map<string, string[]>();

function chapterItems(book: BookMeta, chapterSlug: string): string[] {
  const key = `${book.slug}/${chapterSlug}`;
  let items = cache.get(key);
  if (!items) cache.set(key, (items = extractTakeaways(getChapterMarkdown(book.dirName, chapterSlug))));
  return items;
}

const microsoftBooks = () => BOOKS.filter((b) => b.slug !== "100-rust-projects");

/** Build-time only (reads content/ from disk). */
export function getAllTakeaways(): ChapterTakeaways[] {
  return microsoftBooks().flatMap((book) =>
    getBookStructure(book.dirName)
      .flatChapters.map((ch) => ({ bookSlug: book.slug, chapterSlug: ch.slug, items: chapterItems(book, ch.slug) }))
      .filter((t) => t.items.length > 0)
  );
}

export function chapterHasTakeaways(bookSlug: string, chapterSlug: string): boolean {
  const book = getBookBySlug(bookSlug);
  return !!book && book.slug !== "100-rust-projects" && chapterItems(book, chapterSlug).length > 0;
}
