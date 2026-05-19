# Project 089 – Static Site Generator (Markdown → HTML)

## Code
Traverses source directories using the `walkdir` crate, converting Markdown files to HTML snippets using `pulldown-cmark`, and saving formatted pages to output folders.

---

## Problem
Static site generators need to recursively scan directories for Markdown source files, render content into HTML templates, and write outputs while preserving structures.

---

## Goal
Build a static site generator that creates output directories, walks source content, converts markdown, and saves HTML pages.

---

## What I Learn
- Creating target directories recursively using `std::fs::create_dir_all`
- Traversing directory files recursively using the `walkdir::WalkDir` crate
- Filtering files by checking path extensions using `path.extension`
- Reading source markdown contents using `std::fs::read_to_string`
- Rendering markdown structures to HTML elements using the `pulldown-cmark` library
- Formatting templates with dynamic title variables and body snippets
- Creating output files and writing raw bytes using `std::fs::File::create`

---

## Notes
- `walkdir` simplifies directory traversal, avoiding the need to write recursive file search logic manually.
- The generator overwrites existing files in the output directory, making it easy to regenerate pages during updates.
- Try creating a `content` folder, adding multiple markdown files, and running the generator to check output pages in the `public` directory.