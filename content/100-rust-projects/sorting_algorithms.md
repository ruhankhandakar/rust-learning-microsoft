# Project 032 – Generic Bubble & Insertion Sorting Algorithms

## Code
Implements generic Bubble Sort and Insertion Sort algorithms bounded by comparison and clone traits, validating and sorting arrays of integers and words.

---

## Problem
Sorting algorithms should work on multiple types (numbers, strings, custom objects) without duplicating logic. Implementing generic sorting requires bounding parameters by standard comparison behaviors.

---

## Goal
Build generic Bubble Sort and Insertion Sort algorithms bounded by `PartialOrd` traits, and wrap them in a CLI validating comma-separated elements.

---

## What I Learn
- Bounds constraints on generic functions (`T: PartialOrd` and `T: Clone`)
- In-place element manipulation using the slice utility helper `swap`
- Implementation of the classic Bubble Sort double-loop swap algorithm
- Implementation of Insertion Sort shifting values using clone allocations
- Comma-delimited text parsing using iterators (`split(',')`) and trimming rules
- Graceful integer parser failures returning custom error messages
- Reusing standard vector collections for different generic typings

---

## Notes
- `arr.swap(j, j + 1)` is a safe std function that swaps two elements in a mutable slice without violating ownership rules.
- Insertion Sort requires `T: Clone` because elements must be cloned out of the slice to act as key comparison elements during shifting.
- Try benchmarking the sorting performance of bubble sort versus insertion sort with a large generated list of random numbers.
