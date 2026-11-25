"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { dueReviewIds, useLearnerStore } from "@/lib/learner-store";
import { useNow } from "@/components/review-due-badge";
import { useProgress } from "@/components/progress-provider";
import { TIERS, type Achievements } from "@/lib/achievements-rules";
import { challengeOpen } from "@/lib/challenge-launch";
import type { ChallengeProgress } from "@/lib/challenge";

export interface RecentChanges {
  date: string;
  chapters: { key: string; title: string; href: string }[];
}

const card = "flex flex-col gap-2.5 rounded-2xl border border-border bg-card p-6";
const label = "text-sm font-semibold text-muted-foreground";

function Bar({ value, max }: { value: number; max: number }) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-border">
      <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, (value / max) * 100)}%` }} />
    </div>
  );
}

export function ReturningDashboard({ name, bookTotals, recent }: { name: string | null; bookTotals: Record<string, number>; recent: RecentChanges | null }) {
  const last = useLearnerStore("lastRead");
  const review = useLearnerStore("review");
  const now = useNow();
  const { readSet } = useProgress();
  const [challenge, setChallenge] = useState<ChallengeProgress | null>(null);
  const [ach, setAch] = useState<Achievements | null>(null);

  useEffect(() => {
    fetch("/api/challenge").then((r) => (r.ok ? r.json() : null)).then(setChallenge).catch(() => {});
    fetch("/api/achievements").then((r) => (r.ok ? r.json() : null)).then(setAch).catch(() => {});
  }, []);

  const due = review && now ? dueReviewIds(review, now).length : 0;
  const readInBook = (slug: string) => [...readSet].filter((k) => k.startsWith(`${slug}/`)).length;
  const updatedRead = recent?.chapters.filter((c) => readSet.has(c.key)) ?? [];
  const tierIndex = ach?.tier ? TIERS.findIndex((t) => t.name === ach.tier) : -1;
  const next = TIERS[tierIndex + 1];

  return (
    <section id="top" aria-labelledby="welcome-title" className="mx-auto max-w-6xl px-4 pb-6 pt-12 sm:px-6">
      <h1 id="welcome-title" className="mb-6 text-4xl font-bold tracking-[-0.02em]">
        Welcome back{name ? `, ${name.split(" ")[0]}` : ""}
      </h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {last ? (
          <a
            href={`/books/${last.bookSlug}/${last.chapterSlug}${last.headingId ? `#${last.headingId}` : ""}`}
            className="flex flex-col gap-2.5 rounded-2xl border-2 border-primary bg-primary/[0.08] p-6 transition-colors hover:bg-primary/[0.12] md:col-span-2"
          >
            <span className="text-sm font-semibold text-primary">Continue reading</span>
            <span className="font-heading text-2xl font-bold">{last.chapterTitle}</span>
            <span className="text-sm text-muted-foreground">
              {last.bookTitle}
              {last.headingText && last.headingText !== last.chapterTitle ? `, section "${last.headingText}"` : ""}
            </span>
            {bookTotals[last.bookSlug] ? (
              <span className="flex items-center gap-3 text-[13px] text-muted-foreground">
                <span className="flex-1">
                  <Bar value={readInBook(last.bookSlug)} max={bookTotals[last.bookSlug]} />
                </span>
                {readInBook(last.bookSlug)} of {bookTotals[last.bookSlug]} chapters
              </span>
            ) : null}
          </a>
        ) : (
          <Link href="/#library" className="flex flex-col gap-2.5 rounded-2xl border-2 border-primary bg-primary/[0.08] p-6 md:col-span-2">
            <span className="text-sm font-semibold text-primary">Start reading</span>
            <span className="font-heading text-2xl font-bold">Pick a book from the library</span>
          </Link>
        )}

        <div className={card}>
          <span className={label}>Review due</span>
          <span className="font-heading text-4xl font-bold tabular-nums">{due}</span>
          <span className="text-sm text-muted-foreground">cards from exercises, quizzes and takeaways</span>
          <Link
            href="/review"
            className="mt-1 flex min-h-11 items-center justify-center rounded-[10px] border border-border font-semibold transition-colors hover:border-primary/50"
          >
            {due ? "Start review" : "Open review"}
          </Link>
        </div>

        <div className={card}>
          {challenge && challenge.status !== "none" ? (
            <>
              <span className={label}>
                30-Day Challenge, {challenge.status === "active" ? `day ${challenge.today}` : challenge.status === "complete" ? "finished" : "ended"}
              </span>
              {(
                [
                  ["Chapters", challenge.chapters, 30],
                  ["Days read", challenge.readingDays, 15],
                  ["Quizzes right", challenge.quizzes, 25],
                ] as const
              ).map(([l, v, m]) => (
                <div key={l} className="flex flex-col gap-1">
                  <div className="flex justify-between text-sm">
                    <span>{l}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {Math.min(v, m)} / {m}
                    </span>
                  </div>
                  <Bar value={v} max={m} />
                </div>
              ))}
              <Link href="/challenge" className="text-sm font-semibold text-primary hover:underline">
                Open the challenge
              </Link>
            </>
          ) : (
            <>
              <span className={label}>30-Day Challenge</span>
              <span className="text-sm text-muted-foreground">
                {now && !challengeOpen(now)
                  ? challenge?.checkedIn
                    ? "Opens on 1 December. You're checked in for a reminder."
                    : "Opens on 1 December. 30 chapters on 15 days and 25 quizzes right."
                  : "30 chapters on 15 days and 25 quizzes right, within 30 days."}
              </span>
              <Link href="/challenge" className="text-sm font-semibold text-primary hover:underline">
                {now && !challengeOpen(now) ? (challenge?.checkedIn ? "See the countdown" : "Get a reminder") : "Start the challenge"}
              </Link>
            </>
          )}
        </div>

        <div className={card}>
          <span className={label}>Badges</span>
          <div className="flex flex-wrap gap-2">
            {ach?.tier && <span className="rounded-full border border-primary px-3 py-1.5 text-[13px] font-semibold text-primary">{ach.tier}</span>}
            {next && (
              <span className="rounded-full border border-dashed border-border px-3 py-1.5 text-[13px] text-muted-foreground">
                {next.name}: {Math.max(0, next.chapters - (ach?.chapters ?? 0))} chapters to go
              </span>
            )}
          </div>
          <Link href="/achievements" className="text-sm font-semibold text-primary hover:underline">
            See all achievements
          </Link>
        </div>

        <div className={card}>
          <span className={label}>This week upstream</span>
          <span className="text-[15px]">
            {updatedRead.length
              ? `${updatedRead.length} chapter${updatedRead.length === 1 ? "" : "s"} you've read ${updatedRead.length === 1 ? "was" : "were"} updated by Microsoft.`
              : recent
                ? `${recent.chapters.length} chapters were updated by Microsoft on ${recent.date}.`
                : "No upstream changes yet."}
          </span>
          <Link href="/changes" className="text-sm font-semibold text-primary hover:underline">
            What changed
          </Link>
        </div>
      </div>
    </section>
  );
}
