# Project 014 – File Reader CLI

## Code
Implements a CLI utility that reads a file line-by-line using a buffered reader, supporting optional line number prefixes (`--lines`) and keyword filtering (`--search <keyword>`).

---

## Problem
Processing large text files line-by-line without overloading system memory requires streaming data incrementally, matching search query keys, and indexing line numbers.

---

## Goal
Build a file-reading tool that parses command-line arguments, opens files, streams lines using buffered readers, applies filters, and formats output lines.

---

## What I Learn
- `std::io::BufReader` to buffer disk I/O, preventing frequent system calls
- `lines()` iterator to read streams line-by-line without loading entire files into memory
- Argument vector scanning using `contains` to toggle boolean options (like `--lines`)
- Finding argument array index positions with `position` to retrieve subsequent key parameters
- Option parsing techniques to extract optional search terms (`Option<&String>`)
- Iterator indexing using `enumerate` to track and print 1-based line counts
- Option mapping using `map_or` to evaluate filter parameters cleanly

---

## Notes
- Using `BufReader` is critical for performance; reading files character-by-character or unbuffered directly from the disk increases system call overhead.
- `lines()` yields elements of type `Result<String, Error>`, which must be unwrapped because disk operations or encoding conversions can fail mid-read.
- Try creating a large test file and verify that memory usage remains low when processing it line-by-line.
