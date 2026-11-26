"use client";

import { useEffect, useState } from "react";
import { Star, X } from "lucide-react";
import { useProgress } from "@/components/progress-provider";
import { CHAPTER_END_EVENT } from "@/components/chapter-feedback";

const DB_NAME = "star-prompt";
const STORE_NAME = "state";
const KEY = "star-prompt-state";
const MIN_CHAPTERS = 3;
const REMIND_LATER_MS = 24 * 60 * 60 * 1000;

interface PromptState {
  dismissed: boolean;
  remindAfter: number | null;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getState(): Promise<PromptState | null> {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).get(KEY);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => resolve(null);
  });
}

async function setState(state: PromptState) {
  const db = await openDB();
  return new Promise<void>((resolve) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(state, KEY);
    tx.oncomplete = () => resolve();
  });
}

export function StarPrompt() {
  const { readSet } = useProgress();
  const [show, setShow] = useState(false);
  const [visible, setVisible] = useState(false);
  const read = readSet.size;

  useEffect(() => {
    if (read < MIN_CHAPTERS || show) return;
    let cancelled = false;

    async function onChapterEnd() {
      if (/bot|crawl|spider|slurp|googlebot/i.test(navigator.userAgent)) return;
      const state = await getState();
      if (cancelled || state?.dismissed) return;
      if (state?.remindAfter && Date.now() < state.remindAfter) return;
      setShow(true);
      requestAnimationFrame(() => setVisible(true));
    }

    window.addEventListener(CHAPTER_END_EVENT, onChapterEnd, { once: true });
    return () => {
      cancelled = true;
      window.removeEventListener(CHAPTER_END_EVENT, onChapterEnd);
    };
  }, [read, show]);

  const close = (state: PromptState) => {
    setVisible(false);
    setTimeout(() => setShow(false), 300);
    setState(state);
  };
  const dismiss = () => close({ dismissed: true, remindAfter: null });
  const remindLater = () => close({ dismissed: false, remindAfter: Date.now() + REMIND_LATER_MS });

  if (!show) return null;

  return (
    <div
      role="status"
      className={`fixed bottom-6 right-3 z-50 w-[calc(100%-1.5rem)] max-w-md transition-[transform,opacity] duration-300 motion-reduce:transition-none sm:right-6 sm:w-auto ${
        visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      }`}
    >
      <div className="relative rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-[0_12px_32px_-8px_rgb(0_0_0/0.45)]">
        <button
          type="button"
          onClick={remindLater}
          className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
          aria-label="Close"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
        <p className="mb-1 pr-6 font-semibold">You&apos;ve read {read} chapters. Nice work.</p>
        <p className="text-sm text-muted-foreground">If this site helped, a star on GitHub helps other learners find it.</p>
        <div className="mt-4 flex flex-wrap items-center gap-1 sm:gap-2">
          <a
            href="https://github.com/ruhankhandakar/rust-learning-microsoft"
            target="_blank"
            rel="noopener noreferrer nofollow"
            onClick={dismiss}
            className="inline-flex min-h-10 items-center gap-1.5 whitespace-nowrap rounded-[10px] bg-primary px-3 text-[13px] font-semibold max-[360px]:px-2 max-[360px]:text-xs sm:px-4 sm:text-sm text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Star className="hidden h-4 w-4 sm:block" aria-hidden="true" />
            Star on GitHub
          </a>
          <button
            type="button"
            onClick={remindLater}
            className="min-h-10 whitespace-nowrap rounded-[10px] px-2 text-[13px] font-medium max-[360px]:px-1 max-[360px]:text-xs sm:px-3 sm:text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Not now
          </button>
          <button
            type="button"
            onClick={dismiss}
            className="min-h-10 whitespace-nowrap rounded-[10px] px-2 text-[13px] font-medium max-[360px]:px-1 max-[360px]:text-xs sm:px-3 sm:text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Don&apos;t ask again
          </button>
        </div>
      </div>
    </div>
  );
}
