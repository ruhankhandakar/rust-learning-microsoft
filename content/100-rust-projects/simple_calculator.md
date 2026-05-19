# Project 003 – Simple Calculator

## Code
Parses a whitespace-delimited mathematical expression from stdin and executes basic arithmetic operations (+, -, *, /).

---

## Problem
Users need a quick way to evaluate basic binary math operations via CLI, which requires parsing a text stream, isolating operands and operators, and handling division-by-zero errors safely.

---

## Goal
Build a command-line calculator that parses standard format expressions, validates input formats, evaluates calculations, and exits gracefully on errors.

---

## What I Learn
- `split_whitespace` iterator to divide a string into parts based on whitespace
- `collect` to transform iterators into concrete collection types like `Vec<&str>`
- `Vec` indexing and bounds checking in Rust
- Parsing string slices (`&str`) to double-precision floats (`f64`)
- Matching mathematical operator strings using `match` patterns
- Stderr writing and exit status handling using `std::process::exit`
- Handling division by zero with custom validation rules

---

## Notes
- Iterators in Rust are lazy; calling `.collect()` is required to consume the iterator and allocate memory for the vector.
- Division by zero on `f64` returns `inf` or `NaN` in IEEE 754, but this app explicitly intercepts zero division to exit early.
- Try extending the operator list to support modulo (`%`) or exponentiation (`^`).
