"use client";

import { useEffect, useState, type CSSProperties, type PointerEvent } from "react";
import { Check, Copy } from "lucide-react";
import { GitHubSignIn } from "@/components/github-sign-in";
import { useSessionLite } from "@/components/session-provider";
import { Checkbox } from "@/components/ui/checkbox";
import { TIERS, meetsTier, type Achievements, type Tier } from "@/lib/achievements-rules";

const SITE = "https://rust.learningz.xyz";
type Data = Achievements & { id: string };

const EXAMPLE: Data = {
  id: "",
  name: "example-learner",
  chapters: 22,
  booksStarted: 2,
  quizzesRight: 14,
  quizzesAnswered: 17,
  accuracy: 14 / 17,
  tier: "Bronze",
  books: [
    { slug: "rust-for-python", title: "Rust for Python Programmers", read: 18, total: 18 },
    { slug: "rust-for-csharp", title: "Rust for C# Programmers", read: 4, total: 38 },
    { slug: "rust-for-cpp", title: "Rust for C/C++ Programmers", read: 0, total: 33 },
    { slug: "async-rust", title: "Async Rust", read: 0, total: 18 },
    { slug: "rust-patterns", title: "Rust Patterns", read: 0, total: 20 },
    { slug: "type-driven-correctness", title: "Type-Driven Correctness", read: 0, total: 19 },
    { slug: "engineering-practices", title: "Rust Engineering Practices", read: 0, total: 14 },
  ],
  challengeFinished: null,
  isPublic: true,
  since: null,
};

async function call(body?: object): Promise<Data> {
  const res = await fetch("/api/achievements", body ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : undefined);
  if (!res.ok) throw new Error(String(res.status));
  return res.json();
}

function tierProgress(a: Achievements | null, t: Tier): number {
  if (!a) return 0;
  const parts = [a.chapters / t.chapters, t.quizzes ? a.quizzesRight / t.quizzes : 1, t.books > 1 ? a.booksStarted / t.books : 1];
  return Math.min(1, ...parts);
}

function tierStatus(a: Achievements | null, t: Tier): string {
  if (!a) return t.rule;
  if (meetsTier(a, t)) return "Earned";
  if (a.chapters < t.chapters) return `${a.chapters} of ${t.chapters} chapters`;
  if (t.books > 1 && a.booksStarted < t.books) return `${a.booksStarted} of ${t.books} books`;
  if (a.quizzesRight < t.quizzes) return `${a.quizzesRight} of ${t.quizzes} quizzes`;
  return `Accuracy ${Math.round(a.accuracy * 100)}%, needs ${Math.round(t.accuracy * 100)}%`;
}

const tierColor = (tier: string | null) => (tier ? `var(--tier-${tier.toLowerCase()})` : "var(--primary)");

function Medal({ size }: { size: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 64 64">
      <circle cx="32" cy="32" r="28" strokeWidth="3" style={{ fill: "color-mix(in oklch, var(--tc) 20%, transparent)", stroke: "var(--tc)" }} />
      <path d="M32 16l4.7 9.6 10.6 1.5-7.7 7.5 1.8 10.5L32 40l-9.4 5.1 1.8-10.5-7.7-7.5 10.6-1.5z" style={{ fill: "var(--tc)" }} />
    </svg>
  );
}

function BadgePreview({ tier, name }: { tier: Tier; name: string }) {
  return (
    <div
      className="tier-card relative flex h-[200px] w-[150px] flex-col justify-between overflow-hidden rounded-2xl border p-4 shadow-[0_20px_40px_-16px_rgb(0_0_0/0.6)]"
      style={{ "--tc": tierColor(tier.name) } as CSSProperties}
    >
      <span aria-hidden="true" className="tier-sheen pointer-events-none absolute inset-0" />
      <p className="relative text-xs text-muted-foreground">Your badge</p>
      <div className="relative">
        <Medal size={40} />
        <p className="mt-1.5 font-heading text-xl font-bold text-foreground">{tier.name}</p>
        <p className="text-xs" style={{ color: "var(--tc)" }}>
          {tier.name === "Gold" ? "Rustacean" : "Rustacean in progress"}
        </p>
      </div>
      <p className="relative truncate font-mono text-[10px] text-muted-foreground">{name}</p>
    </div>
  );
}

