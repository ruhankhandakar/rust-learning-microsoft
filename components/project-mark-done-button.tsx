"use client";

import { useProgress } from "./progress-provider";
import { Check } from "lucide-react";

export function ProjectMarkDoneButton({
  bookSlug,
  chapterSlug,
  className = "",
}: {
  bookSlug: string;
  chapterSlug: string;
  className?: string;
}) {
  const { readSet, toggleRead } = useProgress();
  const key = `${bookSlug}/${chapterSlug}`;
  const done = readSet.has(key);

  return (
    <button
      type="button"
      onClick={() => toggleRead(bookSlug, chapterSlug)}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
        done
          ? "border-primary bg-primary/10 text-primary"
          : "border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground"
      } ${className}`}
      aria-pressed={done}
    >
      <Check className={`h-3.5 w-3.5 ${done ? "opacity-100" : "opacity-40"}`} />
      {done ? "Done" : "Mark done"}
    </button>
  );
}
