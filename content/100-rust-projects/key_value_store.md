# Project 058 – Key-Value Store

## Code
Implements a local key-value store that reads and writes data to a JSON file using a `HashMap` and Serde, supporting commands like set, get, delete, and list.

---

## Problem
Applications need simple persistent storage to save configurations or profiles. Saving state requires serializing maps to disk and parsing CLI arguments.

---

## Goal
Build a terminal key-value store that parses arguments, updates a `HashMap` in memory, and persists changes to a local JSON file.

---

## What I Learn
- Managing key-value pairs using `HashMap<String, String>`
- Serializing database states to JSON files using `serde_json::to_writer_pretty`
- Reading and parsing JSON database files using `serde_json::from_reader`
- Parsing commands case-sensitively using pattern matching on slice structures
- Splitting strings into key-value command segments using `splitn(3, ' ')`
- Updating maps with `insert` and removing entries with `remove`
- Listing stored keys in alphabetical order

---

## Notes
- Using `splitn(3, ' ')` splits the command line into at most 3 parts (command, key, value), allowing values to contain spaces.
- Pattern matching on slice structures (e.g. `["set", key, value]`) provides compile-time verification of argument counts.
- Try running the store, setting a key with a multi-word value, and checking `kv_store.json` on disk.