export interface Tier {
  name: "Starter" | "Bronze" | "Silver" | "Gold";
  rule: string;
  chapters: number;
  quizzes: number;
  accuracy: number;
  books: number;
}

export const TIERS: Tier[] = [
  { name: "Starter", rule: "5 chapters", chapters: 5, quizzes: 0, accuracy: 0, books: 1 },
  { name: "Bronze", rule: "15 chapters and 10 quizzes at 70%", chapters: 15, quizzes: 10, accuracy: 0.7, books: 1 },
  { name: "Silver", rule: "40 chapters in 2+ books and 30 quizzes at 75%", chapters: 40, quizzes: 30, accuracy: 0.75, books: 2 },
  { name: "Gold", rule: "100 chapters and 60 quizzes at 80%", chapters: 100, quizzes: 60, accuracy: 0.8, books: 1 },
];

export interface BookBadge {
  slug: string;
  title: string;
  read: number;
  total: number;
}

export interface Achievements {
  name: string;
  chapters: number;
  booksStarted: number;
  quizzesRight: number;
  quizzesAnswered: number;
  accuracy: number;
  tier: Tier["name"] | null;
  books: BookBadge[];
  challengeFinished: string | null;
  isPublic: boolean;
  since: string | null;
}

export function meetsTier(a: Pick<Achievements, "chapters" | "booksStarted" | "quizzesRight" | "accuracy">, t: Tier): boolean {
  return a.chapters >= t.chapters && a.booksStarted >= t.books && a.quizzesRight >= t.quizzes && a.accuracy >= t.accuracy;
}
