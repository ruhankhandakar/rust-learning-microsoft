"use client";

import { useEffect, useRef, useState } from "react";
import { Star, X } from "lucide-react";

const DB_NAME = "star-prompt";
const STORE_NAME = "state";
const KEY = "star-prompt-state";
const ACTIVE_MS = 60_000;
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
  const [show, setShow] = useState(false);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      const state = await getState();
      if (state?.dismissed) return;
      if (state?.remindAfter && Date.now() < state.remindAfter) return;
      if (cancelled) return;

      timerRef.current = setTimeout(() => {
        if (!cancelled) {
          setShow(true);
          requestAnimationFrame(() => setVisible(true));
        }
      }, ACTIVE_MS);
    }

    check();
    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const dismiss = async () => {
    setVisible(false);
    setTimeout(() => setShow(false), 300);
    await setState({ dismissed: true, remindAfter: null });
  };

  const remindLater = async () => {
    setVisible(false);
    setTimeout(() => setShow(false), 300);
    await setState({ dismissed: false, remindAfter: Date.now() + REMIND_LATER_MS });
  };

  if (!show) return null;

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 max-w-sm w-[calc(100%-3rem)] sm:w-auto transition-all duration-300 ${
        visible
          ? "translate-y-0 opacity-100"
          : "translate-y-4 opacity-0"
      }`}
    >
      <div className="relative rounded-xl border border-border bg-background/95 backdrop-blur-lg shadow-2xl shadow-black/20 p-5">
        <button
          onClick={remindLater}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
            <Star className="h-5 w-5" fill="currentColor" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm leading-tight mb-1">
              Enjoying Rust Training?
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              A star on GitHub helps others discover this project and keeps it going!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 mt-3.5">
          <a
            href="https://github.com/ruhankhandakar/rust-learning-microsoft"
            target="_blank"
            rel="noopener noreferrer"
            onClick={dismiss}
            className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-[11px] font-medium text-primary-foreground hover:bg-primary/90 transition-colors whitespace-nowrap"
          >
            <Star className="h-3 w-3" />
            Star
          </a>
          <button
            onClick={remindLater}
            className="rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors whitespace-nowrap"
          >
            Later
          </button>
          <button
            onClick={dismiss}
            className="rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors whitespace-nowrap"
          >
            Don&apos;t show again
          </button>
        </div>
      </div>
    </div>
  );
}
