import type { Metadata } from "next";
import Link from "next/link";
import { Rss } from "lucide-react";
import { formatChangeDate, getChangelog } from "@/lib/changelog";
import { HomeButton } from "@/components/home-button";
import { SearchTrigger } from "@/components/search-trigger";
import { SettingsDropdownLazy as SettingsDropdown } from "@/components/settings-dropdown-lazy";

const title = "What changed in the books";
const description =
  "Chapters added, removed or edited upstream in Microsoft's free RustTraining books and 100 Rust Projects, listed by the date this reader synced them.";
const RUST100_DIR = "100-rust-projects";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/changes",
    types: { "application/rss+xml": [{ url: "/rss.xml", title: "Rust Training: what changed" }] },
  },
  openGraph: {
    type: "website",
    siteName: "Rust Training",
    locale: "en_US",
    title,
    description,
    url: "/changes",
  },
  twitter: { card: "summary", title, description },
};

const linkClass =
  "rounded-sm hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export default function ChangesPage() {
  const entries = getChangelog();

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
        <p className="text-muted-foreground mb-3 leading-relaxed">
          Chapters that changed upstream in Microsoft&apos;s RustTraining books and in 100 Rust Projects, grouped by the
          day this site synced them. Dates are when this reader picked a change up, which can be a day or more after it
          landed upstream.
        </p>
        <a
          href="/rss.xml"
          className={`inline-flex items-center gap-1.5 text-sm font-medium text-primary mb-10 ${linkClass}`}
        >
          <Rss className="h-4 w-4" aria-hidden />
          Subscribe via RSS
        </a>

        {entries.length === 0 && <p className="text-sm text-muted-foreground">No changes recorded yet.</p>}

        {entries.map((entry) => (
          <section key={entry.date} id={entry.date} aria-labelledby={`synced-${entry.date}`} className="mb-10 scroll-mt-20">
            <h2 id={`synced-${entry.date}`} className="text-lg font-bold mb-3">
              <a href={`#${entry.date}`} className={linkClass}>
                Synced on <time dateTime={entry.date}>{formatChangeDate(entry.date)}</time>
              </a>
            </h2>
            <div className="border border-border rounded-xl overflow-hidden divide-y divide-border">
              {entry.books.map((book) => (
                <div key={book.dir}>
                  <h3 className="flex flex-wrap items-center gap-x-2 px-4 py-2 bg-muted/50 text-xs font-semibold text-muted-foreground">
                    {book.slug ? (
                      <Link href={`/books/${book.slug}`} className={linkClass}>
                        {book.title}
                      </Link>
                    ) : (
                      book.title
                    )}
                    {book.tocChanged && <span className="font-normal">· table of contents changed</span>}
                    {book.dir === RUST100_DIR && (
                      <a
                        href="https://github.com/emmaglorypraise/100rustprojects"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`font-normal underline underline-offset-2 ${linkClass}`}
                      >
                        upstream on GitHub
                      </a>
                    )}
                  </h3>
                  {book.files.length > 0 && (
                    <ul className="divide-y divide-border/50">
                      {book.files.map((f) => (
                        <li key={f.file} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                          <span className="flex-1 min-w-0 font-medium">
                            {f.href ? (
                              <Link href={f.href} className={linkClass}>
                                {f.title}
                              </Link>
                            ) : (
                              <span className="text-muted-foreground">{f.title}</span>
                            )}
                          </span>
                          {f.status !== "modified" && (
                            <span
                              className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                                f.status === "added"
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                                  : "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300"
                              }`}
                            >
                              {f.status === "added" ? "new" : "removed"}
                            </span>
                          )}
                          <span className="shrink-0 font-mono text-xs tabular-nums">
                            <span aria-hidden>
                              <span className="text-emerald-600 dark:text-emerald-400">+{f.added}</span>{" "}
                              <span className="text-rose-600 dark:text-rose-400">−{f.removed}</span>
                            </span>
                            <span className="sr-only">
                              lines: {f.added} added, {f.removed} removed
                            </span>
                          </span>
                          {book.dir !== RUST100_DIR && (
                            <a
                              href={`https://github.com/microsoft/RustTraining/commits/main/${book.dir}/src/${encodeURIComponent(f.file)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`Upstream history of ${f.title} (opens in a new tab)`}
                              className={`shrink-0 text-xs text-muted-foreground underline underline-offset-2 ${linkClass}`}
                            >
                              history
                            </a>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}
      </main>

      <footer className="border-t border-border">
        <p className="mx-auto max-w-3xl px-6 py-5 text-xs text-muted-foreground">
          Chapter titles from Microsoft&apos;s{" "}
          <a
            href="https://github.com/microsoft/RustTraining"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-primary"
          >
            RustTraining
          </a>{" "}
          (CC BY 4.0) and Glory Praise Emmanuel&apos;s 100 Rust Projects. This is an unofficial reader and is not
          affiliated with Microsoft.
        </p>
      </footer>
    </div>
  );
}
