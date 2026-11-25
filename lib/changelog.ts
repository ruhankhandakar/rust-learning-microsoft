import fs from "fs";
import path from "path";
import { BOOKS, getBookBySlug } from "./books";
import { getBookStructure } from "./content";

interface RawFile {
  file: string;
  added: number;
  removed: number;
  status: "added" | "modified" | "deleted";
}

interface RawEntry {
  date: string;
  books: { dir: string; toc?: boolean; files: RawFile[] }[];
}

export interface ChangelogFile extends RawFile {
  title: string;
  href?: string;
}

export interface ChangelogBook {
  dir: string;
  title: string;
  slug?: string;
  tocChanged: boolean;
  files: ChangelogFile[];
}

export interface ChangelogEntry {
  date: string;
  books: ChangelogBook[];
}

let raw: RawEntry[] | undefined;
let changelog: ChangelogEntry[] | undefined;
let lastChange: Map<string, string> | undefined;

function readRaw(): RawEntry[] {
  if (!raw) {
    const file = path.join(process.cwd(), "data", "changelog.json");
    raw = fs.existsSync(file) ? (JSON.parse(fs.readFileSync(file, "utf-8")) as RawEntry[]) : [];
  }
  return raw;
}

export function formatChangeDate(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function getChangelog(): ChangelogEntry[] {
  changelog ??= readRaw().map(({ date, books }) => ({
    date,
    books: books.map(({ dir, toc, files }) => {
      const book = BOOKS.find((b) => b.dirName === dir);
      const chapters = book ? getBookStructure(dir).flatChapters : [];
      return {
        dir,
        title: book?.title ?? dir,
        slug: book?.slug,
        tocChanged: !!toc,
        files: files.map((f) => {
          const chapter = f.status === "deleted" ? undefined : chapters.find((c) => c.file === f.file);
          return {
            ...f,
            title: chapter?.title ?? f.file,
            href: chapter && `/books/${book!.slug}/${chapter.slug}`,
          };
        }),
      };
    }),
  }));
  return changelog;
}

export function getChapterLastChange(bookSlug: string, chapterSlug: string): string | undefined {
  if (!lastChange) {
    lastChange = new Map();
    for (const { date, books } of readRaw()) {
      for (const { dir, files } of books) {
        for (const { file } of files) {
          const key = `${dir}/${file}`;
          const prev = lastChange.get(key);
          if (!prev || prev < date) lastChange.set(key, date);
        }
      }
    }
  }
  const dir = getBookBySlug(bookSlug)?.dirName;
  return dir ? lastChange.get(`${dir}/${chapterSlug}.md`) : undefined;
}
