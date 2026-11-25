"use client";

import { useState } from "react";
import { SwagTicket } from "@/components/swag-ticket";

const DEMO = { prize: "T-shirt bundle", name: "your-github-name", quarter: "This quarter's", ticketNo: "#Q-0003", claimBy: "14 days after the email" };

export function SwagDemo() {
  const [torn, setTorn] = useState(false);
  return (
    <div className="flex flex-col items-start gap-5">
      <SwagTicket info={DEMO} torn={torn} onTear={() => setTorn(true)} />
      <div aria-live="polite">
        {torn && (
          <div className="rise flex flex-col items-start gap-2">
            <p className="font-heading text-2xl font-bold">Torn. It&apos;s yours.</p>
            <p className="max-w-lg text-sm text-muted-foreground">
              Pick a size and colour, then enter where to ship it. Your address is deleted the day it ships.
            </p>
            <button type="button" onClick={() => setTorn(false)} className="mt-1 text-sm font-semibold text-primary hover:underline">
              Replay
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
