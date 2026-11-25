import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getImpact } from "@/lib/impact";
import { getRepoFacts } from "@/lib/site-stats";

export const revalidate = 3600;

const title = "Impact";
const description = "How people use this free Rust reader: visits, pages read, exercises, quizzes and challenge finishers, counted without cookies.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/impact" },
  openGraph: { type: "website", siteName: "Rust Training", title, description, url: "/impact" },
};

const fmt = (n: number) => n.toLocaleString("en-US");
const card = "rounded-2xl border border-border p-6";

function WeeklyVisits({ weekly }: { weekly: { week: string; visits: number }[] }) {
  const max = Math.max(...weekly.map((w) => w.visits), 1);
  return (
    <section aria-labelledby="weekly-title" className={card}>
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="weekly-title" className="text-xl font-bold">Visits per week since launch</h2>
        <span className="text-[13px] text-muted-foreground">peak {fmt(max)} a week</span>
      </div>
      <div className="flex h-[200px] items-end gap-1.5 border-b border-border" aria-hidden="true">
        {weekly.map((w) => (
          <div
            key={w.week}
            title={`Week of ${w.week}: ${fmt(w.visits)} visits`}
            className="flex-1 rounded-t-[4px] bg-primary transition-opacity hover:opacity-75"
            style={{ height: `${Math.max(2, (w.visits / max) * 100)}%` }}
          />
        ))}
      </div>
      <div className="mt-2 flex justify-between text-xs text-muted-foreground" aria-hidden="true">
        <span>{weekly[0].week}</span>
        <span>{weekly.at(-1)!.week}</span>
      </div>
      <table className="sr-only">
        <caption>Visits per week</caption>
        <thead>
          <tr>
            <th>Week of</th>
            <th>Visits</th>
          </tr>
        </thead>
        <tbody>
          {weekly.map((w) => (
            <tr key={w.week}>
              <td>{w.week}</td>
              <td>{w.visits}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export default async function ImpactPage() {
  const [impact, repo] = await Promise.all([getImpact(), getRepoFacts()]);
  const t = impact?.totals ?? {};
  const totals: [number | undefined, string, string][] = [
    [t.visit, "visits", "Site counter"],
    [t.page_view, "pages read", "Site counter"],
    [t.exercise_solved, "exercises solved", "Site counter"],
    [t.quiz_answered, "quiz answers", "Site counter"],
    [impact?.finishers, "challenge finishers", "Server-checked"],
    [repo?.stars, "GitHub stars", "GitHub"],
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 md:py-14">
        <h1 className="mb-3 text-4xl font-bold tracking-[-0.03em] sm:text-[44px]">Impact</h1>
        <p className="mb-8 max-w-2xl text-muted-foreground">
          How people use this free Rust reader{impact?.launch ? ` since counting began on ${impact.launch}` : ""}. Updated hourly. How each number is
          counted is explained at the bottom.
        </p>

        {!impact ? (
          <p className="text-muted-foreground">The numbers are unavailable right now. Try again later.</p>
        ) : (
          <div className="flex flex-col gap-8">
            <dl className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
              {totals.map(([n, label, source], i) => (
                <div key={label} className={`flex flex-col-reverse gap-0.5 rounded-[14px] border p-5 ${i === 0 ? "border-primary/50 bg-primary/[0.08]" : "border-border"}`}>
                  <span className="text-xs text-muted-foreground/80">{source}</span>
                  <dt className="text-sm text-muted-foreground">{label}</dt>
                  <dd className="font-heading text-[30px] font-bold tabular-nums">{fmt(n ?? 0)}</dd>
                </div>
              ))}
            </dl>

            {impact.weekly.length > 0 && <WeeklyVisits weekly={impact.weekly} />}

            <div className="grid gap-4 md:grid-cols-2">
              <section aria-labelledby="by-month-title" className={card}>
                <h2 id="by-month-title" className="mb-4 text-xl font-bold">30-Day Challenge by month</h2>
                {impact.challengeByMonth.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No one has started yet. <Link href="/challenge" className="text-primary hover:underline">Be the first</Link>.
                  </p>
                ) : (
                  <table className="w-full text-left text-sm">
                    <thead className="text-muted-foreground">
                      <tr>
                        <th className="pb-2 font-normal">Month</th>
                        <th className="pb-2 text-right font-normal">Started</th>
                        <th className="pb-2 text-right font-normal">Finished</th>
                        <th className="pb-2 text-right font-normal">Rate</th>
                      </tr>
                    </thead>
                    <tbody className="tabular-nums">
                      {impact.challengeByMonth.map((m) => (
                        <tr key={m.month}>
                          <td className="py-1">{m.month}</td>
                          <td className="py-1 text-right">{m.started}</td>
                          <td className="py-1 text-right">{m.finished}</td>
                          <td className="py-1 text-right">{Math.round((m.finished / m.started) * 100)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </section>
              <section aria-labelledby="helpful-title" className={card}>
                <h2 id="helpful-title" className="mb-4 text-xl font-bold">Most helpful chapters</h2>
                {impact.helpful.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Shown once chapters have at least 3 votes on &ldquo;Was this chapter helpful?&rdquo;.</p>
                ) : (
                  <ol className="flex list-decimal flex-col gap-2 pl-5 text-sm">
                    {impact.helpful.map((h) => (
                      <li key={h.href}>
                        <Link href={h.href} className="hover:text-primary">
                          {h.title}
                        </Link>
                        <span className="text-muted-foreground">
                          , {Math.round((h.yes / h.total) * 100)}% found it helpful ({h.total} votes)
                        </span>
                      </li>
                    ))}
                  </ol>
                )}
              </section>
            </div>

            {impact.quotes.length > 0 && (
              <section aria-labelledby="quotes-title">
                <h2 id="quotes-title" className="mb-4 text-2xl font-bold">What learners say</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {impact.quotes.map((q, i) => (
                    <figure key={i} className="m-0 rounded-2xl bg-card p-6">
                      <blockquote className="m-0 mb-4">&ldquo;{q.comment}&rdquo;</blockquote>
                      <figcaption className="text-sm text-muted-foreground">
                        {q.name ?? "A reader"}, {q.date}
                      </figcaption>
                    </figure>
                  ))}
                </div>
              </section>
            )}

            <section aria-labelledby="counting-title" className="rounded-2xl bg-card p-6">
              <h2 id="counting-title" className="mb-3 text-lg font-bold">How these numbers are counted</h2>
              <ul className="mb-3 flex list-disc flex-col gap-1.5 pl-5 text-sm text-muted-foreground">
                <li>Visits, pages read and learning totals are counted by this site as anonymous daily totals, without cookies, accounts or IP addresses. They are not tamper-proof.</li>
                <li>Challenge numbers count only progress our server checked.</li>
                <li>GitHub stars come from GitHub and refresh daily.</li>
              </ul>
              <p className="text-sm text-muted-foreground">Some challenge finishers enter a swag draw. Stars, reviews and testimonials are never required or rewarded.</p>
            </section>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
