# Rust for Python Programmers: Complete Training Guide

A comprehensive guide to learning Rust for developers with Python experience. This guide
covers everything from basic syntax to advanced patterns, focusing on the conceptual shifts
required when moving from a dynamically-typed, garbage-collected language to a statically-typed
systems language with compile-time memory safety.

## How to Use This Book

**Self-study format**: Work through Part I (ch 1–6) first — these map closely to Python concepts you already know. Part II (ch 7–12) introduces Rust-specific ideas like ownership and traits. Part III (ch 13–16) covers advanced topics and migration.

**Pacing recommendations:**

| Chapters | Topic | Suggested Time | Checkpoint |
|----------|-------|---------------|------------|
| 1–4 | Setup, types, control flow | 1 day | You can write a CLI temperature converter in Rust |
| 5–6 | Data structures, enums, pattern matching | 1–2 days | You can define an enum with data and `match` exhaustively on it |
| 7 | Ownership and borrowing | 1–2 days | You can explain *why* `let s2 = s1` invalidates `s1` |
| 8–9 | Modules, error handling | 1 day | You can create a multi-file project that propagates errors with `?` |
| 10–12 | Traits, generics, closures, iterators | 1–2 days | You can translate a list comprehension to an iterator chain |
| 13 | Concurrency | 1 day | You can write a thread-safe counter with `Arc<Mutex<T>>` |
| 14 | Unsafe, PyO3, testing | 1 day | You can call a Rust function from Python via PyO3 |
| 15–16 | Migration, best practices | At your own pace | Reference material — consult as you write real code |
| 17 | Capstone project | 2–3 days | Build a complete CLI app tying everything together |

