# Project 029 – Generic Stack Implementation

## Code
Implements a last-in, first-out (LIFO) stack data structure supporting generic types, offering push, pop, peek, mutable peek, iteration, print, and clear functions.

---

## Problem
Standard collections are often too low-level. Developers need to restrict access patterns to enforce LIFO behaviors using type-safe APIs.

---

## Goal
Build a generic `Stack<T>` data structure wrapping a standard vector, implementing LIFO methods, checking stack states, and allowing mutable updates to the top item.

---

## What I Learn
- Struct definition with type parameterization (`Stack<T>`) to support any generic type
- Implementing traits on generic structs using trait bounds like `impl<T: Debug>`
- Standard vector wrappers like `pop` and `push` to manage elements
- Safely retrieving references using `Option` results with `last` and `last_mut`
- Returning impl traits like `impl Iterator<Item = &T>` using reversed vector iterators
- Default instance generation using the `Default` derive macro and `default()` constructor
- Mutably altering elements in-place by dereferencing pointers (e.g. `*val = new_val`)

---

## Notes
- Enforcing `T: Debug` trait bounds inside the `impl<T: Debug> Stack<T>` block makes the print function available only when the elements are printable.
- `peek_mut` returns a mutable reference `Option<&mut T>`, allowing users to change the value of the top element directly without popping it.
- Try creating a stack of integers or custom structs in `main` to verify the generic capability.
