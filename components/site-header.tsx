import Link from "next/link";
import { Star } from "lucide-react";
import { LogoMark } from "@/components/logo-mark";
import { SearchTrigger } from "@/components/search-trigger";
import { SettingsDropdownLazy as SettingsDropdown } from "@/components/settings-dropdown-lazy";
import { SiteNav } from "@/components/site-nav";
import { REPO_URL, getRepoFacts } from "@/lib/site-stats";

export async function SiteHeader() {
  const stars = (await getRepoFacts())?.stars ?? null;
  return (
    <header className="relative z-40 border-b border-border bg-background/90 backdrop-blur-md lg:sticky lg:top-0">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-6 lg:h-[60px] lg:flex-nowrap lg:py-0">
        <Link href="/" className="flex items-center gap-2.5 text-foreground">
          <LogoMark size={36} />
          <span className="font-semibold">Rust Training</span>
        </Link>
        <SiteNav />
        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <SearchTrigger />
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Star on GitHub" className="inline-flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-sm transition-colors hover:border-primary/40"
          >
            <Star className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Star</span>
            {stars !== null && <span className="text-muted-foreground tabular-nums">{stars.toLocaleString("en-US")}</span>}
          </a>
          <SettingsDropdown />
        </div>
      </div>
    </header>
  );
}
