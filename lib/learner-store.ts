import { useSyncExternalStore } from "react";
import {
  mergeStates,
  sanitizeState,
  type LastRead,
  type LearnerState,
} from "./learner-merge";

export type { LastRead };

export interface ReviewCard {
  box: number;
  due: number;
}

interface View {
  solved: Record<string, number>;
  review: Record<string, ReviewCard>;
  lastRead: LastRead | null;
}

type Key = keyof LearnerState;

const KEYS: Key[] = ["solved", "review", "lastRead"];
const STORAGE_KEYS: Record<Key, string> = {
  solved: "rt:solved",
  review: "rt:review",
  lastRead: "rt:last-read",
};
const OWNER_KEY = "rt:sync-owner";

const DAY = 86_400_000;
export const REVIEW_INTERVAL_DAYS = [1, 3, 7, 21];

export type ActivityKind =
  | "exercise_solved"
  | "quiz_answered"
  | "quiz_correct"
  | "review_graded"
  | "playground_run"
  | "page_view"
  | "visit";

const memory = new Map<Key, string>();
const cache = new Map<Key, { raw: string | null; stored: unknown; view: unknown }>();
const listeners = new Set<() => void>();
const localListeners = new Set<() => void>();

function getRaw(key: Key): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEYS[key]) ?? memory.get(key) ?? null;
  } catch {
    return memory.get(key) ?? null;
  }
}

function toView<K extends Key>(key: K, stored: LearnerState[K]): View[K] {
  if (key === "solved")
    return Object.fromEntries(
      Object.entries(stored as LearnerState["solved"]).filter(([, v]) => v > 0)
    ) as unknown as View[K];
  if (key === "review")
    return Object.fromEntries(
      Object.entries(stored as LearnerState["review"]).filter(([, c]) => !c.removed)
    ) as unknown as View[K];
  return stored as unknown as View[K];
}

function load<K extends Key>(key: K): { stored: LearnerState[K]; view: View[K] } {
  const raw = getRaw(key);
  const hit = cache.get(key);
  if (hit && hit.raw === raw) return hit as { stored: LearnerState[K]; view: View[K] };
  let parsed: unknown;
  try {
    if (raw) parsed = JSON.parse(raw);
  } catch {}
  const stored = sanitizeState({ [key]: parsed })[key];
  const entry = { raw, stored, view: toView(key, stored) };
  cache.set(key, entry);
  return entry;
}

function write<K extends Key>(key: K, stored: LearnerState[K], local = true) {
  const raw = JSON.stringify(stored);
  memory.set(key, raw);
  try {
    window.localStorage.setItem(STORAGE_KEYS[key], raw);
  } catch {}
  listeners.forEach((l) => l());
  if (local) localListeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

/** Returns null during SSR and the first hydration pass; render nothing personal until it is non-null. */
export function useLearnerStore<K extends Key>(key: K): View[K] | null {
  return useSyncExternalStore(subscribe, () => load(key).view, () => null);
}

export function trackActivity(kind: ActivityKind) {
  try {
    navigator.sendBeacon("/api/activity", JSON.stringify({ kind }));
  } catch {}
}

export function toggleSolved(exerciseId: string) {
  const solved = { ...load("solved").stored };
  const now = Date.now();
  if (solved[exerciseId] > 0) {
    solved[exerciseId] = -now;
  } else {
    solved[exerciseId] = now;
    enrollReview(`ex:${exerciseId}`);
    trackActivity("exercise_solved");
  }
  write("solved", solved);
}

export function recordQuizAnswer(quizId: string, correct: boolean) {
  enrollReview(`quiz:${quizId}`);
  trackActivity("quiz_answered");
  if (correct) trackActivity("quiz_correct");
}

/** No-op if the card exists, including one the learner removed. */
export function enrollReview(cardId: string) {
  const review = load("review").stored;
  if (review[cardId]) return;
  // at 0: a card graded or removed on another device wins the merge over this fresh enrollment.
  write("review", { ...review, [cardId]: { box: 0, due: Date.now() + DAY, at: 0 } });
}

export function gradeReview(cardId: string, gotIt: boolean) {
  const review = load("review").stored;
  const card = review[cardId];
  if (!card || card.removed) return;
  const box = gotIt ? Math.min(card.box + 1, REVIEW_INTERVAL_DAYS.length - 1) : 0;
  const now = Date.now();
  write("review", {
    ...review,
    [cardId]: { box, due: now + REVIEW_INTERVAL_DAYS[box] * DAY, at: now },
  });
  trackActivity("review_graded");
}

export function removeReview(cardId: string) {
  const review = load("review").stored;
  if (!review[cardId]) return;
  write("review", { ...review, [cardId]: { box: 0, due: 0, at: Date.now(), removed: true } });
}

export function dueReviewIds(review: Record<string, ReviewCard>, now: number): string[] {
  return Object.entries(review)
    .filter(([, c]) => c.due <= now)
    .sort((a, b) => a[1].due - b[1].due)
    .map(([id]) => id);
}

export function setLastRead(value: LastRead) {
  const prev = load("lastRead").stored;
  if (
    prev &&
    prev.bookSlug === value.bookSlug &&
    prev.chapterSlug === value.chapterSlug &&
    prev.headingId === value.headingId
  )
    return;
  write("lastRead", value);
}

export function exportState(): LearnerState {
  return {
    solved: load("solved").stored,
    review: load("review").stored,
    lastRead: load("lastRead").stored,
  };
}

/** Merges (or with replace, adopts) state from the server without triggering another push. */
export function importState(remote: unknown, replace = false) {
  const incoming = sanitizeState(remote);
  const next = replace ? incoming : mergeStates(exportState(), incoming);
  for (const key of KEYS) {
    if (JSON.stringify(next[key]) !== JSON.stringify(load(key).stored)) write(key, next[key], false);
  }
}

export function onLocalChange(cb: () => void) {
  localListeners.add(cb);
  return () => {
    localListeners.delete(cb);
  };
}

export function getSyncOwner(): string | null {
  try {
    return window.localStorage.getItem(OWNER_KEY);
  } catch {
    return null;
  }
}

export function setSyncOwner(userId: string) {
  try {
    window.localStorage.setItem(OWNER_KEY, userId);
  } catch {}
}
