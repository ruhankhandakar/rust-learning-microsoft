"use client";

import type { ReactNode } from "react";
import { useSessionLite } from "@/components/session-provider";
import { ReturningDashboard, type RecentChanges } from "@/components/home/returning-dashboard";

/** Signed-in readers get the returning dashboard; everyone else sees the hero. */
export function HomeTop({ hero, bookTotals, recent }: { hero: ReactNode; bookTotals: Record<string, number>; recent: RecentChanges | null }) {
  const { user } = useSessionLite();
  return user ? <ReturningDashboard name={user.name ?? null} bookTotals={bookTotals} recent={recent} /> : <>{hero}</>;
}
