import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { FinishersWall } from "@/components/finishers-wall";
import { daysTaken, getFinishers } from "@/lib/finishers";

export const revalidate = 300;

const title = "Finishers wall";
const description = "Everyone who finished the 30-Day Rust Challenge and chose to be listed.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/finishers" },
  openGraph: { type: "website", siteName: "Rust Training", title, description, url: "/finishers" },
};

export default async function FinishersPage() {
  const finishers = await getFinishers();
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 md:py-14">
        <div className="mx-auto mb-10 max-w-xl text-center">
          <h1 className="mb-3 text-4xl font-bold tracking-[-0.03em] sm:text-[44px]">Finishers</h1>
          <p className="text-muted-foreground">
            Everyone here read 30 chapters on 15 or more days and got 25 quizzes right in the 30-Day Rust Challenge. Listed only with their permission.
          </p>
        </div>
        {finishers.length === 0 ? (
          <div className="mx-auto flex max-w-xl flex-col items-center gap-4 rounded-2xl border border-border p-8 text-center">
            <p className="text-lg">No one has finished yet. The first name here could be yours.</p>
            <Link
              href="/challenge"
              className="inline-flex min-h-12 items-center rounded-[10px] bg-primary px-5 font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Start the challenge
            </Link>
          </div>
        ) : (
          <FinishersWall finishers={finishers.map((f) => ({ ...f, days: daysTaken(f) }))} />
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
