import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { isSameOriginJson } from "@/lib/utils";
import { answerOf, getAllQuizzes } from "@/lib/quizzes";
import { firstAnswer, recordQuizResult } from "@/lib/achievements";
import { recordEvent } from "@/lib/challenge";

/**
 * { quizId, answer } grades an answer; for a signed-in learner the first answer is stored before the grade is returned.
 * { quizId, reveal: true } shows the answer to review a card, which a signed-in learner may do only after answering.
 */
export async function POST(request: Request) {
  if (!isSameOriginJson(request)) return NextResponse.json({ error: "Invalid request" }, { status: 403 });
  const body = await request.json().catch(() => null);
  const quiz = typeof body?.quizId === "string" ? getAllQuizzes().find((q) => q.id === body.quizId) : undefined;
  if (!quiz) return NextResponse.json({ error: "Invalid quiz" }, { status: 400 });
  const userId = (await auth.api.getSession({ headers: await headers() }))?.user.id;

  if (typeof body.answer === "boolean") {
    if (userId) {
      await recordQuizResult(userId, quiz.id, body.answer);
      await recordEvent(userId, "quiz", quiz.id, { answer: body.answer });
    }
  } else if (body.reveal === true) {
    if (userId && (await firstAnswer(userId, quiz.id)) === null) {
      return NextResponse.json({ error: "Answer the question first" }, { status: 403 });
    }
  } else {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  return NextResponse.json(answerOf(quiz));
}
