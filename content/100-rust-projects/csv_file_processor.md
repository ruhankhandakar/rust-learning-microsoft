# Project 046 – CSV File Processor

## Code
Reads and filters CSV data using the `csv` crate, matching values in a specified column and printing matching rows to standard output.

---

## Problem
Processing large tabular CSV files requires parsing quote boundaries, handling varying field counts, mapping columns to indices, and filtering records efficiently.

---

## Goal
Build a terminal tool that reads a CSV file path, matches records based on user-defined column name filters, and prints matching rows.

---

## What I Learn
- Reading and parsing CSV streams using `csv::ReaderBuilder` structures
- Extracting CSV headers and tracking index bounds using `headers()`
- Finding column indices by matching header titles with `position` searches
- Iterating rows dynamically via `records()` generators
- Retrieving specific row fields safely using index values and `get`
- Joining array fields into formatted text strings via `join(",")`
- Returning errors using dynamic trait pointers (`Box<dyn Error>`)

---

## Notes
- `ReaderBuilder` handles RFC 4180 rules, including escaped quotes, multi-line values, and varying commas.
- Using `records()` streams rows sequentially, keeping memory consumption low since the whole file is not loaded into a vector.
- Try creating a mock CSV containing columns like "Name, Age, City" and test filtering by city.
