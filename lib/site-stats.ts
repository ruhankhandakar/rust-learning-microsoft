import fs from "fs";
import path from "path";
import { BOOKS } from "@/lib/books";
import { getAllExercises } from "@/lib/exercises";
import { getAllQuizzes } from "@/lib/quizzes";
import { getAllConcepts } from "@/lib/concepts";
import { db } from "@/db";

export const REPO = "ruhankhandakar/rust-learning-microsoft";
export const REPO_URL = `https://github.com/${REPO}`;

export function getSiteStats() {
  const blocks = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "rust-blocks.json"), "utf-8"));
  return {
    books: BOOKS.length,
    runnable: Object.keys(blocks.blocks).length,
    exercises: getAllExercises().length,
    quizzes: getAllQuizzes().length,
    topics: getAllConcepts().length,
  };
}

export interface RepoFacts {
  stars: number;
  openIssues: number;
}

export async function getRepoFacts(): Promise<RepoFacts | null> {
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}`, {
      headers: { Accept: "application/vnd.github+json" },
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;
    const d = await res.json();
    return typeof d.stargazers_count === "number" ? { stars: d.stargazers_count, openIssues: d.open_issues_count ?? 0 } : null;
  } catch {
    return null;
  }
}

export type WeeklyActivity = Partial<Record<"page_view" | "quiz_answered" | "exercise_solved" | "playground_run", number>>;

export async function getWeeklyActivity(): Promise<WeeklyActivity | null> {
  try {
    const since = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10);
    const rows = await db
      .selectFrom("activity_daily")
      .select(["kind", (eb) => eb.fn.sum<number>("count").as("total")])
      .where("day", ">=", since)
      .groupBy("kind")
      .execute();
    return Object.fromEntries(rows.map((r) => [r.kind, Number(r.total)]));
  } catch {
    return null;
  }
}
