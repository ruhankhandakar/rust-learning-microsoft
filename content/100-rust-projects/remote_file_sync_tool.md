# Project 060 – Remote File Sync Tool (Local Simulation)

## Code
Synchronizes two directories by recursively scanning a source folder, checking if files are missing or updated in the destination, and copying new or modified files.

---

## Problem
Backup tools and file sync utilities need to keep directories in sync. Implementing this requires recursive directory traversal, metadata checks, and copying files.

---

## Goal
Build a directory synchronization tool that traverses directories recursively, checks modification times, and copies updated files.

---

## What I Learn
- Traversing directory paths recursively using `std::fs::read_dir`
- Creating target directory trees using `std::fs::create_dir_all`
- Copying files across directories using `std::fs::copy`
- Retrieving file metadata using `std::fs::metadata` to check modification times
- Comparing file modification times using `modified()` and `SystemTime`
- Creating destination paths using the `join` method on `Path` structures
- Formatting paths in console output using `display()`

---

## Notes
- `fs::copy` copies file contents and permission bits, but does not copy directory metadata (like creation times).
- If `metadata().modified()` fails or is not supported by the file system, the sync tool defaults to the Unix epoch to force synchronization.
- Try running the sync tool on a source directory, modifying a file, and running the tool again to verify only the modified file is copied.
