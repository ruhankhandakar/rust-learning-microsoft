# Project 024 – Chat Application

## Code
Implements a rule-based terminal chatbot named "Rusty" that scores pattern matches to select the best response, maintains a timestamped message history, and persists conversations as structured JSON.

---

## Problem
Developing interactive chat interfaces requires matching inputs against dynamic keywords/regex patterns, scoring the match qualities, tracking order of conversations, and persisting session logs.

---

## Goal
Build a CLI chatbot using nested data structures, dynamic string scoring rules, and JSON file serialization/deserialization to preserve historical records.

---

## What I Learn
- `lazy_static` macro usage to initialize static variables (like response lookup maps) safely at runtime
- Custom struct definitions mapped to JSON arrays using Serde traits
- Text query matching using iterator functions like `split` and checks like `contains`
- Calculating matching weights using integer scoring metrics (e.g. pattern length + word matches)
- File serialization writing using `serde_json::to_writer_pretty`
- Dynamic structures parsed via `serde_json::from_reader` from file streams
- Appending items to vector entries and modifying structs in-place using `&mut self`

---

## Notes
- `lazy_static` compiles a thread-safe wrapper, meaning static values are initialized only when first accessed.
- Saving files with `to_writer_pretty` directly streams data to disk, avoiding full memory-buffer allocations.
- Try extending the response lookup map to support complex regex patterns rather than simple string boundaries.