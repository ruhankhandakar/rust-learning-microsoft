export interface LastRead {
  bookSlug: string;
  chapterSlug: string;
  bookTitle: string;
  chapterTitle: string;
  headingId?: string;
  headingText?: string;
  at: number;
}

export interface StoredReviewCard {
  box: number;
  due: number;
  at: number;
  removed?: true;
}

/** Synced learner state. Deletions are kept as tombstones so they win over older copies on other devices. */
export interface LearnerState {
  /** > 0: solved at that time; < 0: unsolved at -value. */
  solved: Record<string, number>;
  review: Record<string, StoredReviewCard>;
  lastRead: LastRead | null;
}

export const EMPTY_STATE: LearnerState = { solved: {}, review: {}, lastRead: null };

function mergeMap<T>(a: Record<string, T>, b: Record<string, T>, at: (v: T) => number) {
  const out = { ...a };
  for (const [k, v] of Object.entries(b)) {
    if (!(k in out) || at(v) > at(out[k])) out[k] = v;
  }
  return out;
}

export function mergeStates(a: LearnerState, b: LearnerState): LearnerState {
  return {
    solved: mergeMap(a.solved, b.solved, Math.abs),
    review: mergeMap(a.review, b.review, (c) => c.at),
    lastRead:
      !a.lastRead || (b.lastRead && b.lastRead.at > a.lastRead.at) ? b.lastRead : a.lastRead,
  };
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);

/** Drops anything that isn't the expected shape; used on data from localStorage and from clients. */
export function sanitizeState(input: unknown): LearnerState {
  const s = isRecord(input) ? input : {};
  const solved: LearnerState["solved"] = {};
  if (isRecord(s.solved))
    for (const [k, v] of Object.entries(s.solved)) if (typeof v === "number" && v) solved[k] = v;
  const review: LearnerState["review"] = {};
  if (isRecord(s.review))
    for (const [k, v] of Object.entries(s.review))
      if (isRecord(v) && typeof v.box === "number" && typeof v.due === "number")
        review[k] = {
          box: v.box,
          due: v.due,
          at: typeof v.at === "number" ? v.at : 0,
          ...(v.removed === true && { removed: true as const }),
        };
  const lr = s.lastRead;
  const lastRead =
    isRecord(lr) &&
    typeof lr.bookSlug === "string" &&
    typeof lr.chapterSlug === "string" &&
    typeof lr.at === "number"
      ? {
          bookSlug: lr.bookSlug,
          chapterSlug: lr.chapterSlug,
          bookTitle: String(lr.bookTitle ?? ""),
          chapterTitle: String(lr.chapterTitle ?? ""),
          headingId: typeof lr.headingId === "string" ? lr.headingId : undefined,
          headingText: typeof lr.headingText === "string" ? lr.headingText : undefined,
          at: lr.at,
        }
      : null;
  return { solved, review, lastRead };
}
