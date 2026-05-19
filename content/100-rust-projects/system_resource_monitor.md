# Project 044 – System Resource Monitor

## Code
Monitors system diagnostics using the `sysinfo` crate, periodically printing core CPU usage, total memory consumption, process counts, and the top 5 active processes.

---

## Problem
System administrators need utilities to track resource usage, identify memory leaks, and locate high-CPU processes in real-time.

---

## Goal
Build a terminal diagnostics dashboard that updates at set intervals, printing CPU usage per core, memory statistics, and process lists.

---

## What I Learn
- Querying host OS metrics using the external `sysinfo::System` wrapper
- Refreshing system stats periodically via `refresh_all` updates
- Iterating and reading properties like `cpu_usage()` across cpus
- Converting memory byte sizes to megabytes using integer division (`/ 1024`)
- Gathering active process details and sorting lists using custom closure comparisons
- Constraining list iteration limits using the `take` iterator method
- Controlling loop refresh intervals using `std::thread::sleep`

---

## Notes
- `sysinfo` queries OS-level system tables, which varies depending on the platform (Linux, macOS, Windows).
- Running `refresh_all()` updates CPU usage records by calculating the delta between two system ticks, which is why the first run can report 0% CPU.
- Try running the monitor in a side terminal and execute a heavy task to observe core loads changing.
