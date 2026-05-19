# Project 011 – Basic Timer Tool

## Code
Launches a command-line countdown timer that takes an hours-minutes-seconds configuration, spawns a background input thread, and allows the user to pause ('p') and resume ('r') execution.

---

## Problem
Building responsive interactive utilities requires managing blocking input prompts concurrently with dynamic system updates, preventing input waits from halting count ticks.

---

## Goal
Build a terminal timer that reads time offsets, handles non-blocking terminal input checks via channel communication, ticks down every second, and processes pause/resume commands.

---

## What I Learn
- `std::thread::spawn` to run background tasks parallel to the main program loop
- `std::sync::mpsc::channel` (multi-producer, single-consumer) to send controls between threads
- Non-blocking message checks using `try_recv` on receiver endpoints
- Thread suspending using `std::thread::sleep` with `Duration` increments
- Modulo and division calculations to transform seconds into standard time segments (`HH:MM:SS`)
- Carriage return (`\r`) in prints to redraw the same terminal line repeatedly
- Multi-threaded synchronization patterns and sharing cross-thread variables

---

## Notes
- Using `try_recv` prevents the receiver from blocking the main loop, allowing countdown ticks to continue even if no input is sent.
- The spawned input thread stays alive reading stdin, meaning the terminal environment must be handled correctly upon program completion.
- Try introducing an audible bell character `\x07` or console beep when the timer finishes.
