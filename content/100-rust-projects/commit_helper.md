# Project 085 – Git Commit Message Helper

## Code
Queries staged Git files by running shell commands via `Command::output`, parses file names, and suggests Conventional Commits prefix tags based on file patterns.

---

## Problem
Writing conventional commits requires identifying what files have been staged and matching changes to categories (like docs, feat, fix, or chore).

---

## Goal
Build a Git commit helper that spawns Git commands, parses staged file names, and recommends conventional commit categories.

---

## What I Learn
- Spawning OS commands using `std::process::Command` with argument list arrays
- Collecting command execution outputs and checking exit status codes (`output.status.success()`)
- Parsing stdout streams into strings using UTF-8 lossy conversion
- Splitting strings into line arrays using `.lines()`
- Checking file extensions and sub-names using `contains` and `ends_with`
- Mapping file types to conventional commit labels (e.g. `feat` for `.rs`, `docs` for `.md`)
- Handling cases where folders are not Git repositories or no files are staged

---

## Notes
- `git diff --cached --name-only` returns files that have been staged via `git add` but not yet committed.
- Spawning process commands requires the target executable (like `git`) to be present in the user's environment `$PATH`.
- Try staging a few files in your repository and run this tool to check the suggested commit prefix.
