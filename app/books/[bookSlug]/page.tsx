import Link from "next/link";
import { notFound } from "next/navigation";
import { BOOKS, getBookBySlug } from "@/lib/books";
import { getBookStructure } from "@/lib/content";
import { Badge } from "@/components/ui/badge";
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
      {/* Top nav */}
      <nav className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-5xl px-6 flex items-center justify-between h-14">
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
      </nav>

      <div className="mx-auto max-w-5xl w-full px-6 flex-1">
        {/* Two-column layout on desktop */}
        <div className="lg:grid lg:grid-cols-[280px_1fr] lg:gap-10 py-8">
          {/* Left: Book info card (sticky on desktop) */}
          <aside className="lg:sticky lg:top-20 lg:self-start mb-8 lg:mb-0">
            <div className="flex flex-row lg:flex-col items-start gap-4">
              <div className="flex h-14 w-14 lg:h-20 lg:w-20 items-center justify-center rounded-2xl bg-accent text-3xl lg:text-5xl shrink-0">
                {book.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <Badge
                    variant="secondary"
                    className={LEVEL_STYLES[book.levelColor]}
                  >
                    {book.level}
                  </Badge>
                </div>
                <h1 className="text-xl lg:text-2xl font-bold tracking-tight leading-tight">
                  {book.title}
                </h1>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
              {book.description}
            </p>

            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Layers className="h-3.5 w-3.5" />
                {structure.parts.length} parts
              </span>
              <span className="flex items-center gap-1">
                <FileText className="h-3.5 w-3.5" />
                {structure.flatChapters.length} chapters
              </span>
            </div>

            <div className="mt-3">
              <BookProgressBar
                bookSlug={bookSlug}
                totalChapters={structure.flatChapters.length}
              />
            </div>

            {firstChapter && (
              <Link
                href={`/books/${bookSlug}/${firstChapter.slug}`}
                className="inline-flex h-10 items-center gap-2 mt-4 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-rust-dark"
              >
                <BookOpen className="h-4 w-4" />
                Start Reading
              </Link>
            )}

            <p className="hidden lg:block text-xs text-muted-foreground mt-4">
              For {book.audience}
            </p>
          </aside>

          {/* Right: Table of Contents */}
          <main>
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">
              Table of Contents
            </h2>

            <div className="border border-border rounded-xl overflow-hidden divide-y divide-border">
              {structure.introduction && (
                <Link
                  href={`/books/${bookSlug}/${structure.introduction.slug}`}
                  className="group flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-primary text-[11px] font-bold shrink-0">
                    0
                  </span>
                  <span className="text-sm font-medium group-hover:text-primary transition-colors flex-1 truncate">
                    {structure.introduction.title}
                  </span>
                  <ChapterCheckmark bookSlug={bookSlug} chapterSlug={structure.introduction.slug} />
                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </Link>
              )}

              {structure.parts.map((part, pi) => (
                <div key={pi}>
                  {part.title && (
                    <div className="px-4 py-2.5 bg-muted/50">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        {part.title}
                      </span>
                    </div>
                  )}
                  {part.chapters.map((ch, ci) => (
                    <div key={ch.slug} className={ci > 0 ? "border-t border-border/50" : ""}>
                      <Link
                        href={`/books/${bookSlug}/${ch.slug}`}
                        className="group flex items-center gap-3 px-4 py-2.5 hover:bg-accent transition-colors"
                      >
                        <span className="flex h-6 w-6 items-center justify-center rounded bg-muted text-muted-foreground text-[11px] font-bold shrink-0">
                          <FileText className="h-3.5 w-3.5" />
                        </span>
                        <span className="text-sm font-medium group-hover:text-primary transition-colors flex-1 truncate">
                          {ch.title}
                        </span>
                        <ChapterCheckmark bookSlug={bookSlug} chapterSlug={ch.slug} />
                        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </Link>
                      {ch.children.length > 0 &&
                        ch.children.map((sub) => (
                          <Link
                            key={sub.slug}
                            href={`/books/${bookSlug}/${sub.slug}`}
                            className="group flex items-center gap-2.5 pl-11 pr-4 py-2 hover:bg-accent transition-colors border-t border-border/30"
                          >
                            <span className="w-1 h-1 rounded-full bg-border shrink-0" />
                            <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors flex-1 truncate">
                              {sub.title}
                            </span>
                            <ChapterCheckmark bookSlug={bookSlug} chapterSlug={sub.slug} />
                          </Link>
                        ))}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border mt-auto">
        <div className="mx-auto max-w-5xl px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
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
