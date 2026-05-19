# Project 087 – YouTube Audio/Video Downloader

## Code
Spawns the `yt-dlp` CLI tool to download videos or extract audio using `Command::new`, validating executable availability in the OS path, and routing stderr output.

---

## Problem
Downloading online media formats and extracting MP3 files requires spawning external system tools (like `yt-dlp` and `ffmpeg`) and handling execution results.

---

## Goal
Build a terminal downloader that checks if `yt-dlp` is installed, takes choices, and streams download processes.

---

## What I Learn
- Spawning OS command-line tools from Rust using `std::process::Command`
- Checking CLI tool availability in the user's path using the `which` command
- Redirecting stdout/stderr output streams using `Stdio::null()`
- Running downloads and passing custom formatting arguments (like MP3 extracts)
- Checking execution success states using `status.success()`
- Extracting and parsing stderr outputs to identify missing dependencies (like `ffmpeg`)
- Pattern matching downloader options using custom enums

---

## Notes
- `yt-dlp` is a command-line media downloader, and `ffmpeg` is required to transcode video formats into MP3 audio formats.
- Spawning processes blocks the main thread; for graphical applications, running commands on separate threads keeps the UI responsive.
- Try running the program to download a short video, checking if dependencies are installed in your shell first.
