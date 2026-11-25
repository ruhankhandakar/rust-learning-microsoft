"use client";

import { Fragment, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { Check, CircleHelp, Code2, ListChecks, Trash2, X } from "lucide-react";
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

const KIND: Record<ReviewSource["kind"], { label: string; Icon: typeof ListChecks }> = {
  takeaways: { label: "Key takeaways", Icon: ListChecks },
  exercise: { label: "Exercise", Icon: Code2 },
  quiz: { label: "Does it compile?", Icon: CircleHelp },
};

export function ReviewSession(data: ReviewData) {
  const review = useLearnerStore("review");
  const now = useNow();
  if (!review || !now) return <p className="text-sm text-muted-foreground">Loading your review queue…</p>;
  return (
    <div className="flex flex-col gap-8">
      <Schedule review={review} now={now} />
      <ReviewQueue {...data} review={review} now={now} />
    </div>
  );
}

function Schedule({ review, now }: { review: Record<string, ReviewCard>; now: number }) {
  const cards = Object.values(review);
  const due = dueReviewIds(review, now).length;
  const perBox = REVIEW_INTERVAL_DAYS.map((_, i) => cards.filter((c) => Math.min(c.box, REVIEW_INTERVAL_DAYS.length - 1) === i).length);
  return (
    <section aria-label="Your review schedule" className="grid grid-cols-2 gap-3 sm:grid-cols-[1.3fr_repeat(4,1fr)]">
      <div className="col-span-2 flex flex-col justify-between gap-1 rounded-2xl border-2 border-primary bg-primary/[0.08] p-5 sm:col-span-1">
        <span className="text-sm font-semibold text-primary">Due now</span>
        <span aria-live="polite" className="font-heading text-5xl font-bold tabular-nums">
          {due}
        </span>
        <span className="text-[13px] text-muted-foreground">of {plural(cards.length, "card")} in your queue</span>
      </div>
      {REVIEW_INTERVAL_DAYS.map((days, i) => (
        <div key={days} className="flex flex-col gap-1 rounded-2xl border border-border p-5">
          <span className="text-sm text-muted-foreground">Every {plural(days, "day")}</span>
          <span className="font-heading text-3xl font-bold tabular-nums">{perBox[i]}</span>
          <div className="mt-auto flex gap-1 pt-2" aria-hidden="true">
            {REVIEW_INTERVAL_DAYS.map((_, j) => (
              <span key={j} className={`h-1.5 flex-1 rounded-full ${j <= i ? "bg-primary" : "bg-border"}`} />
            ))}
          </div>
        </div>
      ))}
    </section>
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
      {id ? (
        <div className="relative">
          {due.length > 2 && <span aria-hidden="true" className="absolute inset-x-6 -bottom-4 h-full rounded-2xl border border-border bg-card/40" />}
          {due.length > 1 && <span aria-hidden="true" className="absolute inset-x-3 -bottom-2 h-full rounded-2xl border border-border bg-card/70" />}
          <ReviewCardView key={id} id={id} box={review[id].box} source={data.cards[id]} data={data} act={act} />
        </div>
      ) : (
        <div className="flex flex-col items-start gap-3 rounded-2xl border border-dashed border-border p-8">
          <p className="font-heading text-2xl font-bold">{total === 0 ? "No cards yet" : "All caught up"}</p>
          {total === 0 ? (
            <p className="max-w-lg text-muted-foreground">Cards are added as you learn. Solve an exercise or answer a quiz and it comes back here the next day.</p>
          ) : (
            <p className="text-muted-foreground">
              The next card is due{" "}
              <time
                dateTime={new Date(next).toISOString()}
                title={new Date(next).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                className="font-semibold text-foreground"
              >
                {dueIn(next - now)}
              </time>
              .
            </p>
          )}
          <Link href="/practice" className="text-sm font-semibold text-primary hover:underline">
            Find something to practise
          </Link>
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
      <article aria-labelledby="review-front" className="relative rounded-2xl border border-border bg-card p-6 sm:p-8">
        <h2 id="review-front" className="font-heading text-xl font-bold">
          This item was removed from the book
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">The chapter changed upstream, so this card has nothing left to review.</p>
        <div className="mt-5 flex">{remove}</div>
      </article>
    );

  const chapterTitle = data.chapters[source.chapter];
  const bookTitle = data.books[source.chapter.split("/")[0]];
  const href = `/books/${source.chapter}${source.kind === "takeaways" ? "" : `#${source.anchor}`}`;
  const gotItDays = REVIEW_INTERVAL_DAYS[Math.min(box + 1, REVIEW_INTERVAL_DAYS.length - 1)];
  const { label, Icon } = KIND[source.kind];

  return (
    <article aria-labelledby="review-front" className="rise relative rounded-2xl border border-border bg-card p-6 shadow-[0_20px_40px_-24px_rgb(0_0_0/0.5)] sm:p-8">
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-2.5 py-1 font-semibold text-primary">
          <Icon className="size-4" aria-hidden="true" />
          {label}
        </span>
        <span className="text-muted-foreground">
          {chapterTitle}, {bookTitle}
        </span>
      </div>
      <h2 id="review-front" className="font-heading text-xl font-bold leading-snug sm:text-2xl">
        {source.kind === "takeaways" && `Recall the key takeaways of ${chapterTitle}`}
        {source.kind === "exercise" && `Re-solve: ${source.title}`}
        {source.kind === "quiz" && inlineMarkdown(source.change)}
      </h2>
      {source.kind !== "takeaways" && (
        <p className="mt-2 text-sm text-muted-foreground">
          <a href={href} className={linkClass}>
            {source.kind === "exercise" ? "Open the exercise" : "Open the question"}
          </a>
        </p>
      )}

      {shown && (
        <div ref={answer} tabIndex={-1} className="rise mt-5 rounded-xl bg-muted/50 p-4 text-sm leading-relaxed outline-none">
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
              <span className="font-semibold">
                {source.compiles ? "It compiles." : `It does not compile${source.errorCode ? ` (${source.errorCode})` : ""}.`}
              </span>{" "}
              <a href={href} className={linkClass}>
                Back to the question
              </a>
            </p>
          )}
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-2">
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
          Got it: back in {plural(gotItDays, "day")}. Missed: back tomorrow.
        </p>
      )}
    </article>
  );
}
