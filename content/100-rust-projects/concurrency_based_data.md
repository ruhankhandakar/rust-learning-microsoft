# Project 041 – Concurrency-Based Data Processing

## Code
Partitions an array of integers into chunks, spawning multiple concurrent threads using `std::thread` to process chunks (squaring each integer) in parallel, and merges output values into a thread-safe `Arc<Mutex<Vec<i32>>>` buffer.

---

## Problem
Single-threaded data processing fails to leverage modern multi-core processors, resulting in bottlenecked performance when analyzing large collections or files.

---

## Goal
Build a parallel data processor that divides array segments across threads, runs parallel mappings, and aggregates outcomes using synchronization primitives.

---

## What I Learn
- Spawning OS threads dynamically using `std::thread::spawn`
- Sharing read-only structures across thread boundaries using atomic reference counters (`Arc`)
- Protecting mutable shared state from race conditions using mutual exclusion locks (`Mutex`)
- Splitting collections into independent segments using the `.chunks()` iterator method
- Transferring variable ownership to thread closures using the `move` keyword
- Syncing parent thread execution with worker threads using `handle.join()`
- Acquiring locks and handling poisoned states with `.lock().unwrap()`

---

## Notes
- `Arc` (Atomic Reference Counting) provides shared ownership across multiple threads, whereas a standard `Rc` is not thread-safe because its reference counter is not updated using atomic CPU instructions.
- A `Mutex` guard automatically releases the lock when it goes out of scope (using the `Drop` trait), preventing deadlock scenarios.
