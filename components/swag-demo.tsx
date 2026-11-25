"use client";

import { useState } from "react";
import { SwagTicket, TicketStage } from "@/components/swag-ticket";

const DEMO = { prize: "T-shirt bundle", name: "your-github-name", quarter: "This quarter's", ticketNo: "#Q-0003", claimBy: "14 days after the email" };

export function SwagDemo() {
  const [torn, setTorn] = useState(false);
  return (
    <TicketStage torn={torn}>
      <SwagTicket info={DEMO} torn={torn} onTear={() => setTorn(true)} />
      <div aria-live="polite" className="w-full max-w-[720px]">
        {torn && (
          <div className="rise flex flex-col items-start gap-2 rounded-2xl border border-primary/50 bg-primary/[0.08] p-5" style={{ animationDelay: "350ms" }}>
            <p className="font-bold">Torn. It&apos;s yours.</p>
            <p className="text-sm text-muted-foreground">Pick a size and colour, then enter where to ship it. Your address is deleted the day it ships.</p>
            <button
              type="button"
              onClick={() => setTorn(false)}
              className="mt-1 inline-flex h-9 items-center rounded-lg border border-border px-3 text-sm transition-colors hover:border-primary/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              Replay
            </button>
          </div>
        )}
      </div>
    </TicketStage>
  );
}
