"use client";

import { useEffect } from "react";
import { useProgress } from "./progress-provider";

export function ChapterReadMarker({
  bookSlug,
  chapterSlug,
}: {
  bookSlug: string;
  chapterSlug: string;
}) {
  const { markRead } = useProgress();

  useEffect(() => {
    const timer = setTimeout(() => {
      markRead(bookSlug, chapterSlug);
    }, 3000);
    return () => clearTimeout(timer);
  }, [bookSlug, chapterSlug, markRead]);

  return null;
}
