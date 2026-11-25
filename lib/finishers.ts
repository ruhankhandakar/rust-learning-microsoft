import { db } from "@/db";
import { getProgress } from "@/lib/challenge";

export interface Finisher {
  id: string;
  name: string;
  image: string | null;
  startedAt: string;
  completedAt: string;
}

function wall() {
  return db
    .selectFrom("challenge_enrollment")
    .innerJoin("user", "user.id", "challenge_enrollment.user_id")
    .select(["user.id", "user.name", "user.image", "challenge_enrollment.started_at as startedAt", "challenge_enrollment.completed_at as completedAt"])
    .where("challenge_enrollment.completed_at", "is not", null)
    .where("challenge_enrollment.show_on_wall", "=", 1);
}

export function daysTaken(f: Pick<Finisher, "startedAt" | "completedAt">): number {
  return Math.max(1, Math.ceil((Date.parse(f.completedAt) - Date.parse(f.startedAt)) / 86_400_000));
}

export async function getFinishers(): Promise<Finisher[]> {
  try {
    return (await wall().orderBy("challenge_enrollment.completed_at", "desc").execute()) as Finisher[];
  } catch {
    return [];
  }
}

/** A finisher who opted in to the wall, with their challenge numbers; null otherwise. */
export async function getFinisher(id: string) {
  try {
    const f = (await wall().where("user.id", "=", id).executeTakeFirst()) as Finisher | undefined;
    if (!f) return null;
    const p = await getProgress(id);
    return { ...f, chapters: p.chapters, readingDays: p.readingDays, quizzes: p.quizzes, days: daysTaken(f) };
  } catch {
    return null;
  }
}
