import type { Metadata } from "next";
import fs from "fs";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HomeButton } from "@/components/home-button";
import { SearchTrigger } from "@/components/search-trigger";
import { SettingsDropdownLazy as SettingsDropdown } from "@/components/settings-dropdown-lazy";
import {
  getRust100ProjectByChapterSlug,
  loadRust100Manifest,
} from "@/lib/rust-100-projects";
import {
  listProjectSourceDir,
  readProjectSourceFile,
  resolveProjectSourcePath,
} from "@/lib/rust-100-project-source";
import {
  projectBlobGithubUrl,
  projectTreeGithubUrl,
} from "@/lib/rust-100-projects-public";
import { Rust100SourceCopyButton } from "@/components/rust-100-source-copy-button";
import { ChevronRight, ExternalLink, File, Folder } from "lucide-react";

const BOOK_SLUG = "100-rust-projects";

export const dynamic = "force-dynamic";

const BASE_URL = "https://rust.learningz.xyz";

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ chapterSlug: string; segments?: string[] }>;
}): Promise<Metadata> {
  const { chapterSlug, segments } = await params;
  const manifest = loadRust100Manifest();
  const p = getRust100ProjectByChapterSlug(manifest, chapterSlug);
  const titleBase = p?.title ?? chapterSlug;
  const rel = segments?.length ? segments.join("/") : "";
  const title = rel
    ? `${rel} — ${titleBase} (source)`
    : `${titleBase} — source tree`;
  return {
    title,
    description: `Browse synced project files for ${titleBase} from emmaglorypraise/100rustprojects.`,
    openGraph: {
      title,
      url: `${BASE_URL}/books/${BOOK_SLUG}/${chapterSlug}/source${rel ? `/${rel}` : ""}`,
      siteName: "100 Rust Projects | Ruhan Khandakar",
    },
  };
}

