"use client";

import { useEffect, useState } from "react";
import { GitHubSignIn } from "@/components/github-sign-in";
import { useSessionLite } from "@/components/session-provider";
import { ProgressRing } from "@/components/ui/progress-ring";
import { setChallengeActive } from "@/lib/challenge-client";
import type { ChallengeDay, ChallengeProgress } from "@/lib/challenge";

const TARGETS = { chapters: 30, readingDays: 15, quizzes: 25 };
const primary =
  "inline-flex min-h-12 items-center rounded-[10px] bg-primary px-5 font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50";

async function call(body?: object): Promise<ChallengeProgress> {
  const res = await fetch("/api/challenge", body ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : undefined);
  if (!res.ok) throw new Error(String(res.status));
  return res.json();
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

function dayDate(startedAt: string | null, day: number): string | null {
  if (!startedAt) return null;
  return new Date(Date.parse(startedAt.slice(0, 10)) + (day - 1) * 86_400_000).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
}

function Timeline({ p }: { p: ChallengeProgress | null }) {
  const [active, setActive] = useState<number | null>(null);
  const days = p?.days ?? Array.from({ length: 30 }, (_, i) => ({ day: i + 1, chapters: 0, quizzes: 0 }));
  const today = p?.status === "active" ? p.today : 0;
  const done = p?.status === "complete";
  const heightOf = (d: ChallengeDay) => {
    const past = today > 0 && d.day < today;
    return d.chapters > 0 || d.quizzes > 0 ? Math.min(28 + d.chapters * 24 + d.quizzes * 10, 160) : past ? 10 : 6;
  };
  const hovered = active ? days[active - 1] : null;
  const summary = (d: ChallengeDay) => {
    if (d.chapters || d.quizzes) return [plural(d.chapters, "chapter read", "chapters read"), plural(d.quizzes, "quiz right", "quizzes right")];
    if (d.day === today) return ["Today, nothing yet"];
    if (today > 0 ? d.day < today : done || p?.status === "expired") return ["Skipped"];
    return ["Not reached yet"];
  };

  return (
    <figure className="m-0">
      <div
        role="img"
        aria-label={p ? `${p.chapters} chapters on ${p.readingDays} days and ${p.quizzes} quizzes right so far` : "Thirty empty days"}
        className="relative flex h-40 items-end gap-1 sm:gap-1.5"
        onPointerLeave={() => setActive(null)}
      >
        {days.map((d) => {
          const past = today > 0 && d.day < today;
          const built = d.chapters > 0 || d.quizzes > 0;
          return (
            <div
              key={d.day}
              className="flex h-full flex-1 items-end"
              onPointerEnter={() => setActive(d.day)}
              onPointerDown={() => setActive(d.day)}
            >
              <div
                className={`w-full rounded-t-[4px] rounded-b-[2px] transition-opacity ${
                  built ? (done ? "bg-emerald-500" : "bg-primary") : past ? "challenge-skip" : "bg-border"
                } ${d.day === today ? "outline-2 outline-offset-2 outline-primary/60" : ""} ${active && active !== d.day ? "opacity-50" : ""}`}
                style={{ height: heightOf(d) }}
              />
            </div>
          );
        })}
        {hovered && p && (
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute z-10 whitespace-nowrap rounded-lg border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-lg ${
              hovered.day <= 4 ? "" : hovered.day >= 27 ? "-translate-x-full" : "-translate-x-1/2"
            }`}
            style={{ left: `${((hovered.day - (hovered.day <= 4 ? 1 : hovered.day >= 27 ? 0 : 0.5)) / days.length) * 100}%`, bottom: heightOf(hovered) + 10 }}
          >
            <p className="font-semibold">
              Day {hovered.day}
              {dayDate(p.startedAt, hovered.day) ? <span className="font-normal text-muted-foreground">, {dayDate(p.startedAt, hovered.day)}</span> : null}
            </p>
            {summary(hovered).map((line) => (
              <p key={line} className="text-muted-foreground">
                {line}
              </p>
            ))}
          </div>
        )}
      </div>
      <div className="mt-2 flex justify-between font-mono text-xs text-muted-foreground" aria-hidden="true">
        {[1, 5, 10, 15, 20, 25, 30].map((n) => (
          <span key={n}>{n}</span>
        ))}
      </div>
    </figure>
  );
}

function Goals({ p }: { p: ChallengeProgress | null }) {
  const started = p && p.status !== "none";
  const rows = [
    ["Chapters read", p?.chapters ?? 0, TARGETS.chapters],
    ["Reading days", p?.readingDays ?? 0, TARGETS.readingDays],
    ["Quizzes right", p?.quizzes ?? 0, TARGETS.quizzes],
  ] as const;
  const accuracy = p && p.quizzes + p.misses > 0 ? p.quizzes / (p.quizzes + p.misses) : null;

  return (
    <div className="mt-6 grid grid-cols-3 gap-2 border-t border-border pt-6 sm:gap-6">
      {rows.map(([label, have, need]) => {
        const ok = have >= need;
        const status = ok ? "Done" : !started ? "Not started" : p.status === "expired" ? "Missed" : "In progress";
        return (
          <div key={label} className="flex flex-col items-center gap-2 text-center">
            <ProgressRing value={have} max={need}>
              <span className="font-heading text-2xl font-bold tabular-nums sm:text-3xl">{have}</span>
              <span className="mt-1 text-xs tabular-nums text-muted-foreground">of {need}</span>
            </ProgressRing>
            <div>
              <p className="text-sm font-semibold">{label}</p>
              <p className={`text-xs ${ok ? "text-emerald-500" : status === "Missed" ? "text-red-400" : "text-muted-foreground"}`}>
                {label === "Quizzes right" && accuracy !== null ? `${Math.round(accuracy * 100)}% right, needs 70%` : status}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const FEATURES = [
  { key: "wall", label: "wall", help: "Show me on the finishers wall", on: (p: ChallengeProgress) => p.showOnWall, body: (on: boolean) => ({ action: "wall", show: on }) },
  { key: "draw", label: "draw", help: "Email me if I'm drawn for swag", on: (p: ChallengeProgress) => p.drawOptIn, body: (on: boolean) => ({ action: "draw", optIn: on }) },
] as const;

function Rewards({ p, busy, act }: { p: ChallengeProgress; busy: boolean; act: (body: object) => void }) {
  return (
    <section aria-labelledby="rewards-title" className="rounded-xl border border-border bg-[var(--code-surface)] p-4 font-mono text-[13px] leading-relaxed text-[var(--code-ink)]">
      <h2 id="rewards-title" className="font-mono text-[13px] font-normal text-[var(--syntax-comment)]">
        # Cargo.toml, rewards
      </h2>
      <p className="text-[var(--syntax-keyword)]">[features]</p>
      <p>
        default = [<span className="text-[var(--syntax-string)]">&quot;badge&quot;</span>, <span className="text-[var(--syntax-string)]">&quot;share-card&quot;</span>]
      </p>
      {FEATURES.map((f) => {
        const on = f.on(p);
        return (
          <button
            key={f.key}
            type="button"
            role="switch"
            aria-checked={on}
            aria-label={f.help}
            title={f.help}
            disabled={busy}
            onClick={() => act(f.body(!on))}
            className="-mx-1 flex w-[calc(100%+0.5rem)] items-baseline gap-2 rounded px-1 text-left transition-colors hover:bg-[var(--code-control)] focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-60"
          >
            <span className={on ? "text-emerald-500" : "text-[var(--syntax-comment)]"}>{on ? "+" : "#"}</span>
            <span className={on ? "" : "text-[var(--syntax-comment)]"}>{f.label} = []</span>
            <span className="ml-auto font-sans text-xs text-[var(--code-muted)]">{f.help}</span>
          </button>
        );
      })}
      <p className="mt-2 font-sans text-xs text-[var(--code-muted)]">
        Finishing earns the badge and a share card. Turn on <span className="font-mono">draw</span> to enter the quarterly swag draw.
      </p>
    </section>
  );
}

function BuildLog({ p }: { p: ChallengeProgress }) {
  const lines: [string, string, string][] = [["$", "cargo build --challenge", "text-muted-foreground"]];
  const lastDay = p.status === "active" ? p.today : 30;
  for (const d of p.days.slice(0, lastDay)) {
    if (d.chapters || d.quizzes) {
      lines.push(["Compiling", `day ${d.day}: ${d.chapters} chapter${d.chapters === 1 ? "" : "s"}, ${d.quizzes} quiz${d.quizzes === 1 ? "" : "zes"} right`, "text-emerald-500"]);
    } else if (d.day < lastDay) {
      lines.push(["warning:", `day ${d.day} skipped`, "text-amber-400"]);
    }
  }
  if (p.status === "complete") lines.push(["Finished", "challenge in " + (p.days.findLastIndex((d) => d.chapters || d.quizzes) + 1) + " days", "text-emerald-500"]);
  if (p.status === "expired") lines.push(["error:", "30 days passed before every test passed", "text-red-400"]);
  return (
    <div role="log" aria-label="Your challenge so far" className="max-h-64 overflow-y-auto rounded-xl border border-border bg-[var(--code-surface)] p-4 font-mono text-[13px] leading-relaxed text-[var(--code-ink)]">
      {lines.slice(-8).map(([tag, text, color], i) => (
        <div key={i} className="whitespace-pre-wrap">
          <span className={`font-semibold ${color}`}>{tag.padStart(10)}</span> {text}
        </div>
      ))}
    </div>
  );
}

const EXAMPLE_READ: Record<number, number> = { 1: 2, 2: 1, 3: 2, 5: 1, 6: 2, 8: 2, 9: 1 };
const EXAMPLE_QUIZ: Record<number, number> = { 1: 1, 3: 2, 5: 1, 6: 1, 8: 2, 9: 1 };
const EXAMPLE: ChallengeProgress = {
  enrolled: true,
  startedAt: null,
  completedAt: null,
  showOnWall: false,
  drawOptIn: false,
  status: "active",
  today: 9,
  chapters: 11,
  readingDays: 7,
  quizzes: 8,
  misses: 2,
  days: Array.from({ length: 30 }, (_, i) => ({ day: i + 1, chapters: i < 9 ? (EXAMPLE_READ[i + 1] ?? 0) : 0, quizzes: i < 9 ? (EXAMPLE_QUIZ[i + 1] ?? 0) : 0 })),
};

export function ChallengeBoard() {
  const { user, isPending } = useSessionLite();
  const [p, setP] = useState<ChallengeProgress | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!user) return;
    call()
      .then((next) => {
        setP(next);
        setChallengeActive(next.status === "active");
      })
      .catch(() => setError(true));
  }, [user]);

  async function act(body: object) {
    setBusy(true);
    setError(false);
    try {
      const next = await call(body);
      setP(next);
      setChallengeActive(next.status === "active");
    } catch {
      setError(true);
    }
    setBusy(false);
  }

  const example = !isPending && !user;
  const shown = example ? EXAMPLE : p;
  const headline = example
    ? "Thirty days. Thirty chapters."
    : !p || p.status === "none"
      ? "Thirty days. Thirty chapters."
      : p.status === "complete"
        ? "Finished. You built it."
        : p.status === "expired"
          ? "This attempt ran out of days."
          : `Day ${p.today} of 30`;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="mb-3 text-4xl font-bold tracking-[-0.03em] sm:text-5xl">{headline}</h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Read 30 chapters, on at least 15 different days, and get 25 quizzes right, all within 30 days. Skipped days are only warnings.
        </p>
        <ul className="mt-4 flex max-w-2xl flex-col gap-1 text-sm text-muted-foreground">
          <li>A chapter counts when you reach its end after reading it for a few minutes, up to 5 a day.</li>
          <li>A quiz counts after you&apos;ve read its chapter. Only your first answer counts, and 70% of them need to be right.</li>
        </ul>
      </div>

      <section aria-label="Your 30 days" className="rounded-2xl border border-border bg-card/60 p-5 sm:p-6">
        <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2 font-mono text-[13px] text-muted-foreground">
          <span>cargo build --challenge --timings</span>
          {example ? <span>example: day 9 of a learner&apos;s challenge</span> : p && p.status !== "none" && <span>started {p.startedAt?.slice(0, 10)}</span>}
        </div>
        <div className="relative">
          <Timeline p={shown && shown.status !== "none" ? shown : null} />
          {shown?.status === "complete" && (
            <div className="compiled-stamp pointer-events-none absolute right-2 top-0 flex -rotate-6 flex-col items-center rounded-xl border-[3px] border-emerald-500 px-4 py-2 font-heading text-emerald-500">
              <span className="text-2xl font-bold">Compiled</span>
              <span className="text-sm">30/30 Rustacean</span>
            </div>
          )}
        </div>
        <Goals p={shown} />
      </section>


      {isPending ? null : !user ? (
        <div className="flex flex-col gap-6">
          <BuildLog p={EXAMPLE} />
          <div className="flex flex-wrap items-center gap-4">
          <GitHubSignIn callbackURL="/challenge" />
          <span className="text-sm text-muted-foreground">Sign in to start. Free, and progress is counted on our server from the day you start.</span>
          </div>
        </div>
      ) : !p ? null : p.status === "none" || p.status === "expired" ? (
        <div className="flex flex-wrap items-center gap-4">
          <button type="button" className={primary} disabled={busy} onClick={() => act({ action: "join" })}>
            {p.status === "expired" ? "Start again" : "Start the challenge"}
          </button>
          <span className="text-sm text-muted-foreground">Day 1 starts now. Chapters read before today don&apos;t count.</span>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <BuildLog p={p} />
          <Rewards p={p} busy={busy} act={act} />
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive" role="alert">
          Couldn&apos;t load your challenge. Try again in a moment.
        </p>
      )}
    </div>
  );
}
