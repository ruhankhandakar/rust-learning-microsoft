# Project 021 – CRUD Operations on a Text File

## Code
Implements file-based database operations, reading lines into memory, letting the user modify or delete specific lines by index, and writing updates back to disk.

---

## Problem
Simple data management applications need file storage without the complexity of SQL servers. They need to handle line-based file modification, index validations, and disk operations safely.

---

## Goal
Build a terminal app that performs create, read, update, and delete (CRUD) operations on lines inside a local text file, implementing index validations.

---

## What I Learn
- `std::fs::write` to create or overwrite file contents in a single call
- `std::path::Path::new` and its `exists` method to check file availability
- `BufReader::new` and `lines().collect()` to read files into a vector of strings
- Indexing and updating elements in mutable vectors (`Vec<String>`)
- Deleting items in vectors using index offsets via `remove`
- Structuring modular datastores (e.g. `TextFileDb` in `main_pro.rs`)
- Designing custom error enums and converting `std::io::Error` using the `From` trait

---

## Notes
- Rewriting files by reading all content to memory, modifying it, and saving it works well for small configurations but does not scale to large datasets.
- Custom errors mapping standard I/O errors using `From` traits make code cleaner by allowing the `?` operator.
- Try modifying the database to store comma-separated values (CSV) rather than plain text lines.
