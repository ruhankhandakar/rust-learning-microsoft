import type { Metadata } from "next";
import Link from "next/link";
import { BOOKS } from "@/lib/books";
import { getBookStructure } from "@/lib/content";
import { getAllExercises } from "@/lib/exercises";
import { getAllQuizzes } from "@/lib/quizzes";
import { getAllTakeaways } from "@/lib/takeaways";
import { ReviewSession, type ReviewData } from "@/components/review-session";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CircleHelp, Code2, ListChecks } from "lucide-react";
import { REVIEW_INTERVAL_DAYS } from "@/lib/review-schedule";

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

const STEPS = [
  { Icon: Code2, title: "Solve an exercise", body: "Mark it solved on its chapter page.", href: "/practice", link: "All exercises" },
  { Icon: CircleHelp, title: "Answer a quiz", body: "The \u201cDoes it still compile?\u201d questions at the end of a chapter.", href: "/#library", link: "Pick a book" },
  { Icon: ListChecks, title: "Read the takeaways", body: "Chapters with a key takeaways list add one when you read them.", href: "/concepts", link: "Browse topics" },
];

export default function ReviewPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-12 sm:px-6">
        <h1 className="mb-3 text-4xl font-bold tracking-[-0.03em] sm:text-5xl">{title}</h1>
        <p className="mb-10 max-w-2xl text-lg text-muted-foreground">
          What you practise comes back just before you forget it: after {REVIEW_INTERVAL_DAYS.slice(0, -1).join(", ")} and{" "}
          {REVIEW_INTERVAL_DAYS.at(-1)} days while you keep getting it right. Miss one and it starts again tomorrow.
        </p>

        <ReviewSession {...getReviewData()} />

        <section aria-labelledby="review-how" className="mt-16">
          <h2 id="review-how" className="mb-4 text-2xl font-bold">
            How cards get added
          </h2>
          <ol className="grid gap-3 sm:grid-cols-3">
            {STEPS.map(({ Icon, title, body, href, link }) => (
              <li key={title} className="flex flex-col gap-2 rounded-2xl border border-border p-5">
                <Icon className="size-5 text-primary" aria-hidden="true" />
                <p className="font-semibold">{title}</p>
                <p className="text-sm text-muted-foreground">{body}</p>
                <Link href={href} className="mt-auto pt-1 text-sm font-semibold text-primary hover:underline">
                  {link}
                </Link>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-sm text-muted-foreground">Your queue is saved in this browser, and synced to your account when you sign in with GitHub.</p>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
