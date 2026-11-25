"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { ReviewDueBadge } from "@/components/review-due-badge";

const NAV = [
  { href: "/#library", label: "Library", match: "/books" },
  { href: "/practice", label: "Practice", match: "/practice" },
  { href: "/concepts", label: "Topics", match: "/concepts" },
  { href: "/review", label: "Review", match: "/review", badge: true },
  { href: "/challenge", label: "Challenge", match: "/challenge" },
  { href: "/achievements", label: "Achievements", match: "/achievements" },
];

export function SiteNav() {
  const pathname = usePathname();
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const nav = ref.current;
    const active = nav?.querySelector<HTMLElement>("[aria-current=page]");
    if (nav && active) nav.scrollLeft = active.offsetLeft - (nav.clientWidth - active.offsetWidth) / 2;
  }, [pathname]);

  return (
    <nav ref={ref} aria-label="Main" className="relative order-last -mx-3 flex w-full gap-1 overflow-x-auto lg:order-none lg:mx-0 lg:w-auto lg:flex-1 lg:self-stretch">
      {NAV.map((item) => {
        const active = pathname === item.match || pathname.startsWith(`${item.match}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`-mb-px inline-flex shrink-0 items-center gap-1.5 border-b-2 px-2.5 py-2.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring lg:py-0 ${
              active ? "border-primary font-medium text-foreground" : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
            }`}
          >
            {item.label}
            {item.badge && <ReviewDueBadge />}
          </Link>
        );
      })}
    </nav>
  );
}
