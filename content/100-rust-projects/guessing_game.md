# Project 004 – Guessing Game CLI

## Code
Generates a random number within a chosen difficulty range and guides the player to guess it within a limited number of attempts, including options to replay.

---

## Problem
Developing interactive CLI games requires handling multiple loops, checking values against dynamic bounds, parsing inputs safely without crashing, and generating secure random numbers.

---

## Goal
Build an interactive guessing game with configurable difficulty levels, attempt limits, guess validation, and replay functionality.

---

## What I Learn
- `rand::Rng` trait and `rand::thread_rng().gen_range` to generate random numbers
- `std::cmp::Ordering` enum (`Less`, `Greater`, `Equal`) for clean comparisons
- Nested loops (`loop` and `for` loops) for game states and attempt counting
- Range pattern matching (`1..=4`) to check selection bounds
- Custom error messages for out-of-range user inputs
- Flushed stdout buffers using `io::stdout().flush().unwrap()` to handle prompt ordering
- Multi-branching match constructs for flexible control flow

---

## Notes
- Prompt lines without newlines must be explicitly flushed with `io::stdout().flush()` due to stdout buffering.
- External dependencies like `rand` are declared in `Cargo.toml` and automatically downloaded during the cargo build phase.
- Try modifying the maximum bounds or creating a "cheat mode" key that reveals the secret number.
