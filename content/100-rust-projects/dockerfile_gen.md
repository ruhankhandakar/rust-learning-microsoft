# Project 099 – Dockerfile Generator

## Code
Generates optimized, multi-stage Dockerfiles for Rust projects, parsing `Cargo.toml` files to infer crate configurations, and writing files using Clap CLI arguments.

---

## Problem
Writing Dockerfiles for Rust projects requires multi-stage setups to compile binaries, leverage caching layers, and produce minimal production images.

---

## Goal
Build a Docker generator CLI that parses Cargo manifests, takes customization flags, generates optimized Dockerfiles, and outputs files.

---

## What I Learn
- Designing CLI argument parsers using the `clap` crate's builder pattern
- Implementing flags and default values for builder versions and base images
- Parsing `Cargo.toml` manifests to infer workspace attributes and crate names
- Determining build types (binary vs. library) based on project layouts
- Generating optimized multi-stage build instructions targeting build caches
- Appending copy commands for binaries and handling workspaces or examples
- Writing output Dockerfile templates to files on disk

---

## Notes
- The generated Dockerfile utilizes a builder stage (using `rust:slim` images) and a runtime stage (using `debian:slim` images) to minimize final container sizes.
- Layer cache optimization compiles cargo dependencies separately to prevent rebuilds on minor code updates.
- Try running this generator on a Rust project and verify the resulting `Dockerfile` by running `docker build .`.
