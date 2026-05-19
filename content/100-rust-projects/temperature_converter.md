# Project 002 – Temperature Converter

## Code
Performs six-way temperature conversions between Celsius, Fahrenheit, and Kelvin through a console-based command-line loop.

---

## Problem
Many everyday and scientific calculations require translating values across different temperature units, requiring a simple interface to take raw text inputs, validate decimal parsing, and branch logic.

---

## Goal
Build a terminal-based interactive loop that prompts the user for conversion choices and temperature inputs, validates input formats, and computes output.

---

## What I Learn
- `std::io::stdin` to read raw user keyboard inputs from the command line
- `String::new` and `read_line` to initialize and populate mutable buffers
- `trim` and `parse` method chaining to sanitize inputs and convert strings to `u32` or `f64` values
- Pattern matching (`match`) to handle parsing errors (`Ok` and `Err` variants) and menu options
- Interactive terminal control loops (`loop`) for continuous application run
- Output formatting with precision modifiers like `{:.2}` in `println!`
- Modular code architecture using helper functions for distinct conversion formulas

---

## Notes
- `stdin().read_line` retains the trailing newline (`\n` or `\r\n`), making `.trim()` essential before parsing.
- Floating-point calculations can lead to precision issues; using `{:.2}` limits visual decimal overflow in the output.
- Try converting a non-numeric string to observe how the error matching blocks handle bad inputs gracefully.
