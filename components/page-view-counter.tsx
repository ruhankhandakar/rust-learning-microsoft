"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { trackActivity } from "@/lib/learner-store";

/** Cookie-free daily totals: a visit is a page reached from another site or typed in; nothing is stored on the device. */
export function PageViewCounter() {
  const pathname = usePathname();
  const first = useRef(true);

  useEffect(() => {
    if (/bot|crawl|spider|slurp|preview|lighthouse/i.test(navigator.userAgent)) return;
    if (first.current) {
      first.current = false;
      let fromHere = false;
      try {
        fromHere = new URL(document.referrer).host === location.host;
      } catch {}
      if (!fromHere) trackActivity("visit");
    }
    trackActivity("page_view");
  }, [pathname]);

  return null;
}