**How to use the exercises:**
- Chapters include hands-on exercises in collapsible `<details>` blocks with solutions
- **Always try the exercise before expanding the solution.** Struggling with the borrow checker is part of learning — the compiler's error messages are your teacher
- If you're stuck for more than 15 minutes, expand the solution, study it, then close it and try again from scratch
- The [Rust Playground](https://play.rust-lang.org/) lets you run code without a local install

**Difficulty indicators:**
- 🟢 **Beginner** — Direct translation from Python concepts
- 🟡 **Intermediate** — Requires understanding ownership or traits
- 🔴 **Advanced** — Lifetimes, async internals, or unsafe code

**When you hit a wall:**
- Read the compiler error message carefully — Rust's errors are exceptionally helpful
- Re-read the relevant section; concepts like ownership (ch7) often click on the second pass
- The [Rust standard library docs](https://doc.rust-lang.org/std/) are excellent — search for any type or method
- For deeper async patterns, see the companion [Async Rust Training](../async-book/)

---

## Table of Contents

### Part I — Foundations

#### 1. Introduction and Motivation 🟢
- [The Case for Rust for Python Developers](ch01-introduction-and-motivation.md#the-case-for-rust-for-python-developers)
- [Common Python Pain Points That Rust Addresses](ch01-introduction-and-motivation.md#common-python-pain-points-that-rust-addresses)
- [When to Choose Rust Over Python](ch01-introduction-and-motivation.md#when-to-choose-rust-over-python)

#### 2. Getting Started 🟢
- [Installation and Setup](ch02-getting-started.md#installation-and-setup)
- [Your First Rust Program](ch02-getting-started.md#your-first-rust-program)
- [Cargo vs pip/Poetry](ch02-getting-started.md#cargo-vs-pippoetry)

#### 3. Built-in Types and Variables 🟢
- [Variables and Mutability](ch03-built-in-types-and-variables.md#variables-and-mutability)
- [Primitive Types Comparison](ch03-built-in-types-and-variables.md#primitive-types-comparison)
- [String Types: String vs &str](ch03-built-in-types-and-variables.md#string-types-string-vs-str)

#### 4. Control Flow 🟢
- [Conditional Statements](ch04-control-flow.md#conditional-statements)
- [Loops and Iteration](ch04-control-flow.md#loops-and-iteration)
- [Expression Blocks](ch04-control-flow.md#expression-blocks)
- [Functions and Type Signatures](ch04-control-flow.md#functions-and-type-signatures)

#### 5. Data Structures and Collections 🟢
- [Tuples, Arrays, Slices](ch05-data-structures-and-collections.md#tuples-and-destructuring)
- [Structs vs Classes](ch05-data-structures-and-collections.md#structs-vs-classes)
- [Vec vs list, HashMap vs dict](ch05-data-structures-and-collections.md#vec-vs-list)

#### 6. Enums and Pattern Matching 🟡
- [Algebraic Data Types vs Union Types](ch06-enums-and-pattern-matching.md#algebraic-data-types-vs-union-types)
- [Exhaustive Pattern Matching](ch06-enums-and-pattern-matching.md#exhaustive-pattern-matching)
- [Option for None Safety](ch06-enums-and-pattern-matching.md#option-for-none-safety)

### Part II — Core Concepts

#### 7. Ownership and Borrowing 🟡
- [Understanding Ownership](ch07-ownership-and-borrowing.md#understanding-ownership)
- [Move Semantics vs Reference Counting](ch07-ownership-and-borrowing.md#move-semantics-vs-reference-counting)
- [Borrowing and Lifetimes](ch07-ownership-and-borrowing.md#borrowing-and-lifetimes)
- [Smart Pointers](ch07-ownership-and-borrowing.md#smart-pointers)

#### 8. Crates and Modules 🟢
- [Rust Modules vs Python Packages](ch08-crates-and-modules.md#rust-modules-vs-python-packages)
- [Crates vs PyPI Packages](ch08-crates-and-modules.md#crates-vs-pypi-packages)

#### 9. Error Handling 🟡
- [Exceptions vs Result](ch09-error-handling.md#exceptions-vs-result)
- [The ? Operator](ch09-error-handling.md#the--operator)
- [Custom Error Types with thiserror](ch09-error-handling.md#custom-error-types-with-thiserror)

#### 10. Traits and Generics 🟡
- [Traits vs Duck Typing](ch10-traits-and-generics.md#traits-vs-duck-typing)
- [Protocols (PEP 544) vs Traits](ch10-traits-and-generics.md#protocols-pep-544-vs-traits)
- [Generic Constraints](ch10-traits-and-generics.md#generic-constraints)

#### 11. From and Into Traits 🟡
- [Type Conversions in Rust](ch11-from-and-into-traits.md#type-conversions-in-rust)
- [From, Into, TryFrom](ch11-from-and-into-traits.md#rust-frominto)
- [String Conversion Patterns](ch11-from-and-into-traits.md#string-conversions)

#### 12. Closures and Iterators 🟡
- [Closures vs Lambdas](ch12-closures-and-iterators.md#rust-closures-vs-python-lambdas)
- [Iterators vs Generators](ch12-closures-and-iterators.md#iterators-vs-generators)
- [Macros: Code That Writes Code](ch12-closures-and-iterators.md#why-macros-exist-in-rust)

### Part III — Advanced Topics & Migration

#### 13. Concurrency 🔴
- [No GIL: True Parallelism](ch13-concurrency.md#no-gil-true-parallelism)
- [Thread Safety: Type System Guarantees](ch13-concurrency.md#thread-safety-type-system-guarantees)
- [async/await Comparison](ch13-concurrency.md#asyncawait-comparison)

#### 14. Unsafe Rust, FFI, and Testing 🔴
- [When and Why to Use Unsafe](ch14-unsafe-rust-and-ffi.md#when-and-why-to-use-unsafe)
- [PyO3: Rust Extensions for Python](ch14-unsafe-rust-and-ffi.md#pyo3-rust-extensions-for-python)
- [Unit Tests vs pytest](ch14-unsafe-rust-and-ffi.md#unit-tests-vs-pytest)

#### 15. Migration Patterns 🟡
- [Common Python Patterns in Rust](ch15-migration-patterns.md#common-python-patterns-in-rust)
- [Essential Crates for Python Developers](ch08-crates-and-modules.md#essential-crates-for-python-developers)
- [Incremental Adoption Strategy](ch15-migration-patterns.md#incremental-adoption-strategy)

#### 16. Best Practices 🟡
- [Idiomatic Rust for Python Developers](ch16-best-practices.md#idiomatic-rust-for-python-developers)
- [Common Pitfalls and Solutions](ch16-best-practices.md#common-pitfalls-and-solutions)
- [Python→Rust Rosetta Stone](ch16-best-practices.md#rosetta-stone-python-to-rust)
- [Learning Path and Resources](ch16-best-practices.md#learning-path-and-resources)

---

### Part IV — Capstone

#### 17. Capstone Project: CLI Task Manager 🔴
- [The Project: `rustdo`](ch17-capstone-project.md#the-project-rustdo)
- [Data Model, Storage, Commands, Business Logic](ch17-capstone-project.md#step-1-define-the-data-model-ch-3-6-10-11)
- [Tests and Stretch Goals](ch17-capstone-project.md#step-7-tests-ch-14)

***


