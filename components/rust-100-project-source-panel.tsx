"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ExternalLink, File, Folder, FolderTree } from "lucide-react";
import { ProjectMarkDoneButton } from "./project-mark-done-button";
import { Rust100SourceCopyButton } from "./rust-100-source-copy-button";
import {
  projectBlobGithubUrl,
  glossaryGithubUrl,
  projectTreeGithubUrl,
} from "@/lib/rust-100-projects-public";

const BOOK_SLUG = "100-rust-projects";

interface SourceListingEntry {
  name: string;
  kind: "dir" | "file";
  size: number | null;
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

/** Shared panel: browse in app, GitHub, mark done + file tree preview. */
export function Rust100ProjectSourcePanel({
  chapterSlug,
  projectDir,
  initialEntries = [],
  showActions = true,
}: {
  chapterSlug: string;
  projectDir: string;
  initialEntries?: SourceListingEntry[];
  showActions?: boolean;
}) {
  const [currentPath, setCurrentPath] = useState("");
  const [mode, setMode] = useState<"dir" | "file" | "large" | "binary">("dir");
  const [entries, setEntries] = useState<SourceListingEntry[]>(initialEntries);
  const [fileContent, setFileContent] = useState("");
  const [loading, setLoading] = useState(false);
  const initKeyRef = useRef<string>("");

  const parts = useMemo(
    () => (currentPath ? currentPath.split("/").filter(Boolean) : []),
    [currentPath]
  );
  const treeUrl = projectTreeGithubUrl(projectDir);
  const githubUrl = useMemo(() => {
    if (!treeUrl) return null;
    if (!currentPath) return treeUrl;
    if (mode === "dir") return `${treeUrl}/${currentPath}`;
    return projectBlobGithubUrl(projectDir, currentPath);
  }, [treeUrl, currentPath, mode, projectDir]);

  const loadPath = useCallback(
    async (nextPath: string) => {
      setLoading(true);
      try {
        const query = new URLSearchParams({
          chapterSlug,
          path: nextPath,
        }).toString();
        const res = await fetch(`/api/rust-100-source?${query}`);
        if (!res.ok) return;
        const data = await res.json();
        setCurrentPath(data.path ?? "");
        if (data.kind === "dir") {
          setMode("dir");
          setEntries(data.entries ?? []);
          setFileContent("");
        } else if (data.kind === "file") {
          setMode("file");
          setFileContent(data.content ?? "");
        } else if (data.kind === "large") {
          setMode("large");
          setFileContent("");
        } else {
          setMode("binary");
          setFileContent("");
        }
      } catch {
        // Request can fail during navigation/fast-refresh; keep current panel state.
      } finally {
        setLoading(false);
      }
    },
    [chapterSlug]
  );

  const openChild = useCallback(
    (entry: SourceListingEntry) => {
      const next = currentPath ? `${currentPath}/${entry.name}` : entry.name;
      void loadPath(next);
    },
    [currentPath, loadPath]
  );

  const goUp = useCallback(() => {
    if (!currentPath) return;
    const next = parts.slice(0, -1).join("/");
    void loadPath(next);
  }, [currentPath, parts, loadPath]);

  useEffect(() => {
    const key = `${chapterSlug}:${projectDir}`;
    if (initKeyRef.current === key) return;
    initKeyRef.current = key;

    setCurrentPath("");
    setMode("dir");
    setEntries(initialEntries);
    setFileContent("");
    if (initialEntries.length === 0) {
      void loadPath("");
    }
  }, [chapterSlug, projectDir, initialEntries, loadPath]);

  return (
    <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3 shadow-sm">
      <nav className="flex items-center gap-1 text-xs text-muted-foreground">
        <span>100rustprojects</span>
        <span>{">"}</span>
        <span>projects</span>
        <span>{">"}</span>
        <button
          type="button"
          onClick={() => void loadPath("")}
          className="text-foreground font-medium truncate hover:text-primary"
        >
          {projectDir}
        </button>
        {parts.map((part, i) => (
          <span key={`${part}-${i}`} className="flex items-center gap-1">
            <span>{">"}</span>
            {i === parts.length - 1 ? (
              <span className="inline-flex items-center gap-1.5 truncate max-w-[9rem] font-semibold text-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                {part}
              </span>
            ) : (
              <button
                type="button"
                onClick={() => void loadPath(parts.slice(0, i + 1).join("/"))}
                className="truncate max-w-[9rem] hover:text-primary"
              >
                {part}
              </button>
            )}
          </span>
        ))}
      </nav>
      <div className="flex items-center justify-between gap-2">
        <p className="text-2xl font-semibold tracking-tight text-foreground leading-none">
          {parts[parts.length - 1] ?? projectDir}
        </p>
        {!showActions && (
          <div className="flex items-center gap-2">
            {githubUrl && (
              <a
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary"
              >
                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                View on GitHub
              </a>
            )}
            <ProjectMarkDoneButton
              bookSlug={BOOK_SLUG}
              chapterSlug={chapterSlug}
              className="py-2"
            />
          </div>
        )}
      </div>
      {mode === "dir" && (
        <div className="rounded-lg border border-border bg-background overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-muted-foreground">
                <th className="px-3 py-2 text-left font-medium">Name</th>
                <th className="px-3 py-2 text-right font-medium w-20">Size</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border/60 hover:bg-accent/40">
                <td className="px-3 py-2.5" colSpan={2}>
                  <button
                    type="button"
                    onClick={goUp}
                    className="inline-flex items-center gap-1.5 hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed"
                    disabled={!currentPath || loading}
                  >
                    <span className="font-mono text-[11px]">..</span>
                  </button>
                </td>
              </tr>
              {entries.map((entry) => (
                <tr
                  key={`${entry.kind}-${entry.name}`}
                  className="border-b border-border/60 last:border-0 hover:bg-accent/40"
                >
                  <td className="px-3 py-2.5">
                    <button
                      type="button"
                      onClick={() => openChild(entry)}
                      className="inline-flex w-full items-center gap-1.5 hover:text-primary text-left disabled:opacity-60"
                      disabled={loading}
                    >
                      {entry.kind === "dir" ? (
                        <Folder className="h-3.5 w-3.5 text-sky-500 shrink-0" />
                      ) : (
                        <File className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      )}
                      <span className="font-mono text-[11px] truncate max-w-[12rem]">
                        {entry.name}
                      </span>
                    </button>
                  </td>
                  <td className="px-3 py-2.5 text-right text-muted-foreground tabular-nums">
                    {entry.kind === "file" && entry.size !== null
                      ? formatBytes(entry.size)
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {mode === "file" && (
        <div className="relative rounded-lg border border-border bg-background overflow-hidden">
          <Rust100SourceCopyButton text={fileContent} />
          <pre className="p-3 pt-12 overflow-x-auto text-[11px] leading-relaxed font-mono">
            <code>{fileContent}</code>
          </pre>
        </div>
      )}
      {mode === "large" && (
        <p className="rounded-lg border border-border bg-background p-4 text-xs text-muted-foreground">
          This file is too large to preview here.
        </p>
      )}
      {mode === "binary" && (
        <p className="rounded-lg border border-border bg-background p-4 text-xs text-muted-foreground">
          Binary file. Open on GitHub to view/download.
        </p>
      )}
      {showActions && (
        <div className="flex flex-col gap-2">
          <Link
            href={
              currentPath
                ? `/books/${BOOK_SLUG}/${chapterSlug}/source/${currentPath}`
                : `/books/${BOOK_SLUG}/${chapterSlug}/source`
            }
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-rust-dark transition-colors text-center"
          >
            <FolderTree className="h-3.5 w-3.5 shrink-0" />
            Browse source in app
          </Link>
          <div className="grid grid-cols-2 gap-2">
            {githubUrl && (
              <a
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2.5 text-xs font-medium text-foreground hover:bg-accent transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                GitHub
              </a>
            )}
            <ProjectMarkDoneButton
              bookSlug={BOOK_SLUG}
              chapterSlug={chapterSlug}
              className="justify-center py-2.5"
            />
          </div>
        </div>
      )}
    </div>
  );
}

/** Glossary-only: link to upstream file. */
export function Rust100ProjectGlossaryToolbar() {
  return (
    <div className="mb-8 pb-6 border-b border-border">
      <a
        href={glossaryGithubUrl()}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent transition-colors"
      >
        <ExternalLink className="h-3.5 w-3.5" />
        View on GitHub
      </a>
    </div>
  );
}
