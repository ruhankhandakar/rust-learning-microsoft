# Project 048 – Process Manager

## Code
Queries system processes using the `sysinfo` crate, providing options to list all active processes, search for processes by name, and terminate processes using their PID.

---

## Problem
Managing system processes requires querying active OS tasks, parsing search queries, obtaining process handles, and sending termination signals safely.

---

## Goal
Build a terminal process manager that lists active processes, searches processes by name, and terminates tasks by PID.

---

## What I Learn
- Interfacing with OS process tables using `sysinfo` APIs
- Refreshing processes and system stats periodically via `refresh_all` updates
- Filtering process maps case-insensitively using name matching
- Terminating processes using target OS signals like `Signal::Kill`
- Parsing process IDs using the custom `Pid` wrapper type
- Formatting process listings with PID, name, and CPU percentage columns
- Handling invalid PIDs or missing targets during termination prompts

---

## Notes
- Terminating processes with `Signal::Kill` forces immediate termination without letting the process clean up resources.
- Depending on the OS, terminating processes owned by other users or the system requires elevated privileges (e.g. `sudo`).
- Try searching for your browser process name in the manager list to check its PID and CPU load.
