"use client";

import { useEffect } from "react";
import { useProgress } from "./progress-provider";
import { enrollReview } from "@/lib/learner-store";

export function ChapterReadMarker({
  bookSlug,
  chapterSlug,
  reviewCardId,
}: {
  bookSlug: string;
  chapterSlug: string;
  reviewCardId?: string;
}) {
  const { markRead } = useProgress();

  useEffect(() => {
    const timer = setTimeout(() => {
      markRead(bookSlug, chapterSlug);
      if (reviewCardId) enrollReview(reviewCardId);
    }, 3000);
    return () => clearTimeout(timer);
  }, [bookSlug, chapterSlug, markRead, reviewCardId]);

  return null;
}
