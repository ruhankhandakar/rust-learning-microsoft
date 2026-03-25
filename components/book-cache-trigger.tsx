"use client";

import { useEffect } from "react";

export function BookCacheTrigger({
  bookSlug,
  chapterSlugs,
}: {
  bookSlug: string;
  chapterSlugs: string[];
}) {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.ready.then((reg) => {
      const urls = [
        `/books/${bookSlug}`,
        ...chapterSlugs.map((ch) => `/books/${bookSlug}/${ch}`),
      ];
      reg.active?.postMessage({ type: "CACHE_BOOK", urls });
    });
  }, [bookSlug, chapterSlugs]);

  return null;
}
