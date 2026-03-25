import Link from "next/link";
import { notFound } from "next/navigation";
import { BOOKS, getBookBySlug } from "@/lib/books";
import { getBookStructure } from "@/lib/content";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  BookOpen,
  ChevronRight,
  ArrowLeft,
  Layers,
  FileText,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { SearchTrigger } from "@/components/search-dialog";
import { BookProgressBar } from "@/components/book-progress";
import { ChapterCheckmark } from "@/components/chapter-checkmark";

const LEVEL_STYLES: Record<string, string> = {
  green:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  blue: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300",
  yellow:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  purple:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
  brown:
    "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
};

export function generateStaticParams() {
  return BOOKS.map((book) => ({ bookSlug: book.slug }));
}

export default async function BookPage({
  params,
}: {
  params: Promise<{ bookSlug: string }>;
}) {
  const { bookSlug } = await params;
  const book = getBookBySlug(bookSlug);
  if (!book) notFound();

  const structure = getBookStructure(book.dirName);
  const firstChapter = structure.flatChapters[0];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-border">
        <div className="mx-auto max-w-4xl px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              All Books
            </Link>
            <div className="flex items-center gap-2">
              <SearchTrigger />
              <ThemeToggle />
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-4xl shrink-0">
              {book.icon}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge
                  variant="secondary"
                  className={LEVEL_STYLES[book.levelColor]}
                >
                  {book.level}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  For {book.audience}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">
                {book.title}
              </h1>
              <p className="text-muted-foreground">{book.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-6 mt-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Layers className="h-4 w-4" />
              {structure.parts.length} parts
            </span>
            <span className="flex items-center gap-1.5">
              <FileText className="h-4 w-4" />
              {structure.flatChapters.length} chapters
            </span>
          </div>

          <div className="mt-4 max-w-xs">
            <BookProgressBar
              bookSlug={bookSlug}
              totalChapters={structure.flatChapters.length}
            />
          </div>

          {firstChapter && (
            <Link
              href={`/books/${bookSlug}/${firstChapter.slug}`}
              className="inline-flex h-11 items-center gap-2 mt-6 rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-rust-dark"
            >
              <BookOpen className="h-4 w-4" />
              Start Reading
            </Link>
          )}
        </div>
      </header>

      {/* Table of Contents */}
      <main className="mx-auto max-w-4xl px-6 py-10 flex-1">
        <h2 className="text-xl font-bold mb-6">Table of Contents</h2>

        {structure.introduction && (
          <Link
            href={`/books/${bookSlug}/${structure.introduction.slug}`}
            className="group flex items-center gap-3 p-3 -mx-3 rounded-lg hover:bg-accent transition-colors mb-4"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary text-xs font-bold shrink-0">
              0
            </div>
            <span className="font-medium group-hover:text-primary transition-colors flex-1">
              {structure.introduction.title}
            </span>
            <ChapterCheckmark bookSlug={bookSlug} chapterSlug={structure.introduction.slug} />
            <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        )}

        <div className="space-y-8">
          {structure.parts.map((part, pi) => (
            <div key={pi}>
              {part.title && (
                <>
                  <Separator className="mb-4" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
                    {part.title}
                  </h3>
                </>
              )}
              <div className="space-y-1">
                {part.chapters.map((ch) => (
                  <div key={ch.slug}>
                    <Link
                      href={`/books/${bookSlug}/${ch.slug}`}
                      className="group flex items-center gap-3 p-3 -mx-3 rounded-lg hover:bg-accent transition-colors"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-muted-foreground text-xs font-bold shrink-0">
                        <FileText className="h-4 w-4" />
                      </div>
                      <span className="font-medium group-hover:text-primary transition-colors flex-1">
                        {ch.title}
                      </span>
                      <ChapterCheckmark bookSlug={bookSlug} chapterSlug={ch.slug} />
                      <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                    {ch.children.length > 0 && (
                      <div className="ml-11 space-y-0.5">
                        {ch.children.map((sub) => (
                          <Link
                            key={sub.slug}
                            href={`/books/${bookSlug}/${sub.slug}`}
                            className="group flex items-center gap-2 p-2 -mx-2 rounded-md hover:bg-accent transition-colors text-sm"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-border shrink-0" />
                            <span className="text-muted-foreground group-hover:text-primary transition-colors flex-1">
                              {sub.title}
                            </span>
                            <ChapterCheckmark bookSlug={bookSlug} chapterSlug={sub.slug} />
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-auto">
        <div className="mx-auto max-w-4xl px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <p>
            <a
              href="https://github.com/microsoft/RustTraining"
              className="hover:text-primary"
              target="_blank"
              rel="noopener noreferrer"
            >
              microsoft/RustTraining
            </a>{" "}
            — MIT & CC BY 4.0
          </p>
          <a
            href="https://x.com/KhandakarRuhan"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-medium text-foreground hover:text-primary transition-colors"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            @KhandakarRuhan
          </a>
        </div>
      </footer>
    </div>
  );
}
