# Project 005 – Word Counter

## Code
Reads a text file specified by a command-line argument and counts its total words, lines, and characters.

---

## Problem
Text analysis and file handling require extracting parameters from command-line environments, opening local file handles, reading data safely into memory, and running fast string tokenization.

---

## Goal
Build a command-line tool that accepts a file path argument, handles missing-file errors, reads the file's text, and outputs text statistics.

---

## What I Learn
- `std::env::args` to collect CLI arguments into a `Vec<String>`
- `std::fs::File::open` to open a file read-only stream handle
- `read_to_string` to read text stream data directly into a mutable `String` buffer
- `split_whitespace` to count words while ignoring varying spacing patterns
- `lines` string method to parse newline boundaries
- `chars` method to accurately count Unicode code points rather than raw bytes
- Error mapping of standard file errors to descriptive user messages

---

## Notes
- `chars().count()` counts Unicode characters, which can differ from the raw byte length (`len()`) if multi-byte characters are present.
- Storing full file content in a single `String` can exhaust memory on massive files; a buffered reader is preferred for larger datasets.
- Try passing a directory path instead of a file path to see how the open file handler responds to access errors.
