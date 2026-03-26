"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const LEVEL_STYLES: Record<string, string> = {
  green:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  blue: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300",
  yellow:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  purple:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
  brown:
    "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
};

const LEVEL_DESC: Record<string, string> = {
  Bridge: "Guides for devs crossing over from another language",
  "Deep Dive": "Focused exploration of a single Rust domain",
  Advanced: "Complex patterns for experienced Rustaceans",
  Expert: "Pushing the type system to its limits",
  Practices: "Production engineering workflows & tooling",
};

export function LevelTooltip({
  level,
  color,
}: {
  level: string;
  color: string;
}) {
  const [show, setShow] = useState(false);

  return (
    <span className="relative inline-flex items-center gap-1">
      <Badge variant="secondary" className={LEVEL_STYLES[color]}>
        {level}
      </Badge>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setShow((s) => !s);
        }}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="text-muted-foreground/60 hover:text-muted-foreground transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center -m-2.5"
        aria-label={`What does ${level} mean?`}
      >
        <Info className="h-4 w-4" />
      </button>
      {show && (
        <span className="absolute right-0 top-full mt-1.5 z-50 w-52 rounded-lg border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-lg">
          {LEVEL_DESC[level]}
        </span>
      )}
    </span>
  );
}
