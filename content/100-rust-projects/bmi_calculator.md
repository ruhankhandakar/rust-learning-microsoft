# Project 006 – BMI Calculator

## Code
Prompts the user for weight (kg) and height (m) via standard input, computes Body Mass Index (BMI), and classifies the weight category.

---

## Problem
Processing physical measurements requires parsing keyboard inputs to floating-point numbers, checking for invalid inputs like zero values, and categorizing results using numeric ranges.

---

## Goal
Build a command-line tool that gathers weight and height, checks for division-by-zero errors, computes BMI using floats, and outputs a classification category.

---

## What I Learn
- `Option` wrapping of parsing results (`Some` and `None`) for cleaner code validation
- Float division and exponent calculations on double-precision floats (`f64`)
- Guard conditions to intercept zero values before calculation steps
- Nested conditional branches (`if`/`else if`) to evaluate numeric boundary conditions
- Formatting decimal outputs using precision rules in `println!` macros
- Returning static string references (`&'static str`) from evaluation functions
- Helper functions to separate user inputs, calculations, and classifications

---

## Notes
- Passing a zero value for height is intercepted to prevent division by zero, which would evaluate to `infinity` on floating-point numbers.
- Returning a `&'static str` is highly efficient because the string literal is stored directly in the program binary rather than allocated dynamically.
- Try modifying the logic to allow inputting weight in pounds and height in inches, and convert them internally.
