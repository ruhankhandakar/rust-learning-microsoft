import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { drawState, isAdmin, listCheckins, listComments, listFinishers } from "@/lib/admin";
import { SiteHeader } from "@/components/site-header";
import { AdminBoard } from "@/components/admin-board";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

export default async function AdminPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!(await isAdmin(session?.user.id))) notFound();
  const [comments, checkins, finishers, draw] = await Promise.all([listComments(), listCheckins(), listFinishers(), drawState()]);
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <AdminBoard comments={comments} checkins={checkins} finishers={finishers} draw={draw} site={process.env.BETTER_AUTH_URL ?? "https://rust.learningz.xyz"} />
      </main>
    </div>
  );
}
