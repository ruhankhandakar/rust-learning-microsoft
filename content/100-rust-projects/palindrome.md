# Project 007 – Palindrome Checker

## Code
Cleans a user-provided string by stripping non-alphanumeric characters, converts it to lowercase, and checks if it reads the same forward and backward.

---

## Problem
Text validation tasks like anagram detection, spelling checkers, or string symmetry checks require filtering out punctuation and spaces, converting characters to uniform case, and comparing reversed sequences.

---

## Goal
Build a command-line tool that prompts the user for text, removes non-alphanumeric noise, handles case insensitivity, and determines if the text is a palindrome.

---

## What I Learn
- `chars` iterator to parse strings code-point by code-point
- `filter` method combined with `is_alphanumeric` to strip spaces and punctuation symbols
- `map` and `to_lowercase` to normalize input characters
- `collect::<String>` to construct a new cleaned `String` from character collections
- `rev` iterator adaptor to reverse character sequences
- String slice comparisons using standard equality operators (`==`)
- Handle edge cases like empty strings or inputs containing only punctuation

---

## Notes
- `is_alphanumeric` respects Unicode, so characters from other scripts (e.g., Cyrillic or accented letters) are handled correctly.
- Reversing characters with `chars().rev().collect()` allocates a new string, which is simple but uses extra memory compared to a two-pointer approach.
- Try entering a palindrome sentence with punctuation and spaces (e.g., "A man, a plan, a canal: Panama!") to verify the filtering logic.
