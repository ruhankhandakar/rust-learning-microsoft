import type { Metadata } from "next";
import Link from "next/link";
import { BOOKS } from "@/lib/books";
import { getAllConcepts } from "@/lib/concepts";

const title = "Rust topics across Microsoft's Rust books";
const description =
  "Core Rust concepts such as ownership, traits, async and unsafe, with every section from Microsoft's seven RustTraining books that explains each one, side by side.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/concepts" },
  openGraph: {
    type: "website",
    siteName: "Rust Training",
    locale: "en_US",
    title,
    description,
    url: "/concepts",
  },
  twitter: { card: "summary", title, description },
};

export default function ConceptsPage() {
  const concepts = getAllConcepts();

  return (
    <>
      <h1 className="text-2xl lg:text-3xl font-bold tracking-tight mb-2">{title}</h1>
      <p className="text-muted-foreground mb-8 leading-relaxed">
        Microsoft publishes its Rust training as seven separate books. These {concepts.length} topic pages put them side
        by side: each lists every section that explains the concept, starting from the bridge book for the language you
        already know.
      </p>
      <ul className="grid gap-3 sm:grid-cols-2">
        {concepts.map((c) => (
          <li key={c.slug}>
            <Link
              href={`/concepts/${c.slug}`}
              className="group flex h-full flex-col rounded-xl border border-border p-4 hover:border-primary/40 hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <h2 className="font-semibold group-hover:text-primary transition-colors">{c.title}</h2>
              <p className="mt-1 flex-1 text-sm text-muted-foreground leading-relaxed">{c.summary}</p>
              <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <span>
                  {c.sections.length} sections in {c.bookCount} books
                </span>
                <span aria-hidden>
                  {BOOKS.filter((b) => c.sections.some((s) => s.bookSlug === b.slug))
                    .map((b) => b.icon)
                    .join(" ")}
                </span>
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
