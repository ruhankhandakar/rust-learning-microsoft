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

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [readSet, setReadSet] = useState<Set<string>>(new Set());

  useEffect(() => {
    getReadChapters()
      .then((records) => setReadSet(new Set(records.map((r) => r.id))))
      .catch(() => {
        // IndexedDB unavailable — progress won't persist but app still works
      });
  }, []);

  const markRead = useCallback(
    (bookSlug: string, chapterSlug: string) => {
      const key = `${bookSlug}/${chapterSlug}`;
      setReadSet((prev) => {
        if (prev.has(key)) return prev;
        dbMark(bookSlug, chapterSlug);
        return new Set(prev).add(key);
      });
    },
    []
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
