# Project 013 – JSON Parser

## Code
Validates and parses a JSON file specified via command-line arguments using the `serde_json` crate, outputting pretty-printed JSON structure or formatting error locations.

---

## Problem
Tools handling data exchange must validate JSON schemas, parse text structures into strongly typed representations, format outputs, and pinpoint syntax errors.

---

## Goal
Build a command-line validation tool that reads raw file paths, validates file readability, parses JSON content to a generic tree node structure, and prints it.

---

## What I Learn
- `serde_json::Value` to dynamically represent any valid JSON value (object, array, string, number, boolean, null)
- `serde_json::from_str` to parse dynamic JSON documents into structural nodes
- `serde_json::to_string_pretty` to format JSON with indentations for console display
- Command-line argument length validation and redirecting errors to stderr using `eprintln!`
- Nested pattern matching on file operations and JSON parser results
- Handling parse failures and mapping them to descriptive error details
- Declaring external serialization crate dependencies in the package file

---

## Notes
- Parsing to `serde_json::Value` allocates memory dynamically for a node tree; for high-performance pipelines, parsing to strongly typed structs is faster.
- Using `eprintln!` writes to the standard error stream (`stderr`) rather than the standard output stream (`stdout`), which is standard CLI practice.
- Try modifying the script to parse JSON into a concrete struct with defined fields rather than the generic `Value` enum.