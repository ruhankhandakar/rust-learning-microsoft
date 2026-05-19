# Project 035 – Remote Control - Command Pattern with Traits

## Code
Implements the Command design pattern where device operations (LightOn, LightOff, FanOn, FanOff) are encapsulated inside objects implementing a `Command` trait, managed by a `Remote` receiver.

---

## Problem
Decoupling event triggers (like GUI button presses or CLI options) from actual execution logic requires encapsulating requests as standalone objects to support undo, scheduling, or history logging.

---

## Goal
Build a remote control simulation using the Command design pattern, logging executed commands to a history vector and triggering actions via references.

---

## What I Learn
- Command Pattern architecture decoupling invoker and receiver modules
- Passing trait object references (`&dyn Command`) to functions without heap boxing
- Storing executed action labels in a session history list (`Vec<String>`)
- Implementing traits on zero-sized structs representing commands
- Printing logs sequentially using index enumerators (`iter().enumerate()`)
- Dynamic code routing triggering execution methods on references
- Menu options mapping inputs to static object executions

---

## Notes
- Commands are passed to `press_button` as references (`&dyn Command`), avoiding heap allocations and memory transfers.
- Storing string labels in history instead of boxed commands keeps memory management simple and prevents ownership complications.
- Try extending the Remote struct with an `undo` stack to revert the last executed command.
