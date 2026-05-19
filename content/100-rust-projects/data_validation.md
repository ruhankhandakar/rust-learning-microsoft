# Project 028 – Data Validation Tool

## Code
Validates user-provided text inputs (emails, phone numbers, and password strengths) using regular expressions and character predicates, and prints colored validation results.

---

## Problem
Web and desktop applications must validate raw inputs before database entry to prevent format corruption and ensure passwords satisfy security rules.

---

## Goal
Build a terminal validation utility using the `regex` crate for string pattern matching, character predicates for password checking, and the `colored` crate for success/failure coloring.

---

## What I Learn
- `regex::Regex` compilation and matches validation checking using `is_match`
- Colored terminal prints using string extension traits provided by the `colored` crate
- Predicate checks on string characters using `chars().any` to test criteria
- Verifying ASCII categories using checks like `is_ascii_lowercase` and `is_ascii_uppercase`
- Writing password validation rules enforcing combinations of case, numbers, and symbols
- Matching choices to trigger validations inside loops
- Passing reference parameters (`&Regex`) to utility functions to reuse compiled expressions

---

## Notes
- Compining `Regex` is expensive; compiling regex instances once in `main` and passing them as references is much faster than compiling them inside validation functions.
- Predicates like `is_ascii_digit` check ASCII constraints, whereas methods like `is_numeric` support a wider set of Unicode digits.
- Try testing passwords of varying lengths and composition to verify the validation output.
