"use client";

import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

const BARS = Array.from({ length: 48 }, (_, i) => [1, 2, 1, 3, 1, 1, 2, 1][i % 8]);
const TEAR_AT = 0.55;

export interface TicketInfo {
  prize: string;
  name: string;
  quarter: string;
  ticketNo: string;
  claimBy: string;
}

export function SwagTicket({ info, torn, onTear }: { info: TicketInfo; torn: boolean; onTear: () => void }) {
  const [pull, setPull] = useState(0);
  const [dragging, setDragging] = useState(false);
  const start = useRef<number | null>(null);
  const pulled = useRef(0);
  const stub = useRef<HTMLDivElement>(null);

  const width = () => stub.current?.getBoundingClientRect().width ?? 120;
  const down = (e: PointerEvent<HTMLDivElement>) => {
    if (torn) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    start.current = e.clientX;
    pulled.current = 0;
    setDragging(true);
  };
  const move = (e: PointerEvent<HTMLDivElement>) => {
    if (start.current === null) return;
    pulled.current = Math.max(0, Math.min(1, (e.clientX - start.current) / width()));
    setPull(pulled.current);
  };
  const up = () => {
    if (start.current === null) return;
    start.current = null;
    setDragging(false);
    if (pulled.current >= TEAR_AT) onTear();
    else setPull(0);
  };
  const key = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!torn && (e.key === "Enter" || e.key === " " || e.key === "ArrowRight")) {
      e.preventDefault();
      onTear();
    }
  };
  const offset = torn ? 1 : pull;

  return (
    <div className="flex w-full max-w-[720px] items-stretch select-none">
      <div className="relative flex min-w-0 flex-1 flex-col justify-between gap-5 rounded-l-2xl border border-r-0 border-primary/50 bg-[linear-gradient(135deg,color-mix(in_oklch,var(--primary)_22%,var(--card)),var(--card)_65%)] p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-mono text-xs text-muted-foreground">Admit one, {info.quarter} draw</p>
            <p className="mt-1 font-heading text-2xl font-bold sm:text-3xl">{info.prize}</p>
            <p className="mt-1 text-sm text-muted-foreground">For {info.name}, who finished the 30-Day Rust Challenge.</p>
          </div>
          <span aria-hidden="true" className="font-heading text-2xl font-bold text-primary">
            rs::
          </span>
        </div>
        <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-xs text-muted-foreground">Ticket</dt>
            <dd className="whitespace-nowrap font-mono">{info.ticketNo}</dd>
          </div>
          <div className="hidden sm:block">
            <dt className="text-xs text-muted-foreground">Ships to</dt>
            <dd>India</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Claim by</dt>
            <dd className="whitespace-nowrap tabular-nums">{info.claimBy}</dd>
          </div>
        </dl>
        <div aria-hidden="true" className="flex h-7 items-stretch gap-[2px] overflow-hidden opacity-60">
          {BARS.map((w, i) => (
            <span key={i} className="bg-foreground" style={{ width: w * 2 }} />
          ))}
        </div>
      </div>
      <div aria-hidden="true" className="w-0 border-l-2 border-dashed border-primary/60" />
      <div
        ref={stub}
        role="button"
        tabIndex={torn ? -1 : 0}
        aria-label={torn ? "Ticket torn" : "Drag the stub to the right to tear and claim"}
        aria-disabled={torn}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onKeyDown={key}
        className={`flex w-24 shrink-0 touch-none flex-col items-center justify-center gap-2 rounded-r-2xl border border-l-0 border-primary/50 bg-primary/15 p-3 text-center focus-visible:outline-2 focus-visible:outline-ring sm:w-32 ${
          torn ? "" : "cursor-grab active:cursor-grabbing"
        } ${!dragging ? "transition-[transform,opacity] duration-500 ease-out motion-reduce:transition-none" : ""}`}
        style={{ transform: `translateX(${offset * 60}%) rotate(${offset * 14}deg)`, opacity: torn ? 0 : 1 - pull * 0.4 }}
      >
        <span className="font-heading text-sm font-bold">Tear to claim</span>
        <span aria-hidden="true" className="text-xs text-muted-foreground">
          drag right
        </span>
      </div>
    </div>
  );
}
