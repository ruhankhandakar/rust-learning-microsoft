"use client";

import { useEffect } from "react";
import { setLastRead } from "@/lib/learner-store";

const HEADER_OFFSET = 120;
const HASH_WAIT_FRAMES = 180;

export function ReadingPosition({
  bookSlug,
  chapterSlug,
  bookTitle,
  chapterTitle,
}: {
  bookSlug: string;
  chapterSlug: string;
  bookTitle: string;
  chapterTitle: string;
}) {
  useEffect(() => {
    const save = () => {
      let current: HTMLElement | undefined;
      for (const h of document.querySelectorAll<HTMLElement>("article :is(h1,h2,h3,h4)[id]")) {
        if (h.getBoundingClientRect().top > HEADER_OFFSET) break;
        current = h;
      }
      setLastRead({
        bookSlug,
        chapterSlug,
        bookTitle,
        chapterTitle,
        headingId: current?.id,
        headingText: current?.textContent?.trim() || undefined,
        at: Date.now(),
      });
    };

    // The chapter body renders after hydration, so the browser's own jump to #hash can miss; redo it once the target exists.
    let target = window.location.hash.slice(1);
    try {
      target = decodeURIComponent(target);
    } catch {}
    let ready = !target;
    let hashFrame = 0;
    let tries = 0;
    const settleHash = () => {
      const el = document.getElementById(target);
      if (el || ++tries > HASH_WAIT_FRAMES) {
        el?.scrollIntoView();
        ready = true;
        save();
        return;
      }
      hashFrame = requestAnimationFrame(settleHash);
    };

    let frame = 0;
    const onScroll = () => {
      if (!ready) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(save);
    };

    if (ready) save();
    else hashFrame = requestAnimationFrame(settleHash);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(hashFrame);
      window.removeEventListener("scroll", onScroll);
    };
  }, [bookSlug, chapterSlug, bookTitle, chapterTitle]);

  return null;
}
