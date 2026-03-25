import Link from "next/link";
import { BOOKS } from "@/lib/books";
import { getBookStructure } from "@/lib/content";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { BookOpen, ChevronRight } from "lucide-react";
import { SearchTrigger } from "@/components/search-dialog";
import { SettingsDropdown } from "@/components/settings-dropdown";
import { BookProgressBar } from "@/components/book-progress";
import { LevelTooltip } from "@/components/level-tooltip";
import { APP_VERSION } from "@/lib/version";

export default function HomePage() {
  const booksWithCounts = BOOKS.map((book) => {
    const structure = getBookStructure(book.dirName);
    return { ...book, chapterCount: structure.flatChapters.length };
  });

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <header className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-rust/5 via-transparent to-rust/10" />
        <div className="relative mx-auto max-w-6xl px-6 py-8 md:py-12">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground text-lg font-bold">
                🦀
              </div>
              <span className="text-xs font-medium text-muted-foreground tracking-wide uppercase">
                Microsoft Rust Training
              </span>
            </div>
            <div className="flex items-center gap-2">
              <SearchTrigger />
              <SettingsDropdown />
            </div>
          </div>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight mb-1.5">
                Learn Rust,{" "}
                <span className="text-primary">Your Way</span>
              </h1>
              <p className="text-sm md:text-base text-muted-foreground max-w-xl">
                Seven free books that meet you where you are — from C++, C#, Python
                bridges to async deep dives and type-driven design.
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Book Grid */}
      <main id="books" className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-2xl font-bold mb-2">The Library</h2>
        <p className="text-muted-foreground mb-10">
          Pick the book that matches your background and level.
        </p>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {booksWithCounts.map((book) => (
            <Link key={book.slug} href={`/books/${book.slug}`}>
              <Card className="group h-full transition-all hover:shadow-lg hover:shadow-rust/5 hover:border-primary/30 cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-3xl">{book.icon}</span>
                    <LevelTooltip level={book.level} color={book.levelColor} />
                  </div>
                  <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors">
                    {book.title}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    For {book.audience}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground mb-4">
                    {book.description}
                  </p>
                  <BookProgressBar
                    bookSlug={book.slug}
                    totalChapters={book.chapterCount}
                  />
                  <div className="flex items-center justify-between text-xs text-muted-foreground mt-3">
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-3.5 w-3.5" />
                      {book.chapterCount} chapters
                    </span>
                    <span className="flex items-center gap-1 text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      Start reading
                      <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-auto">
        <div className="mx-auto max-w-6xl px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>
            Content from{" "}
            <a
              href="https://github.com/microsoft/RustTraining"
              className="font-medium text-foreground hover:text-primary"
              target="_blank"
              rel="noopener noreferrer"
            >
              microsoft/RustTraining
            </a>{" "}
            — MIT & CC BY 4.0
          </p>
          <div className="flex items-center gap-4">
            <a
              href="https://x.com/KhandakarRuhan"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-medium text-foreground hover:text-primary transition-colors"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
              @KhandakarRuhan
            </a>
            <span>v{APP_VERSION}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
