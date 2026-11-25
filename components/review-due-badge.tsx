"use client";

import { useSyncExternalStore } from "react";
import { dueReviewIds, useLearnerStore } from "@/lib/learner-store";

let now = 0;

function subscribeClock(cb: () => void) {
  const tick = () => {
    now = Date.now();
    cb();
  };
  now = Date.now();
  const id = setInterval(tick, 60_000);
  window.addEventListener("focus", tick);
  document.addEventListener("visibilitychange", tick);
  return () => {
    clearInterval(id);
    window.removeEventListener("focus", tick);
    document.removeEventListener("visibilitychange", tick);
  };
}

/** Wall-clock time refreshed every minute and on focus; 0 during SSR and hydration. */
export function useNow(): number {
  return useSyncExternalStore(subscribeClock, () => now || (now = Date.now()), () => 0);
}

export function ReviewDueBadge() {
  const review = useLearnerStore("review");
  const time = useNow();
  const due = review && time ? dueReviewIds(review, time).length : 0;
  if (!due) return null;
  return (
    <span className="rounded-full bg-primary px-1.5 text-[11px] font-semibold leading-4 tabular-nums text-primary-foreground">
      {due}
      <span className="sr-only"> {due === 1 ? "card" : "cards"} due</span>
    </span>
  );
}
