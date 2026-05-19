# Project 001 – Hello Rust CLI

## Code
Prints "Hello, Rust!" and a welcome message to the console using the `println!` macro.

---

## Problem
Learners starting with a new systems programming language need a minimal, zero-dependency baseline to verify that their toolchain, compiler, package manager, and build environments are fully functional.

---

## Goal
Generate a fresh binary package, build it, and output a basic greeting message to standard output.

---

## What I Learn
- `fn main` as the mandatory entry point of all executable Rust programs
- `println!` macro to print text lines to standard output
- `cargo new` CLI command to bootstrap a standardized project skeleton
- `cargo run` utility to automatically compile and run the application in a single step
- `Cargo.toml` configuration file structure and how it manages metadata and dependencies
- Difference between a standard function and a macro (indicated by the `!`) in Rust
- Standard directory layout (e.g., `src/main.rs`) expected by the Cargo build system

---

## Notes
- `println!` executes compile-time type-safety checks on format strings, preventing common runtime format vulnerabilities.
- Cargo projects use a locked dependency file (`Cargo.lock`) to guarantee reproducible builds across machines.
- Try modifying the message inside `println!` and running `cargo build` to inspect the generated binary in the `target/` directory.
