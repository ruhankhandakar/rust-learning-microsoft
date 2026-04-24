"use client";

import { useCallback, useEffect, useState } from "react";
import { HardDrive, Trash2, Loader2 } from "lucide-react";

type Status = "idle" | "clearing" | "done";

function formatBytes(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "0 B";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

async function deleteAllIndexedDBs(): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  // `databases()` is not in older Safari; guard it.
  const anyIdb = indexedDB as IDBFactory & {
    databases?: () => Promise<Array<{ name?: string }>>;
  };
  if (typeof anyIdb.databases !== "function") return;
  try {
    const dbs = await anyIdb.databases();
    await Promise.all(
      dbs
        .map((d) => d.name)
        .filter((n): n is string => Boolean(n))
        .map(
          (name) =>
            new Promise<void>((resolve) => {
              const req = indexedDB.deleteDatabase(name);
              req.onsuccess = req.onerror = req.onblocked = () => resolve();
            })
        )
    );
  } catch {
    // no-op
  }
}

export function StorageUsage() {
  const [usage, setUsage] = useState<number | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [supported, setSupported] = useState(true);

  const refresh = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.storage?.estimate) {
      setSupported(false);
      return;
    }
    try {
      const est = await navigator.storage.estimate();
      setUsage(est.usage ?? 0);
    } catch {
      setSupported(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const clear = useCallback(async () => {
    setStatus("clearing");
    try {
      // 1. Unregister ALL service workers first. While any SW is still
      //    controlling the page, its fetch handler will re-populate caches
      //    the moment we delete them (networkFirstThenCache). Unregistering
      //    stops that race.
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister().catch(() => false)));
      }

      // 2. Wipe Cache Storage.
      if (typeof caches !== "undefined") {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k).catch(() => false)));
      }

      // 3. Wipe IndexedDB databases (best effort).
      await deleteAllIndexedDBs();

      setStatus("done");
      await refresh();

      // 4. Reload so a fresh SW registers against an empty cache.
      setTimeout(() => window.location.reload(), 700);
    } catch {
      setStatus("idle");
    }
  }, [refresh]);

  if (!supported) return null;

  return (
    <div className="px-3 pt-2 pb-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
        Storage
      </p>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <HardDrive className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="text-sm tabular-nums">
            {usage === null ? "…" : formatBytes(usage)}
          </span>
          <span className="text-[11px] text-muted-foreground truncate">
            used
          </span>
        </div>
        <button
          onClick={clear}
          disabled={status === "clearing"}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs font-medium hover:bg-accent transition-colors disabled:opacity-60"
          title="Clear cached pages, service worker caches, and local databases"
        >
          {status === "clearing" ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              Clearing…
            </>
          ) : (
            <>
              <Trash2 className="h-3 w-3" />
              Clear
            </>
          )}
        </button>
      </div>
      {status === "done" && (
        <p className="mt-1.5 text-[11px] text-muted-foreground">
          Cleared. Reloading…
        </p>
      )}
    </div>
  );
}
