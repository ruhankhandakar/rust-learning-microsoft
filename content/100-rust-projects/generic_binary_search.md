# Project 030 – Generic Binary Search CLI

## Code
Implements a generic binary search algorithm that finds elements in sorted slices of any type implementing `PartialOrd`, and provides menus to search numbers and words.

---

## Problem
Searching through large datasets sequentially ($O(n)$) is inefficient. Sorted datasets can be searched in logarithmic time ($O(\log n)$), but implementing this algorithm requires general compatibility with custom orderable types.

---

## Goal
Build a generic binary search function bounded by comparison traits, and wrap it in a terminal interface to search sorted arrays of integers and strings.

---

## What I Learn
- Generic binary search implementation using trait bounds for ordering (`T: PartialOrd`)
- Safely matching comparison outcomes (`Ordering::Equal`, `Ordering::Less`, `Ordering::Greater`)
- Safely dividing indices without overflow using `low + (high - low) / 2`
- Normalizing comparisons case-insensitively using string comparison methods like `eq_ignore_ascii_case`
- Converting word arrays (`&[&str]`) to owned collections (`Vec<String>`) for compatibility
- Handling optional search output indexes with `Option<usize>`
- Gracefully handling invalid numeric formats during user input parsing

---

## Notes
- Binary search requires the input collection to be sorted beforehand; passing an unsorted array will yield incorrect results.
- `T: PartialOrd` is used instead of `T: Ord` to support types that might not have a total ordering (like floats), though total ordering is preferred.
- Try searching for elements that do not exist to verify the search halts and returns `None` correctly.
