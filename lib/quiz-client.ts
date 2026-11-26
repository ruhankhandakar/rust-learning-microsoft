import type { QuizAnswer } from "@/lib/quizzes";

/** Null when the server can't be reached or refuses, e.g. offline. */
export async function checkQuiz(quizId: string, body: { answer: boolean } | { reveal: true }): Promise<QuizAnswer | null> {
  try {
    const res = await fetch("/api/quiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quizId, ...body }),
    });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}
