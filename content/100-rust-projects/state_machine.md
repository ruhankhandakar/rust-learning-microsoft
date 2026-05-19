# Project 022 – Enum-Based State Machine

## Code
Implements a finite-state machine (FSM) signup wizard using a Rust `enum` whose variants hold intermediate string payloads, handling state transitions dynamically within a terminal main loop.

---

## Problem
Interactive user flows (like registration forms, game turns, or session negotiations) require robust tracking of intermediate variables and transitions to ensure users cannot skip mandatory steps.

---

## Goal
Build a wizard state machine CLI that prompts for a name and email, validates inputs (such as basic email format checking), requests final confirmation, and exits upon success or when maximum retry attempts are exceeded.

---

## What I Learn
- Designing finite-state machines using algebraic data types with Rust's `enum`
- Embedding dynamic state variables into enum variants (e.g. `State::EnterEmail(String)`)
- Matching and referencing embedded payloads inside matches using `ref` and pattern bindings
- Restricting input retry cycles using loop state counters
- Implementing basic string validators (e.g. searching for characters using `.contains`)
- Transitioning back to previous states by reassignment (such as returning to `State::EnterName` from `State::Confirm`)
- Ensuring interactive CLI prompts are flushed using `io::stdout().flush().unwrap()`

---

## Notes
- By embedding data inside enum variants, Rust prevents invalid states at compile time (e.g. it is impossible to be in the `Confirm` state without having collected both a name and an email).
- Enums with associated data are also known as tagged unions or sum types, which are a cornerstone of Rust's type-safety system.
