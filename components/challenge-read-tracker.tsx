"use client";

import { useEffect } from "react";
import { CHALLENGE_ACTIVE_EVENT, reportChallenge, requestReadTicket } from "@/lib/challenge-client";

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
      if (sent || !ticket || !reachedEnd || visibleSeconds < ticket.seconds + 1) return;
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

    const start = () =>
      requestReadTicket(ref).then((t) => {
        if (cancelled || !t) return;
        // The server's clock starts at the ticket, so count visible time from here.
        visibleSeconds = 0;
        ticket = t;
        trySend();
      });
    void start();
    // On a new device the sign-in sync may set the flag after this page loaded.
    window.addEventListener(CHALLENGE_ACTIVE_EVENT, start, { once: true });

    return () => {
      cancelled = true;
      window.removeEventListener(CHALLENGE_ACTIVE_EVENT, start);
      clearInterval(clock);
      io.disconnect();
    };
  }, [bookSlug, chapterSlug]);

  return null;
}
