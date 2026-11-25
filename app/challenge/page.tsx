import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ChallengeBoard } from "@/components/challenge-board";

const title = "The 30-Day Rust Challenge";
const description =
  "Read 30 chapters of Microsoft's free Rust books on 15 different days and get 25 compiler-checked quizzes right, all within 30 days.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/challenge" },
  openGraph: { type: "website", siteName: "Rust Training", title, description, url: "/challenge" },
  twitter: { card: "summary", title, description },
};

export default function ChallengePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 md:py-16">
        <ChallengeBoard />
      </main>
      <SiteFooter />
    </div>
  );
}
