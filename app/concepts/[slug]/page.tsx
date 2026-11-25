import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { BOOKS, type BookMeta } from "@/lib/books";
import { getAllConcepts, getConcept, type ConceptSection } from "@/lib/concepts";

const BASE_URL = "https://rust.learningz.xyz";

const BRIDGES: Record<string, string> = {
  "rust-for-cpp": "Coming from C or C++",
  "rust-for-csharp": "Coming from C# or Java",
  "rust-for-python": "Coming from Python",
};

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllConcepts().map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const concept = getConcept(slug);
  if (!concept) return {};
  const title = `${concept.title} in Rust — how each book explains it`;
  const description = `${concept.summary} Compare ${concept.sections.length} sections from ${concept.bookCount} of Microsoft's Rust books.`;
  const url = `/concepts/${slug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { type: "website", siteName: "Rust Training", locale: "en_US", title, description, url },
    twitter: { card: "summary", title, description },
  };
}

const sectionHref = (s: ConceptSection) => `/books/${s.bookSlug}/${s.chapterSlug}#${s.headingId}`;

function SectionList({ sections }: { sections: ConceptSection[] }) {
  return (
    <ul className="mt-3 space-y-3">
      {sections.map((s) => (
        <li key={sectionHref(s)} className="rounded-xl border border-border p-4">
          {s.chapterTitle.replace(/^[\d.]+\s+/, "").toLowerCase() !== s.headingText.toLowerCase() && (
            <p className="text-xs text-muted-foreground mb-1">{s.chapterTitle}</p>
          )}
          {/* Plain <a>: the chapter body renders lazily, so the anchor only resolves on a full page load. */}
          <a
            href={sectionHref(s)}
            className="font-medium underline-offset-2 hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
          >
            {s.headingText}
          </a>
          {s.excerpt && <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{s.excerpt}</p>}
        </li>
      ))}
    </ul>
  );
}

function BookName({ book }: { book: BookMeta }) {
  return (
    <>
      <span aria-hidden>{book.icon}</span> {book.title}
    </>
  );
}

export default async function ConceptPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const concept = getConcept(slug);
  if (!concept) notFound();

  const groups = BOOKS.map((book) => ({ book, sections: concept.sections.filter((s) => s.bookSlug === book.slug) })).filter(
    (g) => g.sections.length > 0
  );
  const bridges = groups.filter((g) => g.book.slug in BRIDGES);
  const deepDives = groups.filter((g) => !(g.book.slug in BRIDGES));
  const starts = [
    ...bridges.map((g) => ({ id: g.book.slug, label: BRIDGES[g.book.slug] })),
    ...(deepDives.length ? [{ id: "deep-dives", label: "Deep dives" }] : []),
  ];

  const chapters = new Set(concept.sections.map((s) => `${s.bookSlug}/${s.chapterSlug}`));
  const related = getAllConcepts()
    .filter((c) => c.slug !== slug)
    .map((c) => ({ c, shared: new Set(c.sections.map((s) => `${s.bookSlug}/${s.chapterSlug}`).filter((k) => chapters.has(k))).size }))
    .filter((r) => r.shared > 0)
    .sort((a, b) => b.shared - a.shared)
    .slice(0, 6)
    .map((r) => r.c);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${concept.title} in Rust`,
    description: concept.summary,
    url: `${BASE_URL}/concepts/${slug}`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: concept.sections.map((s, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: s.headingText,
        url: `${BASE_URL}${sectionHref(s)}`,
      })),
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Link
        href="/concepts"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        All topics
      </Link>
      <h1 className="text-2xl lg:text-3xl font-bold tracking-tight mb-3">{concept.title}</h1>
      <p className="text-lg leading-relaxed mb-2">{concept.summary}</p>
      <p className="text-sm text-muted-foreground mb-8">
        {concept.sections.length} sections in {concept.bookCount} of Microsoft&apos;s Rust books, which are published as
        separate sites.
      </p>

      <h2 className="text-lg font-bold mb-2">Pick your starting point</h2>
      <p className="text-sm text-muted-foreground mb-3">
        Start with the book for the language you know, then follow the deep dives.
      </p>
      <nav aria-label="Starting points">
        <ul className="flex flex-wrap gap-2 text-sm">
          {starts.map(({ id, label }) => (
            <li key={id}>
              <a
                href={`#${id}`}
                className="inline-block rounded-full border border-border px-3 py-1 hover:border-primary/40 hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {bridges.map((g) => (
        <section key={g.book.slug} aria-labelledby={g.book.slug} className="mt-10">
          <h2 id={g.book.slug} className="text-lg font-bold scroll-mt-20">
            {BRIDGES[g.book.slug]}
          </h2>
          <p className="text-sm text-muted-foreground">
            <BookName book={g.book} />
          </p>
          <SectionList sections={g.sections} />
        </section>
      ))}

      {deepDives.length > 0 && (
        <section aria-labelledby="deep-dives" className="mt-10">
          <h2 id="deep-dives" className="text-lg font-bold scroll-mt-20">
            Deep dives
          </h2>
          {deepDives.map((g) => (
            <div key={g.book.slug} className="mt-4">
              <h3 className="text-sm font-semibold text-muted-foreground">
                <BookName book={g.book} />
              </h3>
              <SectionList sections={g.sections} />
            </div>
          ))}
        </section>
      )}

      {related.length > 0 && (
        <section aria-labelledby="related" className="mt-12 border-t border-border pt-6">
          <h2 id="related" className="text-sm font-semibold mb-3">
            Related topics
          </h2>
          <ul className="flex flex-wrap gap-2">
            {related.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/concepts/${c.slug}`}
                  className="inline-block rounded-full border border-border px-2.5 py-0.5 text-xs hover:border-primary/40 hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {c.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
