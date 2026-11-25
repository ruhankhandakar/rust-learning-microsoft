import { getFinisher } from "@/lib/finishers";
import { OG_SIZE, shareCard } from "@/lib/og";

export const alt = "A 30-Day Rust Challenge finisher";
export const size = OG_SIZE;
export const contentType = "image/png";
export const revalidate = 300;

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const f = await getFinisher((await params).id);
  return shareCard({
    kicker: f ? `${f.name} finished` : "Finish it in 30 days",
    glow: true,
    title: "The 30-Day Rust Challenge",
    stats: f
      ? [
          [String(f.chapters), "chapters"],
          [String(f.readingDays), "days of reading"],
          [String(f.quizzes), "quizzes right"],
        ]
      : undefined,
    footer: ["rust.learningz.xyz", "Free, unofficial"],
  });
}
