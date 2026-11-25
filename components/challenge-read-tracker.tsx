"use client";

import { useEffect } from "react";
import { reportChallenge, requestReadTicket } from "@/lib/challenge-client";

/** Counts a chapter for the challenge once its end was reached and it stayed visible long enough. */
export function ChallengeReadTracker({ bookSlug, chapterSlug }: { bookSlug: string; chapterSlug: string }) {
  useEffect(() => {
    const ref = `${bookSlug}/${chapterSlug}`;
    let cancelled = false;
    let ticket: { ticket: string; seconds: number } | null = null;
    let visibleSeconds = 0;
    let reachedEnd = false;
    let sent = false;

    const trySend = () => {
      if (sent || !ticket || !reachedEnd || visibleSeconds < ticket.seconds) return;
      sent = true;
      clearInterval(clock);
      void reportChallenge("chapter", ref, { ticket: ticket.ticket });
    };

    const clock = setInterval(() => {
      if (document.visibilityState === "visible") visibleSeconds++;
      trySend();
    }, 1000);

    const end = document.getElementById("feedback-title");
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      reachedEnd = true;
      io.disconnect();
      trySend();
    });
    if (end) io.observe(end);

    requestReadTicket(ref).then((t) => {
      if (cancelled) return;
      if (!t) {
        clearInterval(clock);
        io.disconnect();
        return;
      }
      ticket = t;
      trySend();
    });

    return () => {
      cancelled = true;
      clearInterval(clock);
      io.disconnect();
    };
  }, [bookSlug, chapterSlug]);

  return null;
}
