import Link from "next/link";
import { notFound } from "next/navigation";
import { BOOKS, getBookBySlug } from "@/lib/books";
import { getBookStructure, getChapterMarkdown } from "@/lib/content";
import { ChapterSidebar } from "@/components/chapter-sidebar";
import { MobileNav } from "@/components/mobile-nav";
import { ChapterReadMarker } from "@/components/chapter-read-marker";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { ErrorBoundary } from "@/components/error-boundary";
import { SearchTrigger } from "@/components/search-dialog";
import { HomeButton } from "@/components/home-button";
import { SettingsDropdown } from "@/components/settings-dropdown";
import { ArrowLeft, ArrowRight } from "lucide-react";

export function generateStaticParams() {
  const params: { bookSlug: string; chapterSlug: string }[] = [];
  for (const book of BOOKS) {
    const structure = getBookStructure(book.dirName);
    for (const ch of structure.flatChapters) {
      params.push({ bookSlug: book.slug, chapterSlug: ch.slug });
    }
  }
  return params;
}

export default async function ChapterPage({
  params,
}: {
  params: Promise<{ bookSlug: string; chapterSlug: string }>;
}) {
  const { bookSlug, chapterSlug } = await params;
  const book = getBookBySlug(bookSlug);
  if (!book) notFound();

  const structure = getBookStructure(book.dirName);
  const flat = structure.flatChapters;
  const currentIndex = flat.findIndex((ch) => ch.slug === chapterSlug);
  if (currentIndex === -1) notFound();

  const current = flat[currentIndex];
  const prev = currentIndex > 0 ? flat[currentIndex - 1] : null;
  const next = currentIndex < flat.length - 1 ? flat[currentIndex + 1] : null;

  const markdown = getChapterMarkdown(book.dirName, chapterSlug);

  return (
    <div className="min-h-screen flex flex-col">
      <ChapterReadMarker bookSlug={bookSlug} chapterSlug={chapterSlug} />

      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="flex items-center gap-3 px-4 h-14">
          <MobileNav
            book={book}
            structure={structure}
            currentSlug={chapterSlug}
          />
          <HomeButton />
          <span className="text-muted-foreground">/</span>
          <Link
            href={`/books/${bookSlug}`}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors shrink-0"
          >
            <span className="hidden sm:inline font-medium">
              {book.shortTitle}
            </span>
            <span className="sm:hidden font-medium">{book.icon}</span>
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="text-sm font-medium truncate flex-1">
            {current.title}
          </span>
          <div className="flex items-center gap-2 shrink-0">
            <SearchTrigger />
            <SettingsDropdown />
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="hidden lg:flex w-72 shrink-0 border-r border-border">
          <div className="sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto p-4 w-full">
            <ChapterSidebar
              book={book}
              structure={structure}
              currentSlug={chapterSlug}
            />
          </div>
        </aside>

        <main className="flex-1 min-w-0">
          <article className="mx-auto max-w-3xl px-6 md:px-10 py-10">
              <ErrorBoundary>
                <MarkdownRenderer content={markdown} bookSlug={bookSlug} chapterSlug={chapterSlug} />
              </ErrorBoundary>
          </article>

          <nav className="border-t border-border">
            <div className="mx-auto max-w-3xl px-6 md:px-10 py-6 flex items-stretch gap-4">
              {prev ? (
                <Link
                  href={`/books/${bookSlug}/${prev.slug}`}
                  className="group flex-1 flex flex-col items-start gap-1 p-4 rounded-lg border border-border hover:border-primary/30 hover:bg-accent transition-all"
                >
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <ArrowLeft className="h-3 w-3" />
                    Previous
                  </span>
                  <span className="text-sm font-medium group-hover:text-primary transition-colors line-clamp-1">
                    {prev.title}
                  </span>
                </Link>
              ) : (
                <div className="flex-1" />
              )}
              {next ? (
                <Link
                  href={`/books/${bookSlug}/${next.slug}`}
                  className="group flex-1 flex flex-col items-end gap-1 p-4 rounded-lg border border-border hover:border-primary/30 hover:bg-accent transition-all text-right"
                >
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    Next
                    <ArrowRight className="h-3 w-3" />
                  </span>
                  <span className="text-sm font-medium group-hover:text-primary transition-colors line-clamp-1">
                    {next.title}
                  </span>
                </Link>
              ) : (
                <div className="flex-1" />
              )}
            </div>
          </nav>
        </main>
      </div>
    </div>
  );
}
