import fs from "fs";
import path from "path";
import { getBookBySlug } from "./books";
import { getChapterMarkdown } from "./content";
import { extractRustBlocks, hashCode } from "./rust-blocks";

type Mode = "main" | "wrap";

const DATA_FILE = path.join(process.cwd(), "data", "rust-blocks.json");
let allRunnable: Record<string, Mode> | undefined;

function loadRunnable(): Record<string, Mode> {
  allRunnable ??= fs.existsSync(DATA_FILE)
    ? (JSON.parse(fs.readFileSync(DATA_FILE, "utf-8")) as { blocks: Record<string, Mode> }).blocks
    : {};
  return allRunnable;
}

/** Playground modes for the Rust blocks in one chapter that compiled in scripts/check-rust-blocks.ts. */
export function getChapterRunnable(bookSlug: string, chapterSlug: string): Record<string, Mode> {
  const book = getBookBySlug(bookSlug);
  if (!book) return {};
  const all = loadRunnable();
  const runnable: Record<string, Mode> = {};
  for (const { code } of extractRustBlocks(getChapterMarkdown(book.dirName, chapterSlug))) {
    const hash = hashCode(code);
    if (Object.hasOwn(all, hash)) runnable[hash] = all[hash];
  }
  return runnable;
}
