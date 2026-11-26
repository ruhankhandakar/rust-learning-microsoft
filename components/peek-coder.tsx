"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useProgress } from "@/components/progress-provider";
import { getReadChapters } from "@/lib/progress-db";

// Entry n unlocks /coder/stage-(n+1).webp; stage-0 is the sad starting image.
const UNLOCKS: [chapters: number, item: string][] = [
  [1, "sneakers"],
  [3, "long pants"],
  [5, "an rs:: T-shirt"],
  [10, "a hoodie"],
  [15, "glasses"],
  [25, "headphones"],
  [40, "a laptop"],
  [70, "a coffee mug"],
  [100, "a Rust crab"],
];

// Shown with a preview of the finished look. Keep each short enough for one caption line.
const CHEERS = ["You've got this.", "Keep going, Rustacean.", "One chapter at a time.", "No borrowing. Own it.", "Small steps add up."];
const PREVIEW_MS = 4000;

const PEEKING =
  "translate-x-(--peek) -rotate-[35deg] group-hover:translate-x-[42%] group-hover:-rotate-[18deg] group-focus-visible:translate-x-[42%] group-focus-visible:-rotate-[18deg]";
const OUT = "translate-x-0 -rotate-6";

export function PeekCoder() {
  const { readSet } = useProgress();
  const [saved, setSaved] = useState<number | null>(null);
  const [view, setView] = useState<"closed" | "preview" | "progress">("closed");
  const [cheer, setCheer] = useState(-1);
  const [wantsFinal, setWantsFinal] = useState(false);
  const [finalReady, setFinalReady] = useState(false);
  const open = view !== "closed";
  // The countdown waits for the finished image, so a slow download doesn't eat the preview.
  const showFinal = view === "preview" && finalReady;
  const button = useRef<HTMLButtonElement>(null);

  // readSet is empty both while loading and at zero, so re-read the saved count each time it changes.
  useEffect(() => {
    let stale = false;
    getReadChapters().then((rows) => {
      if (!stale) setSaved(rows.length);
    });
    return () => {
      stale = true;
    };
  }, [readSet]);

  useEffect(() => {
    if (!showFinal) return;
    const timer = setTimeout(() => setView("progress"), PREVIEW_MS);
    return () => clearTimeout(timer);
  }, [showFinal]);

  useEffect(() => {
    if (!open) return;
    const outside = (e: PointerEvent) => !button.current?.contains(e.target as Node) && setView("closed");
    const escape = (e: KeyboardEvent) => e.key === "Escape" && setView("closed");
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  if (saved === null) return null;

  const read = readSet.size || saved;
  const stage = UNLOCKS.filter(([chapters]) => read >= chapters).length;
  const next = UNLOCKS[stage];
  const caption = `${read} ${read === 1 ? "chapter" : "chapters"} read. ${next ? `${next[0] - read} more to unlock ${next[1]}.` : "Full setup unlocked."}`;
  const left = UNLOCKS[UNLOCKS.length - 1][0] - read;

  function toggle() {
    if (open) return setView("closed");
    if (!next) return setView("progress");
    setCheer((c) => (c + 1) % CHEERS.length);
    setWantsFinal(true);
    setView("preview");
  }

  return (
    <div className="pointer-events-none fixed bottom-40 [@media(max-height:500px)]:bottom-8! right-0 z-30 h-[calc(var(--w)*1.3+7rem)] w-[max(13rem,calc(var(--w)*1.15))] overflow-hidden animate-in slide-in-from-right-full delay-500 duration-700 fill-mode-both [--peek:99%] [--w:7.5rem] motion-reduce:animate-none xl:bottom-24 xl:[--peek:93%] xl:[--w:12rem] print:hidden">
      <p role="status" className={open ? "absolute bottom-[calc(var(--w)*1.3)] right-3 w-48 rounded-xl border border-border bg-card p-3 text-sm text-foreground shadow-lg" : "sr-only"}>
        {showFinal ? (
          <>
            <strong className="block font-semibold">{CHEERS[cheer]}</strong>
            You, in {left} {left === 1 ? "chapter" : "chapters"}.
          </>
        ) : (
          open && caption
        )}
      </p>
      {/* The button stays put while the image moves, so hover can't flicker. */}
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-label={`Your coder. ${caption}`}
        onClick={toggle}
        onPointerEnter={() => setWantsFinal(true)}
        onFocus={() => setWantsFinal(true)}
        className="group pointer-events-auto absolute bottom-[calc(var(--w)*0.6)] right-0 h-[calc(var(--w)*0.5)] w-[max(2.75rem,calc(var(--w)*0.28))] cursor-pointer outline-none"
      >
        <span
          className={`pointer-events-none absolute bottom-[calc(var(--w)*-0.5)] right-0 block w-(--w) origin-bottom transition-[translate,rotate] duration-500 ease-[cubic-bezier(.34,1.4,.64,1)] motion-reduce:transition-none ${open ? OUT : PEEKING}`}
        >
          <Image
            src={`/coder/stage-${stage}.webp`}
            alt=""
            width={640}
            height={721}
            unoptimized
            className={`h-auto w-full max-w-none transition-opacity duration-500 motion-reduce:transition-none ${showFinal ? "opacity-0" : "opacity-100"}`}
          />
          {next && wantsFinal && (
            <Image
              src={`/coder/stage-${UNLOCKS.length}.webp`}
              alt=""
              width={640}
              height={721}
              unoptimized
              loading="eager"
              onLoad={() => setFinalReady(true)}
              onError={() => setWantsFinal(false)}
              className={`absolute left-0 top-0 h-auto w-full max-w-none transition-opacity duration-500 motion-reduce:transition-none ${showFinal ? "opacity-100" : "opacity-0"}`}
            />
          )}
          {/* Only his head takes the pointer, so the empty parts of the picture never block links. */}
          <span className={`absolute left-[33%] right-[23%] top-0 h-[40%] rounded-full outline-ring group-focus-visible:outline-2 ${open ? "pointer-events-auto" : "group-hover:pointer-events-auto"}`} />
        </span>
      </button>
    </div>
  );
}
