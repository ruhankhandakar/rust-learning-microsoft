# Project 016 – Asset Management CLI

## Code
Tracks company assets (such as names and monetary values) using an in-memory `AssetManager` struct containing vectors and index maps, supporting CRUD commands via a terminal loop.

---

## Problem
Organizations need to log, edit, and audit inventory assets dynamically without setting up heavy database structures or complex servers.

---

## Goal
Build a terminal inventory manager that handles addition, listing, deletion, and editing of company items while generating unique serial IDs.

---

## What I Learn
- Storing items in contiguous memory lists using the `Vec` collections type
- Mapping serial number IDs to vector positions using the `HashMap` collections type
- Performing $O(1)$ removal operations on vector indices using the `swap_remove` method
- Adjusting moved indices inside map structures after swapping elements
- Processing console string inputs using `std::io::stdin().read_line`
- Implementing numeric boundaries using pattern match ranges (e.g. `1..=5`)
- Formatting tabular terminal borders using character grid sequences (e.g. `┌`, `├`, `└`)
- Displaying formatted decimal string values using floating-point format keys (`{:.2}`)

---

## Notes
- `swap_remove` is a high-performance $O(1)$ alternative to standard `remove`, but it alters the order of elements in the vector by moving the last element to the deleted slot.
- Group 7 task reference can be found [here](https://github.com/Bloceducare/Web3bridge-Rust-Masterclass-Cohort-I/blob/main/tasks/week-2/Group-Project-1-24.markdown).
