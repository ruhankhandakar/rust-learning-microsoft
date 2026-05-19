# Project 036 – Multi-threaded Counter

## Code
Shares an atomic counter (`AtomicUsize`) across 5 threads using thread-safe reference counting (`Arc`), incrementing the value in parallel and joining threads before displaying the total count.

---

## Problem
Updating shared memory from multiple threads concurrently creates race conditions where operations interrupt each other, leading to corrupted data values.

---

## Goal
Build a parallel counter that spans multiple threads, utilizing atomic integers to prevent race conditions and thread handles to block until completion.

---

## What I Learn
- `std::sync::Arc` (Atomically Reference Counted) to share read-only ownership of variables across threads
- `std::sync::atomic::AtomicUsize` representing integer types that can be safely shared and mutated atomically
- Spawning OS threads using `std::thread::spawn` with move closures (`move ||`)
- Modifying atomic integers safely using the `fetch_add` instruction
- Understanding memory orderings using CPU constraint settings like `std::sync::atomic::Ordering::SeqCst`
- Collecting thread handles in a list and calling `join` to coordinate completion
- Thread-safety rules enforced by compiler marker traits like `Send` and `Sync`

---

## Notes
- `AtomicUsize` handles CPU-level lock-free operations, which are much faster than acquiring mutex locks for simple integer mutations.
- `Ordering::SeqCst` (Sequentially Consistent) is the strictest memory ordering constraint, guaranteeing all threads see changes in the same order.
- Try changing the iteration loops to much higher numbers (e.g. 100,000) and compare execution speeds against locked mutex counters.
