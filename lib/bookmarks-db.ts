const DB_NAME = "rust-training-bookmarks";
const DB_VERSION = 1;
const STORE_NAME = "bookmarks";

export interface LocalBookmark {
  id: string; // book_slug/chapter_slug#heading_id
  book_slug: string;
  chapter_slug: string;
  heading_id: string;
  heading_text: string;
  note: string | null;
  created_at: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
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

function makeKey(bookSlug: string, chapterSlug: string, headingId: string) {
  return `${bookSlug}/${chapterSlug}#${headingId}`;
}

export async function addBookmark(
  bookmark: Omit<LocalBookmark, "id" | "created_at">
): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put({
      ...bookmark,
      id: makeKey(bookmark.book_slug, bookmark.chapter_slug, bookmark.heading_id),
      created_at: Date.now(),
    });
    await new Promise<void>((res, rej) => {
      tx.oncomplete = () => res();
      tx.onerror = () => rej(tx.error);
    });
  } catch {}
}

export async function removeBookmark(
  bookSlug: string,
  chapterSlug: string,
  headingId: string
): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(makeKey(bookSlug, chapterSlug, headingId));
    await new Promise<void>((res, rej) => {
      tx.oncomplete = () => res();
      tx.onerror = () => rej(tx.error);
    });
  } catch {}
}

export async function getAllBookmarks(): Promise<LocalBookmark[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).getAll();
    return new Promise((resolve, reject) => {
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}
