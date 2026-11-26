import fs from "fs";
import path from "path";
import { isChapter } from "@/lib/content";

export interface QuizQuestion {
  id: string;
  bookSlug: string;
  chapterSlug: string;
  code: string;
  changedLine: number;
  change: string;
  /** The line as it was before the edit; absent when the edit inserted a line. */
  original?: string;
  compiles: boolean;
  errorCode?: string;
  errorMessage?: string;
  /** rustc's label on the primary span, e.g. "expected `&str`, found `String`". */
  errorLabel?: string;
  errorLine?: number;
  rustc: string;
}

let cache: QuizQuestion[] | undefined;

export function getAllQuizzes(): QuizQuestion[] {
  if (!cache) {
    const file = path.join(process.cwd(), "data", "quizzes.json");
    if (!fs.existsSync(file)) return (cache = []);
    const data = JSON.parse(fs.readFileSync(file, "utf-8"));
    cache = data.questions.map((q: Omit<QuizQuestion, "rustc">) => ({ ...q, rustc: data.rustc }));
  }
  return cache!;
}

export function getChapterQuizzes(bookSlug: string, chapterSlug: string): QuizQuestion[] {
  return getAllQuizzes().filter((q) => q.bookSlug === bookSlug && q.chapterSlug === chapterSlug);
}

let homePicks: QuizQuestion[] | undefined;

/** The five sample questions on the home page. Answers to them are graded but never stored. */
export function homeQuizzes(): QuizQuestion[] {
  homePicks ??= (() => {
    const short = getAllQuizzes().filter((q) => {
      const lines = q.code.split("\n");
      return lines.length <= 12 && lines.every((l) => l.length <= 64) && isChapter(q.bookSlug, q.chapterSlug);
    });
    const picked = [...short.filter((q) => !q.compiles).slice(0, 3), ...short.filter((q) => q.compiles).slice(0, 2)];
    return [0, 3, 1, 4, 2].flatMap((i) => picked[i] ?? []);
  })();
  return homePicks;
}

export type QuizAnswer = Pick<QuizQuestion, "compiles" | "errorCode" | "errorMessage" | "errorLabel" | "errorLine">;
/** What the page may show before an answer: the grade stays on the server. */
export type QuizPrompt = Omit<QuizQuestion, keyof QuizAnswer>;

export function toPrompt({ id, bookSlug, chapterSlug, code, changedLine, change, original, rustc }: QuizQuestion): QuizPrompt {
  return { id, bookSlug, chapterSlug, code, changedLine, change, original, rustc };
}

export function answerOf(q: QuizQuestion): QuizAnswer {
  return { compiles: q.compiles, errorCode: q.errorCode, errorMessage: q.errorMessage, errorLabel: q.errorLabel, errorLine: q.errorLine };
}
