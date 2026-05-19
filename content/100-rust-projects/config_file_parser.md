# Project 025 – Config File Parser

## Code
Parses configuration files containing `key=value` lines into a `HashMap`, discarding comments (`#` or `;`) and empty lines, and validating file extensions.

---

## Problem
Software parameters are often saved in custom key-value text files. Programs need to read these files, strip syntax noise like comments, isolate keys/values, and store pairs for runtime retrieval.

---

## Goal
Build a configuration file parser that accepts file paths, checks file extensions, parses keys and values into a `HashMap`, and logs validation errors.

---

## What I Learn
- `std::collections::HashMap` to store unique key-value settings mappings
- `splitn` string iterator to split a string by a delimiter up to a maximum number of segments
- Skipping line iterations based on comments (`#`, `;`) and empty lines
- Extracting and checking file extensions using `std::path::Path::extension`
- Matching extensions case-insensitively using helper macros like `matches!`
- Sorting keys in alphabetical order before printing config collections
- Formatting key-value listings in the console using width layout parameters

---

## Notes
- Using `splitn(2, '=')` prevents splitting the value if it contains additional `=` symbols (e.g. `url=http://example.com?a=1`).
- `Path::extension` returns an `Option<&OsStr>`, meaning it must be converted to a string slice (`&str`) to check values.
- Try modifying the parser to support nested section headers like INI files (e.g. `[Database]`).