# Project 027 – Logger Utility

## Code
Logs console entries classified by severity levels (INFO, WARN, ERROR) into a persistent log file, prefixing entries with formatted local timestamps.

---

## Problem
Debugging and auditing systems need a uniform format for events, attaching accurate timestamps to entries, and appending logs to storage files without destroying previous contents.

---

## Goal
Build a terminal log-entry manager that formats timestamps with `chrono`, structures log entries, and appends them to a file.

---

## What I Learn
- `std::fs::OpenOptions` to configure file writes with custom settings (create, append, write)
- Formatting date and time segments using `chrono::Local` and associated patterns
- Writing raw byte slices (`as_bytes()`) to file streams using `write_all`
- Matching log selection numbers to log level string labels
- Handling file access errors with descriptive panics via `expect`
- Prompt loop architectures to receive continuous user input
- Formatting file entry strings using variables and text segments

---

## Notes
- `OpenOptions::new().append(true).create(true)` guarantees the log file is created if it does not exist, and new entries are added at the end without truncating existing data.
- The `chrono` crate is the standard choice for date and time calculations in Rust, replacing basic stdlib time structures.
- Try checking the contents of the generated `log.txt` file to observe the date formats and entry alignments.