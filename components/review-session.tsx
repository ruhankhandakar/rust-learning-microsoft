"use client";

import { Fragment, useRef, useState, type ReactNode } from "react";
import { Check, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNow } from "@/components/review-due-badge";
import {
  REVIEW_INTERVAL_DAYS,
  dueReviewIds,
  gradeReview,
  removeReview,
  useLearnerStore,
  type ReviewCard,
} from "@/lib/learner-store";

/** `chapter` is "<bookSlug>/<chapterSlug>"; `anchor` is the element id on that chapter page. */
type ReviewSource =
  | { kind: "takeaways"; chapter: string; items: string[] }
  | { kind: "exercise"; chapter: string; anchor: string; title: string }
  | { kind: "quiz"; chapter: string; anchor: string; change: string; compiles: boolean; errorCode?: string };

export interface ReviewData {
  books: Record<string, string>;
  chapters: Record<string, string>;
  cards: Record<string, ReviewSource>;
}

const INLINE = /(`+)(.+?)\1(?!`)|\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)\s]+)\)|\*([^*\s](?:[^*]*[^*\s])?)\*/g;
const linkClass = "underline underline-offset-2 hover:text-primary";

/** Code spans, bold, italics and absolute links as React nodes; everything else stays plain text. */
function inlineMarkdown(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(INLINE)) {
    const [whole, , code, bold, label, href, em] = m;
    const key = m.index;
    out.push(text.slice(last, key));
    if (code !== undefined)
      out.push(
        <code key={key} className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]">
          {code.trim()}
        </code>
      );
    else if (bold !== undefined) out.push(<strong key={key}>{inlineMarkdown(bold)}</strong>);
    else if (em !== undefined) out.push(<em key={key}>{inlineMarkdown(em)}</em>);
    else if (/^(\/|https?:\/\/)/.test(href))
      out.push(
        <a key={key} href={href} className={linkClass}>
          {inlineMarkdown(label)}
        </a>
      );
    else out.push(<Fragment key={key}>{inlineMarkdown(label)}</Fragment>);
    last = key + whole.length;
  }
  out.push(text.slice(last));
  return out;
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
const relative = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

function dueIn(ms: number) {
  const minutes = Math.max(1, Math.round(ms / 60_000));
  if (minutes < 60) return relative.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  return hours < 24 ? relative.format(hours, "hour") : relative.format(Math.round(hours / 24), "day");
}

export function ReviewSession(data: ReviewData) {
  const review = useLearnerStore("review");
  const now = useNow();
  return (
    <>
      <p className="mb-8 leading-relaxed text-muted-foreground">
        Cards come back after {REVIEW_INTERVAL_DAYS.slice(0, -1).join(", ")} and {REVIEW_INTERVAL_DAYS.at(-1)} days as
        you keep getting them right. Miss one and it starts again the next day.
      </p>
      {review && now ? (
        <ReviewQueue {...data} review={review} now={now} />
      ) : (
        <p className="text-sm text-muted-foreground">Loading your review queue…</p>
      )}
    </>
  );
}

