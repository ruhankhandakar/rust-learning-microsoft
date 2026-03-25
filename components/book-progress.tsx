"use client";

import { useProgress } from "./progress-provider";

export function BookProgressBar({
  bookSlug,
  totalChapters,
}: {
  bookSlug: string;
  totalChapters: number;
}) {
  const { getBookProgress } = useProgress();
  const read = getBookProgress(bookSlug, totalChapters);

  if (read === 0) return null;

  const pct = Math.round((read / totalChapters) * 100);

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="shrink-0 tabular-nums">
        {read}/{totalChapters}
      </span>
    </div>
  );
}
