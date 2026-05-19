# Project 080 – Markdown to HTML Converter (Rust CLI Tool)

## Code
Converts Markdown files to HTML using the `pulldown-cmark` crate, parsing markdown formatting from an input file path and writing the generated HTML output to disk.

---

## Problem
Building document builders or static site generators requires reading text files, parsing markdown tags, generating valid HTML structures, and writing output files.

---

## Goal
Build a terminal Markdown converter that validates command-line inputs, reads markdown files, parses formats, and saves HTML documents.

---

## What I Learn
- Collecting and validating command-line arguments using `std::env::args`
- Reading file contents into memory strings using `std::fs::read_to_string`
- Instantiating markdown parser engines using `pulldown_cmark::Parser`
- Enabling optional GFM (GitHub Flavored Markdown) options via `Options::all()`
- Directing parser output tokens into HTML strings using `pulldown_cmark::html::push_html`
- Writing string buffers to output files using `std::fs::write`
- Returning usage errors when argument counts are incorrect

---

## Notes
- `pulldown-cmark` is an event-based pull parser, which parses markdown into stream events instead of generating intermediate trees, saving CPU memory.
- Using `Options::all()` enables parsing tables, task lists, strikethroughs, and footnotes.
- Try creating a sample markdown file, converting it with this tool, and opening the resulting HTML file in a browser.