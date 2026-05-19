# Project 088 – CSV to JSON Converter Tool

## Code
Parses records from a CSV file using Serde, deserializes rows into contact structs, and serializes the list to a pretty-printed JSON file on disk.

---

## Problem
Data pipeline utilities must translate structured tables (CSV files) into structured nested layouts (JSON files), handling parsing errors and checking arguments.

---

## Goal
Build a CSV-to-JSON command converter that parses path arguments, deserializes rows, and outputs pretty JSON documents.

---

## What I Learn
- Collecting and validating command arguments using `std::env::args`
- Reading file objects from paths using `std::fs::File::open`
- Deserializing CSV records into typed structures using the `csv` crate
- Parsing dynamic columns into defined struct fields (e.g. `u32` age fields)
- Serializing vectors of structures to pretty JSON strings using `serde_json::to_string_pretty`
- Writing serialized text structures to target files using `std::fs::write`
- Handling parsing and formatting errors at each pipeline stage

---

## Notes
- CSV deserialization relies on column names matching struct field names (like `name`, `email`, `age`).
- Structuring large CSV migrations to JSON files by reading records sequentially prevents memory exhaustion on huge datasets.
- Try creating a contact CSV table, run the converter, and verify the resulting JSON formatting matches.
