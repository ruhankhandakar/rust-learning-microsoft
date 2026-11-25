"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { signIn } from "@/lib/auth-client";
import { useSessionLite } from "@/components/session-provider";
import { Checkbox } from "@/components/ui/checkbox";
import { setChallengeActive } from "@/lib/challenge-client";
import type { ChallengeProgress } from "@/lib/challenge";

const TARGETS = { chapters: 30, readingDays: 15, quizzes: 25 };
const primary =
  "inline-flex min-h-12 items-center rounded-[10px] bg-primary px-5 font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50";

async function call(body?: object): Promise<ChallengeProgress> {
  const res = await fetch("/api/challenge", body ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : undefined);
  if (!res.ok) throw new Error(String(res.status));
  return res.json();
}

function Timeline({ p }: { p: ChallengeProgress | null }) {
  const days = p?.days ?? Array.from({ length: 30 }, (_, i) => ({ day: i + 1, chapters: 0, quizzes: 0 }));
  const today = p?.status === "active" ? p.today : 0;
  const done = p?.status === "complete";
  return (
    <figure className="m-0">
      <div
        role="img"
        aria-label={p ? `${p.chapters} chapters on ${p.readingDays} days and ${p.quizzes} quizzes right so far` : "Thirty empty days"}
        className="flex h-40 items-end gap-1 sm:gap-1.5"
      >
        {days.map((d) => {
          const past = today > 0 && d.day < today;
          const built = d.chapters > 0 || d.quizzes > 0;
          const height = built ? Math.min(28 + d.chapters * 24 + d.quizzes * 10, 160) : past ? 10 : 6;
          return (
            <div
              key={d.day}
              title={built ? `Day ${d.day}: ${d.chapters} chapter(s), ${d.quizzes} quiz(zes) right` : past ? `Day ${d.day}: skipped` : `Day ${d.day}`}
              className={`flex-1 rounded-t-[4px] rounded-b-[2px] ${
                built ? (done ? "bg-emerald-500" : "bg-primary") : past ? "challenge-skip" : "bg-border"
              } ${d.day === today ? "outline-2 outline-offset-2 outline-primary/60" : ""}`}
              style={{ height }}
            />
          );
        })}
      </div>
      <div className="mt-2 flex justify-between font-mono text-xs text-muted-foreground" aria-hidden="true">
        {[1, 5, 10, 15, 20, 25, 30].map((n) => (
          <span key={n}>{n}</span>
        ))}
      </div>
    </figure>
  );
}

const RING_R = 38;
const RING_C = 2 * Math.PI * RING_R;

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
            <div className="relative size-20 sm:size-24">
              <svg viewBox="0 0 88 88" className="size-full -rotate-90" aria-hidden="true">
                <circle cx="44" cy="44" r={RING_R} fill="none" strokeWidth="7" className="stroke-border" />
                <circle
                  cx="44"
                  cy="44"
                  r={RING_R}
                  fill="none"
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray={RING_C}
                  className={`goal-ring ${ok ? "stroke-emerald-500" : "stroke-primary"}`}
                  style={{ strokeDashoffset: RING_C * (1 - Math.min(have, need) / need), opacity: have ? 1 : 0 }}
                />
              </svg>
              <span className="absolute inset-0 flex flex-col items-center justify-center leading-none">
                {ok ? (
                  <Check className="size-7 text-emerald-500" strokeWidth={3} aria-hidden="true" />
                ) : (
                  <span className="font-heading text-2xl font-bold tabular-nums sm:text-3xl">{have}</span>
                )}
                <span className="mt-1 text-xs tabular-nums text-muted-foreground">of {need}</span>
              </span>
            </div>
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

  const headline =
    !p || p.status === "none"
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
          {p && p.status !== "none" && <span>started {p.startedAt?.slice(0, 10)}</span>}
        </div>
        <Timeline p={p && p.status !== "none" ? p : null} />
        <Goals p={p} />
      </section>


      {isPending ? null : !user ? (
        <div className="flex flex-wrap items-center gap-4">
          <button type="button" className={primary} onClick={() => signIn.social({ provider: "github", callbackURL: "/challenge" })}>
            Sign in with GitHub to start
          </button>
          <span className="text-sm text-muted-foreground">Free. Progress is counted on our server, from the day you start.</span>
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
          <div className="rounded-xl border border-border p-4">
            <h2 className="mb-1 font-sans text-sm font-semibold">Rewards</h2>
            <p className="mb-3 text-sm text-muted-foreground">
              Finishing earns the challenge badge, a share card and an automatic entry in the quarterly swag draw.
            </p>
            <Checkbox checked={p.showOnWall} disabled={busy} onChange={(e) => act({ action: "wall", show: e.target.checked })}>
              Show me on the finishers wall
            </Checkbox>
          </div>
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
