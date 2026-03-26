"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Bookmark, X, Trash2 } from "lucide-react";
import { useBookmarks } from "./bookmark-provider";
import { BOOKS } from "@/lib/books";

export function BookmarksPanel() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const { bookmarks, toggleBookmark } = useBookmarks();

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const grouped = bookmarks.reduce(
    (acc, b) => {
      const key = b.book_slug;
      if (!acc[key]) acc[key] = [];
      acc[key].push(b);
      return acc;
    },
    {} as Record<string, typeof bookmarks>
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent transition-colors"
      >
        <Bookmark className="h-4 w-4" />
        Bookmarks
        {bookmarks.length > 0 && (
          <span className="ml-auto text-[10px] bg-primary/10 text-primary rounded-full px-1.5 py-0.5 font-semibold">
            {bookmarks.length}
          </span>
        )}
      </button>

      {open &&
        createPortal(
          <>
            <div
              className="fixed inset-0 bg-black/50 z-[9998] animate-in fade-in duration-200"
              onClick={() => setOpen(false)}
            />
            <div
              ref={panelRef}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-card border-l border-border shadow-2xl z-[9999] animate-in slide-in-from-right duration-200 flex flex-col"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <Bookmark className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">Bookmarks</h2>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-accent transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {bookmarks.length === 0 ? (
                  <div className="text-center text-muted-foreground py-12">
                    <Bookmark className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No bookmarks yet</p>
                    <p className="text-xs mt-1">
                      Hover over a heading in any chapter and click the bookmark
                      icon
                    </p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {Object.entries(grouped).map(([bookSlug, items]) => {
                      const book = BOOKS.find((b) => b.slug === bookSlug);
                      return (
                        <div key={bookSlug}>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                            {book?.icon} {book?.shortTitle ?? bookSlug}
                          </p>
                          <div className="space-y-1">
                            {items.map((bm) => (
                              <div
                                key={`${bm.chapter_slug}#${bm.heading_id}`}
                                className="group flex items-start gap-2 rounded-lg px-3 py-2 hover:bg-accent transition-colors"
                              >
                                <Link
                                  href={`/books/${bm.book_slug}/${bm.chapter_slug}#${bm.heading_id}`}
                                  onClick={() => setOpen(false)}
                                  className="flex-1 min-w-0"
                                >
                                  <p className="text-sm font-medium truncate">
                                    {bm.heading_text}
                                  </p>
                                  <p className="text-[11px] text-muted-foreground truncate">
                                    {bm.chapter_slug}
                                  </p>
                                </Link>
                                <button
                                  onClick={() =>
                                    toggleBookmark({
                                      book_slug: bm.book_slug,
                                      chapter_slug: bm.chapter_slug,
                                      heading_id: bm.heading_id,
                                      heading_text: bm.heading_text,
                                    })
                                  }
                                  className="h-7 w-7 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all shrink-0"
                                  title="Remove bookmark"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </>,
          document.body
        )}
    </>
  );
}
