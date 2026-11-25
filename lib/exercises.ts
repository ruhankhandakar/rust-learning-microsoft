import { BOOKS } from "./books";
import { getBookStructure, getChapterMarkdown } from "./content";
import {
  exerciseAnchor,
  exerciseId,
  findExercises,
  type Difficulty,
  type ExerciseEvent,
} from "./rehype-exercises";

export interface Exercise {
  id: string;
  bookSlug: string;
  chapterSlug: string;
  anchor: string;
  title: string;
  difficulty: Difficulty | null;
}

const inlineText = (md: string) =>
  md
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[`*]/g, "")
    .replace(/\s+/g, " ")
    .trim();

/** Mirrors the top-level hast blocks rehype-exercises sees: headings, paragraphs and outermost <details>. */
export function markdownEvents(markdown: string): ExerciseEvent[] {
  const events: ExerciseEvent[] = [];
  const lines = markdown.split("\n");
  let fence: string | null = null;
  let depth = 0;
  let blockStart = true;

  lines.forEach((line, i) => {
    const marker = line.match(/^\s*(`{3,}|~{3,})/)?.[1];
    if (fence) {
      if (marker && marker[0] === fence[0] && marker.length >= fence.length) {
        fence = null;
        blockStart = true;
      }
      return;
    }
    if (marker) {
      fence = marker;
      return;
    }

    const heading = line.match(/^#{1,6}\s+(.*?)(?:\s+#+)?\s*$/);
    if (depth === 0) {
      if (heading) {
        events.push({ kind: "heading", text: inlineText(heading[1]) });
      } else if (blockStart && /^(🟢|🟡|🔴)/u.test(line)) {
        events.push({ kind: "para", text: inlineText(line) });
      } else if (/^\s*<details/i.test(line)) {
        const end = lines.findIndex((l, j) => j > i && l.trim() === "");
        const block = lines.slice(i, end === -1 ? undefined : end).join("\n");
        const summary = block.match(/<summary[^>]*>([\s\S]*?)<\/summary>/i)?.[1] ?? "";
        events.push({ kind: "details", summary: inlineText(summary.replace(/<[^>]+>/g, "")) });
      }
    }
    const code = line.replace(/`[^`]*`/g, "");
    depth = Math.max(0, depth + (code.match(/<details/gi)?.length ?? 0) - (code.match(/<\/details>/gi)?.length ?? 0));
    blockStart = line.trim() === "" || !!heading;
  });
  return events;
}

let cache: Exercise[] | null = null;

/** Build-time only (reads content/ from disk). */
export function getAllExercises(): Exercise[] {
  if (cache) return cache;
  const all: Exercise[] = [];
  for (const book of BOOKS) {
    if (book.slug === "100-rust-projects") continue;
    for (const ch of getBookStructure(book.dirName).flatChapters) {
      for (const ex of findExercises(markdownEvents(getChapterMarkdown(book.dirName, ch.slug)))) {
        all.push({
          id: exerciseId(book.slug, ch.slug, ex.slug),
          bookSlug: book.slug,
          chapterSlug: ch.slug,
          anchor: exerciseAnchor(ex.slug),
          title: ex.title,
          difficulty: ex.difficulty,
        });
      }
    }
  }
  const ids = new Set<string>();
  for (const ex of all) {
    if (ids.has(ex.id)) throw new Error(`Duplicate exercise id "${ex.id}" (is a chapter listed twice in SUMMARY.md?)`);
    ids.add(ex.id);
  }
  return (cache = all);
}
