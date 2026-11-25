import { Check } from "lucide-react";
import type { ReactNode } from "react";

const R = 38;
const C = 2 * Math.PI * R;

export function ProgressRing({ value, max, done, children }: { value: number; max: number; done?: boolean; children?: ReactNode }) {
  const complete = done ?? value >= max;
  return (
    <div className="relative size-20 sm:size-24">
      <svg viewBox="0 0 88 88" className="size-full -rotate-90" aria-hidden="true">
        <circle cx="44" cy="44" r={R} fill="none" strokeWidth="7" className="stroke-border" />
        <circle
          cx="44"
          cy="44"
          r={R}
          fill="none"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={C}
          className={`goal-ring ${complete ? "stroke-emerald-500" : "stroke-primary"}`}
          style={{ strokeDashoffset: C * (1 - Math.min(value, max) / max), opacity: value ? 1 : 0 }}
        />
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        {complete ? <Check className="size-7 text-emerald-500" strokeWidth={3} aria-hidden="true" /> : children}
      </span>
    </div>
  );
}
