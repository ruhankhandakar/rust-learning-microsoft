"use client";

import { useProgress } from "./progress-provider";
import { Check } from "lucide-react";

export function ChapterCheckmark({
  bookSlug,
  chapterSlug,
}: {
  bookSlug: string;
  chapterSlug: string;
}) {
  const { readSet } = useProgress();
  const isRead = readSet.has(`${bookSlug}/${chapterSlug}`);

  if (!isRead) return null;

  return (
    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-primary shrink-0">
      <Check className="h-3 w-3" />
    </span>
  );
}
