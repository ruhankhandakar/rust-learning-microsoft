# Rust Bootstrap Course for C/C++ Programmers

## Course Overview
- Course overview
    - The case for Rust (from both C and C++ perspectives)
    - Local installation
    - Types, functions, control flow, pattern matching
    - Modules, cargo
    - Traits, generics
    - Collections, error handling
    - Closures, memory management, lifetimes, smart pointers
    - Concurrency
    - Unsafe Rust, including Foreign Function Interface (FFI)
    - `no_std` and embedded Rust essentials for firmware teams
    - Case studies: real-world C++ to Rust translation patterns
- We'll not cover `async` Rust in this course — see the companion [Async Rust Training](../async-book/) for a full treatment of futures, executors, `Pin`, tokio, and production async patterns


---

# Self-Study Guide

This material works both as an instructor-led course and for self-study. If you're working through it on your own, here's how to get the most out of it:

**Pacing recommendations:**

| Chapters | Topic | Suggested Time | Checkpoint |
|----------|-------|---------------|------------|
| 1–4 | Setup, types, control flow | 1 day | You can write a CLI temperature converter |
| 5–7 | Data structures, ownership | 1–2 days | You can explain *why* `let s2 = s1` invalidates `s1` |
| 8–9 | Modules, error handling | 1 day | You can create a multi-file project that propagates errors with `?` |
| 10–12 | Traits, generics, closures | 1–2 days | You can write a generic function with trait bounds |
| 13–14 | Concurrency, unsafe/FFI | 1 day | You can write a thread-safe counter with `Arc<Mutex<T>>` |
| 15–16 | Deep dives | At your own pace | Reference material — read when relevant |
| 17–19 | Best practices & reference | At your own pace | Consult as you write real code |

