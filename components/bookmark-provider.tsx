"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useSessionLite } from "./session-provider";
import {
  getAllBookmarks,
  addBookmark as localAdd,
  removeBookmark as localRemove,
  type LocalBookmark,
} from "@/lib/bookmarks-db";

export interface Bookmark {
  book_slug: string;
  chapter_slug: string;
  heading_id: string;
  heading_text: string;
  note: string | null;
  created_at: string;
}

interface BookmarkContextValue {
  bookmarks: Bookmark[];
  isBookmarked: (bookSlug: string, chapterSlug: string, headingId: string) => boolean;
  toggleBookmark: (b: Omit<Bookmark, "created_at" | "note">) => void;
}

const BookmarkContext = createContext<BookmarkContextValue>({
  bookmarks: [],
  isBookmarked: () => false,
  toggleBookmark: () => {},
});

export function useBookmarks() {
  return useContext(BookmarkContext);
}

async function pullCloud(): Promise<Bookmark[]> {
  try {
    const res = await fetch("/api/bookmarks");
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

async function pushCloud(entries: Omit<Bookmark, "created_at">[]) {
  try {
    await fetch("/api/bookmarks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entries),
    });
  } catch {}
}

async function deleteCloud(bookSlug: string, chapterSlug: string, headingId: string) {
  try {
    await fetch(
      `/api/bookmarks?book_slug=${bookSlug}&chapter_slug=${chapterSlug}&heading_id=${encodeURIComponent(headingId)}`,
      { method: "DELETE" }
    );
  } catch {}
}

function makeKey(b: string, c: string, h: string) {
  return `${b}/${c}#${h}`;
}

export function BookmarkProvider({ children }: { children: React.ReactNode }) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const { user } = useSessionLite();
  const isLoggedIn = !!user;

  useEffect(() => {
    let cancelled = false;

    async function loadAndMerge() {
      const local = await getAllBookmarks().catch(() => [] as LocalBookmark[]);
      const localMap = new Map(local.map((b) => [b.id, b]));

      if (!isLoggedIn) {
        if (!cancelled)
          setBookmarks(
            local.map((b) => ({
              book_slug: b.book_slug,
              chapter_slug: b.chapter_slug,
              heading_id: b.heading_id,
              heading_text: b.heading_text,
              note: b.note,
              created_at: new Date(b.created_at).toISOString(),
            }))
          );
        return;
      }

      const cloud = await pullCloud();
      const merged = new Map<string, Bookmark>();

      for (const c of cloud) {
        merged.set(makeKey(c.book_slug, c.chapter_slug, c.heading_id), c);
      }

      // Add local-only bookmarks and push to cloud
      const localOnly: Omit<Bookmark, "created_at">[] = [];
      for (const [key, lb] of localMap) {
        if (!merged.has(key)) {
          const bm: Bookmark = {
            book_slug: lb.book_slug,
            chapter_slug: lb.chapter_slug,
            heading_id: lb.heading_id,
            heading_text: lb.heading_text,
            note: lb.note,
            created_at: new Date(lb.created_at).toISOString(),
          };
          merged.set(key, bm);
          localOnly.push(bm);
        }
      }

      if (localOnly.length > 0) pushCloud(localOnly);

      // Persist cloud-only to IndexedDB
      for (const c of cloud) {
        const key = makeKey(c.book_slug, c.chapter_slug, c.heading_id);
        if (!localMap.has(key)) {
          localAdd({
            book_slug: c.book_slug,
            chapter_slug: c.chapter_slug,
            heading_id: c.heading_id,
            heading_text: c.heading_text,
            note: c.note,
          });
        }
      }

      if (!cancelled) setBookmarks([...merged.values()]);
    }

    loadAndMerge();
    window.addEventListener("online", loadAndMerge);
    return () => {
      cancelled = true;
      window.removeEventListener("online", loadAndMerge);
    };
  }, [isLoggedIn]);

  const isBookmarked = useCallback(
    (bookSlug: string, chapterSlug: string, headingId: string) =>
      bookmarks.some(
        (b) =>
          b.book_slug === bookSlug &&
          b.chapter_slug === chapterSlug &&
          b.heading_id === headingId
      ),
    [bookmarks]
  );

  const toggleBookmark = useCallback(
    (b: Omit<Bookmark, "created_at" | "note">) => {
      const exists = bookmarks.find(
        (x) =>
          x.book_slug === b.book_slug &&
          x.chapter_slug === b.chapter_slug &&
          x.heading_id === b.heading_id
      );

      if (exists) {
        localRemove(b.book_slug, b.chapter_slug, b.heading_id);
        if (isLoggedIn) deleteCloud(b.book_slug, b.chapter_slug, b.heading_id);
        setBookmarks((prev) =>
          prev.filter(
            (x) =>
              !(
                x.book_slug === b.book_slug &&
                x.chapter_slug === b.chapter_slug &&
                x.heading_id === b.heading_id
              )
          )
        );
      } else {
        const newBm: Bookmark = {
          ...b,
          note: null,
          created_at: new Date().toISOString(),
        };
        localAdd({
          book_slug: b.book_slug,
          chapter_slug: b.chapter_slug,
          heading_id: b.heading_id,
          heading_text: b.heading_text,
          note: null,
        });
        if (isLoggedIn) pushCloud([newBm]);
        setBookmarks((prev) => [newBm, ...prev]);
      }
    },
    [bookmarks, isLoggedIn]
  );

  return (
    <BookmarkContext.Provider value={{ bookmarks, isBookmarked, toggleBookmark }}>
      {children}
    </BookmarkContext.Provider>
  );
}
