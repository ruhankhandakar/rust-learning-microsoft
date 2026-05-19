# Project 010 – To-Do List App

## Code
Implements a CLI-based task manager that performs CRUD operations on tasks and persists the list to a local JSON file.

---

## Problem
Persistent local storage, data structures, and state manipulation are key requirements in software. Apps need to read, write, update, and serialize structures to disk.

---

## Goal
Build a tasks CLI with options to add, view, complete, and delete tasks, serialize data with Serde, and load/save tasks on start/exit.

---

## What I Learn
- Struct definition with Serde attributes like `#[derive(Serialize, Deserialize)]`
- `serde_json::from_str` and `to_string_pretty` to marshal and unmarshal JSON data
- Reading files with `std::fs::read_to_string` and handling missing file cases
- Writing and creating files with `std::fs::File::create` and `write_all`
- Iterating and mutably modifying objects using `iter_mut` and `find`
- Finding index positions in vectors with `position` and removing elements with `remove`
- Terminal prompt loops displaying a multi-option menu

---

## Notes
- Serializing structs requires adding `serde` and `serde_json` dependencies to `Cargo.toml`.
- Mutating a task in place inside a vector requires using a mutable iterator (`iter_mut()`), otherwise elements are immutable.
- Try running the app, adding some tasks, exiting, and viewing the generated `tasks.json` file in your editor.