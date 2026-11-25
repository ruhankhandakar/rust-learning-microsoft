"use client";

import { BookOpen, ChevronRight } from "lucide-react";
import { useLearnerStore } from "@/lib/learner-store";
import { useSessionLite } from "@/components/session-provider";

export function ContinueReading({ bookSlug, signedOutOnly }: { bookSlug?: string; signedOutOnly?: boolean }) {
  const last = useLearnerStore("lastRead");
  const { user } = useSessionLite();
  if (!last || (bookSlug && last.bookSlug !== bookSlug) || (signedOutOnly && user)) return null;

  const href = `/books/${last.bookSlug}/${last.chapterSlug}${last.headingId ? `#${last.headingId}` : ""}`;
  return (
    // Full navigation so the server-rendered headings exist when the browser scrolls to the hash.
    <a
      href={href}
      className="group flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm hover:bg-primary/10 transition-colors"
    >
      <BookOpen className="h-4 w-4 shrink-0 text-primary" />
      <span className="min-w-0 flex-1">
        <span className="block text-xs text-muted-foreground">
          Continue reading{bookSlug ? "" : ` · ${last.bookTitle}`}
        </span>
        <span className="block font-medium truncate">
          {last.chapterTitle}
          {last.headingText && last.headingText !== last.chapterTitle ? ` — ${last.headingText}` : ""}
        </span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary" />
    </a>
  );
}
