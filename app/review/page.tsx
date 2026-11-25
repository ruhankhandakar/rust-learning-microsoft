import type { Metadata } from "next";
import Link from "next/link";
import { BOOKS } from "@/lib/books";
import { getBookStructure } from "@/lib/content";
import { getAllExercises } from "@/lib/exercises";
import { getAllQuizzes } from "@/lib/quizzes";
import { getAllTakeaways } from "@/lib/takeaways";
import { HomeButton } from "@/components/home-button";
import { SearchTrigger } from "@/components/search-trigger";
import { SettingsDropdownLazy as SettingsDropdown } from "@/components/settings-dropdown-lazy";
import { ReviewSession, type ReviewData } from "@/components/review-session";

const title = "Spaced review";
const description =
  "Review the exercises, quiz questions and chapter key takeaways from Microsoft's RustTraining books on a spaced-repetition schedule.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/review" },
  robots: { index: false, follow: false },
  openGraph: {
    type: "website",
    siteName: "Rust Training",
    locale: "en_US",
    title,
    description,
    url: "/review",
  },
  twitter: { card: "summary", title, description },
};

function getReviewData(): ReviewData {
  const books: ReviewData["books"] = {};
  const titles = new Map<string, string>();
  for (const book of BOOKS) {
    if (book.slug === "100-rust-projects") continue;
    books[book.slug] = book.title;
    for (const ch of getBookStructure(book.dirName).flatChapters) titles.set(`${book.slug}/${ch.slug}`, ch.title);
  }

  const cards: ReviewData["cards"] = {};
  for (const t of getAllTakeaways()) {
    const chapter = `${t.bookSlug}/${t.chapterSlug}`;
    cards[`takeaways:${chapter}`] = { kind: "takeaways", chapter, items: t.items };
  }
  for (const ex of getAllExercises())
    cards[`ex:${ex.id}`] = { kind: "exercise", chapter: `${ex.bookSlug}/${ex.chapterSlug}`, anchor: ex.anchor, title: ex.title };
  for (const q of getAllQuizzes())
    cards[`quiz:${q.id}`] = {
      kind: "quiz",
      chapter: `${q.bookSlug}/${q.chapterSlug}`,
      anchor: `quiz-${q.id}`,
      change: q.change,
      compiles: q.compiles,
      errorCode: q.errorCode,
    };

  const chapters: ReviewData["chapters"] = {};
  for (const card of Object.values(cards)) chapters[card.chapter] = titles.get(card.chapter) ?? card.chapter;
  return { books, chapters, cards };
}

const linkClass = "underline underline-offset-2 hover:text-primary";

export default function ReviewPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <nav className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-3xl px-6 flex items-center justify-between h-14">
          <HomeButton />
          <div className="flex items-center gap-2">
            <SearchTrigger />
            <SettingsDropdown />
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-3xl w-full px-6 py-10 flex-1">
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight mb-2">{title}</h1>
        <ReviewSession {...getReviewData()} />

        <section aria-labelledby="review-how" className="mt-12 text-sm leading-relaxed text-muted-foreground">
          <h2 id="review-how" className="mb-2 text-base font-semibold text-foreground">
            How cards get added
          </h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              Mark an exercise solved on its chapter page (all of them are listed on{" "}
              <Link href="/practice" className={linkClass}>
                Practice
              </Link>
              ).
            </li>
            <li>Answer a &ldquo;Does it still compile?&rdquo; quiz question at the end of a chapter.</li>
            <li>Read a chapter that has a key takeaways list for a few seconds.</li>
          </ul>
          <p className="mt-3">
            A new card is first due the next day. Your queue is saved in this browser, and synced to your account when you
            sign in with GitHub.
          </p>
        </section>
      </main>

      <footer className="border-t border-border">
        <p className="mx-auto max-w-3xl px-6 py-5 text-xs text-muted-foreground">
          From Microsoft&apos;s{" "}
          <a
            href="https://github.com/microsoft/RustTraining"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-primary"
          >
            RustTraining
          </a>{" "}
          (CC BY 4.0); unofficial reader, not affiliated with Microsoft.
        </p>
      </footer>
    </div>
  );
}
