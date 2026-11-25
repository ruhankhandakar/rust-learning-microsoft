// Usage: pnpm tsx scripts/check-learner-merge.ts — asserts the cross-device merge rules for synced learner state.
import assert from "node:assert/strict";
import { mergeStates, sanitizeState, EMPTY_STATE } from "../lib/learner-merge";

const a = sanitizeState({ solved: { x: 100, y: -300 }, review: { "ex:x": { box: 1, due: 5, at: 200 } }, lastRead: { bookSlug: "b", chapterSlug: "c", at: 50 } });
const b = sanitizeState({ solved: { x: -200, y: 250, z: 7 }, review: { "ex:x": { box: 0, due: 0, at: 150, removed: true } }, lastRead: { bookSlug: "b", chapterSlug: "d", at: 40 } });
const m = mergeStates(a, b);
assert.equal(m.solved.x, -200, "later unsolve wins");
assert.equal(m.solved.y, -300, "later unsolve beats earlier solve");
assert.equal(m.solved.z, 7);
assert.equal(m.review["ex:x"].box, 1, "later grade beats older tombstone");
assert.equal(m.lastRead?.chapterSlug, "c");
assert.deepEqual(mergeStates(m, m), m, "idempotent");
assert.deepEqual(mergeStates(a, b), mergeStates(b, a), "commutative when timestamps differ");
assert.deepEqual(sanitizeState("junk"), EMPTY_STATE);
assert.deepEqual(sanitizeState({ solved: { x: "1" }, review: { r: { box: "a" } }, lastRead: { at: 1 } }), EMPTY_STATE);

const server = sanitizeState({ review: { g: { box: 3, due: 9e12, at: 500 }, r: { box: 0, due: 0, at: 500, removed: true } } });
const fresh = sanitizeState({ review: { g: { box: 0, due: 1, at: 0 }, r: { box: 0, due: 1, at: 0 }, n: { box: 0, due: 1, at: 0 } } });
const synced = mergeStates(fresh, server);
assert.equal(synced.review.g.box, 3, "a fresh enrollment never resets a card graded elsewhere");
assert.equal(synced.review.r.removed, true, "a fresh enrollment never revives a removed card");
assert.equal(synced.review.n.box, 0, "a fresh enrollment of a new card is kept");
assert.equal(mergeStates(sanitizeState({ review: { g: { box: 2, due: 1, at: 100 } } }), sanitizeState({ review: { g: { box: 0, due: 0, at: 200, removed: true } } })).review.g.removed, true, "a newer removal beats an older grade");

console.log("merge checks passed");