function ReviewQueue({
  review,
  now,
  ...data
}: ReviewData & { review: Record<string, ReviewCard>; now: number }) {
  const region = useRef<HTMLDivElement>(null);
  const due = dueReviewIds(review, now);
  const total = Object.keys(review).length;
  const id = due[0];
  const next = Math.min(...Object.values(review).map((c) => c.due));

  const act = (fn: () => void) => {
    fn();
    requestAnimationFrame(() => region.current?.focus());
  };

  return (
    <div ref={region} tabIndex={-1} aria-label="Review queue" className="outline-none">
      <p aria-live="polite" className="mb-4 text-sm font-medium">
        {due.length > 0 ? `${due.length} due now` : "Nothing due"}
        <span className="text-muted-foreground"> · {plural(total, "card")} in your queue</span>
      </p>
      {id ? (
        <ReviewCardView key={id} id={id} box={review[id].box} source={data.cards[id]} data={data} act={act} />
      ) : (
        <div className="rounded-xl border border-border bg-card p-5 text-sm leading-relaxed">
          {total === 0 ? (
            <p>You have no review cards yet. They are added as you learn; see below for how.</p>
          ) : (
            <p>
              All caught up. The next card is due{" "}
              <time
                dateTime={new Date(next).toISOString()}
                title={new Date(next).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                className="font-medium"
              >
                {dueIn(next - now)}
              </time>
              .
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function ReviewCardView({
  id,
  box,
  source,
  data,
  act,
}: {
  id: string;
  box: number;
  source: ReviewSource | undefined;
  data: ReviewData;
  act: (fn: () => void) => void;
}) {
  const [shown, setShown] = useState(false);
  const answer = useRef<HTMLDivElement>(null);

  const remove = (
    <Button variant="ghost" size="sm" className="ml-auto text-muted-foreground" onClick={() => act(() => removeReview(id))}>
      <Trash2 aria-hidden />
      Remove card
    </Button>
  );

  if (!source)
    return (
      <article aria-labelledby="review-front" className="rounded-xl border border-border bg-card p-5">
        <h2 id="review-front" className="font-semibold">
          This item was removed from the book
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          The chapter changed upstream, so this card has nothing left to review.
        </p>
        <div className="mt-5 flex">{remove}</div>
      </article>
    );

  const chapterTitle = data.chapters[source.chapter];
  const bookTitle = data.books[source.chapter.split("/")[0]];
  const href = `/books/${source.chapter}${source.kind === "takeaways" ? "" : `#${source.anchor}`}`;
  const gotItDays = REVIEW_INTERVAL_DAYS[Math.min(box + 1, REVIEW_INTERVAL_DAYS.length - 1)];

  return (
    <article aria-labelledby="review-front" className="rounded-xl border border-border bg-card p-5">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {source.kind === "takeaways" ? "Key takeaways" : source.kind === "exercise" ? "Exercise" : "Quiz"}
      </p>
      <h2 id="review-front" className="text-lg font-semibold leading-snug">
        {source.kind === "takeaways" && `Recall the key takeaways of ${chapterTitle} (${bookTitle})`}
        {source.kind === "exercise" && `Re-solve: ${source.title}`}
        {source.kind === "quiz" && <>Does it still compile? {inlineMarkdown(source.change)}</>}
      </h2>
      {source.kind !== "takeaways" && (
        <p className="mt-1 text-sm text-muted-foreground">
          <a href={href} className={linkClass}>
            {source.kind === "exercise" ? "Open the exercise" : "Open the question"}
          </a>{" "}
          in {chapterTitle} ({bookTitle})
        </p>
      )}

      {shown && (
        <div ref={answer} tabIndex={-1} className="mt-4 border-t border-border pt-4 text-sm leading-relaxed outline-none">
          {source.kind === "takeaways" && (
            <>
              <ul className="list-disc space-y-1.5 pl-5">
                {source.items.map((item, i) => (
                  <li key={i}>{inlineMarkdown(item)}</li>
                ))}
              </ul>
              <p className="mt-3 text-muted-foreground">
                <a href={href} className={linkClass}>
                  Reread the chapter
                </a>
              </p>
            </>
          )}
          {source.kind === "exercise" && <p>Did you solve it without opening the solution?</p>}
          {source.kind === "quiz" && (
            <p>
              {source.compiles
                ? "It compiles."
                : `It does not compile${source.errorCode ? ` (${source.errorCode})` : ""}.`}{" "}
              <a href={href} className={linkClass}>
                Back to the question
              </a>
            </p>
          )}
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {shown ? (
          <>
            <Button onClick={() => act(() => gradeReview(id, true))}>
              <Check aria-hidden />
              Got it
            </Button>
            <Button variant="outline" onClick={() => act(() => gradeReview(id, false))}>
              <X aria-hidden />
              Missed
            </Button>
          </>
        ) : (
          <Button
            onClick={() => {
              setShown(true);
              requestAnimationFrame(() => answer.current?.focus());
            }}
          >
            Show answer
          </Button>
        )}
        {remove}
      </div>
      {shown && (
        <p className="mt-3 text-xs text-muted-foreground">
          Got it: next review in {plural(gotItDays, "day")}. Missed: back to {plural(REVIEW_INTERVAL_DAYS[0], "day")}.
        </p>
      )}
    </article>
  );
}
