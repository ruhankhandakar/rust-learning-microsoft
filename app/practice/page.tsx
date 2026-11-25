import type { Metadata } from "next";
import { BOOKS } from "@/lib/books";
import { getBookStructure } from "@/lib/content";
import { getAllExercises } from "@/lib/exercises";
import { PracticeList, type PracticeBook } from "@/components/practice-list";
import { SiteHeader } from "@/components/site-header";

const title = "Practice exercises";
const description =
  "Every hands-on exercise from Microsoft's free RustTraining books in one list, grouped by book and chapter, with difficulty levels and solved tracking.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/practice" },
  openGraph: {
    type: "website",
    siteName: "Rust Training",
    locale: "en_US",
    title,
    description,
    url: "/practice",
  },
  twitter: { card: "summary", title, description },
};

export default function PracticePage() {
  const exercises = getAllExercises();
  const books: PracticeBook[] = BOOKS.map((book) => ({
    slug: book.slug,
    title: book.title,
    icon: book.icon,
    chapters: getBookStructure(book.dirName)
      .flatChapters.map((ch) => ({
        slug: ch.slug,
        title: ch.title,
        exercises: exercises
          .filter((ex) => ex.bookSlug === book.slug && ex.chapterSlug === ch.slug)
          .map(({ id, anchor, title, difficulty }) => ({ id, anchor, title, difficulty })),
      }))
      .filter((ch) => ch.exercises.length > 0),
  })).filter((book) => book.chapters.length > 0);

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <main className="mx-auto max-w-3xl w-full px-6 py-10 flex-1">
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight mb-2">{title}</h1>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          {exercises.length} exercises from {books.length} Rust books, each with a worked solution on its chapter page.
          Mark an exercise solved there and your progress shows up here. It is saved in this browser, and synced to your account when you sign in with GitHub.
        </p>
        <PracticeList books={books} />
      </main>

      <footer className="border-t border-border">
        <p className="mx-auto max-w-3xl px-6 py-5 text-xs text-muted-foreground">
          Exercises from Microsoft&apos;s{" "}
          <a
            href="https://github.com/microsoft/RustTraining"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-primary"
          >
            RustTraining
          </a>{" "}
          (CC BY 4.0). This is an unofficial reader and is not affiliated with Microsoft.
        </p>
      </footer>
    </div>
  );
}
