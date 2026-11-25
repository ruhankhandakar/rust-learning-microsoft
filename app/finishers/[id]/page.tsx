import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ShareMenu } from "@/components/share-menu";
import { getFinisher } from "@/lib/finishers";

export const revalidate = 300;

const BASE_URL = "https://rust.learningz.xyz";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const f = await getFinisher((await params).id);
  if (!f) return {};
  const title = `${f.name} finished the 30-Day Rust Challenge`;
  const description = `${f.chapters} chapters on ${f.readingDays} days and ${f.quizzes} compiler-checked quizzes right, in ${f.days} days.`;
  return {
    title,
    description,
    openGraph: { type: "profile", siteName: "Rust Training", title, description },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function FinisherPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const f = await getFinisher(id);
  if (!f) notFound();

  const stats: [number, string][] = [
    [f.chapters, "chapters read"],
    [f.readingDays, "days of reading"],
    [f.quizzes, "quizzes right"],
    [f.days, "days in total"],
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 md:py-16">
        <div className="mb-8 flex items-center gap-4">
          {f.image && <Image src={f.image} alt="" width={64} height={64} unoptimized className="size-16 rounded-full" />}
          <div>
            <h1 className="text-3xl font-bold tracking-[-0.02em] sm:text-4xl">{f.name}</h1>
            <p className="text-muted-foreground">Finished the 30-Day Rust Challenge on {f.completedAt.slice(0, 10)}</p>
          </div>
        </div>
        <dl className="mb-10 grid grid-cols-2 gap-6 rounded-2xl border border-primary/45 bg-primary/5 p-6 sm:grid-cols-4">
          {stats.map(([n, label]) => (
            <div key={label} className="flex flex-col-reverse gap-1">
              <dt className="text-sm text-muted-foreground">{label}</dt>
              <dd className="font-heading text-4xl font-bold tabular-nums">{n}</dd>
            </div>
          ))}
        </dl>
        <div className="flex flex-wrap items-center gap-4">
          <ShareMenu url={`${BASE_URL}/finishers/${f.id}`} title={`${f.name} finished the 30-Day Rust Challenge`} />
          <Link href="/challenge" className="font-semibold text-primary hover:underline">
            Take the challenge
          </Link>
          <Link href="/finishers" className="text-sm text-muted-foreground hover:text-foreground">
            All finishers
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
