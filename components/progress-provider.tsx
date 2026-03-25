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
  type ChapterProgress,
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
    getReadChapters().then((records) => {
      setReadSet(new Set(records.map((r) => r.id)));
    });
  }, []);

  const markRead = useCallback(
    (bookSlug: string, chapterSlug: string) => {
      const key = `${bookSlug}/${chapterSlug}`;
      if (readSet.has(key)) return;
      dbMark(bookSlug, chapterSlug);
      setReadSet((prev) => new Set(prev).add(key));
    },
    [readSet]
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
