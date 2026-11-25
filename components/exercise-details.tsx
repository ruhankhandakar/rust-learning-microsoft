"use client";

import type { ComponentProps } from "react";
import type { ExtraProps } from "react-markdown";
import { Circle, CircleCheck } from "lucide-react";
import { exerciseId } from "@/lib/rehype-exercises";
import { toggleSolved, useLearnerStore } from "@/lib/learner-store";

export function ExerciseDetails({
  node,
  bookSlug,
  chapterSlug,
  ...rest
}: ComponentProps<"details"> & ExtraProps & { bookSlug: string; chapterSlug: string }) {
  const slug = node?.properties.dataExercise;
  if (typeof slug !== "string") return <details {...rest} />;
  return (
    <>
      <details {...rest} />
      <SolvedToggle
        id={exerciseId(bookSlug, chapterSlug, slug)}
        title={String(node?.properties.dataExerciseTitle ?? "")}
      />
    </>
  );
}

function SolvedToggle({ id, title }: { id: string; title: string }) {
  const solvedMap = useLearnerStore("solved");
  const solved = !!solvedMap?.[id];
  return (
    <div className="flex justify-end mt-2 mb-6">
      <button
        type="button"
        onClick={() => toggleSolved(id)}
        disabled={solvedMap === null}
        aria-pressed={solvedMap === null ? undefined : solved}
        aria-label={`Mark "${title}" solved`}
        className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60 ${
          solved
            ? "border-emerald-500/40 bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
            : "border-border text-muted-foreground hover:border-primary/40 hover:text-primary"
        }`}
      >
        {solved ? <CircleCheck className="h-3.5 w-3.5" aria-hidden /> : <Circle className="h-3.5 w-3.5" aria-hidden />}
        {solved ? "Solved" : "Mark solved"}
      </button>
    </div>
  );
}
