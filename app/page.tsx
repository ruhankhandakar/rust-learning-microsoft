import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";
import { BOOKS } from "@/lib/books";
import { getBookStructure } from "@/lib/content";
import { getAllQuizzes } from "@/lib/quizzes";
import { ChevronRight, Play, ListChecks, Waypoints, RotateCcw, Star, BookOpen, CalendarDays, CircleCheck, Shirt, Truck, Shuffle, Bug, GitPullRequest, ChevronDown } from "lucide-react";
import { REPO_URL, getRepoFacts, getSiteStats, getWeeklyActivity } from "@/lib/site-stats";
import { CONTENT_LAST_UPDATED } from "@/lib/version";
import { BookProgressBar } from "@/components/book-progress";
import { ContinueReading } from "@/components/continue-reading";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { RotatingWord } from "@/components/home/rotating-word";
import { CompileCard, type CompileQuestion } from "@/components/home/compile-card";
import { SectionDivider } from "@/components/home/section-divider";
import { SwagPreview } from "@/components/home/swag-preview";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
    types: { "application/rss+xml": [{ url: "/rss.xml", title: "Rust Training: what changed" }] },
  },
};


const STARTS = [
  { label: "C or C++", slug: "rust-for-cpp" },
  { label: "C#, Java or Swift", slug: "rust-for-csharp" },
  { label: "Python", slug: "rust-for-python" },
  { label: "I already know Rust", slug: "async-rust" },
];

const STAGES = [
  { name: "Bridge", dot: "bg-emerald-500 shadow-emerald-500", book: "green", slugs: ["rust-for-cpp", "rust-for-csharp", "rust-for-python"] },
  { name: "Deep Dive", dot: "bg-sky-500 shadow-sky-500", book: "blue", slugs: ["async-rust"] },
  { name: "Advanced and Expert", dot: "bg-amber-400 shadow-amber-400", book: "amber", slugs: ["rust-patterns", "type-driven-correctness"] },
  { name: "Practice and build", dot: "bg-primary shadow-primary", book: "rust", slugs: ["engineering-practices", "100-rust-projects"] },
];

const CHALLENGE = [
  [30, "chapters read", BookOpen],
  [15, "different days", CalendarDays],
  [25, "quizzes right", CircleCheck],
] as const;

const SWAG_FACTS = [
  [Shirt, "A T-shirt bundle or a sticker pack"],
  [Truck, "Shipped free within India"],
  [Shuffle, "Entry is automatic. Stars never change your odds, but they really help me keep building this."],
] as const;

const DISCORD_URL = process.env.NEXT_PUBLIC_DISCORD_URL;

const GLYPHS = ["fn", "let", "mut", "&str", "impl", "::", "->", "Ok(())", "?", "match", "Box<T>", "async", ".await", "trait", "&mut", "Vec<u8>", "unsafe", "enum", "'a", "Some(x)", "where", "dyn", "Rc<T>", "pub"];

export const revalidate = 3600;

const FEATURES = [
  { icon: Play, title: "Run every example", body: "One click sends the code to the Rust Playground and shows the output.", href: "/books/rust-for-cpp" },
  { icon: ListChecks, title: "Practice exercises", body: "exercises from the books, with solved tracking.", href: "/practice", count: "exercises" },
  { icon: Waypoints, title: "Topics across books", body: "See how each book explains ownership, traits or async.", href: "/concepts" },
  { icon: RotateCcw, title: "Spaced review", body: "What you learned comes back after 1, 3, 7 and 21 days.", href: "/review" },
] as const;

