import fs from "fs";
import path from "path";

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

export function getChapterMarkdown(
  bookDir: string,
  chapterSlug: string
): string {
  const filePath = path.join(CONTENT_DIR, bookDir, `${chapterSlug}.md`);
  if (!fs.existsSync(filePath)) return "";
  return fs.readFileSync(filePath, "utf-8");
}

export function getChapterRawContent(
  bookDir: string,
  chapterSlug: string
): string {
  return getChapterMarkdown(bookDir, chapterSlug);
}
