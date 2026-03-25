import { NextResponse } from "next/server";
import { BOOKS } from "@/lib/books";
import { getBookStructure, getChapterRawContent } from "@/lib/content";

export const dynamic = "force-static";

export interface SearchEntry {
  bookSlug: string;
  bookTitle: string;
  bookIcon: string;
  chapterSlug: string;
  chapterTitle: string;
  preview: string;
}

export async function GET() {
  const entries: SearchEntry[] = [];

  for (const book of BOOKS) {
    const structure = getBookStructure(book.dirName);
    for (const ch of structure.flatChapters) {
      const raw = getChapterRawContent(book.dirName, ch.slug);
      const stripped = raw
        .replace(/^#+\s.*$/gm, "")
        .replace(/```[\s\S]*?```/g, "")
        .replace(/[`*_\[\]()#>|\\-]/g, "")
        .replace(/\n+/g, " ")
        .trim();
      const preview = stripped.slice(0, 200);

      entries.push({
        bookSlug: book.slug,
        bookTitle: book.shortTitle,
        bookIcon: book.icon,
        chapterSlug: ch.slug,
        chapterTitle: ch.title,
        preview,
      });
    }
  }

  return NextResponse.json(entries);
}
