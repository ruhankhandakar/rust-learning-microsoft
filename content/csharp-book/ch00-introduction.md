# Rust for C# Programmers: Complete Training Guide

A comprehensive guide to learning Rust for developers with C# experience. This guide covers everything from basic syntax to advanced patterns, focusing on the conceptual shifts and practical differences between the two languages.

## Course Overview
- **The case for Rust** — Why Rust matters for C# developers: performance, safety, and correctness
- **Getting started** — Installation, tooling, and your first program
- **Basic building blocks** — Types, variables, control flow
- **Data structures** — Arrays, tuples, structs, collections
- **Pattern matching and enums** — Algebraic data types and exhaustive matching
- **Ownership and borrowing** — Rust's memory management model
- **Modules and crates** — Code organization and dependencies
- **Error handling** — Result-based error propagation
- **Traits and generics** — Rust's type system
- **Closures and iterators** — Functional programming patterns
- **Concurrency** — Fearless concurrency with type-system guarantees, async/await deep dive
- **Unsafe Rust and FFI** — When and how to go beyond safe Rust
- **Migration patterns** — Real-world C# to Rust patterns and incremental adoption
- **Best practices** — Idiomatic Rust for C# developers

---

# Self-Study Guide

This material works both as an instructor-led course and for self-study. If you're working through it on your own, here's how to get the most out of it.

**Pacing recommendations:**

| Chapters | Topic | Suggested Time | Checkpoint |
|----------|-------|---------------|------------|
| 1–4 | Setup, types, control flow | 1 day | You can write a CLI temperature converter in Rust |
| 5–6 | Data structures, enums, pattern matching | 1–2 days | You can define an enum with data and `match` exhaustively on it |
| 7 | Ownership and borrowing | 1–2 days | You can explain *why* `let s2 = s1` invalidates `s1` |
| 8–9 | Modules, error handling | 1 day | You can create a multi-file project that propagates errors with `?` |
| 10–12 | Traits, generics, closures, iterators | 1–2 days | You can translate a LINQ chain to Rust iterators |
| 13 | Concurrency and async | 1 day | You can write a thread-safe counter with `Arc<Mutex<T>>` |
| 14 | Unsafe Rust, FFI, testing | 1 day | You can call a Rust function from C# via P/Invoke |
| 15–16 | Migration, best practices, tooling | At your own pace | Reference material — consult as you write real code |
| 17 | Capstone project | 1–2 days | You have a working CLI tool that fetches weather data |