function TierCard({ a, image }: { a: Data; image?: string | null }) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const move = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    setTilt({ y: ((e.clientX - r.left) / r.width - 0.5) * 20, x: -((e.clientY - r.top) / r.height - 0.5) * 20 });
  };
  return (
    <div className="[perspective:900px]">
      <div
        onPointerMove={move}
        onPointerLeave={() => setTilt({ x: 0, y: 0 })}
        className="tier-card relative flex h-[340px] w-[260px] flex-col justify-between overflow-hidden rounded-[20px] border p-6 shadow-[0_30px_60px_-20px_rgb(0_0_0/0.6)] transition-transform duration-150 ease-out motion-reduce:transition-none"
        style={{ transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`, "--tc": tierColor(a.tier) } as CSSProperties}
      >
        <span aria-hidden="true" className="tier-sheen pointer-events-none absolute inset-0" />
        <p className="relative text-sm text-muted-foreground">Current tier</p>
        <div className="relative">
          <Medal size={64} />
          <p className="mt-2 font-heading text-3xl font-bold text-foreground">{a.tier ?? "Not yet"}</p>
          <p className="text-sm" style={{ color: "var(--tc)" }}>
            {a.tier === "Gold" ? "Rustacean" : "Rustacean in progress"}
          </p>
        </div>
        <div className="relative flex min-w-0 items-center gap-2.5">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt="" width={32} height={32} className="size-8 shrink-0 rounded-full" style={{ boxShadow: "0 0 0 2px var(--tc)" }} />
          ) : (
            <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold" style={{ boxShadow: "0 0 0 2px var(--tc)", background: "color-mix(in oklab, var(--tc) 20%, var(--card))" }}>
              {a.name.slice(0, 1).toUpperCase()}
            </span>
          )}
          <p className="min-w-0 truncate font-mono text-[11px] text-muted-foreground">
            {a.name}
            {a.since ? <><br />since {a.since.slice(0, 10)}</> : null}
          </p>
        </div>
      </div>
    </div>
  );
}

export function AchievementsBoard() {
  const { user, isPending } = useSessionLite();
  const [a, setA] = useState<Data | null>(null);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
    call().then(setA).catch(() => setError(true));
  }, [user]);

  const example = !isPending && !user;
  const d = a ?? (example ? EXAMPLE : null);
  const markdown = d ? `[![Rust Training](${SITE}/badge/${a ? a.id : "your-id"}.svg)](${SITE})` : "";

  return (
    <div className="flex flex-col gap-12">
      <section className="flex flex-wrap items-center gap-10">
        <div className="min-w-0 flex-[999_1_480px]">
          <h1 className="mb-3 text-4xl font-bold tracking-[-0.03em] sm:text-5xl">Your achievements</h1>
          <p className="max-w-xl text-lg text-muted-foreground">
            Badges are earned from chapters the site saw you read and quizzes it graded. They show learning progress; they are not a certificate.
          </p>
          {example && (
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <GitHubSignIn callbackURL="/achievements" />
              <span className="text-sm text-muted-foreground">Sign in to track your own. Until then this page shows an example learner.</span>
            </div>
          )}
        </div>
        {d && (
          <div className="flex flex-[1_1_300px] justify-center">
            <TierCard a={d} image={a ? user?.image : null} />
          </div>
        )}
      </section>

      <section aria-label="Tiers" className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {TIERS.map((t) => {
          const pct = tierProgress(d, t);
          const earned = !!d && meetsTier(d, t);
          return (
            <div
              key={t.name}
              tabIndex={0}
              className="group relative flex flex-col rounded-[14px] border border-border p-5 outline-none focus-visible:ring-2 focus-visible:ring-ring"
              style={{ "--tc": tierColor(t.name), ...(earned ? { borderColor: "color-mix(in oklch, var(--tc) 60%, transparent)", background: "color-mix(in oklch, var(--tc) 8%, transparent)" } : {}) } as CSSProperties}
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-3 -translate-x-1/2 translate-y-1 opacity-0 transition-[opacity,transform] duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 motion-reduce:transition-none"
              >
                <BadgePreview tier={t} name={d?.name ?? "you"} />
              </div>
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
                <span className={earned ? "" : "opacity-45 grayscale-[0.4]"}>
                  <Medal size={28} />
                </span>
                <p className="font-bold">{t.name}</p>
                {earned && (
                  <span className="ml-auto rounded-full px-2 py-0.5 text-xs font-semibold" style={{ color: "var(--tc)", background: "color-mix(in oklab, var(--tc) 16%, transparent)" }}>
                    Earned
                  </span>
                )}
              </div>
              <p className="mt-1 text-[13px] text-muted-foreground">{t.rule}</p>
              <div className="mt-auto pt-3">
                <div className="h-1.5 overflow-hidden rounded-full bg-border">
                  <div className="goal-bar h-full origin-left rounded-full" style={{ transform: `scaleX(${pct})`, background: "var(--tc)" }} />
                </div>
                {!earned && <p className="mt-2 text-[13px] font-semibold tabular-nums text-muted-foreground">{tierStatus(d, t)}</p>}
              </div>
            </div>
          );
        })}
      </section>

      {d && (
        <>
          <section aria-labelledby="books-title">
            <h2 id="books-title" className="mb-4 text-2xl font-bold">Book badges</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {d.books.map((b) => {
                const done = b.total > 0 && b.read === b.total;
                return (
                  <div key={b.slug} className="flex items-center gap-3.5 rounded-xl border border-border px-4 py-3.5">
                    <span
                      aria-hidden="true"
                      className={`size-10 shrink-0 rounded-full ${done ? "medal-done" : ""}`}
                      style={done ? undefined : { background: `conic-gradient(var(--primary) ${Math.round((b.read / Math.max(b.total, 1)) * 360)}deg, var(--border) 0)` }}
                    />
                    <div className="min-w-0">
                      <p className="font-semibold">{b.title}</p>
                      <p className="text-[13px] text-muted-foreground">{done ? "Finished" : b.read ? `${b.read} of ${b.total} chapters` : "Not started"}</p>
                    </div>
                  </div>
                );
              })}
              <div className="flex items-center gap-3.5 rounded-xl border border-border px-4 py-3.5">
                <span aria-hidden="true" className={`size-10 shrink-0 rounded-full ${d.challengeFinished ? "medal-done" : "bg-border"}`} />
                <div className="min-w-0">
                  <p className="font-semibold">30-Day Rust Challenge</p>
                  <p className="text-[13px] text-muted-foreground">{d.challengeFinished ? `Finished ${d.challengeFinished.slice(0, 10)}` : "Not finished yet"}</p>
                </div>
              </div>
            </div>
          </section>

          <section aria-labelledby="badge-title" className="flex flex-wrap items-center gap-7 rounded-2xl border border-border bg-card p-7">
            <div className="min-w-0 flex-[1_1_320px]">
              <h2 id="badge-title" className="mb-2 text-[22px] font-bold">Show it on your GitHub profile</h2>
              <p className="mb-4 text-sm text-muted-foreground">A live badge that updates as you progress. Only shown if you make your profile public.</p>
              {a ? (
                // eslint-disable-next-line @next/next/no-img-element -- a live SVG from our own route, shown as it will appear on GitHub
                <img src={`/badge/${a.id}.svg?v=${a.isPublic ? 1 : 0}`} alt="Your Rust Training badge" height={20} className="h-5 w-auto" />
              ) : (
                <span className="inline-flex overflow-hidden rounded-[4px] font-[Verdana,sans-serif] text-xs text-white">
                  <span className="bg-[#3a3d44] px-2 py-1">rust.learningz.xyz</span>
                  <span className="bg-[#b5541f] px-2 py-1">Bronze, 1 book finished</span>
                </span>
              )}
              <Checkbox
                className="mt-3"
                checked={d.isPublic}
                disabled={!a}
                onChange={(e) => call({ action: "public", value: e.target.checked }).then(setA).catch(() => setError(true))}
              >
                Make my profile and badge public (16+)
              </Checkbox>
            </div>
            <div className="relative min-w-0 flex-[1_1_420px]">
              <pre className="m-0 whitespace-pre-wrap break-all rounded-[10px] border border-[var(--code-border)] bg-[var(--code-surface)] p-3.5 pr-14 font-mono text-[13px] text-[var(--code-ink)]">{markdown}</pre>
              <button
                type="button"
                aria-label={copied ? "Copied" : "Copy Markdown"}
                title={copied ? "Copied" : "Copy Markdown"}
                onClick={() =>
                  navigator.clipboard.writeText(markdown).then(() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  })
                }
                className={`absolute right-2 top-2 flex size-9 items-center justify-center rounded-lg border transition-colors focus-visible:outline-2 focus-visible:outline-ring ${
                  copied
                    ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-500"
                    : "border-[var(--code-control-border)] bg-[var(--code-control)] text-[var(--code-control-ink)] hover:text-[var(--code-ink-strong)]"
                }`}
              >
                {copied ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
              </button>
            </div>
          </section>
        </>
      )}

      {error && (
        <p className="text-sm text-destructive" role="alert">
          Couldn&apos;t load your achievements. Try again in a moment.
        </p>
      )}
    </div>
  );
}
