"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { Finisher } from "@/lib/finishers";

const monthLabel = (m: string) => new Date(`${m}-01T00:00:00Z`).toLocaleString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });

export function FinishersWall({ finishers }: { finishers: (Finisher & { days: number })[] }) {
  const months = [...new Set(finishers.map((f) => f.completedAt.slice(0, 7)))];
  const [month, setMonth] = useState<string | null>(null);
  const shown = month ? finishers.filter((f) => f.completedAt.startsWith(month)) : finishers;

  return (
    <>
      {finishers.length >= 8 && (
        <div aria-hidden="true" className="finisher-ribbon -mx-4 mb-10 overflow-hidden py-2 sm:-mx-6">
          <div className="finisher-loop flex w-max gap-3">
            {[...finishers, ...finishers].map((f, i) => (
              <span key={i} className="rounded-full border border-primary/40 px-4 py-2 text-sm text-foreground/90">
                {f.name}
              </span>
            ))}
          </div>
        </div>
      )}
      {months.length > 1 && (
        <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label="Filter by month">
          {[null, ...months].map((m) => (
            <button
              key={m ?? "all"}
              type="button"
              aria-pressed={month === m}
              onClick={() => setMonth(m)}
              className={`min-h-10 rounded-full px-4 text-sm transition-colors ${
                month === m ? "bg-primary font-semibold text-primary-foreground" : "border border-border text-foreground/85 hover:border-primary/50"
              }`}
            >
              {m ? monthLabel(m) : "All"}
            </button>
          ))}
        </div>
      )}
      <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {shown.map((f) => (
          <li key={f.id}>
            <Link href={`/finishers/${f.id}`} className="group flex items-center gap-3 rounded-xl border border-border p-3.5 transition-colors hover:border-primary/50">
              {f.image ? (
                <Image src={f.image} alt="" width={44} height={44} unoptimized className="size-11 rounded-full" />
              ) : (
                <span className="size-11 shrink-0 rounded-full bg-border" />
              )}
              <span className="min-w-0">
                <span className="block truncate font-semibold group-hover:text-primary">{f.name}</span>
                <span className="text-[13px] text-muted-foreground">
                  Finished {f.completedAt.slice(0, 10)}, {f.days} days
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </>
  );
}
