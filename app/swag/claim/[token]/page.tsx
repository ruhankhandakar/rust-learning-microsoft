import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { claimExpired, getWinnerByToken } from "@/lib/swag";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ClaimFlow, SignInToClaim } from "@/components/swag-claim";

export const metadata: Metadata = { title: "Claim your prize", robots: { index: false } };

export default async function ClaimPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const winner = await getWinnerByToken(token);
  if (!winner) notFound();
  const session = await auth.api.getSession({ headers: await headers() });

  let body: React.ReactNode;
  if (!session) body = <SignInToClaim path={`/swag/claim/${token}`} />;
  else if (session.user.id !== winner.userId) body = <p className="text-muted-foreground">This claim link belongs to another account. Sign in with the GitHub account that won.</p>;
  else if (winner.status === "claimed") body = <p className="text-muted-foreground">You&apos;ve claimed this prize. It ships soon.</p>;
  else if (winner.status === "shipped") body = <p className="text-muted-foreground">This prize has shipped. Enjoy it.</p>;
  else if (claimExpired(winner.claimBy)) body = <p className="text-muted-foreground">The 14-day claim window has closed, so this prize goes back into the draw.</p>;
  else
    body = (
      <ClaimFlow
        token={token}
        shirt={winner.prize.toLowerCase().includes("shirt")}
        info={{ prize: winner.prize, name: winner.name, quarter: winner.quarter, ticketNo: `#${winner.quarter}-${String(winner.id).padStart(4, "0")}`, claimBy: winner.claimBy.slice(0, 10) }}
      />
    );

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 md:py-16">
        <h1 className="mb-3 text-4xl font-bold tracking-[-0.03em]">You won the {winner.quarter} swag draw</h1>
        <p className="mb-8 text-muted-foreground">Congratulations, and thank you for finishing the 30-Day Rust Challenge.</p>
        {body}
      </main>
      <SiteFooter />
    </div>
  );
}
