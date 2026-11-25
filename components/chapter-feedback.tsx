"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { signIn } from "@/lib/auth-client";
import { useSessionLite } from "@/components/session-provider";
import { Checkbox } from "@/components/ui/checkbox";

export const CHAPTER_END_EVENT = "rs:chapter-end";

interface Vote {
  id: number;
  token: string;
  helpful: boolean;
  commented?: boolean;
}

type Status = "idle" | "sending" | "error";

const choice =
  "inline-flex min-h-11 items-center gap-2 rounded-[10px] border border-border px-4 font-semibold transition-colors hover:border-primary/50 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50";

function readStored(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function subscribeStorage(cb: () => void) {
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
}

function save(key: string, vote: Vote) {
  try {
    localStorage.setItem(key, JSON.stringify(vote));
  } catch {}
}

export function ChapterFeedback({ bookSlug, chapterSlug }: { bookSlug: string; chapterSlug: string }) {
  const key = `feedback:${bookSlug}/${chapterSlug}`;
  const { user } = useSessionLite();
  const stored = useSyncExternalStore(subscribeStorage, () => readStored(key), () => null);
  const [fresh, setVote] = useState<Vote | null>(null);
  const vote = fresh ?? (stored ? (JSON.parse(stored) as Vote) : null);
  const [status, setStatus] = useState<Status>("idle");
  const [comment, setComment] = useState("");
  const [showPublic, setShowPublic] = useState(false);
  const [okToQuote, setOkToQuote] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      window.dispatchEvent(new Event(CHAPTER_END_EVENT));
    });
    io.observe(ref.current!);
    return () => io.disconnect();
  }, []);

  async function cast(helpful: boolean) {
    setStatus("sending");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookSlug, chapterSlug, helpful }),
      });
      if (!res.ok) throw new Error();
      const { id, token } = await res.json();
      const next = { id, token, helpful };
      save(key, next);
      setVote(next);
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  }

  async function send() {
    if (!vote) return;
    setStatus("sending");
    try {
      const res = await fetch("/api/feedback", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: vote.id, token: vote.token, comment, showPublic, okToQuote }),
      });
      if (!res.ok) throw new Error();
      const next = { ...vote, commented: true };
      save(key, next);
      setVote(next);
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  }

  return (
    <section ref={ref} aria-labelledby="feedback-title" className="mt-14 border-t border-border pt-8">
      <h2 id="feedback-title" className="mb-4 text-xl font-bold">
        Was this chapter helpful?
      </h2>

      {!vote ? (
        <div className="flex flex-wrap gap-2">
          <button type="button" className={choice} disabled={status === "sending"} onClick={() => cast(true)}>
            <ThumbsUp className="h-4 w-4" aria-hidden="true" />
            Yes
          </button>
          <button type="button" className={choice} disabled={status === "sending"} onClick={() => cast(false)}>
            <ThumbsDown className="h-4 w-4" aria-hidden="true" />
            Not really
          </button>
        </div>
      ) : vote.commented ? (
        <p className="text-muted-foreground" role="status">
          Thanks. Your comment was sent and will appear after review.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-muted-foreground" role="status">
            Thanks for the {vote.helpful ? "thumbs up" : "honest answer"}. Want to say more?
          </p>
          {user ? (
            <>
              <label htmlFor="feedback-comment" className="sr-only">
                Your comment
              </label>
              <textarea
                id="feedback-comment"
                rows={3}
                maxLength={2000}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={vote.helpful ? "What did this chapter help you do?" : "What was unclear or missing?"}
                className="w-full rounded-[10px] border border-border bg-card px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-primary"
              />
              <div className="flex flex-wrap gap-x-6">
                <Checkbox checked={showPublic} onChange={(e) => setShowPublic(e.target.checked)}>
                  Show publicly with my GitHub name
                </Checkbox>
                <Checkbox checked={okToQuote} onChange={(e) => setOkToQuote(e.target.checked)}>
                  OK to quote
                </Checkbox>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={send}
                  disabled={!comment.trim() || status === "sending"}
                  className="inline-flex min-h-11 items-center rounded-[10px] bg-primary px-5 font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {status === "sending" ? "Sending" : "Send comment"}
                </button>
                <span className="text-xs text-muted-foreground">Comments appear only after review.</span>
              </div>
            </>
          ) : (
            <div>
              <button
                type="button"
                onClick={() => signIn.social({ provider: "github", callbackURL: `${location.pathname}#feedback-title` })}
                className={choice}
              >
                Sign in with GitHub to add a comment
              </button>
            </div>
          )}
        </div>
      )}

      {status === "error" && (
        <p className="mt-3 text-sm text-destructive" role="alert">
          That didn&apos;t save. Try again in a moment.
        </p>
      )}
    </section>
  );
}