function homeQuestions(): CompileQuestion[] {
  const titles = new Map<string, string>();
  for (const book of BOOKS) {
    for (const ch of getBookStructure(book.dirName).flatChapters) titles.set(`${book.slug}/${ch.slug}`, `${book.title} · ${ch.title}`);
  }
  const short = getAllQuizzes().filter((q) => {
    const lines = q.code.split("\n");
    return lines.length <= 12 && lines.every((l) => l.length <= 64) && titles.has(`${q.bookSlug}/${q.chapterSlug}`);
  });
  const picked = [...short.filter((q) => !q.compiles).slice(0, 3), ...short.filter((q) => q.compiles).slice(0, 2)];
  return [0, 3, 1, 4, 2].flatMap((i) => picked[i] ?? []).map((q) => ({
    id: q.id,
    code: q.code,
    change: q.change,
    changedLine: q.changedLine,
    compiles: q.compiles,
    errorCode: q.errorCode,
    errorMessage: q.errorMessage,
    errorLine: q.errorLine,
    source: titles.get(`${q.bookSlug}/${q.chapterSlug}`)!,
    href: `/books/${q.bookSlug}/${q.chapterSlug}`,
  }));
}

export default async function HomePage() {
  const booksWithCounts = BOOKS.map((book) => {
    const structure = getBookStructure(book.dirName);
    return { ...book, chapterCount: structure.flatChapters.length };
  });
  const bySlug = new Map(booksWithCounts.map((b) => [b.slug, b]));
  const stats = getSiteStats();
  const questions = homeQuestions();
  const rustc = `rustc ${getAllQuizzes()[0]?.rustc ?? ""}`.trim();
  const [repo, week] = await Promise.all([getRepoFacts(), getWeeklyActivity()]);
  const weekRows = [
    ["pages read", week?.page_view],
    ["quiz answers", week?.quiz_answered],
    ["exercises solved", week?.exercise_solved],
    ["Playground runs", week?.playground_run],
  ].filter((r): r is [string, number] => (week?.page_view ?? 0) >= 1000 && typeof r[1] === "number" && r[1] > 0);
  const readout = [
    ["site licence", "MIT"],
    ["book licence", "CC BY 4.0"],
    ["synced from Microsoft", CONTENT_LAST_UPDATED.slice(0, 10)],
    ["quizzes checked by", rustc],
    ...(repo ? [["open issues", String(repo.openIssues)]] : []),
    ...weekRows.map(([k, v]) => [`${k}, last 7 days`, v.toLocaleString("en-US")]),
  ];
  const statRows = [
    [stats.books, "books and collections"],
    [stats.runnable, "examples you can run"],
    [stats.exercises, "practice exercises"],
    [stats.quizzes, "compiler-checked quizzes"],
    [stats.topics, "topics across books"],
  ] as const;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Rust Training",
    description:
      "A curated collection of free Rust programming books and tutorials. Learn Rust from beginner to advanced.",
    url: "https://rust.learningz.xyz",
    author: { "@type": "Person", name: "Ruhan Khandakar" },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: booksWithCounts.length,
      itemListElement: booksWithCounts.map((book, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "Book",
          name: book.title,
          description: book.description,
          url: `https://rust.learningz.xyz/books/${book.slug}`,
          author:
            book.slug === "100-rust-projects"
              ? {
                "@type": "Person",
                name: "Glory Praise Emmanuel",
                url: "https://github.com/emmaglorypraise",
              }
              : { "@type": "Organization", name: "Microsoft" },
          numberOfPages: book.chapterCount,
          inLanguage: "en",
          isAccessibleForFree: true,
        },
      })),
    },
  };

  return (
    <div className="flex min-h-screen flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SiteHeader />

      <section id="top" className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="glyphs pointer-events-none absolute inset-0 grid grid-cols-6 content-around p-6 font-mono text-[15px] md:grid-cols-12 [mask-image:radial-gradient(ellipse_at_70%_40%,black_10%,transparent_75%)]"
        >
          {Array.from({ length: 72 }, (_, i) => (
            <span key={i} className="justify-self-center" style={{ animationDelay: `${(i * 7) % 61 / 6.8}s` }}>
              {GLYPHS[(i * 5) % GLYPHS.length]}
            </span>
          ))}
        </div>
        <div className="relative mx-auto flex max-w-6xl flex-wrap items-center gap-12 px-4 pb-16 pt-14 sm:px-6 md:pt-20">
          <div className="min-w-0 flex-[999_1_520px]">
            <h1 className="mb-5 text-4xl font-bold leading-[1.05] tracking-[-0.03em] text-foreground sm:text-5xl lg:text-6xl">
              <span className="blur-in">Learn Rust</span>{" "}
              <span className="inline-block whitespace-nowrap">
                <span className="blur-in" style={{ animationDelay: ".12s" }}>from</span> <RotatingWord />
              </span>
            </h1>
            <p className="rise mb-8 max-w-xl text-pretty text-lg text-muted-foreground" style={{ animationDelay: ".35s" }}>
              Seven free Microsoft books and 100 projects, every quiz checked by rustc.
            </p>
            <div className="rise flex flex-wrap gap-3" style={{ animationDelay: ".5s" }}>
              <a href="#start" className="inline-flex min-h-12 items-center rounded-[10px] bg-primary px-5 font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
                Start reading
              </a>
              <a href="#practice" className="star-border inline-flex min-h-12 items-center rounded-[11px] p-px">
                <span className="inline-flex h-[46px] items-center rounded-[10px] bg-card px-5 font-semibold">Try a quiz</span>
              </a>
            </div>
          </div>

          <div id="start" className="rise min-w-0 flex-[1_1_380px]" style={{ animationDelay: ".6s" }}>
            <h2 className="mb-1 text-lg font-bold">Where are you coming from?</h2>
            <p className="mb-4 text-sm text-muted-foreground">Pick one and we&apos;ll open the right book.</p>
            <div className="flex flex-col gap-2">
              {STARTS.map((s) => {
                const book = bySlug.get(s.slug)!;
                return (
                  <Link
                    key={s.slug}
                    href={`/books/${s.slug}`}
                    className="group flex min-h-[60px] items-center justify-between gap-3 rounded-[10px] border border-border bg-card px-4 py-3 transition-colors hover:border-primary hover:bg-primary/10"
                  >
                    <span className="flex flex-col gap-0.5">
                      <span className="font-semibold text-foreground">{s.label}</span>
                      <span className="text-[13px] text-muted-foreground">
                        {book.title}, {book.chapterCount} chapters
                      </span>
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-primary transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden="true" />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section aria-label="What's inside" className="border-y border-border bg-card/50">
        <dl className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-7 sm:px-6 md:grid-cols-5">
          {statRows.map(([n, label]) => (
            <div key={label} className="flex flex-col-reverse">
              <dt className="text-sm text-muted-foreground">{label}</dt>
              <dd className="font-heading text-[34px] font-bold tabular-nums tracking-[-0.02em] text-foreground">
                <span className="sr-only">{n}</span>
                <span aria-hidden="true" className="count" style={{ "--n": n } as CSSProperties} />
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <main className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <section id="library" className="scroll-mt-4 py-16 md:py-[72px]">
          <div className="mb-8 max-w-xl empty:hidden">
            <ContinueReading />
          </div>
          <h2 className="mb-2 text-2xl font-bold tracking-[-0.02em] sm:text-3xl lg:text-[40px]">One path, from first steps to expert</h2>
          <p className="mb-8 text-muted-foreground">Start with a bridge book, then go deeper. Every book is free and works offline.</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STAGES.map((stage) => (
              <div key={stage.name} className="flex flex-col gap-3">
                <div className="flex items-center gap-2.5">
                  <span className={`h-2.5 w-2.5 rounded-full ${stage.dot}`} />
                  <h3 className="font-sans text-sm font-semibold text-muted-foreground">{stage.name}</h3>
                </div>
                {stage.slugs.map((slug) => {
                  const book = bySlug.get(slug)!;
                  return (
                    <Link
                      key={slug}
                      href={`/books/${slug}`}
                      className="group flex flex-col gap-1.5 rounded-xl border border-border bg-card p-[18px] transition-colors hover:border-primary/60"
                    >
                      <span
                        aria-hidden="true"
                        className="book -ml-1 mb-1 block h-14 w-14"
                        style={{ backgroundImage: `url(/brand/books/book-${stage.book}.webp)` }}
                      >
                        <span className="book-frame book-ajar" />
                        <span className="book-frame book-open" />
                      </span>
                      <span className="font-semibold text-foreground">{book.title}</span>
                      <span className="text-sm text-muted-foreground">{book.description}</span>
                      <span className="text-[13px] text-muted-foreground">
                        {book.chapterCount} {slug === "100-rust-projects" ? "projects" : "chapters"}
                      </span>
                      <BookProgressBar bookSlug={slug} totalChapters={book.chapterCount} />
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>
        </section>

        <SectionDivider />

        <section id="practice" className="scroll-mt-4 py-16 md:py-[72px]">
          <h2 className="mb-2 text-2xl font-bold tracking-[-0.02em] sm:text-3xl lg:text-[40px]">More than reading</h2>
          <p className="mb-8 text-muted-foreground">Every quiz is one real change to an example from the books. rustc decides the answer.</p>
          <CompileCard questions={questions} rustc={rustc} />
          <div className="mt-10 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <Link key={f.title} href={f.href} className="group flex flex-col gap-2">
                <h3 className="flex items-center gap-2 text-base font-bold group-hover:text-primary">
                  <f.icon className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  {f.title}
                </h3>
                <p className="text-sm text-muted-foreground">{"count" in f ? `${stats.exercises} ${f.body}` : f.body}</p>
              </Link>
            ))}
          </div>
        </section>

        <section id="challenge" aria-labelledby="challenge-title" className="py-16 md:py-[72px]">
          <div className="relative flex flex-wrap items-center gap-8 overflow-hidden rounded-[20px] border border-primary/45 bg-primary/5 p-6 sm:p-10">
            <span aria-hidden="true" className="backdrop-type backdrop-outline hidden sm:block -bottom-[0.5em] right-[-0.02em] text-[clamp(240px,36vw,460px)]">
              30
            </span>
            <div className="relative min-w-0 flex-[999_1_460px]">
              <h2 id="challenge-title" className="mb-3 text-2xl font-bold tracking-[-0.02em] sm:text-3xl lg:text-[40px]">The 30-Day Rust Challenge</h2>
              <p className="mb-5 max-w-xl text-muted-foreground">
                Read 30 chapters on at least 15 days and get 25 quizzes right. Finish to earn the challenge badge, a spot on the finishers wall and a chance at Rust swag each quarter.
              </p>
              <Link href="/challenge" className="inline-flex min-h-12 items-center rounded-[10px] bg-primary px-5 font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
                Start the challenge
              </Link>
            </div>
            <dl className="relative grid min-w-0 flex-[1_1_280px] grid-cols-3 gap-4">
              {CHALLENGE.map(([n, label, Icon]) => (
                <div key={label} className="flex flex-col-reverse justify-end gap-1">
                  <dt className="text-sm text-muted-foreground">{label}</dt>
                  <dd className="font-heading text-4xl font-bold tabular-nums text-foreground">{n}</dd>
                  <Icon className="mb-1 h-5 w-5 text-primary" aria-hidden="true" />
                </div>
              ))}
            </dl>
          </div>
        </section>

        <SectionDivider />

        <section id="swag" aria-labelledby="swag-title" className="py-16 md:py-[72px]">
          <div className="relative flex flex-wrap items-center gap-8 overflow-hidden rounded-[20px] border border-border bg-card/60 p-6 sm:px-10 sm:py-7">
            <span aria-hidden="true" className="backdrop-type backdrop-solid -right-[0.08em] top-1/2 -translate-y-1/2 text-[clamp(160px,26vw,340px)]">
              rs::
            </span>
            <div className="relative min-w-0 flex-[999_1_420px]">
              <h2 id="swag-title" className="mb-3 text-[22px] font-bold tracking-[-0.02em] sm:text-3xl lg:text-[40px]">
                <span className="block sm:inline lg:block">Finish the challenge.</span>{" "}
                <span className="block sm:inline lg:block">
                  Wear the <span className="text-primary">rs::</span> shirt.
                </span>
              </h2>
              <p className="mb-4 max-w-xl text-muted-foreground">Each quarter, a few people who finished the 30-Day Rust Challenge win.</p>
              <ul className="flex flex-col gap-2.5 text-sm">
                {SWAG_FACTS.map(([Icon, text]) => (
                  <li key={text} className="flex items-center gap-3">
                    <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                    {text}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative min-w-0 flex-[1_1_240px]">
              <SwagPreview />
            </div>
          </div>
        </section>

        {DISCORD_URL && (
          <>
            <SectionDivider />
            <section aria-labelledby="community-title" className="py-16 md:py-[72px]">
              <div className="flex flex-wrap items-center justify-between gap-6 rounded-2xl border border-border p-6 sm:p-8">
                <div>
                  <h2 id="community-title" className="mb-2 text-xl font-bold">Learn with others</h2>
                  <p className="text-muted-foreground">Join the Discord for questions, challenge check-ins and monthly live office hours.</p>
                </div>
                <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center rounded-[10px] border border-border px-5 font-semibold transition-colors hover:border-primary/50">
                  Join the Discord
                </a>
              </div>
            </section>
          </>
        )}

        <SectionDivider />

        <section aria-labelledby="open-source" className="py-16 md:py-[72px]">
          <div className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
            <div className="flex flex-col gap-5 bg-background p-6 sm:p-8">
              {repo ? (
                <h2 id="open-source" className="flex flex-wrap items-baseline gap-x-3 text-2xl font-bold leading-tight lg:text-[32px]">
                  <span className="text-6xl tabular-nums tracking-[-0.04em] text-foreground">{repo.stars}</span>
                  people starred this on GitHub.
                </h2>
              ) : (
                <h2 id="open-source" className="text-2xl font-bold">Built in the open on GitHub.</h2>
              )}
              <p className="max-w-md text-muted-foreground">
                Stars decide what GitHub shows people searching for a Rust course.
                {repo ? ` Yours would be number ${repo.stars + 1}.` : ""}
              </p>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
                <a
                  href={REPO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center gap-2 rounded-[10px] bg-primary px-5 font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  <Star className="h-4 w-4" aria-hidden="true" />
                  Star on GitHub
                </a>
                <a href={`${REPO_URL}/issues/new`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold hover:text-primary">
                  <Bug className="h-4 w-4" aria-hidden="true" />
                  Report a problem
                </a>
                <a href={`${REPO_URL}/blob/main/CONTRIBUTING.md`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold hover:text-primary">
                  <GitPullRequest className="h-4 w-4" aria-hidden="true" />
                  Contribute
                </a>
              </div>
            </div>
            <div className="flex flex-col gap-4 bg-card p-6 font-mono text-[13px] sm:p-8">
              <p className="text-muted-foreground">
                <span className="text-primary">$</span> rs:: --about
              </p>
              <dl className="flex flex-col gap-2">
                {readout.map(([k, v]) => (
                  <div key={k} className="flex items-baseline gap-2">
                    <dt className="text-muted-foreground">{k}</dt>
                    <span aria-hidden="true" className="min-w-4 flex-1 translate-y-[-3px] border-b border-dotted border-border" />
                    <dd className="tabular-nums text-foreground">{v}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-auto text-xs text-muted-foreground">
                Free to read, fork and reuse.{weekRows.length ? " Weekly totals are anonymous: no account, IP address or cookie." : ""}
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* FAQ */}
      <section aria-labelledby="faq-title" className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-16 sm:px-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] md:gap-12 md:py-[72px]">
        <div>
          <h2 id="faq-title" className="mb-2 text-2xl font-bold tracking-[-0.02em] sm:text-3xl lg:text-[40px]">Frequently Asked Questions</h2>
          <p className="text-muted-foreground mb-8">
            Offline reading, fonts, sign-in and what we count.
          </p>
        </div>
        <div className="border-t border-border">
          <details className="faq border-b border-border">
            <summary className="flex cursor-pointer items-center justify-between gap-4 py-4">
              <h3 className="font-semibold">Does it work offline?</h3>
              <ChevronDown className="faq-chevron h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300" aria-hidden="true" />
            </summary>
            <p className="pb-5 pr-8 text-sm text-muted-foreground">
              Yes. The site is a PWA: once you visit a book, its chapters are
              cached automatically. You can install it on your device and read
              without an internet connection.
            </p>
          </details>
          <details className="faq border-b border-border">
            <summary className="flex cursor-pointer items-center justify-between gap-4 py-4">
              <h3 className="font-semibold">Can I change the font?</h3>
              <ChevronDown className="faq-chevron h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300" aria-hidden="true" />
            </summary>
            <p className="pb-5 pr-8 text-sm text-muted-foreground">
              Open the settings menu (gear icon) to choose from five fonts and
              four size options. Your choice is saved and applies across all pages.
            </p>
          </details>
          <details className="faq border-b border-border">
            <summary className="flex cursor-pointer items-center justify-between gap-4 py-4">
              <h3 className="font-semibold">How do bookmarks work?</h3>
              <ChevronDown className="faq-chevron h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300" aria-hidden="true" />
            </summary>
            <p className="pb-5 pr-8 text-sm text-muted-foreground">
              Hover over any heading inside a chapter and click the bookmark icon.
              All your bookmarks are accessible from the settings menu. They work
              offline via your browser&apos;s local storage.
            </p>
          </details>
          <details className="faq border-b border-border">
            <summary className="flex cursor-pointer items-center justify-between gap-4 py-4">
              <h3 className="font-semibold">Why sign in with GitHub?</h3>
              <ChevronDown className="faq-chevron h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300" aria-hidden="true" />
            </summary>
            <p className="pb-5 pr-8 text-sm text-muted-foreground">
              Signing in syncs your reading progress, bookmarks, preferences,
              solved exercises, quiz answers and review schedule to the cloud, so
              they follow you across devices. Without signing in, everything is
              stored locally in your current browser.
            </p>
          </details>
          <details className="faq border-b border-border">
            <summary className="flex cursor-pointer items-center justify-between gap-4 py-4">
              <h3 className="font-semibold">Is my reading progress tracked?</h3>
              <ChevronDown className="faq-chevron h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300" aria-hidden="true" />
            </summary>
            <p className="pb-5 pr-8 text-sm text-muted-foreground">
              Chapters are automatically marked as read when you visit them. A
              progress bar on each book card shows how far you&apos;ve gone.
            </p>
          </details>
          <details className="faq border-b border-border">
            <summary className="flex cursor-pointer items-center justify-between gap-4 py-4">
              <h3 className="font-semibold">What do you count?</h3>
              <ChevronDown className="faq-chevron h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300" aria-hidden="true" />
            </summary>
            <p className="pb-5 pr-8 text-sm text-muted-foreground">
              Anonymous daily totals only: how many pages were viewed, visits,
              exercises marked solved, quiz questions answered, review cards
              graded and Playground runs.
              No account, IP address or cookie is attached to those counts.
              Cloudflare Web Analytics also measures page visits, without cookies.
            </p>
          </details>
          <details className="faq border-b border-border">
            <summary className="flex cursor-pointer items-center justify-between gap-4 py-4">
              <h3 className="font-semibold">Is this an official Microsoft site?</h3>
              <ChevronDown className="faq-chevron h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300" aria-hidden="true" />
            </summary>
            <p className="pb-5 pr-8 text-sm text-muted-foreground">
              No. It&apos;s an independent, unofficial reader built by Ruhan Khandakar. The
              books come from Microsoft&apos;s open-source RustTraining repo, but Microsoft
              doesn&apos;t run, endorse or support this site.
            </p>
          </details>
          <details className="faq border-b border-border">
            <summary className="flex cursor-pointer items-center justify-between gap-4 py-4">
              <h3 className="font-semibold">Is this free &amp; open source?</h3>
              <ChevronDown className="faq-chevron h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300" aria-hidden="true" />
            </summary>
            <p className="pb-5 pr-8 text-sm text-muted-foreground">
              The training content is from Microsoft&apos;s{" "}
              <a
                href="https://github.com/microsoft/RustTraining"
                className="text-primary underline underline-offset-2 decoration-primary/40 hover:decoration-primary"
                target="_blank"
                rel="noopener noreferrer"
              >
                RustTraining
              </a>{" "}
              repo (MIT &amp; CC BY 4.0). This website is also{" "}
              <a
                href="https://github.com/ruhankhandakar/rust-learning-microsoft"
                className="text-primary underline underline-offset-2 decoration-primary/40 hover:decoration-primary"
                target="_blank"
                rel="noopener noreferrer"
              >
                open source
              </a>.
            </p>
          </details>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
