# Project 043 – File Compression Tool

## Code
Performs Gzip compression and decompression using the `flate2` crate, wrapping file reader and writer streams with encoder/decoder structures, and implementing custom error handling.

---

## Problem
Data storage and transmission pipelines need to compress files to reduce disk footprint and bandwidth, requiring format validations and stream encoders.

---

## Goal
Build a command-line Gzip utility that compresses files to `.gz` format, decompresses them, validates file extensions, and logs compression errors.

---

## What I Learn
- `flate2::write::GzEncoder` to stream compressed byte data into files
- `flate2::read::GzDecoder` to decompress file streams back to plain text
- Custom error enums (`CompressionError`) capturing and classifying failure categories
- Implementing `std::fmt::Display` to print clean, descriptive error outputs
- Automatically converting `io::Error` types using the `From` trait implementation
- Reading files to completion using `read_to_end` with mutable byte vectors
- Working with path wrappers like `PathBuf` and checking file extensions

---

## Notes
- Using `BufReader` and `BufWriter` wraps I/O operations in memory blocks, significantly speeding up disk reads and writes.
- Suffixing paths with `.gz` acts as a safety check; the decompression helper rejects files lacking the correct extension.
- Try compressing a text file and compare the resulting file size with the original source.
