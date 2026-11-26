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
  unmarkChapterRead as dbUnmark,
} from "@/lib/progress-db";
import { useSessionLite } from "./session-provider";
import { getSyncOwner, setSyncOwner } from "@/lib/learner-store";

const OWNER_KEY = "rt:progress-owner";

interface ProgressContextValue {
  readSet: Set<string>;
  markRead: (bookSlug: string, chapterSlug: string) => void;
  toggleRead: (bookSlug: string, chapterSlug: string) => void;
  getBookProgress: (bookSlug: string, total: number) => number;
}

const ProgressContext = createContext<ProgressContextValue>({
  readSet: new Set(),
  markRead: () => {},
  toggleRead: () => {},
  getBookProgress: () => 0,
});

export function useProgress() {
  return useContext(ProgressContext);
}

async function pullCloudProgress(): Promise<
  { book_slug: string; chapter_slug: string }[] | null
> {
  try {
    const res = await fetch("/api/progress");
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
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

async function deleteFromCloud(bookSlug: string, chapterSlug: string) {
  try {
    await fetch("/api/progress", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookSlug, chapterSlug }),
    });
  } catch {
    // offline
  }
}

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [readSet, setReadSet] = useState<Set<string>>(new Set());
  const { user } = useSessionLite();
  const isLoggedIn = !!user;
  const userId = user?.id;

  useEffect(() => {
    let cancelled = false;

    async function loadAndMerge() {
      let localRecords = await getReadChapters().catch(() => []);
      const localKeys = new Set(localRecords.map((r) => r.id));

      if (!userId) {
        if (!cancelled) setReadSet(localKeys);
        return;
      }

      const cloudRecords = await pullCloudProgress();
      if (!cloudRecords) {
        if (!cancelled) setReadSet(localKeys);
        return;
      }
      // Rows left by another account in this browser are dropped, not uploaded into this one.
      if ((getSyncOwner(OWNER_KEY) ?? userId) !== userId) {
        for (const r of localRecords) await dbUnmark(r.bookSlug, r.chapterSlug);
        localRecords = [];
        localKeys.clear();
      }
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

      setSyncOwner(userId, OWNER_KEY);
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
  }, [userId]);

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

  const toggleRead = useCallback(
    (bookSlug: string, chapterSlug: string) => {
      const key = `${bookSlug}/${chapterSlug}`;
      setReadSet((prev) => {
        const next = new Set(prev);
        if (next.has(key)) {
          next.delete(key);
          void dbUnmark(bookSlug, chapterSlug);
          if (isLoggedIn) void deleteFromCloud(bookSlug, chapterSlug);
        } else {
          next.add(key);
          void dbMark(bookSlug, chapterSlug);
          if (isLoggedIn) void pushToCloud([{ bookSlug, chapterSlug }]);
        }
        return next;
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
    <ProgressContext.Provider
      value={{ readSet, markRead, toggleRead, getBookProgress }}
    >
      {children}
    </ProgressContext.Provider>
  );
}
