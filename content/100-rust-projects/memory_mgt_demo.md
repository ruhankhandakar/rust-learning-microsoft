# Project 015 – Memory Management Demo

## Code
Demonstrates ownership transfers (moves), borrowing rules, lifetimes, heap allocations (`Box`), shared ownership (`Rc`), and interior mutability (`RefCell`) in a single console application.

---

## Problem
Systems languages require precise memory management. Developers need to understand when memory is allocated, freed, shared, or mutated safely without introducing dereferencing errors or race conditions.

---

## Goal
Build a demonstration suite that exercises and explains Rust's memory concepts, highlighting lifetime annotations, reference counts, and interior mutability.

---

## What I Learn
- Ownership transfer (move semantics) where assigning a variable invalidates the original owner
- Borrowing rules allowing multiple immutable borrows or exactly one mutable borrow at a time
- Lifetime annotations (`'a`) to specify relationship scopes of references in functions
- Heap allocation using `Box::new` to store values outside stack frames
- Reference counting using `Rc::new` and `Rc::clone` to share read-only data across owners
- `Rc::strong_count` to track the number of active references pointing to shared resources
- Interior mutability using `RefCell` and mutating values at runtime with `borrow_mut`

---

## Notes
- `Rc` is not thread-safe; for sharing data across threads, you must use `Arc` (Atomically Reference Counted) instead.
- `RefCell` enforces borrowing rules at runtime rather than compile-time, which will trigger a panic if multiple mutable references are requested simultaneously.
- Try uncommenting the line `// println!("{}", s1);` to observe the compiler error message when attempting to access a moved value.