export default async function Rust100SourcePage({
  params,
}: {
  params: Promise<{ chapterSlug: string; segments?: string[] }>;
}) {
  const { chapterSlug, segments } = await params;
  const manifest = loadRust100Manifest();
  const project = getRust100ProjectByChapterSlug(manifest, chapterSlug);

  if (!project?.projectDir) notFound();

  const resolved = resolveProjectSourcePath(project.projectDir, segments);
  if (!resolved) notFound();

  const treeUrl = projectTreeGithubUrl(project.projectDir);
  const basePath = `/books/${BOOK_SLUG}/${chapterSlug}/source`;

  const stat = fs.statSync(resolved.absolute);

  if (stat.isDirectory()) {
    const entries = listProjectSourceDir(resolved.absolute);
    const parentHref =
      segments?.length && segments.length > 0
        ? `${basePath}${segments.length > 1 ? `/${segments.slice(0, -1).join("/")}` : ""}`
        : `/books/${BOOK_SLUG}/${chapterSlug}`;

    return (
      <div className="min-h-screen flex flex-col">
        <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
          <div className="flex items-center gap-2 px-4 h-14 flex-wrap">
            <HomeButton />
            <span className="text-muted-foreground">/</span>
            <Link
              href={`/books/${BOOK_SLUG}`}
              className="text-sm text-muted-foreground hover:text-primary"
            >
              100 Projects
            </Link>
            <span className="text-muted-foreground">/</span>
            <Link
              href={`/books/${BOOK_SLUG}/${chapterSlug}`}
              className="text-sm text-muted-foreground hover:text-primary truncate max-w-[8rem] sm:max-w-none"
            >
              Notes
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="text-sm font-medium truncate">Source</span>
            <div className="ml-auto flex items-center gap-2 shrink-0">
              <SearchTrigger />
              <SettingsDropdown />
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-4xl w-full px-6 py-6 flex-1">
          <nav className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground mb-4">
            <Link href={`/books/${BOOK_SLUG}`} className="hover:text-primary">
              100rustprojects
            </Link>
            <ChevronRight className="h-3.5 w-3.5 shrink-0" />
            <span>projects</span>
            <ChevronRight className="h-3.5 w-3.5 shrink-0" />
            <Link
              href={basePath}
              className="hover:text-primary font-medium text-foreground"
            >
              {project.projectDir}
            </Link>
            {segments?.map((seg, i) => (
              <span key={`${i}-${seg}`} className="flex items-center gap-1">
                <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                <Link
                  href={`${basePath}/${segments.slice(0, i + 1).join("/")}`}
                  className="hover:text-primary truncate max-w-[12rem]"
                >
                  {seg}
                </Link>
              </span>
            ))}
          </nav>

          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h1 className="text-lg font-semibold tracking-tight">
              {resolved.relative || project.projectDir}
            </h1>
            {treeUrl && (
              <a
                href={
                  resolved.relative
                    ? projectBlobGithubUrl(project.projectDir, resolved.relative)
                    : treeUrl
                }
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                View on GitHub
              </a>
            )}
          </div>

          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
                  <th className="px-4 py-2 font-medium">Name</th>
                  <th className="px-4 py-2 font-medium w-24 text-right hidden sm:table-cell">
                    Size
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border/60 hover:bg-accent/40">
                  <td className="px-4 py-2.5" colSpan={2}>
                    <Link
                      href={parentHref}
                      className="inline-flex items-center gap-2 text-primary font-medium"
                    >
                      ..
                    </Link>
                  </td>
                </tr>
                {entries.map((e) => {
                  const childRel = resolved.relative
                    ? `${resolved.relative}/${e.name}`
                    : e.name;
                  const href =
                    e.kind === "dir"
                      ? `${basePath}/${childRel}`
                      : `${basePath}/${childRel}`;
                  return (
                    <tr
                      key={e.name}
                      className="border-b border-border/60 last:border-0 hover:bg-accent/30"
                    >
                      <td className="px-4 py-2.5">
                        <Link
                          href={href}
                          className="inline-flex items-center gap-2 hover:text-primary"
                        >
                          {e.kind === "dir" ? (
                            <Folder className="h-4 w-4 text-sky-500 shrink-0" />
                          ) : (
                            <File className="h-4 w-4 text-muted-foreground shrink-0" />
                          )}
                          <span className="font-mono text-[13px]">{e.name}</span>
                        </Link>
                      </td>
                      <td className="px-4 py-2.5 text-right text-muted-foreground tabular-nums hidden sm:table-cell">
                        {e.kind === "file" && e.size !== null
                          ? formatBytes(e.size)
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (!stat.isFile()) notFound();

  const raw = readProjectSourceFile(resolved.absolute);
  const blobGh = projectBlobGithubUrl(project.projectDir, resolved.relative);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="flex items-center gap-2 px-4 h-14 flex-wrap">
          <HomeButton />
          <span className="text-muted-foreground">/</span>
          <Link
            href={`/books/${BOOK_SLUG}`}
            className="text-sm text-muted-foreground hover:text-primary"
          >
            100 Projects
          </Link>
          <span className="text-muted-foreground">/</span>
          <Link
            href={`/books/${BOOK_SLUG}/${chapterSlug}`}
            className="text-sm text-muted-foreground hover:text-primary truncate max-w-[8rem] sm:max-w-none"
          >
            Notes
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="text-sm font-medium truncate">Source</span>
          <div className="ml-auto flex items-center gap-2 shrink-0">
            <SearchTrigger />
            <SettingsDropdown />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl w-full px-6 py-6 flex-1">
        <nav className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground mb-4">
          <Link href={`/books/${BOOK_SLUG}`} className="hover:text-primary">
            100rustprojects
          </Link>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          <span>projects</span>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          <Link href={basePath} className="hover:text-primary">
            {project.projectDir}
          </Link>
          {segments &&
            segments.length > 1 &&
            segments.slice(0, -1).map((seg, i) => (
              <span key={`${i}-${seg}`} className="flex items-center gap-1">
                <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                <Link
                  href={`${basePath}/${segments.slice(0, i + 1).join("/")}`}
                  className="hover:text-primary truncate max-w-[10rem]"
                >
                  {seg}
                </Link>
              </span>
            ))}
          {segments && segments.length > 0 && (
            <>
              <ChevronRight className="h-3.5 w-3.5 shrink-0" />
              <span className="text-foreground font-medium truncate max-w-[12rem]">
                {segments[segments.length - 1]}
              </span>
            </>
          )}
        </nav>

        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h1 className="text-lg font-semibold font-mono text-[13px] sm:text-sm tracking-tight break-all">
            {resolved.relative}
          </h1>
          <a
            href={blobGh}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary shrink-0"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            View on GitHub
          </a>
        </div>

        {raw.kind === "large" && (
          <p className="text-sm text-muted-foreground border border-border rounded-lg p-6">
            This file is too large to display in the browser. Open it on GitHub
            instead.
          </p>
        )}
        {raw.kind === "binary" && (
          <p className="text-sm text-muted-foreground border border-border rounded-lg p-6">
            Binary file — open on GitHub to download or view.
          </p>
        )}
        {raw.kind === "text" && (
          <div className="relative rounded-lg border border-border bg-muted/30 overflow-hidden">
            <Rust100SourceCopyButton text={raw.content} />
            <pre className="p-4 pt-12 overflow-x-auto text-xs leading-relaxed font-mono">
              <code>{raw.content}</code>
            </pre>
          </div>
        )}

        <p className="mt-6 text-center">
          <Link
            href={`${basePath}${segments && segments.length > 1 ? `/${segments.slice(0, -1).join("/")}` : ""}`}
            className="text-sm text-primary hover:underline"
          >
            ← Back to folder
          </Link>
        </p>
      </div>
    </div>
  );
}
