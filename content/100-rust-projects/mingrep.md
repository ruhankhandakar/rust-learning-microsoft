# Project 026 – Minigrep

## Code
Implements a light command-line search tool (grep) that searches files for query strings, supporting case-sensitive and case-insensitive matching via environment variables.

---

## Problem
Text pattern searching across directories requires clean argument validation, isolating searching logic from program control flow, and managing optional case-insensitivity toggles.

---

## Goal
Build a modular text-search utility with a dedicated library file containing logic, tests, and configuration constructors, and a binary entry point that handles exit states.

---

## What I Learn
- Separation of concerns by spliting logic into `src/lib.rs` and `src/main.rs`
- Custom `Config` struct design with an associated `build` instantiator
- Extracting environment variables using `std::env::var` to switch program logic dynamically
- Returning polymorphic errors using dynamic traits like `Box<dyn std::error::Error>`
- Writing unit tests directly inside code files inside inline `tests` modules
- Declaring lifetime parameters (`'a`) to bind string slice outputs to source contents
- Destructuring error states using helper overrides like `unwrap_or_else`

---

## Notes
- Lifetimes (`'a`) verify that output string slices returned by search functions do not outlive the file content buffer.
- `Box<dyn Error>` is a trait object that can represent any error type, making it convenient for high-level error handling.
- Try setting the `IGNORE_CASE` environment variable in your terminal (e.g. `IGNORE_CASE=1 cargo run ...`) to check case insensitivity.