# Project 074 – Banking System CLI

## Code
Manages bank accounts supporting dual currencies (Naira and Dollar) and executes deposit, withdrawal, and same-bank transfer transactions with parameter validations.

---

## Problem
Financial applications require rigorous transactional logic, currency conversion rates, and ledger balance guarantees to prevent accounts from going below zero.

---

## Goal
Build a terminal banking simulator that manages multiple account objects, performs safe deposits and withdrawals, validates recipient accounts, and calculates currency exchange values.

---

## What I Learn
- Structuring modular projects using sub-modules (`mod banking`, `mod models`, `mod ui`)
- Implementing multi-currency objects using custom `enum` structures
- Simulating ledger actions on multiple dynamic account structs
- Performing same-bank checks and validating transaction bounds
- Converting money balances across currencies using customizable exchange rates
- Preventing invalid mutations using explicit Rust mutable borrowing semantics (`&mut`)
- Returning structured text errors to the UI layer using `Result<T, String>` types

---

## Notes
- The application separates logic (`BankingService`) from representations (`Account` models) and user interface loops (`ui`), following clean software architecture practices in Rust.
- Transfers are verified in a two-stage transaction layout (first calling `validate_transfer` and then sequentially calling `withdraw` and `deposit`) to guarantee consistency.
