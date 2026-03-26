"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import {
  getReadChapters,
  markChapterRead as dbMark,
} from "@/lib/progress-db";
import { useSessionLite } from "./session-provider";

interface ProgressContextValue {
  readSet: Set<string>;
  markRead: (bookSlug: string, chapterSlug: string) => void;
  getBookProgress: (bookSlug: string, total: number) => number;
}

const ProgressContext = createContext<ProgressContextValue>({
  readSet: new Set(),
  markRead: () => {},
  getBookProgress: () => 0,
});

export function useProgress() {
  return useContext(ProgressContext);
}

async function pullCloudProgress(): Promise<
  { book_slug: string; chapter_slug: string }[]
> {
  try {
    const res = await fetch("/api/progress");
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

async function pushToCloud(
  entries: { bookSlug: string; chapterSlug: string }[]
) {
  try {
    await fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entries),
    });
  } catch {
    // Offline or error — will sync next time
  }
}

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [readSet, setReadSet] = useState<Set<string>>(new Set());
  const { user } = useSessionLite();
  const isLoggedIn = !!user;

  useEffect(() => {
    let cancelled = false;

    async function loadAndMerge() {
      const localRecords = await getReadChapters().catch(() => []);
      const localKeys = new Set(localRecords.map((r) => r.id));

      if (!isLoggedIn) {
        if (!cancelled) setReadSet(localKeys);
        return;
      }

      const cloudRecords = await pullCloudProgress();
      const merged = new Set(localKeys);

      for (const cr of cloudRecords) {
        merged.add(`${cr.book_slug}/${cr.chapter_slug}`);
      }

      // Persist cloud-only entries to IndexedDB
      for (const cr of cloudRecords) {
        const key = `${cr.book_slug}/${cr.chapter_slug}`;
        if (!localKeys.has(key)) {
          dbMark(cr.book_slug, cr.chapter_slug);
        }
      }

      // Push local-only entries to cloud
      const cloudKeys = new Set(
        cloudRecords.map((cr) => `${cr.book_slug}/${cr.chapter_slug}`)
      );
      const localOnly = localRecords.filter((r) => !cloudKeys.has(r.id));
      if (localOnly.length > 0) {
        await pushToCloud(
          localOnly.map((r) => ({
            bookSlug: r.bookSlug,
            chapterSlug: r.chapterSlug,
          }))
        );
      }

      if (!cancelled) setReadSet(merged);
    }

    loadAndMerge();

    function onOnline() {
      if (!cancelled) loadAndMerge();
    }

    window.addEventListener("online", onOnline);
    return () => {
      cancelled = true;
      window.removeEventListener("online", onOnline);
    };
  }, [isLoggedIn]);

  const markRead = useCallback(
    (bookSlug: string, chapterSlug: string) => {
      const key = `${bookSlug}/${chapterSlug}`;
      setReadSet((prev) => {
        if (prev.has(key)) return prev;
        dbMark(bookSlug, chapterSlug);
        if (isLoggedIn) {
          pushToCloud([{ bookSlug, chapterSlug }]);
        }
        return new Set(prev).add(key);
      });
    },
    [isLoggedIn]
  );

  const getBookProgress = useCallback(
    (bookSlug: string, total: number) => {
      if (total === 0) return 0;
      let count = 0;
      readSet.forEach((key) => {
        if (key.startsWith(bookSlug + "/")) count++;
      });
      return count;
    },
    [readSet]
  );

  return (
    <ProgressContext.Provider value={{ readSet, markRead, getBookProgress }}>
      {children}
    </ProgressContext.Provider>
  );
}
