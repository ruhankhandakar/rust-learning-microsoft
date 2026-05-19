# Project 018 – Contact Manager

## Code
Maintains a contact database using structured data (ID, name, phone, email) with options to add, view, search, and delete contacts, spanning multiple modules.

---

## Problem
Building structured apps requires organizing code into separate modules (UI, data structures, storage manager), managing states (adding/deleting elements from vectors), and parsing inputs.

---

## Goal
Build a multi-module contact directory app using modules (`models`, `manager`, `ui`) that performs search filtering and retains state updates.

---

## What I Learn
- Code organization using Rust's module system (`mod`, `pub mod`, and `pub use`)
- Struct representation across modules with public and private attributes (`pub`)
- `retain` method on vectors to perform in-place deletions by filtering matches
- Dynamic search queries using `iter` pipelines with `filter` and `collect`
- Sharing data fields inside structs using mutable borrows (`&mut self`)
- Helper functions parsing console input into custom structures
- Gracefully handling invalid inputs or blank strings during menu interactions

---

## Notes
- Declaring `pub` modules makes their members accessible to the parent modules, which is required to organize multi-file crates.
- `retain` runs in-place, removing elements that do not satisfy the predicate function while keeping vector memory allocations intact.
- Try modifying the search query logic to support fuzzy matching or matching against multiple conditions.
