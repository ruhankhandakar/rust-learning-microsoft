import Link from "next/link";
import { Star } from "lucide-react";
import { LogoMark } from "@/components/logo-mark";
import { SearchTrigger } from "@/components/search-trigger";
import { SettingsDropdownLazy as SettingsDropdown } from "@/components/settings-dropdown-lazy";
import { ReviewDueBadge } from "@/components/review-due-badge";
import { REPO_URL, getRepoFacts } from "@/lib/site-stats";

const NAV = [
  { href: "/#library", label: "Library" },
  { href: "/practice", label: "Practice" },
  { href: "/concepts", label: "Topics" },
  { href: "/review", label: "Review", badge: true },
];

export async function SiteHeader() {
  const stars = (await getRepoFacts())?.stars ?? null;
  return (
    <header className="relative z-10 border-b border-border">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 text-foreground">
          <LogoMark size={36} />
          <span className="font-semibold">Rust Training</span>
        </Link>
        <nav aria-label="Main" className="order-last -mx-3 flex w-full gap-1 overflow-x-auto md:order-none md:mx-0 md:w-auto md:flex-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {item.label}
              {item.badge && <ReviewDueBadge />}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <SearchTrigger />
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-sm transition-colors hover:border-primary/40"
          >
            <Star className="h-4 w-4" aria-hidden="true" />
            Star
            {stars !== null && <span className="text-muted-foreground tabular-nums">{stars.toLocaleString("en-US")}</span>}
          </a>
          <SettingsDropdown />
        </div>
      </div>
    </header>
  );
}
