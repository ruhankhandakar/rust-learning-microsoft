"use client";

import { useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { ArrowRight } from "lucide-react";

const BARS = Array.from({ length: 48 }, (_, i) => [1, 2, 1, 3, 1, 1, 2][i % 7]);
const TEAR_AT = 0.55;
const SPARK_GLYPHS = ["rs::", "::", "{}", "&", "!", "*"];
const SPARK_COLORS = ["var(--primary)", "var(--foreground)", "var(--tier-gold)"];
const SPARKS = Array.from({ length: 18 }, (_, i) => {
  const angle = (i / 18) * Math.PI * 2;
  const dist = 140 + (i % 4) * 40;
  return {
    glyph: SPARK_GLYPHS[i % 6],
    style: {
      fontSize: 14 + (i % 3) * 6,
      color: SPARK_COLORS[i % 3],
      animationDelay: `${i * 12}ms`,
      "--dx": `${Math.round(Math.cos(angle) * dist)}px`,
      "--dy": `${Math.round(Math.sin(angle) * dist)}px`,
      "--rot": `${(i % 2 ? 1 : -1) * 120}deg`,
    } as CSSProperties,
  };
});

export interface TicketInfo {
  prize: string;
  name: string;
  quarter: string;
  ticketNo: string;
  claimBy: string;
}

export function TicketStage({ torn, children }: { torn: boolean; children: ReactNode }) {
  return (
    <div className="ticket-stage flex flex-col items-center gap-5 overflow-hidden rounded-3xl border border-border px-4 pb-12 pt-10 sm:px-8">
      <p className="font-mono text-sm text-primary">{torn ? "Claimed. Enjoy it." : "You won. Tear the stub to claim."}</p>
      {children}
    </div>
  );
}

export function SwagTicket({ info, torn, onTear }: { info: TicketInfo; torn: boolean; onTear: () => void }) {
  const [px, setPx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const start = useRef<number | null>(null);
  const pulled = useRef(0);
  const stub = useRef<HTMLDivElement>(null);

  const width = () => stub.current?.offsetWidth || 120;
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
    const w = width();
    pulled.current = Math.max(0, Math.min(1, (e.clientX - start.current) / w));
    setPx(pulled.current * w * 1.2);
  };
  const up = () => {
    if (start.current === null) return;
    start.current = null;
    setDragging(false);
    if (pulled.current >= TEAR_AT) onTear();
    setPx(0);
  };
  const key = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!torn && (e.key === "Enter" || e.key === " " || e.key === "ArrowRight")) {
      e.preventDefault();
      onTear();
    }
  };
  const stubTransform = torn ? "translate(260px, 220px) rotate(38deg)" : `translate(${px}px, ${Math.max(0, px - 60) * 0.25}px) rotate(${px * 0.12}deg)`;

  return (
    <div className="relative flex w-full max-w-[720px] select-none items-stretch drop-shadow-[0_30px_50px_rgb(0_0_0/0.45)]">
      <div className="relative flex min-w-0 flex-1 flex-col justify-between gap-5 overflow-hidden rounded-l-[18px] border border-r-0 border-primary/40 bg-[linear-gradient(135deg,color-mix(in_oklab,var(--primary)_22%,var(--card)),var(--card)_60%)] p-5 sm:p-7">
        <span aria-hidden="true" className="ticket-holo pointer-events-none absolute inset-y-0 right-6 hidden w-8 opacity-30 sm:block dark:opacity-50" />
        <div className="relative flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-mono text-xs text-primary">Admit one, {info.quarter} draw</p>
            <p className="mt-1.5 font-heading text-2xl font-bold sm:text-[34px] sm:leading-tight">{info.prize}</p>
            <p className="mt-1 text-sm text-muted-foreground">For {info.name}, who finished the 30-Day Rust Challenge.</p>
          </div>
          <span
            aria-hidden="true"
            className="flex size-14 shrink-0 -rotate-12 items-center justify-center rounded-full border-2 border-dashed border-primary/70 font-heading text-base font-bold text-primary sm:size-[72px] sm:text-xl"
          >
            rs::
          </span>
        </div>
        <dl className="relative grid gap-2 font-mono text-xs text-muted-foreground sm:flex sm:gap-7">
          <div>
            <dt>Ticket</dt>
            <dd className="whitespace-nowrap text-[15px] text-foreground">{info.ticketNo}</dd>
          </div>
          <div className="hidden sm:block">
            <dt>Ships to</dt>
            <dd className="text-[15px] text-foreground">India</dd>
          </div>
          <div>
            <dt>Claim by</dt>
            <dd className="whitespace-nowrap text-[15px] tabular-nums text-foreground">{info.claimBy}</dd>
          </div>
        </dl>
        <div aria-hidden="true" className="relative flex h-7 items-stretch gap-[2px] overflow-hidden">
          {BARS.map((w, i) => (
            <span key={i} className={`rounded-[1px] bg-foreground ${i % 5 === 0 ? "opacity-20" : "opacity-70"}`} style={{ flex: w }} />
          ))}
        </div>
      </div>
      <div aria-hidden="true" className="my-3.5 w-0 border-l-[3px] border-dotted border-primary/60" />
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
        className={`flex w-20 shrink-0 origin-bottom-left touch-none flex-col items-center justify-between rounded-r-[18px] bg-[linear-gradient(160deg,color-mix(in_oklab,var(--primary)_75%,white),var(--primary))] py-5 text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:w-28 ${
          torn ? "pointer-events-none" : "cursor-grab active:cursor-grabbing"
        } ${dragging ? "" : "transition-[transform,opacity] duration-700 ease-[cubic-bezier(.5,0,.75,0)] motion-reduce:transition-none"}`}
        style={{ transform: stubTransform, opacity: torn ? 0 : 1 }}
      >
        <span className="rotate-180 font-mono text-xs font-semibold [writing-mode:vertical-rl]">Tear to claim</span>
        <span className="flex flex-col items-center gap-1 text-xs font-bold">
          <ArrowRight className="size-5" aria-hidden="true" />
          drag
        </span>
      </div>
      {torn && (
        <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 size-0">
          {SPARKS.map((s, i) => (
            <span key={i} className="ticket-spark absolute font-heading font-bold" style={s.style}>
              {s.glyph}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