**How to use the exercises:**
- Chapters include hands-on exercises in collapsible `<details>` blocks with solutions
- **Always try the exercise before expanding the solution.** Struggling with the borrow checker is part of learning — the compiler's error messages are your teacher
- If you're stuck for more than 15 minutes, expand the solution, study it, then close it and try again from scratch
- The [Rust Playground](https://play.rust-lang.org/) lets you run code without a local install

**Difficulty indicators:**
- 🟢 **Beginner** — Direct translation from C# concepts
- 🟡 **Intermediate** — Requires understanding ownership or traits
- 🔴 **Advanced** — Lifetimes, async internals, or unsafe code

**When you hit a wall:**
- Read the compiler error message carefully — Rust's errors are exceptionally helpful
- Re-read the relevant section; concepts like ownership (ch7) often click on the second pass
- The [Rust standard library docs](https://doc.rust-lang.org/std/) are excellent — search for any type or method
- For deeper async patterns, see the companion [Async Rust Training](../async-book/)

---

# Table of Contents

## Part I — Foundations

### 1. Introduction and Motivation 🟢
- [The Case for Rust for C# Developers](ch01-introduction-and-motivation.md#the-case-for-rust-for-c-developers)
- [Common C# Pain Points That Rust Addresses](ch01-introduction-and-motivation.md#common-c-pain-points-that-rust-addresses)
- [When to Choose Rust Over C#](ch01-introduction-and-motivation.md#when-to-choose-rust-over-c)
- [Language Philosophy Comparison](ch01-introduction-and-motivation.md#language-philosophy-comparison)
- [Quick Reference: Rust vs C#](ch01-introduction-and-motivation.md#quick-reference-rust-vs-c)

### 2. Getting Started 🟢
- [Installation and Setup](ch02-getting-started.md#installation-and-setup)
- [Your First Rust Program](ch02-getting-started.md#your-first-rust-program)
- [Cargo vs NuGet/MSBuild](ch02-getting-started.md#cargo-vs-nugetmsbuild)
- [Reading Input and CLI Arguments](ch02-getting-started.md#reading-input-and-cli-arguments)
- [Essential Rust Keywords *(optional reference — consult as needed)*](ch02-1-essential-keywords-reference.md#essential-rust-keywords-for-c-developers)

### 3. Built-in Types and Variables 🟢
- [Variables and Mutability](ch03-built-in-types-and-variables.md#variables-and-mutability)
- [Primitive Types Comparison](ch03-built-in-types-and-variables.md#primitive-types)
- [String Types: String vs &str](ch03-built-in-types-and-variables.md#string-types-string-vs-str)
- [Printing and String Formatting](ch03-built-in-types-and-variables.md#printing-and-string-formatting)
- [Type Casting and Conversions](ch03-built-in-types-and-variables.md#type-casting-and-conversions)
- [True Immutability vs Record Illusions](ch03-1-true-immutability-vs-record-illusions.md#true-immutability-vs-record-illusions)

### 4. Control Flow 🟢
- [Functions vs Methods](ch04-control-flow.md#functions-vs-methods)
- [Expression vs Statement (Important!)](ch04-control-flow.md#expression-vs-statement-important)
- [Conditional Statements](ch04-control-flow.md#conditional-statements)
- [Loops and Iteration](ch04-control-flow.md#loops)

### 5. Data Structures and Collections 🟢
- [Tuples and Destructuring](ch05-data-structures-and-collections.md#tuples-and-destructuring)
- [Arrays and Slices](ch05-data-structures-and-collections.md#arrays-and-slices)
- [Structs vs Classes](ch05-data-structures-and-collections.md#structs-vs-classes)
- [Constructor Patterns](ch05-1-constructor-patterns.md#constructor-patterns)
- [`Vec<T>` vs `List<T>`](ch05-2-collections-vec-hashmap-and-iterators.md#vect-vs-listt)
- [HashMap vs Dictionary](ch05-2-collections-vec-hashmap-and-iterators.md#hashmap-vs-dictionary)

### 6. Enums and Pattern Matching 🟡
- [Algebraic Data Types vs C# Unions](ch06-enums-and-pattern-matching.md#algebraic-data-types-vs-c-unions)
- [Exhaustive Pattern Matching](ch06-1-exhaustive-matching-and-null-safety.md#exhaustive-pattern-matching-compiler-guarantees-vs-runtime-errors)
- [`Option<T>` for Null Safety](ch06-1-exhaustive-matching-and-null-safety.md#null-safety-nullablet-vs-optiont)
- [Guards and Advanced Patterns](ch06-enums-and-pattern-matching.md#guards-and-advanced-patterns)

### 7. Ownership and Borrowing 🟡
- [Understanding Ownership](ch07-ownership-and-borrowing.md#understanding-ownership)
- [Move Semantics vs Reference Semantics](ch07-ownership-and-borrowing.md#move-semantics)
- [Borrowing and References](ch07-ownership-and-borrowing.md#borrowing-basics)
- [Memory Safety Deep Dive](ch07-1-memory-safety-deep-dive.md#references-vs-pointers)
- [Lifetimes Deep Dive](ch07-2-lifetimes-deep-dive.md#lifetimes-telling-the-compiler-how-long-references-live) 🔴
- [Smart Pointers, Drop, and Deref](ch07-3-smart-pointers-beyond-single-ownership.md#smart-pointers-when-single-ownership-isnt-enough) 🔴

### 8. Crates and Modules 🟢
- [Rust Modules vs C# Namespaces](ch08-crates-and-modules.md#rust-modules-vs-c-namespaces)
- [Crates vs .NET Assemblies](ch08-crates-and-modules.md#crates-vs-net-assemblies)
- [Package Management: Cargo vs NuGet](ch08-1-package-management-cargo-vs-nuget.md#package-management-cargo-vs-nuget)

### 9. Error Handling 🟡
- [Exceptions vs `Result<T, E>`](ch09-error-handling.md#exceptions-vs-resultt-e)
- [The ? Operator](ch09-error-handling.md#the--operator-propagating-errors-concisely)
- [Custom Error Types](ch06-1-exhaustive-matching-and-null-safety.md#custom-error-types)
- [Crate-Level Error Types and Result Aliases](ch09-1-crate-level-error-types-and-result-alias.md#crate-level-error-types-and-result-aliases)
- [Error Recovery Patterns](ch09-1-crate-level-error-types-and-result-alias.md#error-recovery-patterns)

### 10. Traits and Generics 🟡
- [Traits vs Interfaces](ch10-traits-and-generics.md#traits---rusts-interfaces)
- [Inheritance vs Composition](ch10-2-inheritance-vs-composition.md#inheritance-vs-composition)
- [Generic Constraints: where vs trait bounds](ch10-1-generic-constraints.md#generic-constraints-where-vs-trait-bounds)
- [Common Standard Library Traits](ch10-traits-and-generics.md#common-standard-library-traits)

### 11. From and Into Traits 🟡
- [Type Conversions in Rust](ch11-from-and-into-traits.md#type-conversions-in-rust)
- [Implementing From for Custom Types](ch11-from-and-into-traits.md#rust-from-and-into)

### 12. Closures and Iterators 🟡
- [Rust Closures](ch12-closures-and-iterators.md#rust-closures)
- [LINQ vs Rust Iterators](ch12-closures-and-iterators.md#linq-vs-rust-iterators)
- [Macros Primer](ch12-1-macros-primer.md#macros-code-that-writes-code)

---

## Part II — Concurrency & Systems

### 13. Concurrency 🔴
- [Thread Safety: Convention vs Type System Guarantees](ch13-concurrency.md#thread-safety-convention-vs-type-system-guarantees)
- [async/await: C# Task vs Rust Future](ch13-1-asyncawait-deep-dive.md#async-programming-c-task-vs-rust-future)
- [Cancellation Patterns](ch13-1-asyncawait-deep-dive.md#cancellation-cancellationtoken-vs-drop--select)
- [Pin and tokio::spawn](ch13-1-asyncawait-deep-dive.md#pin-why-rust-async-has-a-concept-c-doesnt)

### 14. Unsafe Rust, FFI, and Testing 🟡
- [When and Why to Use Unsafe](ch14-unsafe-rust-and-ffi.md#when-you-need-unsafe)
- [Interop with C# via FFI](ch14-unsafe-rust-and-ffi.md#interop-with-c-via-ffi)
- [Testing in Rust vs C#](ch14-1-testing.md#testing-in-rust-vs-c)
- [Property Testing and Mocking](ch14-1-testing.md#property-testing-proving-correctness-at-scale)

---

## Part III — Migration & Best Practices

### 15. Migration Patterns and Case Studies 🟡
- [Common C# Patterns in Rust](ch15-migration-patterns-and-case-studies.md#common-c-patterns-in-rust)
- [Essential Crates for C# Developers](ch15-1-essential-crates-for-c-developers.md#essential-crates-for-c-developers)
- [Incremental Adoption Strategy](ch15-2-incremental-adoption-strategy.md#incremental-adoption-strategy)

### 16. Best Practices and Reference 🟡
- [Idiomatic Rust for C# Developers](ch16-best-practices.md#best-practices-for-c-developers)
- [Performance Comparison: Managed vs Native](ch16-1-performance-comparison-and-migration.md#performance-comparison-managed-vs-native)
- [Common Pitfalls and Solutions](ch16-2-learning-path-and-resources.md#common-pitfalls-for-c-developers)
- [Learning Path and Resources](ch16-2-learning-path-and-resources.md#learning-path-and-next-steps)
- [Rust Tooling Ecosystem](ch16-3-rust-tooling-ecosystem.md#essential-rust-tooling-for-c-developers)

---

## Capstone

### 17. Capstone Project 🟡
- [Build a CLI Weather Tool](ch17-capstone-project.md#capstone-project-build-a-cli-weather-tool) — combines structs, traits, error handling, async, modules, serde, and testing into a working application


