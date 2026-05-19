# Project 095 – JSON Merge Tool (Conflict-Aware Merger)

## Code
Merges patch JSON objects into base JSON structures recursively, overwriting matching fields and inserting missing entries.

---

## Problem
Configuration managers and API sync engines must merge nested JSON files dynamically, updating existing values while preserving unrelated keys.

---

## Goal
Build a JSON merger tool that validates arguments, parses base/patch files, merges nested maps, and outputs JSON documents.

---

## What I Learn
- Representing dynamic, untyped JSON structures using the `serde_json::Value` enum
- Pattern matching JSON enum variants recursively (e.g. matching `(Object, Object)`)
- Accessing and modifying map entries in-place using mutable references (`&mut Value`)
- Iterating through patch keys and merging nested child objects recursively
- Overwriting non-object values (like numbers or arrays) in the base JSON object
- Serializing final merged objects to pretty-printed strings
- Reading and writing files using file path arguments

---

## Notes
- Overwriting simple values with patch values relies on the dereferencing operator (`*base_value = patch_value.clone()`), which replaces the target value.
- This recursive approach handles objects of arbitrary depth, but it does not merge elements inside JSON arrays; it replaces them instead.
- Try creating a base JSON file and a patch JSON file, run the merger, and verify the resulting output document matches expectations.
