"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, BookOpen, ArrowRight, X, Loader2 } from "lucide-react";
import { Index as FlexIndex } from "flexsearch";

interface SearchEntry {
  bookSlug: string;
  bookTitle: string;
  bookIcon: string;
  chapterSlug: string;
  chapterTitle: string;
  preview: string;
}

export function SearchDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [entries, setEntries] = useState<SearchEntry[] | null>(null);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const flexRef = useRef<FlexIndex | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/search")
      .then((r) => r.json())
      .then((data: SearchEntry[]) => {
        setEntries(data);
        const index = new FlexIndex({
          tokenize: "forward",
          resolution: 9,
        });
        data.forEach((entry, i) => {
          index.add(
            i,
            `${entry.chapterTitle} ${entry.bookTitle} ${entry.preview}`
          );
        });
        flexRef.current = index;
      })
      .catch(() => {
        // Search unavailable — degrade gracefully
        setEntries([]);
      });
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const filtered = useMemo(() => {
    if (!entries || !flexRef.current || query.length < 2) return [];
    const ids = flexRef.current.search(query, { limit: 30 }) as number[];
    return ids.map((id) => entries[id]);
  }, [entries, query]);

  useEffect(() => {
    setSelectedIdx(0);
  }, [query]);

  useEffect(() => {
    const active = resultsRef.current?.querySelector("[data-selected='true']");
    active?.scrollIntoView({ block: "nearest" });
  }, [selectedIdx]);

  const navigate = useCallback(
    (entry: SearchEntry) => {
      router.push(`/books/${entry.bookSlug}/${entry.chapterSlug}`);
      onClose();
    },
    [router, onClose]
  );

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && filtered[selectedIdx]) {
      navigate(filtered[selectedIdx]);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-xl mx-4 bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 border-b border-border">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search all books..."
            className="flex-1 h-12 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div ref={resultsRef} className="max-h-80 overflow-y-auto p-2">
          {!entries && (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Loading index...
            </div>
          )}

          {entries && query.length < 2 && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Type at least 2 characters to search across all 7 books
            </div>
          )}

          {entries && query.length >= 2 && filtered.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No results for &ldquo;{query}&rdquo;
            </div>
          )}

          {filtered.map((entry, i) => (
            <button
              key={`${entry.bookSlug}/${entry.chapterSlug}`}
              data-selected={i === selectedIdx}
              onClick={() => navigate(entry)}
              onMouseEnter={() => setSelectedIdx(i)}
              className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                i === selectedIdx
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-accent"
              }`}
            >
              <BookOpen className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate">
                  {entry.chapterTitle}
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <span>{entry.bookIcon}</span>
                  <span>{entry.bookTitle}</span>
                </div>
              </div>
              {i === selectedIdx && (
                <ArrowRight className="h-4 w-4 mt-0.5 shrink-0" />
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 px-4 py-2 border-t border-border text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <kbd className="px-1 rounded border border-border bg-muted font-mono">
              ↑↓
            </kbd>
            navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 rounded border border-border bg-muted font-mono">
              ↵
            </kbd>
            open
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 rounded border border-border bg-muted font-mono">
              esc
            </kbd>
            close
          </span>
        </div>
      </div>
    </div>
  );
}
