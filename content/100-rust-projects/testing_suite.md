# Project 076 – Unit & Integration Testing Suite

## Code
Implements a mathematical library with unit tests declared inside a `#[cfg(test)]` module, asserting outcomes and verifying error paths.

---

## Problem
Software libraries require automated verification to ensure functions compute correct values, handle edge cases, and return appropriate errors without introducing regressions.

---

## Goal
Build a tested library in Rust, implementing unit tests, checking error paths, and running verification suites.

---

## What I Learn
- Declaring testing modules using the conditional compilation attribute `#[cfg(test)]`
- Writing test cases with the `#[test]` marker attribute
- Testing values and matching expressions using `assert_eq!` assertions
- Testing boolean conditions using `assert!` validations
- Testing error paths by verifying `Result` returns are `is_err()`
- Importing parent module functions into test scopes using `use super::*`
- Structuring libraries to support unit testing workflows

---

## Notes
- Testing modules marked with `#[cfg(test)]` are only compiled when running `cargo test`, keeping them out of production binaries.
- Rust runs test cases in parallel by default, so tests must not depend on shared global states or shared file outputs.
- Try adding a new function (e.g. `multiply`) along with matching unit tests, then run `cargo test` to verify.