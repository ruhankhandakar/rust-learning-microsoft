"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { drawState, listComments, listFinishers } from "@/lib/admin";

type Comments = Awaited<ReturnType<typeof listComments>>;
type Finishers = Awaited<ReturnType<typeof listFinishers>>;
type Draw = Awaited<ReturnType<typeof drawState>>;

const TABS = ["Comments", "Flagged progress", "Swag draw"] as const;
const small = "min-h-9 rounded-lg border px-3 text-sm font-semibold transition-colors disabled:opacity-50";

export function AdminBoard({ comments, finishers, draw, site }: { comments: Comments; finishers: Finishers; draw: Draw; site: string }) {
  const router = useRouter();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Comments");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<number | null>(null);

  async function act(body: object) {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).catch(() => null);
    if (!res?.ok) setError(res ? ((await res.json().catch(() => null))?.error ?? `Failed (${res.status})`) : "Offline");
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border">
        <h1 className="pb-3 text-3xl font-bold">
          Admin <span className="text-base font-normal text-muted-foreground">only visible to the owner</span>
        </h1>
        <nav aria-label="Admin sections" className="flex gap-1">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              aria-current={tab === t ? "page" : undefined}
              onClick={() => setTab(t)}
              className={`-mb-px border-b-2 px-3 py-2.5 text-sm transition-colors ${tab === t ? "border-primary font-medium text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              {t}
            </button>
          ))}
        </nav>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      {tab === "Comments" && (
        <section>
          <h2 className="mb-1 text-xl font-bold">Testimonials and comments</h2>
          <p className="mb-5 text-sm text-muted-foreground">
            Nothing appears on the site until you approve it. &ldquo;Draw entrant&rdquo; marks people in the swag draw, for disclosure.
          </p>
          {comments.length === 0 ? (
            <p className="text-muted-foreground">No comments yet.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {comments.map((c) => (
                <li key={c.id} className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-border p-4">
                  <div className="min-w-0 flex-[1_1_420px]">
                    <p className="text-sm text-muted-foreground">
                      <span className="font-semibold text-foreground">{c.name}</span> on {c.where}, {c.date}
                      {[c.helpful ? "found it helpful" : "not helpful", c.showPublic && "show publicly", c.okToQuote && "OK to quote", c.drawEntrant && "draw entrant"]
                        .filter(Boolean)
                        .map((f) => (
                          <span key={String(f)} className="ml-2 rounded-full border border-border px-2 py-0.5 text-xs">
                            {f}
                          </span>
                        ))}
                    </p>
                    <p className="mt-2">{c.comment}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm ${c.status === "approved" ? "text-emerald-600 dark:text-emerald-500" : c.status === "hidden" ? "text-muted-foreground" : "text-amber-600 dark:text-amber-400"}`}>{c.status}</span>
                    <button type="button" disabled={busy || c.status === "approved"} onClick={() => act({ action: "comment", id: c.id, status: "approved" })} className={`${small} border-emerald-500/50 hover:bg-emerald-500/10`}>
                      Approve
                    </button>
                    <button type="button" disabled={busy || c.status === "hidden"} onClick={() => act({ action: "comment", id: c.id, status: "hidden" })} className={`${small} border-border hover:bg-accent`}>
                      Hide
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {tab === "Flagged progress" && (
        <section>
          <h2 className="mb-1 text-xl font-bold">Flagged progress</h2>
          <p className="mb-5 text-sm text-muted-foreground">
            Every finisher, with signals worth a look. Revoking removes their badge, wall listing and draw entry; their badge image updates within an hour.
          </p>
          {finishers.length === 0 ? (
            <p className="text-muted-foreground">No finishers yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-left text-sm">
                <thead className="text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="p-3 font-normal">Account</th>
                    <th className="p-3 font-normal">Account age at start</th>
                    <th className="p-3 font-normal">Days taken</th>
                    <th className="p-3 font-normal">Quiz accuracy</th>
                    <th className="p-3 font-normal">Signals</th>
                    <th className="p-3" />
                  </tr>
                </thead>
                <tbody>
                  {finishers.map((f) => (
                    <tr key={f.id} className="border-b border-border last:border-0">
                      <td className="p-3 font-semibold">{f.name}</td>
                      <td className="p-3 tabular-nums">{f.accountAgeAtStart} days</td>
                      <td className="p-3 tabular-nums">{f.daysTaken ?? "–"}</td>
                      <td className="p-3 tabular-nums">{f.accuracy === null ? "–" : `${Math.round(f.accuracy * 100)}%`}</td>
                      <td className="p-3 text-amber-600 dark:text-amber-400">{f.revoked ? <span className="text-muted-foreground">revoked</span> : f.flags.join(", ") || <span className="text-muted-foreground">none</span>}</td>
                      <td className="p-3 text-right">
                        {!f.revoked && (
                          <button type="button" disabled={busy} onClick={() => act({ action: "revoke", userId: f.id })} className={`${small} border-red-400/50 text-red-400 hover:bg-red-500/10`}>
                            Revoke
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {tab === "Swag draw" && (
        <section>
          <h2 className="mb-1 text-xl font-bold">Swag draw, {draw.quarter}</h2>
          <p className="mb-5 text-sm text-muted-foreground">
            {draw.eligible} eligible finishers (finished, opted in to the draw, never won). Check each winner&apos;s profile before emailing them their claim link.
          </p>
          {draw.drawnAt ? (
            <p className="mb-5 text-sm text-muted-foreground">
              Drawn {draw.drawnAt.slice(0, 16).replace("T", " ")} UTC with seed <span className="font-mono text-foreground">{draw.seed}</span>
            </p>
          ) : (
            <button
              type="button"
              disabled={busy || draw.eligible === 0}
              onClick={() => act({ action: "draw" })}
              className="mb-5 inline-flex min-h-11 items-center rounded-[10px] bg-primary px-5 font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Draw {draw.quarter} winners
            </button>
          )}
          {draw.winners.length > 0 && (
            <ul className="flex flex-col gap-3">
              {draw.winners.map((w) => {
                const link = `${site}/swag/claim/${w.token}`;
                return (
                  <li key={w.id} className="rounded-xl border border-border p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p>
                        <span className="font-semibold">{w.name}</span> <span className="text-muted-foreground">({w.email}), {w.prize}, {w.quarter}</span>
                      </p>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm ${w.unclaimed ? "text-red-600 dark:text-red-400" : w.status === "shipped" ? "text-emerald-600 dark:text-emerald-500" : w.status === "claimed" ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`}>{w.unclaimed ? "unclaimed, past the date" : w.status}</span>
                        {w.unclaimed && (
                          <button type="button" disabled={busy} onClick={() => act({ action: "redraw", winnerId: w.id })} className={`${small} border-primary/50 hover:bg-primary/10`}>
                            Redraw
                          </button>
                        )}
                        {w.status === "drawn" && !w.unclaimed && (
                          <button
                            type="button"
                            onClick={() => navigator.clipboard.writeText(link).then(() => setCopied(w.id))}
                            className={`${small} border-border hover:bg-accent`}
                          >
                            {copied === w.id ? "Link copied" : "Copy claim link"}
                          </button>
                        )}
                        {w.status === "claimed" && (
                          <button type="button" disabled={busy} onClick={() => act({ action: "shipped", winnerId: w.id })} className={`${small} border-emerald-500/50 hover:bg-emerald-500/10`}>
                            Mark shipped
                          </button>
                        )}
                      </div>
                    </div>
                    {w.status === "drawn" && !w.unclaimed && <p className="mt-1 text-xs text-muted-foreground">Claim by {w.claimBy.slice(0, 10)}</p>}
                    {w.status === "claimed" && w.fullName && (
                      <address className="mt-3 rounded-lg bg-card p-3 text-sm not-italic">
                        {w.fullName}, {w.phone}
                        <br />
                        {w.line1}
                        {w.line2 ? `, ${w.line2}` : ""}, {w.city}, {w.state} {w.postcode}
                        {w.size && (
                          <>
                            <br />
                            Size {w.size}, {w.colour}
                          </>
                        )}
                      </address>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
