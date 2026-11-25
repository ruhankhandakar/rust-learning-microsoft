"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { drawState, listCheckins, listComments, listFinishers } from "@/lib/admin";

type Comments = Awaited<ReturnType<typeof listComments>>;
type Finishers = Awaited<ReturnType<typeof listFinishers>>;
type Draw = Awaited<ReturnType<typeof drawState>>;
type Checkins = Awaited<ReturnType<typeof listCheckins>>;

const TABS = ["Comments", "Check-ins", "Flagged progress", "Swag draw"] as const;
const small = "min-h-9 rounded-lg border px-3 text-sm font-semibold transition-colors disabled:opacity-50";
const pill = "rounded-full px-2.5 py-0.5 text-xs font-semibold";
const COMMENT_STATUS: Record<string, [string, string]> = {
  new: ["Waiting", "bg-amber-500/15 text-amber-700 dark:text-amber-300"],
  approved: ["Approved", "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"],
  hidden: ["Hidden", "bg-muted text-muted-foreground"],
};
const WINNER_STATUS: Record<string, [string, string]> = {
  drawn: ["Waiting for claim", "bg-muted text-muted-foreground"],
  claimed: ["Claimed, ship it", "bg-amber-500/15 text-amber-700 dark:text-amber-300"],
  shipped: ["Shipped", "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"],
  expired: ["Expired, redrawn", "bg-muted text-muted-foreground"],
};

const launchMessage = (site: string) => `Subject: The 30-Day Rust Challenge is open

Hi,

You asked us to tell you when the 30-Day Rust Challenge opens. It's open now:
${site}/challenge

Read 30 chapters on at least 15 days and get 25 quizzes right, within 30 days. Your 30 days start when you press Start.

Happy reading,
Ruhan`;

export function AdminBoard({ comments, checkins, finishers, draw, site }: { comments: Comments; checkins: Checkins; finishers: Finishers; draw: Draw; site: string }) {
  const router = useRouter();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Comments");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<number | string | null>(null);
  const pending = checkins.filter((c) => !c.emailedAt && c.email);

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
                <li key={c.id} className={`flex flex-wrap items-start justify-between gap-4 rounded-xl border border-border p-4 transition-opacity ${c.status === "hidden" ? "opacity-50" : ""}`}>
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
                    <span className={`${pill} ${(COMMENT_STATUS[c.status] ?? COMMENT_STATUS.new)[1]}`}>{(COMMENT_STATUS[c.status] ?? COMMENT_STATUS.new)[0]}</span>
                    <button type="button" disabled={busy || c.status === "approved"} onClick={() => act({ action: "comment", id: c.id, status: "approved" })} className={`${small} border-primary bg-primary text-primary-foreground hover:bg-primary/90`}>
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

      {tab === "Check-ins" && (
        <section>
          <h2 className="mb-1 text-xl font-bold">Challenge check-ins</h2>
          <p className="mb-5 text-sm text-muted-foreground">
            {checkins.length} {checkins.length === 1 ? "person" : "people"} asked to be emailed when the challenge opens. {pending.length} not emailed yet. Paste the
            addresses into Bcc, never To, then mark them emailed.
          </p>
          <div className="mb-5 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={pending.length === 0}
              onClick={() => navigator.clipboard.writeText(pending.map((c) => c.email).join(", ")).then(() => setCopied("emails"))}
              className={`${small} border-primary bg-primary text-primary-foreground hover:bg-primary/90`}
            >
              {copied === "emails" ? "Emails copied" : `Copy ${pending.length} ${pending.length === 1 ? "email" : "emails"}`}
            </button>
            <button type="button" onClick={() => navigator.clipboard.writeText(launchMessage(site)).then(() => setCopied("message"))} className={`${small} border-border hover:bg-accent`}>
              {copied === "message" ? "Message copied" : "Copy email text"}
            </button>
            <button
              type="button"
              disabled={busy || pending.length === 0}
              onClick={() => act({ action: "emailed", userIds: pending.map((c) => c.id) })}
              className={`${small} border-border hover:bg-accent`}
            >
              Mark {pending.length} as emailed
            </button>
          </div>
          {checkins.length === 0 ? (
            <p className="text-muted-foreground">No check-ins yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-left text-sm">
                <thead className="text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="p-3 font-normal">Name</th>
                    <th className="p-3 font-normal">Email</th>
                    <th className="p-3 font-normal">Checked in</th>
                    <th className="p-3 font-normal">Emailed</th>
                  </tr>
                </thead>
                <tbody>
                  {checkins.map((c) => (
                    <tr key={c.id} className="border-b border-border last:border-0">
                      <td className="p-3 font-semibold">{c.name}</td>
                      <td className="p-3">{c.email || <span className="text-muted-foreground">no email on GitHub</span>}</td>
                      <td className="p-3 tabular-nums">{c.checkedInAt.slice(0, 10)}</td>
                      <td className="p-3">
                        {c.emailedAt ? (
                          <span className={`${pill} bg-emerald-500/15 text-emerald-700 dark:text-emerald-300`}>{c.emailedAt.slice(0, 10)}</span>
                        ) : (
                          <span className={`${pill} bg-amber-500/15 text-amber-700 dark:text-amber-300`}>Not yet</span>
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
                      <td className="p-3">
                        {f.revoked ? (
                          <span className={`${pill} bg-muted text-muted-foreground`}>Revoked</span>
                        ) : f.flags.length === 0 ? (
                          <span className="text-muted-foreground">None</span>
                        ) : f.cleared ? (
                          <span className="text-muted-foreground">{f.flags.join(", ")}, reviewed</span>
                        ) : (
                          <span className="text-amber-700 dark:text-amber-300">{f.flags.join(", ")}</span>
                        )}
                      </td>
                      <td className="p-3">
                        {!f.revoked && (
                          <div className="flex justify-end gap-2">
                            {f.flags.length > 0 && !f.cleared && (
                              <button type="button" disabled={busy} onClick={() => act({ action: "looks-fine", userId: f.id })} className={`${small} whitespace-nowrap border-border hover:bg-accent`}>
                                Looks fine
                              </button>
                            )}
                            <button type="button" disabled={busy} onClick={() => act({ action: "revoke", userId: f.id })} className={`${small} whitespace-nowrap border-red-500/50 text-red-600 hover:bg-red-500/10 dark:text-red-400`}>
                              Revoke badges
                            </button>
                          </div>
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
            {draw.eligible} eligible finishers (finished, opted in to the draw, never got a prize). GitHub accounts under 90 days old are skipped when you draw. Check each winner&apos;s profile before emailing them their claim link.
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
              {draw.winners.map((w, i) => {
                const link = `${site}/swag/claim/${w.token}`;
                return (
                  <li key={w.id} className={`rise rounded-xl border border-border p-4 ${w.status === "expired" ? "opacity-60" : ""}`} style={{ animationDelay: `${i * 80}ms` }}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p>
                        <span className="font-semibold">{w.name}</span> <span className="text-muted-foreground">({w.email}), {w.prize}, {w.quarter}</span>
                      </p>
                      <div className="flex items-center gap-2">
                        <span className={`${pill} ${w.unclaimed ? "bg-red-500/15 text-red-700 dark:text-red-300" : (WINNER_STATUS[w.status] ?? WINNER_STATUS.drawn)[1]}`}>
                          {w.unclaimed ? "Unclaimed, past the date" : (WINNER_STATUS[w.status] ?? WINNER_STATUS.drawn)[0]}
                        </span>
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
