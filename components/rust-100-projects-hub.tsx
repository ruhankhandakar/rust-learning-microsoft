"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SearchTrigger } from "@/components/search-trigger";
import { SettingsDropdownLazy as SettingsDropdown } from "@/components/settings-dropdown-lazy";
import { HomeButton } from "@/components/home-button";
import { BookProgressBar } from "@/components/book-progress";
import { BookCacheTrigger } from "@/components/book-cache-trigger";
import { ProjectMarkDoneButton } from "@/components/project-mark-done-button";
import type { Rust100ProjectEntry } from "@/lib/rust-100-projects-types";
import { projectTreeGithubUrl } from "@/lib/rust-100-projects-public";
import { Badge } from "@/components/ui/badge";
import { BookOpen, ChevronRight, ExternalLink, FileText } from "lucide-react";
import { APP_VERSION } from "@/lib/version";
import type { BookMeta } from "@/lib/books";

const BOOK_SLUG = "100-rust-projects";

function categoryKey(p: Rust100ProjectEntry): string {
  const t = `${p.typeLabel} ${p.status}`;
  if (p.status.includes("WIP")) return "wip";
  if (t.includes("🌐")) return "web";
  if (t.includes("💾")) return "database";
  if (t.includes("🧠")) return "algorithms";
  if (t.includes("🕸️")) return "wasm";
  return "cli";
}

const CATEGORY_LABEL: Record<string, string> = {
  all: "All",
  cli: "CLI",
  web: "Web / HTTP",
  database: "Database",
  algorithms: "Data / algorithms",
  wasm: "WebAssembly",
  wip: "WIP",
};

export function Rust100ProjectsHub({
  book,
  projects,
  totalChapters,
  allChapterSlugs,
}: {
  book: BookMeta;
  projects: Rust100ProjectEntry[];
  totalChapters: number;
  allChapterSlugs: string[];
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return projects.filter((p) => {
      if (cat !== "all" && categoryKey(p) !== cat) return false;
      if (!query) return true;
      const blob = `${p.title} ${p.typeLabel} ${p.day}`.toLowerCase();
      return blob.includes(query);
    });
  }, [projects, q, cat]);

  const categories = useMemo(() => {
    const s = new Set(projects.map(categoryKey));
    return ["all", ...Array.from(s).sort((a, b) => {
      const order = ["cli", "web", "database", "algorithms", "wasm", "wip"];
      return order.indexOf(a) - order.indexOf(b);
    })];
  }, [projects]);

  return (
    <div className="min-h-screen flex flex-col">
      <BookCacheTrigger bookSlug={BOOK_SLUG} chapterSlugs={allChapterSlugs} />
      <nav className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-5xl px-6 flex items-center justify-between h-14">
          <HomeButton />
          <div className="flex items-center gap-2">
            <SearchTrigger />
            <SettingsDropdown />
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-5xl w-full px-6 flex-1 py-8">
        <div className="flex flex-col sm:flex-row sm:items-start gap-6 mb-10">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-accent text-4xl">
            {book.icon}
          </div>
          <div className="min-w-0 flex-1">
            <Badge variant="secondary" className="mb-2 bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200">
              {book.level}
            </Badge>
            <h1 className="text-2xl font-bold tracking-tight">{book.title}</h1>
            <p className="text-sm text-muted-foreground mt-2 max-w-2xl leading-relaxed">
              {book.description}
            </p>
            <p className="text-xs text-muted-foreground mt-3">
              Notes and project links from{" "}
              <a
                href="https://github.com/emmaglorypraise/100rustprojects"
                className="text-primary hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                emmaglorypraise/100rustprojects
              </a>{" "}
              by{" "}
              <a
                href="https://x.com/emmaglorypraise"
                className="text-primary hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Glory Praise Emmanuel
              </a>
              .
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <FileText className="h-3.5 w-3.5" />
                {projects.length} projects
              </span>
            </div>
            <div className="mt-3 max-w-sm">
              <BookProgressBar
                bookSlug={BOOK_SLUG}
                totalChapters={totalChapters}
              />
            </div>
            <Link
              href={`/books/${BOOK_SLUG}/glossary`}
              className="inline-flex h-10 items-center gap-2 mt-5 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-rust-dark"
            >
              <BookOpen className="h-4 w-4" />
              Open glossary
            </Link>
          </div>
        </div>

        <div className="space-y-4 mb-8">
          <input
            type="search"
            placeholder="Search projects…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="flex h-10 w-full max-w-md rounded-md border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
          />
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCat(c)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  cat === c
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:bg-accent"
                }`}
              >
                {CATEGORY_LABEL[c] ?? c}
              </button>
            ))}
          </div>
        </div>

        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">
          Projects
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((p) => {
            const gh = projectTreeGithubUrl(p.projectDir);
            return (
              <div
                key={p.chapterSlug}
                className="group rounded-xl border border-border p-4 hover:border-primary/30 hover:bg-accent/30 transition-colors flex flex-col gap-3 cursor-pointer"
                role="link"
                tabIndex={0}
                onClick={(e) => {
                  const target = e.target as HTMLElement;
                  if (target.closest("a,button,input,textarea,select,label")) return;
                  router.push(`/books/${BOOK_SLUG}/${p.chapterSlug}`);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    router.push(`/books/${BOOK_SLUG}/${p.chapterSlug}`);
                  }
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="flex h-7 min-w-[2rem] items-center justify-center rounded-md bg-muted text-[11px] font-bold tabular-nums">
                    {String(p.day).padStart(3, "0")}
                  </span>
                  <ProjectMarkDoneButton
                    bookSlug={BOOK_SLUG}
                    chapterSlug={p.chapterSlug}
                  />
                </div>
                <Link
                  href={`/books/${BOOK_SLUG}/${p.chapterSlug}`}
                  className="font-medium text-sm leading-snug group-hover:text-primary transition-colors"
                >
                  {p.title}
                </Link>
                <p className="text-[11px] text-muted-foreground line-clamp-2">
                  {p.typeLabel}
                  {p.status.includes("WIP") ? ` · ${p.status}` : ""}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-auto pt-1">
                  <Link
                    href={`/books/${BOOK_SLUG}/${p.chapterSlug}`}
                    className="inline-flex items-center gap-1 text-xs font-medium text-primary"
                  >
                    Read notes
                    <ChevronRight className="h-3 w-3" />
                  </Link>
                  {p.projectDir && (
                    <Link
                      href={`/books/${BOOK_SLUG}/${p.chapterSlug}/source`}
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
                    >
                      Browse source
                    </Link>
                  )}
                  {gh && (
                    <a
                      href={gh}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
                    >
                      <ExternalLink className="h-3 w-3" />
                      GitHub
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground py-12 text-center">
            No projects match your filters.
          </p>
        )}
      </div>

      <footer className="border-t border-border mt-auto">
        <div className="mx-auto max-w-5xl px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>
            <a
              href="https://github.com/emmaglorypraise/100rustprojects"
              className="hover:text-primary"
              target="_blank"
              rel="noopener noreferrer"
            >
              emmaglorypraise/100rustprojects
            </a>
          </p>
          <span>v{APP_VERSION}</span>
        </div>
      </footer>
    </div>
  );
}
