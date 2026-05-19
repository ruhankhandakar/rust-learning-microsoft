# Project 059 – Scheduler Simulation

## Code
Simulates a task scheduler that sorts tasks based on execution delays (Shortest Job First), runs them using `std::thread::sleep`, and prints elapsed time statistics.

---

## Problem
Operating systems and batch queues need to schedule tasks. Simulating these algorithms requires structuring task payloads, sorting execution lists, and tracking elapsed times.

---

## Goal
Build a terminal task scheduler that sorts a list of tasks by execution delays, runs them in order, and prints elapsed times.

---

## What I Learn
- Representing task properties using custom structs (`Task`)
- Sorting vectors of structs in place using sorting keys like `sort_by_key`
- Tracking application elapsed times using `std::time::Instant`
- Suspending task execution using `std::thread::sleep` and `Duration::from_secs`
- Calculating elapsed seconds using `duration_since(start).as_secs()`
- Dynamic string creation utilizing path wrappers like `into()`
- Iterating vector records and displaying progress statistics

---

## Notes
- `sort_by_key(|t| t.delay_secs)` sorts tasks in ascending order of delay, implementing a Shortest Job First scheduling strategy.
- `Instant::now()` queries high-resolution system timers, which are monotonic and cannot go backward even if the system clock changes.
- Try adding more tasks with varying delays to verify they run in ascending order of execution time.
