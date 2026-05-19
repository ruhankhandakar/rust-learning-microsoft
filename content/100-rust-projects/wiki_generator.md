# Project 093 – Personal Wiki Generator

## Code
Generates a static personal wiki from a folder of Markdown files, converting each file to HTML using `pulldown-cmark`, wrapping pages in navigation layouts, and rendering an index of links.

---

## Problem
Maintaining a personal documentation hub requires compiling markdown documents, nesting pages within shared navigation layouts, and generating directories.

---

## Goal
Build a static wiki builder that creates output directories, walks markdown pages, generates links, and writes index files.

---

## What I Learn
- Scanning local directories recursively using the `walkdir::WalkDir` crate
- Creating directory levels and file targets using the standard `Path` and `PathBuf` libraries
- Stripping source directory prefixes to preserve relative folder structures
- Translating markdown formatting to HTML snippet strings using `pulldown_cmark`
- Formatting HTML files containing navigation panels and title variables
- Collecting generated page links to dynamically construct a master `index.html` file
- Writing output page buffers to disk paths

---

## Notes
- Using `path.strip_prefix` allows the wiki generator to copy the directory structure of the source folder into the output folder.
- Relative paths are formatted using slash replacements (`replace("\\", "/")`) to guarantee that links resolve correctly in browser environments.
- Try creating a hierarchy of folders and markdown files, run the wiki builder, and open the compiled `index.html` to explore.