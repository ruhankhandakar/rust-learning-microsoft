"use client";

import { useState } from "react";
import { CircleCheck } from "lucide-react";
import type { Exercise } from "@/lib/exercises";
import { useLearnerStore } from "@/lib/learner-store";

type Difficulty = NonNullable<Exercise["difficulty"]>;
type Filter = "all" | "unsolved" | Difficulty;
type Item = Pick<Exercise, "id" | "anchor" | "title" | "difficulty">;

export interface PracticeBook {
  slug: string;
  title: string;
  icon: string;
  chapters: { slug: string; title: string; exercises: Item[] }[];
}

const DIFFICULTY: Record<Difficulty, { label: string; className: string }> = {
  starter: {
    label: "Starter",
    className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  },
  intermediate: {
    label: "Intermediate",
    className: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  },
  challenge: {
    label: "Challenge",
    className: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300",
  },
};

const FILTERS: [Filter, string][] = [
  ["all", "All"],
  ["unsolved", "Unsolved"],
  ...(Object.keys(DIFFICULTY) as Difficulty[]).map((d): [Filter, string] => [d, DIFFICULTY[d].label]),
];

export function PracticeList({ books }: { books: PracticeBook[] }) {
  const solved = useLearnerStore("solved");
  const [filter, setFilter] = useState<Filter>("all");
  const matches = (ex: Item) =>
    filter === "all" || (filter === "unsolved" ? !solved?.[ex.id] : ex.difficulty === filter);

  const all = books.flatMap((b) => b.chapters.flatMap((c) => c.exercises));
  const shown = all.filter(matches).length;
  const solvedCount = solved ? all.filter((ex) => solved[ex.id]).length : null;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
        <p aria-live="polite" className="text-sm font-medium">
          {solvedCount === null ? `${all.length} exercises` : `${solvedCount} of ${all.length} solved`}
          {filter !== "all" && <span className="text-muted-foreground"> · showing {shown}</span>}
        </p>
        <div role="group" aria-label="Filter exercises" className="flex flex-wrap gap-1.5">
          {FILTERS.map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                filter === value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border hover:border-primary/40 hover:text-primary"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {books.map((book) => {
        const chapters = book.chapters
          .map((ch) => ({ ...ch, exercises: ch.exercises.filter(matches) }))
          .filter((ch) => ch.exercises.length > 0);
        if (chapters.length === 0) return null;
        return (
          <section key={book.slug} aria-labelledby={`practice-${book.slug}`} className="mb-10">
            <h2 id={`practice-${book.slug}`} className="flex items-center gap-2 text-lg font-bold mb-3">
              <span aria-hidden>{book.icon}</span>
              {book.title}
            </h2>
            <div className="border border-border rounded-xl overflow-hidden divide-y divide-border">
              {chapters.map((ch) => (
                <div key={ch.slug}>
                  <h3 className="px-4 py-2 bg-muted/50 text-xs font-semibold text-muted-foreground">{ch.title}</h3>
                  <ul className="divide-y divide-border/50">
                    {ch.exercises.map((ex) => (
                      <li key={ex.id}>
                        <a
                          href={`/books/${book.slug}/${ch.slug}#${ex.anchor}`}
                          className="group flex items-center gap-3 px-4 py-2.5 hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                        >
                          <span className="flex-1 text-sm font-medium group-hover:text-primary transition-colors">
                            {ex.title}
                          </span>
                          {ex.difficulty && (
                            <span
                              className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${DIFFICULTY[ex.difficulty].className}`}
                            >
                              {DIFFICULTY[ex.difficulty].label}
                            </span>
                          )}
                          <span className="flex w-4 shrink-0 justify-center">
                            {solved?.[ex.id] && (
                              <>
                                <CircleCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden />
                                <span className="sr-only">Solved</span>
                              </>
                            )}
                          </span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        );
      })}

      {shown === 0 && <p className="text-sm text-muted-foreground">No exercises match this filter.</p>}
    </>
  );
}
