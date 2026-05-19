# Project 042 – Directory Scanner

## Code
Recursively scans a specified local directory using standard file-system utilities, traversing subdirectories and rendering directory structures with nested indentations.

---

## Problem
Tools generating folder hierarchies or scanning directories need to traverse nested folders recursively, distinguish files from directories, and print structural trees.

---

## Goal
Build a directory-scanning utility that traverses directories recursively, identifies file types, handles read errors, and prints formatted output trees.

---

## What I Learn
- `std::fs::read_dir` to read contents of folders on local disks
- Directory entry type checking using `is_dir` and `is_file` flags
- Recursive function designs that propagate current directory depths (`depth: usize`)
- Repeating characters to build dynamic indentation lines (`"  ".repeat(depth)`)
- Converting directory names (`std::ffi::OsString`) to standard string templates
- Checking path availability using `Path::exists` and `Path::is_dir`
- Handling directory reading permissions errors without interrupting scanner runs

---

## Notes
- `read_dir` returns an iterator yielding `io::Result<DirEntry>`, meaning entries must be individually unwrapped because file states can change mid-run.
- Deep directory recursion can exhaust stack memory; for extremely nested or massive structures, iterative traversal is preferred.
- Try running the scanner on a workspace folder to observe how the nested directories are displayed.
