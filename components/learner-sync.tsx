"use client";

import { useEffect } from "react";
import { useSessionLite } from "./session-provider";
import { setChallengeActive, syncChallengeFlag } from "@/lib/challenge-client";
import { sanitizeState } from "@/lib/learner-merge";
import {
  exportState,
  getSyncOwner,
  importState,
  onLocalChange,
  setSyncOwner,
} from "@/lib/learner-store";

const PUSH_DELAY_MS = 4000;

/** Syncs solved exercises, quiz answers, review cards and last position to the account when signed in. */
export function LearnerSync() {
  const { user, isPending } = useSessionLite();
  const userId = user?.id;

  useEffect(() => {
    if (isPending) return;
    if (userId) void syncChallengeFlag();
    else setChallengeActive(false);
  }, [userId, isPending]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    let pulled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const push = async (keepalive = false) => {
      // Until this account's state is pulled, local storage may still hold the previous account's data.
      if (!pulled) return void pull();
      try {
        const res = await fetch("/api/learner-state", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(exportState()),
          keepalive,
        });
        if (res.ok && !cancelled) importState(await res.json());
      } catch {}
    };

    const pull = async () => {
      try {
        const res = await fetch("/api/learner-state");
        if (!res.ok || cancelled) return;
        const remote = sanitizeState(await res.json());
        const owner = getSyncOwner();
        // Another account synced this browser last: adopt this account's state instead of merging theirs in.
        importState(remote, owner !== null && owner !== userId);
        setSyncOwner(userId);
        pulled = true;
        if (JSON.stringify(exportState()) !== JSON.stringify(remote)) await push();
      } catch {}
    };
    void pull();

    const off = onLocalChange(() => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        timer = undefined;
        void push();
      }, PUSH_DELAY_MS);
    });
    const flush = () => {
      if (timer === undefined) return;
      clearTimeout(timer);
      timer = undefined;
      void push(true);
    };
    window.addEventListener("pagehide", flush);
    return () => {
      cancelled = true;
      off();
      clearTimeout(timer);
      window.removeEventListener("pagehide", flush);
    };
  }, [userId]);

  return null;
}
