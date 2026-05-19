# Project 096 – Resume Builder (TOML-to-HTML/PDF Builder)

## Code
Parses resume data from a TOML configuration file into structs using Serde, rendering the profile details into an HTML template and spawning WeasyPrint to build a PDF file.

---

## Problem
Maintaining multiple formats (like HTML, PDF, or text) of a resume is tedious. A single source-of-truth file (like TOML) allows generating other formats programmatically.

---

## Goal
Build a resume compiler that parses TOML files, maps details to nested structures, builds HTML documents, and runs PDF generators.

---

## What I Learn
- Deserializing complex TOML file formats into Rust structures using Serde
- Designing nested structure schemas containing optional fields (`Option<Vec<T>>`)
- Formatting HTML files using inline CSS variables (`:root { --primary-color: ... }`)
- Implementing print-specific style parameters inside CSS media queries (`@media print`)
- Mapping optional collections conditionally to HTML blocks using `if let Some(...)` blocks
- Spawning external PDF CLI compilation programs using `std::process::Command`
- Gracefully handling missing dependencies (like WeasyPrint) during runtime

---

## Notes
- To render PDF files from generated HTML pages, you must have the WeasyPrint package installed (`sudo apt install weasyprint`).
- The inline CSS layout uses flexible styling (flexbox and grids) to ensure that the generated resume fits on a single page when printed.
- Try updating `resume.toml` with your credentials, run the builder, and inspect the resulting `resume.pdf` output.