# Project 056 – CLI Shell (Mini Terminal)

## Code
Implements a custom command line shell that prints directories, parses arguments, handles built-ins like `cd` and `pwd`, and spawns system commands via `Command::spawn`.

---

## Problem
System terminals must track shell directories, format custom user prompts, parse space-separated argument arrays, spawn child processes, and inherit system streams.

---

## Goal
Build a terminal shell that displays path prompts, interprets inputs, processes built-ins, spawns OS commands, and matches terminal widths.

---

## What I Learn
- Spawning OS child processes using `std::process::Command`
- Inheriting standard input, output, and error streams via `Stdio::inherit()`
- Querying and modifying working directories with `env::current_dir` and `env::set_current_dir`
- Reading system environment paths (e.g. `env::var("HOME")`) to format prompts (e.g. replacing home paths with `~`)
- Checking console terminal column dimensions using the `termsize` crate
- Splitting user command strings into executable commands and argument arrays
- Blocking shells until child commands complete using `child.wait()`

---

## Notes
- Commands like `cd` cannot be run as standard child processes because they must modify the environment of the parent shell; they must be implemented as built-in commands.
- `Stdio::inherit()` binds the child process directly to the parent's console, allowing interactive tools (like `vim` or `htop`) to run inside the shell.
- Try entering a command that does not exist to observe how the shell catches and reports spawn errors.
