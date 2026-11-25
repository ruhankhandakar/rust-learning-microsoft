import type { Root, Element, ElementContent } from "hast";
import { slugify } from "./utils";

export type Difficulty = "starter" | "intermediate" | "challenge";

/** Top-level blocks in document order. lib/exercises.ts emits them from markdown, the plugin from hast. */
export type ExerciseEvent =
  | { kind: "heading"; text: string }
  | { kind: "para"; text: string }
  | { kind: "details"; summary: string };

export interface FoundExercise {
  slug: string;
  title: string;
  difficulty: Difficulty | null;
  /** Event the anchor lands on: the exercise heading, or the details when the summary names the exercise. */
  target: number;
  /** The details event that carries the "Mark solved" toggle. */
  details: number;
}

const NAMED = /\bExercise\b(?:\s+\d+)?\s*[:—–-]\s*(.+)/i;
const MARKER: Record<string, Difficulty> = { "🟢": "starter", "🟡": "intermediate", "🔴": "challenge" };
const STARS: Difficulty[] = ["starter", "intermediate", "challenge"];

export const exerciseAnchor = (slug: string) => `ex:${slug}`;
export const exerciseId = (bookSlug: string, chapterSlug: string, slug: string) =>
  `${bookSlug}/${chapterSlug}/${slug}`;

function cleanTitle(text: string): string {
  return text
    .replace(/\(click to expand\)/i, "")
    .replace(/★+.*$/, "")
    .replace(/\(Ch\d+\)/i, "")
    .replace(/^.*?\bExercise\b(?:\s+\d+)?\s*[:—–-]\s*/i, "")
    .replace(/\p{Extended_Pictographic}\uFE0F?/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function headingDifficulty(text: string): Difficulty | null {
  const marker = text.match(/🟢|🟡|🔴/u)?.[0];
  if (marker) return MARKER[marker];
  const stars = text.match(/★{1,3}/)?.[0].length;
  return stars ? STARS[stars - 1] : null;
}

export function findExercises(events: ExerciseEvent[]): FoundExercise[] {
  const found: FoundExercise[] = [];
  const seen = new Map<string, number>();
  let heading: { index: number; text: string; difficulty: Difficulty | null; used: boolean } | null = null;

  const add = (title: string, difficulty: Difficulty | null, target: number, details: number) => {
    const base = slugify(title) || "exercise";
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    found.push({ slug: n > 1 ? `${base}-${n}` : base, title, difficulty, target, details });
  };

  events.forEach((e, i) => {
    if (e.kind === "heading") {
      heading = { index: i, text: e.text, difficulty: headingDifficulty(e.text), used: false };
    } else if (e.kind === "para") {
      const marker = e.text.trimStart().match(/^(🟢|🟡|🔴)/u)?.[0];
      if (heading && !heading.used && !heading.difficulty && marker) heading.difficulty = MARKER[marker];
    } else if (!/\bhint\b/i.test(e.summary)) {
      const named = e.summary.match(NAMED);
      if (named) {
        add(cleanTitle(named[1]), null, i, i);
      } else if (
        /\b(exercise|solution)\b/i.test(e.summary) &&
        heading &&
        !heading.used &&
        /\bexercise\b/i.test(heading.text)
      ) {
        heading.used = true;
        add(cleanTitle(heading.text), heading.difficulty, heading.index, i);
      }
    }
  });
  return found;
}

function textOf(node: ElementContent | Element): string {
  if (node.type === "text") return node.value;
  return "children" in node ? node.children.map(textOf).join("") : "";
}

const squash = (s: string) => s.replace(/\s+/g, " ").trim();

export function hastEvents(tree: Root): { events: ExerciseEvent[]; nodes: Element[] } {
  const nodes: Element[] = [];
  const events: ExerciseEvent[] = [];
  for (const node of tree.children) {
    if (node.type !== "element") continue;
    if (/^h[1-6]$/.test(node.tagName)) events.push({ kind: "heading", text: squash(textOf(node)) });
    else if (node.tagName === "p") events.push({ kind: "para", text: squash(textOf(node)) });
    else if (node.tagName === "details") {
      const summary = node.children.find((c) => c.type === "element" && c.tagName === "summary");
      events.push({ kind: "details", summary: summary ? squash(textOf(summary)) : "" });
    } else continue;
    nodes.push(node);
  }
  return { events, nodes };
}

/** Annotates exercise <details> with data-exercise/-title and puts the anchor id on the exercise's start. */
export default function rehypeExercises() {
  return (tree: Root) => {
    const { events, nodes } = hastEvents(tree);
    for (const ex of findExercises(events)) {
      const details = nodes[ex.details];
      const target = nodes[ex.target];
      details.properties.dataExercise = ex.slug;
      details.properties.dataExerciseTitle = ex.title;
      if (target === details) {
        details.properties.id = exerciseAnchor(ex.slug);
      } else {
        const anchor: Element = {
          type: "element",
          tagName: "span",
          properties: { id: exerciseAnchor(ex.slug) },
          children: [],
        };
        tree.children.splice(tree.children.indexOf(target), 0, anchor);
      }
    }
  };
}
