# Project 100 – Prompt Pack Manager

## Code
Implements a CLI application to manage, search, export, and import AI prompts using Serde and UUIDs, supporting multiple export formats (JSON, CSV, TXT, MD).

---

## Problem
AI engineering requires organizing prompts, tagging structures, keyword indexing, and exporting libraries to share across different platforms.

---

## Goal
Build a terminal prompt manager that loads files, prompts choices, generates UUIDs, filters tags/keywords, and exports documents.

---

## What I Learn
- Managing collection states in structured databases using Serde serialization
- Generating unique identifier strings using the `uuid` crate's `Uuid::new_v4` generator
- Appending multi-line keyboard input sequences until terminated by special keywords
- Implementing tag-based and keyword-based search filters across prompts
- Exporting arrays to CSV files using the `csv::Writer` writer
- Writing Markdown format documents by appending structured strings
- Importing and merging JSON/CSV prompt collections while generating new UUID keys

---

## Notes
- To read multi-line inputs for long prompts, the console loops keyboard reads until the user enters `END` on a new line.
- Importing records generates fresh UUIDs to prevent ID collisions with existing prompts in the database.
- Try running the prompt manager, adding multiple prompts, and exporting them as Markdown to view the formatted result.