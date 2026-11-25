import fs from "fs";
import path from "path";
import { BOOKS } from "./books";
import { slugify } from "./utils";

const CONTENT_DIR = path.join(process.cwd(), "content");

export interface ChapterEntry {
  title: string;
  slug: string;
  file: string;
  children: ChapterEntry[];
}

export interface Part {
  title: string;
  chapters: ChapterEntry[];
}

export interface BookStructure {
  introduction: ChapterEntry | null;
  parts: Part[];
  flatChapters: ChapterEntry[];
}

function fileToSlug(file: string): string {
  return file.replace(/\.md$/, "");
}

function parseSummary(summaryContent: string): BookStructure {
  const lines = summaryContent.split("\n");
  const parts: Part[] = [];
  let introduction: ChapterEntry | null = null;
  let currentPart: Part | null = null;
  let lastTopChapter: ChapterEntry | null = null;

  for (const line of lines) {
    const trimmed = line.trimEnd();

    if (/^#\s+(?!Summary)/.test(trimmed) && !trimmed.startsWith("# Summary")) {
      const partTitle = trimmed.replace(/^#+\s*/, "");
      currentPart = { title: partTitle, chapters: [] };
      parts.push(currentPart);
      lastTopChapter = null;
      continue;
    }

    const standaloneMatch = trimmed.match(/^\[([^\]]+)\]\(([^)]+\.md)\)/);
    if (standaloneMatch) {
      const entry: ChapterEntry = {
        title: standaloneMatch[1],
        slug: fileToSlug(standaloneMatch[2]),
        file: standaloneMatch[2],
        children: [],
      };
      if (!introduction) {
        introduction = entry;
      } else if (currentPart) {
        currentPart.chapters.push(entry);
        lastTopChapter = entry;
      }
      continue;
    }

    const topMatch = trimmed.match(/^- \[([^\]]+)\]\(([^)]+\.md)\)/);
    if (topMatch) {
      const entry: ChapterEntry = {
        title: topMatch[1],
        slug: fileToSlug(topMatch[2]),
        file: topMatch[2],
        children: [],
      };
      if (currentPart) {
        currentPart.chapters.push(entry);
      } else {
        if (!parts.length) {
          parts.push({ title: "", chapters: [] });
        }
        parts[parts.length - 1].chapters.push(entry);
      }
      lastTopChapter = entry;
      continue;
    }

    const subMatch = trimmed.match(/^\s+- \[([^\]]+)\]\(([^)]+\.md)\)/);
    if (subMatch && lastTopChapter) {
      lastTopChapter.children.push({
        title: subMatch[1],
        slug: fileToSlug(subMatch[2]),
        file: subMatch[2],
        children: [],
      });
    }
  }

  const flatChapters: ChapterEntry[] = [];
  if (introduction) flatChapters.push(introduction);
  for (const part of parts) {
    for (const ch of part.chapters) {
      flatChapters.push(ch);
      for (const sub of ch.children) {
        flatChapters.push(sub);
      }
    }
  }

  return { introduction, parts, flatChapters };
}

export function getBookStructure(bookDir: string): BookStructure {
  const summaryPath = path.join(CONTENT_DIR, bookDir, "SUMMARY.md");
  const content = fs.readFileSync(summaryPath, "utf-8");
  return parseSummary(content);
}

const BOOK_SLUG_BY_DIR = new Map(BOOKS.map((b) => [b.dirName, b.slug]));

// Upstream mdBook links (`ch02-x.md#Anchor`, `../../async-book/src/ch04.md`, `../async-book/`) → site routes.
export function rewriteChapterHref(href: string): string {
  const [target, fragment] = href.split("#", 2);
  const hash = fragment ? `#${slugify(fragment)}` : "";
  if (!target) return hash || href;

  const crossBook = target.match(/^(?:\.\.\/)+([\w-]+)\/(?:src\/)?(.*)$/);
  if (crossBook && BOOK_SLUG_BY_DIR.has(crossBook[1])) {
    const page = crossBook[2].replace(/\.(md|html)$/, "").replace(/\/$/, "");
    const bookUrl = `/books/${BOOK_SLUG_BY_DIR.get(crossBook[1])}`;
    return !page || page.toLowerCase() === "summary" ? bookUrl : `${bookUrl}/${page}${hash}`;
  }

  const sibling = target.match(/^(?:\.\/)?([\w-]+)\.md$/);
  return sibling ? `${sibling[1]}${hash}` : href;
}

function rewriteChapterLinks(markdown: string): string {
  return markdown
    .split(/(^[ \t]*```[\s\S]*?^[ \t]*```)/m)
    .map((part, i) =>
      i % 2
        ? part
        : part.replace(/(\]\(|href=")([^)\s"]+)/g, (_, pre, href) => pre + rewriteChapterHref(href))
    )
    .join("");
}

export function getChapterMarkdown(
  bookDir: string,
  chapterSlug: string
): string {
  const filePath = path.join(CONTENT_DIR, bookDir, `${chapterSlug}.md`);
  if (!fs.existsSync(filePath)) return "";
  return rewriteChapterLinks(fs.readFileSync(filePath, "utf-8"));
}

export function getChapterRawContent(
  bookDir: string,
  chapterSlug: string
): string {
  return getChapterMarkdown(bookDir, chapterSlug);
}
