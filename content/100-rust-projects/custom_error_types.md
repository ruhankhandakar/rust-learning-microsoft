# Project 023 – Custom Error Types in CLI Tools

## Code
Calculates square roots of user-inputted numbers, routing calculations through a custom domain-specific error type (`MathError`) that integrates with Rust's standard error reporting systems.

---

## Problem
Standard library errors are generic, whereas real-world applications need domain-specific error variants (e.g. division by zero, invalid mathematical inputs, database constraints) to show clear diagnostic messages.

---

## Goal
Build a terminal-based calculator that validates input domains, returns a custom `MathError` variant for negative values, and prints formatted errors.

---

## What I Learn
- Defining custom application error structures using Rust `enum` schemas
- Implementing the standard formatting trait `std::fmt::Display` to output user-facing error text
- Implementing the standard marker trait `std::error::Error` to allow custom errors to interoperate with the wider Rust ecosystem
- Handling and mapping custom result returns (`Result<f64, MathError>`)
- Parsing float values from terminal inputs
- Using the `eprintln!` macro to log math diagnostics to the error output stream

---

## Notes
- To act as a standard Rust error, a type must implement both `std::fmt::Debug` and `std::fmt::Display` before implementing `std::error::Error`.
- Using custom errors instead of simple `String` descriptions allows calling code to handle different failure modes programmatically using match arms.
