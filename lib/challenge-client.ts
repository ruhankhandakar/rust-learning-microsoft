const FLAG = "rt:challenge-active";
export const CHALLENGE_ACTIVE_EVENT = "rs:challenge-active";

export function setChallengeActive(active: boolean) {
  try {
    if (active === (localStorage.getItem(FLAG) === "1")) return;
    if (active) localStorage.setItem(FLAG, "1");
    else localStorage.removeItem(FLAG);
  } catch {
    return;
  }
  if (active) window.dispatchEvent(new Event(CHALLENGE_ACTIVE_EVENT));
}

/** After sign-in on any device, match this browser's flag to the account's challenge. */
export async function syncChallengeFlag() {
  try {
    const res = await fetch("/api/challenge");
    if (res.status === 401) return setChallengeActive(false);
    if (res.ok) setChallengeActive((await res.json()).status === "active");
  } catch {}
}

export function isChallengeActive(): boolean {
  try {
    return localStorage.getItem(FLAG) === "1";
  } catch {
    return false;
  }
}

async function post(body: object): Promise<Response | null> {
  try {
    const res = await fetch("/api/challenge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true,
    });
    if (res.status === 401) setChallengeActive(false);
    return res;
  } catch {
    return null;
  }
}

/** Opening a chapter: the server timestamps it and says how long it must stay open. */
export async function requestReadTicket(ref: string): Promise<{ ticket: string; seconds: number } | null> {
  if (!isChallengeActive()) return null;
  const res = await post({ action: "ticket", ref });
  return res?.status === 200 ? res.json() : null;
}

/** Tells the server about a chapter read or a quiz answer, only while this reader has a challenge running. */
export async function reportChallenge(kind: "chapter" | "quiz", ref: string, proof: { answer?: boolean; ticket?: string }) {
  if (!isChallengeActive()) return;
  const res = await post({ action: "event", kind, ref, ...proof });
  if (!res?.ok) return;
  const progress = await res.json();
  if (progress.status !== "active") setChallengeActive(false);
}
