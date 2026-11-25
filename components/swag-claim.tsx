"use client";

import { useState, type FormEvent } from "react";
import { GitHubSignIn } from "@/components/github-sign-in";
import { Checkbox } from "@/components/ui/checkbox";
import { SwagTicket, TicketStage, type TicketInfo } from "@/components/swag-ticket";

const field =
  "w-full rounded-[10px] border border-border bg-card px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-primary";

export function SignInToClaim({ path }: { path: string }) {
  return (
    <GitHubSignIn callbackURL={path} label="Sign in with GitHub to claim" />
  );
}

export function ClaimFlow({ token, info, shirt }: { token: string; info: TicketInfo; shirt: boolean }) {
  const [torn, setTorn] = useState(false);
  const [adult, setAdult] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    setError(null);
    const form = Object.fromEntries(new FormData(e.currentTarget));
    const res = await fetch("/api/swag/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, token, adult }),
    }).catch(() => null);
    if (res?.ok) return setStatus("done");
    setStatus("idle");
    setError(res ? ((await res.json().catch(() => null))?.error ?? "That didn't save. Try again.") : "You seem to be offline. Try again.");
  }

  if (status === "done") {
    return (
      <div role="status" className="flex flex-col gap-2">
        <p className="font-heading text-2xl font-bold">Claimed. It&apos;s on its way soon.</p>
        <p className="text-muted-foreground">Your address is stored only until the parcel ships, then deleted.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <TicketStage torn={torn}>
        <SwagTicket info={info} torn={torn} onTear={() => setTorn(true)} />
      </TicketStage>
      {torn && (
        <form onSubmit={submit} className="rise grid max-w-2xl gap-4 sm:grid-cols-2" aria-labelledby="claim-title">
          <div className="sm:col-span-2">
            <h2 id="claim-title" className="font-heading text-2xl font-bold">Torn. It&apos;s yours.</h2>
            <p className="text-sm text-muted-foreground">Where should it go? Your address is deleted the day it ships.</p>
          </div>
          {shirt && (
            <>
              <label className="flex flex-col gap-1.5 text-sm">
                Size
                <select name="size" required className={field} defaultValue="">
                  <option value="" disabled>
                    Choose
                  </option>
                  {["S", "M", "L", "XL", "XXL"].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1.5 text-sm">
                Colour
                <select name="colour" required className={field} defaultValue="">
                  <option value="" disabled>
                    Choose
                  </option>
                  {["Black", "Rust orange", "Cream"].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
            </>
          )}
          <label className="flex flex-col gap-1.5 text-sm">
            Full name
            <input name="fullName" required maxLength={120} autoComplete="name" className={field} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            Phone (for the courier)
            <input name="phone" required inputMode="tel" autoComplete="tel" placeholder="+91 98765 43210" className={field} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
            Address line 1
            <input name="line1" required maxLength={120} autoComplete="address-line1" className={field} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
            Address line 2 (optional)
            <input name="line2" maxLength={120} autoComplete="address-line2" className={field} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            City
            <input name="city" required maxLength={60} autoComplete="address-level2" className={field} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            State
            <input name="state" required maxLength={60} autoComplete="address-level1" className={field} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            PIN code
            <input name="postcode" required inputMode="numeric" pattern="\d{6}" autoComplete="postal-code" className={field} />
          </label>
          <div className="sm:col-span-2">
            <Checkbox checked={adult} onChange={(e) => setAdult(e.target.checked)} required>
              I&apos;m 18 or older and this address is in India
            </Checkbox>
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive sm:col-span-2">
              {error}
            </p>
          )}
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={status === "sending" || !adult}
              className="inline-flex min-h-12 items-center rounded-[10px] bg-primary px-5 font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {status === "sending" ? "Sending" : "Claim my prize"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
