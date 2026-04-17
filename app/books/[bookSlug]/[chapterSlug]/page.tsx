import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BOOKS, getBookBySlug } from "@/lib/books";
import { getBookStructure, getChapterMarkdown } from "@/lib/content";
import { ChapterSidebar } from "@/components/chapter-sidebar";
import { MobileNav } from "@/components/mobile-nav";
import { ChapterReadMarker } from "@/components/chapter-read-marker";
import { ErrorBoundary } from "@/components/error-boundary";
import { SearchTrigger } from "@/components/search-trigger";
import { HomeButton } from "@/components/home-button";
import { SettingsDropdownLazy as SettingsDropdown } from "@/components/settings-dropdown-lazy";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { ChapterKeyboardNav } from "@/components/chapter-keyboard-nav";
import { loadRust100Manifest, getRust100ProjectByChapterSlug } from "@/lib/rust-100-projects";
import {
  listProjectSourceDir,
  resolveProjectSourcePath,
} from "@/lib/rust-100-project-source";
import {
  Rust100ProjectGlossaryToolbar,
  Rust100ProjectSourcePanel,
} from "@/components/rust-100-project-source-panel";
import { Rust100ProjectSourceMobile } from "@/components/rust-100-project-source-mobile";

const MarkdownRenderer = dynamic(
  () => import("@/components/markdown-renderer").then((m) => m.MarkdownRenderer),
  {
    loading: () => (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-muted rounded w-3/4" />
        <div className="h-4 bg-muted rounded w-full" />
        <div className="h-4 bg-muted rounded w-5/6" />
        <div className="h-4 bg-muted rounded w-full" />
        <div className="h-4 bg-muted rounded w-2/3" />
      </div>
    ),
  }
);

const BASE_URL = "https://rust.learningz.xyz";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ bookSlug: string; chapterSlug: string }>;
}): Promise<Metadata> {
  const { bookSlug, chapterSlug } = await params;
  const book = getBookBySlug(bookSlug);
  if (!book) return {};

  const structure = getBookStructure(book.dirName);
  const chapter = structure.flatChapters.find((ch) => ch.slug === chapterSlug);
  if (!chapter) return {};

  const title = `${chapter.title} — ${book.shortTitle}`;
  const description =
    bookSlug === "100-rust-projects"
      ? `Read "${chapter.title}" from ${book.title}. Notes from emmaglorypraise/100rustprojects.`
      : `Read "${chapter.title}" from ${book.title}. Free Rust training by Microsoft.`;
  const url = `${BASE_URL}/books/${bookSlug}/${chapterSlug}`;

  return {
    title,
    description,
    openGraph: {
      type: "article",
      title,
      description,
      url,
      siteName:
      bookSlug === "100-rust-projects"
        ? "100 Rust Projects | Ruhan Khandakar"
        : "Rust Training by Microsoft | Ruhan Khandakar",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
    alternates: { canonical: url },
  };
}

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

  const rust100 =
    bookSlug === "100-rust-projects" ? loadRust100Manifest() : null;
  const rust100Project = rust100
    ? getRust100ProjectByChapterSlug(rust100, chapterSlug)
    : undefined;
  const rustProjectDir = rust100Project?.projectDir ?? null;
  const useRustSourceSplit =
    bookSlug === "100-rust-projects" &&
    chapterSlug !== "glossary" &&
    rustProjectDir !== null;
  const rustSourceEntries =
    useRustSourceSplit && rustProjectDir
      ? (() => {
          const root = resolveProjectSourcePath(rustProjectDir, []);
          return root ? listProjectSourceDir(root.absolute) : [];
        })()
      : [];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: current.title,
    description:
      bookSlug === "100-rust-projects"
        ? `Project notes from ${book.title} (emmaglorypraise/100rustprojects).`
        : `Read "${current.title}" from ${book.title}. Free Rust training curated by Microsoft | Ruhan Khandakar.`,
    url: `${BASE_URL}/books/${bookSlug}/${chapterSlug}`,
    author: { "@type": "Person", name: "Ruhan Khandakar" },
    publisher: { "@type": "Person", name: "Ruhan Khandakar" },
    isPartOf: {
      "@type": "Book",
      name: book.title,
      author:
        bookSlug === "100-rust-projects"
          ? {
              "@type": "Person",
              name: "Glory Praise Emmanuel",
              url: "https://github.com/emmaglorypraise",
            }
          : { "@type": "Organization", name: "Microsoft" },
    },
    inLanguage: "en",
    isAccessibleForFree: true,
  };

  return (
    <div className="min-h-screen flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {bookSlug !== "100-rust-projects" && (
        <ChapterReadMarker bookSlug={bookSlug} chapterSlug={chapterSlug} />
      )}
      <ChapterKeyboardNav
        prevHref={prev ? `/books/${bookSlug}/${prev.slug}` : null}
        nextHref={next ? `/books/${bookSlug}/${next.slug}` : null}
      />

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
          {useRustSourceSplit && rustProjectDir ? (
            <>
              <div
                className="w-full px-4 md:px-6 xl:px-8 pt-10 pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] lg:pb-10"
              >
                <div className="flex flex-col lg:flex-row lg:items-start gap-8 lg:gap-10 xl:gap-12">
                  <article className="min-w-0 flex-1">
                    <ErrorBoundary>
                      <MarkdownRenderer
                        content={markdown}
                        bookSlug={bookSlug}
                        chapterSlug={chapterSlug}
                      />
                    </ErrorBoundary>
                  </article>
                  <aside className="hidden lg:block w-full lg:w-[min(42rem,48%)] shrink-0 lg:sticky lg:top-[4.5rem] lg:max-h-[calc(100vh-5rem)] lg:overflow-y-auto">
                    <Rust100ProjectSourcePanel
                      chapterSlug={chapterSlug}
                      projectDir={rustProjectDir}
                      initialEntries={rustSourceEntries}
                      showActions={false}
                    />
                  </aside>
                </div>
              </div>
              <Rust100ProjectSourceMobile
                chapterSlug={chapterSlug}
                projectDir={rustProjectDir}
                initialEntries={rustSourceEntries}
              />
            </>
          ) : (
            <article className="mx-auto max-w-3xl px-6 md:px-10 py-10">
              <ErrorBoundary>
                {bookSlug === "100-rust-projects" &&
                  chapterSlug === "glossary" && <Rust100ProjectGlossaryToolbar />}
                <MarkdownRenderer
                  content={markdown}
                  bookSlug={bookSlug}
                  chapterSlug={chapterSlug}
                />
              </ErrorBoundary>
            </article>
          )}

          <nav
            className={`border-t border-border ${useRustSourceSplit ? "pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] lg:pb-0" : ""}`}
          >
            <p
              className={`${useRustSourceSplit ? "w-full px-4 md:px-6 xl:px-8" : "mx-auto max-w-3xl px-6 md:px-10"} pt-6 text-[11px] text-muted-foreground/50 text-center hidden sm:block`}
            >
              <kbd className="px-1 py-0.5 rounded border border-border text-[10px]">⌘</kbd>{" / "}
              <kbd className="px-1 py-0.5 rounded border border-border text-[10px]">Alt</kbd>
              {" + "}
              <kbd className="px-1 py-0.5 rounded border border-border text-[10px]">←</kbd>
              <kbd className="px-1 py-0.5 rounded border border-border text-[10px]">→</kbd>
              {" to navigate chapters"}
            </p>
            <div
              className={`${useRustSourceSplit ? "w-full px-4 md:px-6 xl:px-8" : "mx-auto max-w-3xl px-6 md:px-10"} py-6 flex items-stretch gap-4`}
            >
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
