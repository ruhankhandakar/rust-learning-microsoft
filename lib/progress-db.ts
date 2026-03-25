const DB_NAME = "rust-training-progress";
const DB_VERSION = 1;
const STORE_NAME = "chapters";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export interface ChapterProgress {
  id: string; // "bookSlug/chapterSlug"
  bookSlug: string;
  chapterSlug: string;
  readAt: number;
}

export async function markChapterRead(
  bookSlug: string,
  chapterSlug: string
): Promise<void> {
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
}

export async function getReadChapters(
  bookSlug?: string
): Promise<ChapterProgress[]> {
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
}

export async function isChapterRead(
  bookSlug: string,
  chapterSlug: string
): Promise<boolean> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readonly");
  const store = tx.objectStore(STORE_NAME);
  const req = store.get(`${bookSlug}/${chapterSlug}`);
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(!!req.result);
    req.onerror = () => reject(req.error);
  });
}
