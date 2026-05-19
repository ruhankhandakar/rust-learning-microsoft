# Project 020 – Linked List Implementation

## Code
Implements a singly linked list in safe Rust using `Box` and `Option` wrappers, supporting operations like pushing to front/back, deleting nodes, checking containment, and custom display formatting.

---

## Problem
Creating recursive data structures in Rust is challenging due to strict ownership, borrow checking, and compile-time size requirements for structs.

---

## Goal
Build a safe singly linked list data structure utilizing recursive structs, Box allocation, Option helpers, and mutable traversal pointers.

---

## What I Learn
- Representing recursive nodes using `Option<Box<Node>>` containers
- Using `Option::take` to extract value ownership out of references, leaving `None` behind
- Navigating nested node graphs by reassigning mutable references (`&mut self.head`)
- In-place deletion and node relinking using pattern matching on option variants
- Implementing `Display` trait to customize string rendering of objects
- Heap-allocating node cells with `Box::new` to handle dynamic growth
- Iterative node traversal loops using `while let Some(node)`

---

## Notes
- Recursive structs require `Box` wrapping to determine compile-time size; without it, the compiler would reject the struct due to infinite size.
- Traversing using mutable references requires careful reborrowing to avoid violating ownership limits.
- Try implementing a `pop` function that removes and returns the first element from the list.
