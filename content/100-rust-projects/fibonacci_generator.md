# Project 008 – Fibonacci Generator

## Code
Generates a Fibonacci sequence up to a user-defined number of terms, then splits the resulting sequence into separate collections of even and odd values.

---

## Problem
Algorithms often require generating sequential values dynamically, allocating memory for varying list sizes, and filtering collections based on modulo checks.

---

## Goal
Build a terminal utility that prompts for a count of terms, generates the Fibonacci sequence in a vector, filters the values, and prints the lists.

---

## What I Learn
- Vector allocation using `Vec::new` and appending elements with `push`
- Dynamic indexing inside vectors with usize conversion (`i as usize`)
- Slicing syntax (`&[u64]`) to pass arrays efficiently to helper functions
- De-referencing values during loops using the `&num` pattern
- Basic array filtering and modulo arithmetic (`%`) inside loops
- Conditional base cases for sequences (e.g., handling inputs of size 1 or 2)
- Tuple returning (`(Vec<u64>, Vec<u64>)`) to return multiple collections from a function

---

## Notes
- Fibonacci sequences grow exponentially and will quickly overflow standard integer types; using `u64` prevents overflow up to the 93rd term.
- Passing collections as slices (`&[u64]`) avoids passing ownership or duplicating memory, keeping functions fast.
- Try entering a large term count like 100 to observe how the program behaves when integer overflow occurs.