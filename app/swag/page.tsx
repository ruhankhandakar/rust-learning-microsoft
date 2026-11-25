import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SwagPreview } from "@/components/home/swag-preview";
import { SwagDemo } from "@/components/swag-demo";

const title = "Quarterly swag draw";
const description = "Finish the 30-Day Rust Challenge and you could win an rs:: T-shirt bundle or sticker pack, shipped free within India.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/swag" },
  openGraph: { type: "website", siteName: "Rust Training", title, description, url: "/swag" },
};

export default function SwagPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 md:py-14">
        <section className="flex flex-wrap items-center gap-10">
          <div className="min-w-0 flex-[999_1_460px]">
            <h1 className="mb-4 text-4xl font-bold tracking-[-0.03em] sm:text-5xl">Quarterly swag draw</h1>
            <p className="max-w-xl text-lg text-muted-foreground">
              Each quarter, a few people who finished the <Link href="/challenge" className="text-primary hover:underline">30-Day Rust Challenge</Link> win
              Rust swag, shipped free to their door. Entry is free. No purchase, star or review is ever needed.
            </p>
          </div>
          <div className="flex min-w-0 flex-[1_1_300px] flex-col items-center gap-2">
            <SwagPreview large />
            <p className="text-sm text-muted-foreground">Prizes: T-shirt bundles and sticker packs.</p>
          </div>
        </section>

        <section aria-label="Rules" className="mt-14 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-border p-6">
            <h2 className="mb-3 text-xl font-bold">Who can win</h2>
            <ul className="flex list-disc flex-col gap-2 pl-5 text-muted-foreground">
              <li>Finished the 30-Day Rust Challenge</li>
              <li>
                Turned on <span className="font-mono text-foreground">draw</span> in the challenge rewards (&ldquo;email me if I&apos;m drawn&rdquo;)
              </li>
              <li>18 or older, with a shipping address in India</li>
              <li>Hasn&apos;t won before: one prize per person, ever</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-border p-6">
            <h2 className="mb-3 text-xl font-bold">How it works</h2>
            <ol className="flex list-decimal flex-col gap-2 pl-5 text-muted-foreground">
              <li>At the end of each quarter, winners are picked at random. The random seed is recorded so the draw can be checked.</li>
              <li>Winners get an email to their GitHub address with a claim link. Claim within 14 days or the prize is redrawn.</li>
              <li>You enter your address in a one-time form. It is deleted the day your parcel ships.</li>
              <li>The parcel is posted to you directly, free.</li>
            </ol>
          </div>
        </section>

        <section aria-labelledby="winner-title" className="mt-14">
          <h2 id="winner-title" className="mb-2 text-2xl font-bold">What a winner sees</h2>
          <p className="mb-6 text-muted-foreground">After clicking the link in their email. Try it: drag the stub to the right.</p>
          <SwagDemo />
        </section>

        <p className="mt-14 text-sm text-muted-foreground">
          Prizes have no cash alternative. Unofficial, not affiliated with Microsoft or the Rust Foundation. Stars and reviews never affect the draw.
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
