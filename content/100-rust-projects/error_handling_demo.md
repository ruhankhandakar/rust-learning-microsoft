# Project 019 – Error Handling Demo

## Code
Performs mathematical calculations (addition and division) on terminal input floats, parsing inputs using Rust's `Result` type, propagating conversion errors with the `?` operator, and reporting failures to the standard error stream.

---

## Problem
Software operations can fail due to invalid user inputs (like non-numeric strings) or illegal calculations (like dividing by zero), requiring applications to recover gracefully without crashing.

---

## Goal
Build an error-handling calculator CLI that accepts float parameters, validates numeric types, checks division constraints, and logs errors distinctly.

---

## What I Learn
- Representing recoverable errors using the `Result<T, E>` enum structure
- Propagating errors automatically up the call stack using the `?` operator
- Handling floating-point parsing failures using the standard `ParseFloatError` type
- Matching enum outcomes (success vs failure) using the `match` control flow structure
- Directing standard logs to `stdout` vs error/warning logs to `stderr` using `println!` and `eprintln!`
- Validating divisor parameters to prevent division by zero operations
- Parsing string buffers into primitive data types using the `.parse::<f64>()` turbofish syntax
- Flushing stdout buffers manually to ensure CLI prompt characters display immediately

---

## Notes
- `println!` writes to the standard output stream (stdout), whereas `eprintln!` writes to the standard error stream (stderr), allowing users or parent shells to redirect or filter logs separately.
- In Unix-like environments, stdout can be redirected to a file (e.g. `cargo run > output.txt`) while stderr diagnostics continue to print directly to the screen.
- The `?` operator can only be used in functions that return a type compatible with the error being propagated (such as another `Result` or `Option`).
