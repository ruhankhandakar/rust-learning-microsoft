"use client";

import { useEffect } from "react";

// Books excluded from offline precaching (too many chapters / too heavy).
const PRECACHE_EXCLUDED_BOOKS = new Set(["100-rust-projects"]);

export function BookCacheTrigger({
  bookSlug,
  chapterSlugs,
}: {
  bookSlug: string;
  chapterSlugs: string[];
}) {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (PRECACHE_EXCLUDED_BOOKS.has(bookSlug)) return;

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