**How to use the exercises:**
- Every chapter has hands-on exercises marked with difficulty: 🟢 Starter, 🟡 Intermediate, 🔴 Challenge
- **Always try the exercise before expanding the solution.** Struggling with the borrow checker is part of learning — the compiler's error messages are your teacher
- If you're stuck for more than 15 minutes, expand the solution, study it, then close it and try again from scratch
- The [Rust Playground](https://play.rust-lang.org/) lets you run code without a local install

**When you hit a wall:**
- Read the compiler error message carefully — Rust's errors are exceptionally helpful
- Re-read the relevant section; concepts like ownership (ch7) often click on the second pass
- The [Rust standard library docs](https://doc.rust-lang.org/std/) are excellent — search for any type or method
- For async patterns, see the companion [Async Rust Training](../async-book/)

---

# Table of Contents

## Part I — Foundations

### 1. Introduction and Motivation
- [Speaker intro and general approach](ch01-introduction-and-motivation.md#speaker-intro-and-general-approach)
- [The case for Rust](ch01-introduction-and-motivation.md#the-case-for-rust)
- [How does Rust address these issues?](ch01-introduction-and-motivation.md#how-does-rust-address-these-issues)
- [Other Rust USPs and features](ch01-introduction-and-motivation.md#other-rust-usps-and-features)
- [Quick Reference: Rust vs C/C++](ch01-introduction-and-motivation.md#quick-reference-rust-vs-cc)
- [Why C/C++ Developers Need Rust](ch01-1-why-c-cpp-developers-need-rust.md)
  - [What Rust Eliminates — The Complete List](ch01-1-why-c-cpp-developers-need-rust.md#what-rust-eliminates--the-complete-list)
  - [The Problems Shared by C and C++](ch01-1-why-c-cpp-developers-need-rust.md#the-problems-shared-by-c-and-c)
  - [C++ Adds More Problems on Top](ch01-1-why-c-cpp-developers-need-rust.md#c-adds-more-problems-on-top)
  - [How Rust Addresses All of This](ch01-1-why-c-cpp-developers-need-rust.md#how-rust-addresses-all-of-this)

### 2. Getting Started
- [Enough talk already: Show me some code](ch02-getting-started.md#enough-talk-already-show-me-some-code)
- [Rust Local installation](ch02-getting-started.md#rust-local-installation)
- [Rust packages (crates)](ch02-getting-started.md#rust-packages-crates)
- [Example: cargo and crates](ch02-getting-started.md#example-cargo-and-crates)

### 3. Basic Types and Variables
- [Built-in Rust types](ch03-built-in-types.md#built-in-rust-types)
- [Rust type specification and assignment](ch03-built-in-types.md#rust-type-specification-and-assignment)
- [Rust type specification and inference](ch03-built-in-types.md#rust-type-specification-and-inference)
- [Rust variables and mutability](ch03-built-in-types.md#rust-variables-and-mutability)

### 4. Control Flow
- [Rust if keyword](ch04-control-flow.md#rust-if-keyword)
- [Rust loops using while and for](ch04-control-flow.md#rust-loops-using-while-and-for)
- [Rust loops using loop](ch04-control-flow.md#rust-loops-using-loop)
- [Rust expression blocks](ch04-control-flow.md#rust-expression-blocks)

### 5. Data Structures and Collections
- [Rust array type](ch05-data-structures.md#rust-array-type)
- [Rust tuples](ch05-data-structures.md#rust-tuples)
- [Rust references](ch05-data-structures.md#rust-references)
- [C++ References vs Rust References — Key Differences](ch05-data-structures.md#c-references-vs-rust-references--key-differences)
- [Rust slices](ch05-data-structures.md#rust-slices)
- [Rust constants and statics](ch05-data-structures.md#rust-constants-and-statics)
- [Rust strings: String vs &str](ch05-data-structures.md#rust-strings-string-vs-str)
- [Rust structs](ch05-data-structures.md#rust-structs)
- [Rust Vec\<T\>](ch05-data-structures.md#rust-vec-type)
- [Rust HashMap](ch05-data-structures.md#rust-hashmap-type)
- [Exercise: Vec and HashMap](ch05-data-structures.md#exercise-vec-and-hashmap)

### 6. Pattern Matching and Enums
- [Rust enum types](ch06-enums-and-pattern-matching.md#rust-enum-types)
- [Rust match statement](ch06-enums-and-pattern-matching.md#rust-match-statement)
- [Exercise: Implement add and subtract using match and enum](ch06-enums-and-pattern-matching.md#exercise-implement-add-and-subtract-using-match-and-enum)

### 7. Ownership and Memory Management
- [Rust memory management](ch07-ownership-and-borrowing.md#rust-memory-management)
- [Rust ownership, borrowing and lifetimes](ch07-ownership-and-borrowing.md#rust-ownership-borrowing-and-lifetimes)
- [Rust move semantics](ch07-ownership-and-borrowing.md#rust-move-semantics)
- [Rust Clone](ch07-ownership-and-borrowing.md#rust-clone)
- [Rust Copy trait](ch07-ownership-and-borrowing.md#rust-copy-trait)
- [Rust Drop trait](ch07-ownership-and-borrowing.md#rust-drop-trait)
- [Exercise: Move, Copy and Drop](ch07-ownership-and-borrowing.md#exercise-move-copy-and-drop)
- [Rust lifetime and borrowing](ch07-1-lifetimes-and-borrowing-deep-dive.md#rust-lifetime-and-borrowing)
- [Rust lifetime annotations](ch07-1-lifetimes-and-borrowing-deep-dive.md#rust-lifetime-annotations)
- [Exercise: Slice storage with lifetimes](ch07-1-lifetimes-and-borrowing-deep-dive.md#exercise-slice-storage-with-lifetimes)
- [Lifetime Elision Rules Deep Dive](ch07-1-lifetimes-and-borrowing-deep-dive.md#lifetime-elision-rules-deep-dive)
- [Rust Box\<T\>](ch07-2-smart-pointers-and-interior-mutability.md#rust-boxt)
- [Interior Mutability: Cell\<T\> and RefCell\<T\>](ch07-2-smart-pointers-and-interior-mutability.md#interior-mutability-cellt-and-refcellt)
- [Shared Ownership: Rc\<T\>](ch07-2-smart-pointers-and-interior-mutability.md#shared-ownership-rct)
- [Exercise: Shared ownership and interior mutability](ch07-2-smart-pointers-and-interior-mutability.md#exercise-shared-ownership-and-interior-mutability)

### 8. Modules and Crates
- [Rust crates and modules](ch08-crates-and-modules.md#rust-crates-and-modules)
- [Exercise: Modules and functions](ch08-crates-and-modules.md#exercise-modules-and-functions)
- [Workspaces and crates (packages)](ch08-crates-and-modules.md#workspaces-and-crates-packages)
- [Exercise: Using workspaces and package dependencies](ch08-crates-and-modules.md#exercise-using-workspaces-and-package-dependencies)
- [Using community crates from crates.io](ch08-crates-and-modules.md#using-community-crates-from-cratesio)
- [Crates dependencies and SemVer](ch08-crates-and-modules.md#crates-dependencies-and-semver)
- [Exercise: Using the rand crate](ch08-crates-and-modules.md#exercise-using-the-rand-crate)
- [Cargo.toml and Cargo.lock](ch08-crates-and-modules.md#cargotoml-and-cargolock)
- [Cargo test feature](ch08-crates-and-modules.md#cargo-test-feature)
- [Other Cargo features](ch08-crates-and-modules.md#other-cargo-features)
- [Testing Patterns](ch08-1-testing-patterns.md)

### 9. Error Handling
- [Connecting enums to Option and Result](ch09-error-handling.md#connecting-enums-to-option-and-result)
- [Rust Option type](ch09-error-handling.md#rust-option-type)
- [Rust Result type](ch09-error-handling.md#rust-result-type)
- [Exercise: log() function implementation with Option](ch09-error-handling.md#exercise-log-function-implementation-with-option)
- [Rust error handling](ch09-error-handling.md#rust-error-handling)
- [Exercise: error handling](ch09-error-handling.md#exercise-error-handling)
- [Error Handling Best Practices](ch09-1-error-handling-best-practices.md)

### 10. Traits and Generics
- [Rust traits](ch10-traits.md#rust-traits)
- [C++ Operator Overloading → Rust std::ops Traits](ch10-traits.md#c-operator-overloading--rust-stdops-traits)
- [Exercise: Logger trait implementation](ch10-traits.md#exercise-logger-trait-implementation)
- [When to use enum vs dyn Trait](ch10-traits.md#when-to-use-enum-vs-dyn-trait)
- [Exercise: Think Before You Translate](ch10-traits.md#exercise-think-before-you-translate)
- [Rust generics](ch10-1-generics.md#rust-generics)
- [Exercise: Generics](ch10-1-generics.md#exercise-generics)
- [Combining Rust traits and generics](ch10-1-generics.md#combining-rust-traits-and-generics)
- [Rust traits constraints in data types](ch10-1-generics.md#rust-traits-constraints-in-data-types)
- [Exercise: Trait constraints and generics](ch10-1-generics.md#exercise-traits-constraints-and-generics)
- [Rust type state pattern and generics](ch10-1-generics.md#rust-type-state-pattern-and-generics)
- [Rust builder pattern](ch10-1-generics.md#rust-builder-pattern)

### 11. Type System Advanced Features
- [Rust From and Into traits](ch11-from-and-into-traits.md#rust-from-and-into-traits)
- [Exercise: From and Into](ch11-from-and-into-traits.md#exercise-from-and-into)
- [Rust Default trait](ch11-from-and-into-traits.md#rust-default-trait)
- [Other Rust type conversions](ch11-from-and-into-traits.md#other-rust-type-conversions)

### 12. Functional Programming
- [Rust closures](ch12-closures.md#rust-closures)
- [Exercise: Closures and capturing](ch12-closures.md#exercise-closures-and-capturing)
- [Rust iterators](ch12-closures.md#rust-iterators)
- [Exercise: Rust iterators](ch12-closures.md#exercise-rust-iterators)
- [Iterator Power Tools Reference](ch12-1-iterator-power-tools.md#iterator-power-tools-reference)

### 13. Concurrency
- [Rust concurrency](ch13-concurrency.md#rust-concurrency)
- [Why Rust prevents data races: Send and Sync](ch13-concurrency.md#why-rust-prevents-data-races-send-and-sync)
- [Exercise: Multi-threaded word count](ch13-concurrency.md#exercise-multi-threaded-word-count)

### 14. Unsafe Rust and FFI
- [Unsafe Rust](ch14-unsafe-rust-and-ffi.md#unsafe-rust)
- [Simple FFI example](ch14-unsafe-rust-and-ffi.md#simple-ffi-example-rust-library-function-consumed-by-c)
- [Complex FFI example](ch14-unsafe-rust-and-ffi.md#complex-ffi-example)
- [Ensuring correctness of unsafe code](ch14-unsafe-rust-and-ffi.md#ensuring-correctness-of-unsafe-code)
- [Exercise: Writing a safe FFI wrapper](ch14-unsafe-rust-and-ffi.md#exercise-writing-a-safe-ffi-wrapper)

## Part II — Deep Dives

### 15. no_std — Rust for Bare Metal
- [What is no_std?](ch15-no_std-rust-without-the-standard-library.md#what-is-no_std)
- [When to use no_std vs std](ch15-no_std-rust-without-the-standard-library.md#when-to-use-no_std-vs-std)
- [Exercise: no_std ring buffer](ch15-no_std-rust-without-the-standard-library.md#exercise-no_std-ring-buffer)
- [Embedded Deep Dive](ch15-1-embedded-deep-dive.md)

### 16. Case Studies: Real-World C++ to Rust Translation
- [Case Study 1: Inheritance hierarchy → Enum dispatch](ch16-case-studies.md#case-study-1-inheritance-hierarchy--enum-dispatch)
- [Case Study 2: shared_ptr tree → Arena/index pattern](ch16-case-studies.md#case-study-2-shared_ptr-tree--arenaindex-pattern)
- [Case Study 3: Framework communication → Lifetime borrowing](ch16-1-case-study-lifetime-borrowing.md#case-study-3-framework-communication--lifetime-borrowing)
- [Case Study 4: God object → Composable state](ch16-1-case-study-lifetime-borrowing.md#case-study-4-god-object--composable-state)
- [Case Study 5: Trait objects — when they ARE right](ch16-1-case-study-lifetime-borrowing.md#case-study-5-trait-objects--when-they-are-right)

## Part III — Best Practices & Reference

### 17. Best Practices
- [Rust Best Practices Summary](ch17-best-practices.md#rust-best-practices-summary)
- [Avoiding excessive clone()](ch17-1-avoiding-excessive-clone.md#avoiding-excessive-clone)
- [Avoiding unchecked indexing](ch17-2-avoiding-unchecked-indexing.md#avoiding-unchecked-indexing)
- [Collapsing assignment pyramids](ch17-3-collapsing-assignment-pyramids.md#collapsing-assignment-pyramids)
- [Capstone Exercise: Diagnostic Event Pipeline](ch17-3-collapsing-assignment-pyramids.md#capstone-exercise-diagnostic-event-pipeline)
- [Logging and Tracing Ecosystem](ch17-4-logging-and-tracing-ecosystem.md#logging-and-tracing-ecosystem)

### 18. C++ → Rust Semantic Deep Dives
- [Casting, Preprocessor, Modules, volatile, static, constexpr, SFINAE, and more](ch18-cpp-rust-semantic-deep-dives.md)

### 19. Rust Macros
- [Declarative macros (`macro_rules!`)](ch19-macros.md#declarative-macros-with-macro_rules)
- [Common standard library macros](ch19-macros.md#common-standard-library-macros)
- [Derive macros](ch19-macros.md#derive-macros)
- [Attribute macros](ch19-macros.md#attribute-macros)
- [Procedural macros](ch19-macros.md#procedural-macros-conceptual-overview)
- [When to use what: macros vs functions vs generics](ch19-macros.md#when-to-use-what-macros-vs-functions-vs-generics)
- [Exercises](ch19-macros.md#exercises)
