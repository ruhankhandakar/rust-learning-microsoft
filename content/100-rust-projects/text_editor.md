# Project 057 – Text Editor (Mini Editor)

## Code
Implements a CLI line-by-line text editor that loads files into memory, allows users to append, edit, or delete lines by line numbers, and writes changes back to disk.

---

## Problem
Text editors require rendering file lines with numeric prefixes, modifying specific indices in string vectors, and committing changes back to disk.

---

## Goal
Build a terminal text editor that loads files to memory, renders indexed views, processes CRUD prompts, and writes contents to disk.

---

## What I Learn
- Reading files to vectors of strings using `BufReader` and `lines()`
- Cleaning and skipping parsing failures using `filter_map(Result::ok)`
- Appending new lines to memory collections using `lines.push()`
- Modifying lines in-place using vector indexing (`lines[idx - 1] = ...`)
- Deleting lines at specific indices using `lines.remove(idx - 1)`
- Creating files and writing lines sequentially using `File::create` and `writeln!`
- Formatting lines in the console using right-aligned width parameters (`{:>3}`)

---

## Notes
- `filter_map(Result::ok)` filters out any lines that failed to read (e.g. due to invalid UTF-8 encoding), collecting only successfully parsed strings.
- Vector indices are 0-based, so user-entered line numbers (1-based) must be offset by subtracting 1 before operations.
- Try creating a new file, typing multiple lines, editing a middle line, and saving to verify disk persistence.
