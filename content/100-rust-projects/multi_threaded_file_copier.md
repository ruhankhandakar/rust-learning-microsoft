# Project 045 – Multi-threaded File Copier

## Code
Copies large files in parallel using the `rayon` crate, splitting files into 1MB chunks processed by worker threads that write to pre-allocated target files.

---

## Problem
Copying massive files sequentially is slow. Splitting files into chunks and writing them concurrently speeds up transfers, but requires pre-allocating files, seeking chunk offsets, and managing thread-safe paths.

---

## Goal
Build a parallel file copier that calculates chunks, pre-allocates destination files, uses Rayon's parallel iterators, and writes chunks concurrently.

---

## What I Learn
- Parallel processing using the `rayon` crate and its `into_par_iter` iterator
- Pre-allocating files on disk using `std::fs::File::set_len` before writing chunks
- Navigating inside files using `seek` with offset markers (`SeekFrom::Start`)
- Reading specific byte counts from files using `read_exact`
- Configuring file write options using `std::fs::OpenOptions`
- Sharing destination paths safely across threads using `std::sync::Arc`
- Calculating optimal chunk sizes and handling remaining byte tail ends

---

## Notes
- Pre-allocating the destination file with `set_len` allows threads to write to any offset concurrently without thread safety issues.
- Rayon manages a work-stealing thread pool automatically, minimizing overhead from thread spawning and joining.
- Try copying a large file (e.g. 100MB) and measure speed differences compared to standard single-threaded copies.