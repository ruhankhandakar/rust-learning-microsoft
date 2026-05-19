# Project 017 – String Manipulation Tool

## Code
Performs common string operations—reversing, case conversions, whitespace trimming, substring checks, and target replacements—via an interactive terminal menu.

---

## Problem
Text processing requires manipulating string types, handling string ownership versus references, using iterators to transform character ordering, and slicing buffers.

---

## Goal
Build a terminal interface that gathers string inputs from the user, applies various transformations using std string methods, and prints outcomes.

---

## What I Learn
- `chars().rev().collect::<String>()` to reverse character arrays without breaking UTF-8 encodings
- `to_uppercase` and `to_lowercase` to convert character casing dynamically
- `trim` method to strip leading and trailing whitespace from string inputs
- `contains` to check for specific substrings inside main string slices
- `replace` method to swap search matches with replacement patterns
- Helper functions prompting inputs using stdout flushes and stdin reads
- Loop control flows matching choices to distinct string operations

---

## Notes
- `to_uppercase` and `to_lowercase` return a new, allocated `String` since lowercase/uppercase variants can change character byte counts.
- `contains` takes a reference wrapper parameter (e.g., `&sub`) rather than consuming the variable directly.
- Try entering multi-byte Unicode strings (like emojis or non-Latin scripts) to see how the reversing logic handles them.
