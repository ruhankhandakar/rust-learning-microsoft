import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { AchievementsBoard } from "@/components/achievements-board";

const title = "Achievements";
const description = "Tiers, book badges and a live GitHub README badge for your progress through Microsoft's free Rust books.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/achievements" },
  openGraph: { type: "website", siteName: "Rust Training", title, description, url: "/achievements" },
};

export default function AchievementsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 md:py-16">
        <AchievementsBoard />
      </main>
      <SiteFooter />
    </div>
  );
}
