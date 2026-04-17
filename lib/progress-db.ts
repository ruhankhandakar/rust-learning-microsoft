const DB_NAME = "rust-training-progress";
const DB_VERSION = 1;
const STORE_NAME = "chapters";

function isIndexedDBAvailable(): boolean {
  try {
    return typeof indexedDB !== "undefined" && indexedDB !== null;
  } catch {
    return false;
  }
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!isIndexedDBAvailable()) {
      reject(new Error("IndexedDB not available"));
      return;
    }
    try {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "id" });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    } catch (e) {
      reject(e);
    }
  });
}

interface ChapterProgress {
  id: string;
  bookSlug: string;
  chapterSlug: string;
  readAt: number;
}

export async function markChapterRead(
  bookSlug: string,
  chapterSlug: string
): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const record: ChapterProgress = {
      id: `${bookSlug}/${chapterSlug}`,
      bookSlug,
      chapterSlug,
      readAt: Date.now(),
    };
    store.put(record);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Silently fail — progress tracking is non-critical
  }
}

export async function unmarkChapterRead(
  bookSlug: string,
  chapterSlug: string
): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.delete(`${bookSlug}/${chapterSlug}`);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // non-critical
  }
}

export async function getReadChapters(
  bookSlug?: string
): Promise<ChapterProgress[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    return new Promise((resolve, reject) => {
      req.onsuccess = () => {
        const all: ChapterProgress[] = req.result;
        resolve(bookSlug ? all.filter((r) => r.bookSlug === bookSlug) : all);
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}
