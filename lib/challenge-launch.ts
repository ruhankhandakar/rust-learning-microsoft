/** Midnight India time on 1 December 2026. NEXT_PUBLIC_CHALLENGE_OPENS_AT overrides it for tests and rehearsals. */
export const CHALLENGE_OPENS_AT = Date.parse(process.env.NEXT_PUBLIC_CHALLENGE_OPENS_AT || "2026-12-01T00:00:00+05:30");

export const challengeOpen = (now: number) => now >= CHALLENGE_OPENS_AT;
