# Project 081 – Real-Time File Watcher

## Code
Watches a specified file or directory for modification events using the `notify` crate, sending events through an `mpsc` channel to print modified file paths to the console.

---

## Problem
Developer utilities and sync clients need to watch directories for changes in real-time without constantly scanning files, which consumes high CPU cycles.

---

## Goal
Build a directory-watching tool that takes path arguments, hooks recommended OS event watchers, and processes modification events.

---

## What I Learn
- Interfacing with OS file monitoring APIs using the `notify` crate
- Setting recursive directory watch constraints via `RecursiveMode::Recursive`
- Transmitting file events from background threads using standard channels (`std::sync::mpsc::channel`)
- Pattern matching event varieties using the `EventKind` enum
- Extracting modified file paths from event records
- Command-line argument collection and validation
- Clean exit handling when receiver channels disconnect

---

## Notes
- `RecommendedWatcher` selects the best monitoring backend for the target OS (such as `inotify` on Linux, `FSEvents` on macOS, or `ReadDirectoryChangesW` on Windows).
- Rapid file changes (e.g. from editor auto-saves) can trigger multiple events in quick succession, requiring debouncers in production apps.
- Try running the watcher in one terminal and modifying a file inside the watched folder in another terminal to verify event logs.
