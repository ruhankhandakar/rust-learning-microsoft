# Rust Engineering Practices — Beyond `cargo build`

## Speaker Intro

- Principal Firmware Architect in Microsoft SCHIE (Silicon and Cloud Hardware Infrastructure Engineering) team
- Industry veteran with expertise in security, systems programming (firmware, operating systems, hypervisors), CPU and platform architecture, and C++ systems
- Started programming in Rust in 2017 (@AWS EC2), and have been in love with the language ever since

---

> A practical guide to the Rust toolchain features that most teams discover too late:
> build scripts, cross-compilation, benchmarking, code coverage, and safety verification
> with Miri and Valgrind. Each chapter uses concrete examples drawn from
> a real hardware-diagnostics codebase —
> a large multi-crate workspace — so every technique maps directly to production code.

## How to Use This Book

This book is designed for **self-paced study or team workshops**. Each chapter is largely independent — read them in order or jump to the topic you need.

### Difficulty Legend

| Symbol | Level | Meaning |
|:------:|-------|---------|
| 🟢 | Starter | Straightforward tools with clear patterns — useful on day one |
| 🟡 | Intermediate | Requires understanding of toolchain internals or platform concepts |
| 🔴 | Advanced | Deep toolchain knowledge, nightly features, or multi-tool orchestration |

### Pacing Guide

| Part | Chapters | Est. Time | Key Outcome |
|------|----------|:---------:|-------------|
| **I — Build & Ship** | ch01–02 | 3–4 h | Build metadata, cross-compilation, static binaries |
| **II — Measure & Verify** | ch03–05 | 4–5 h | Statistical benchmarking, coverage gates, Miri/sanitizers |
| **III — Harden & Optimize** | ch06–10 | 6–8 h | Supply chain security, release profiles, compile-time tools, `no_std`, Windows |
| **IV — Integrate** | ch11–13 | 3–4 h | Production CI/CD pipeline, tricks, capstone exercise |
| | | **16–21 h** | **Full production engineering pipeline** |

### Working Through Exercises

Each chapter contains **🏋️ exercises** with difficulty indicators. Solutions are provided in expandable `<details>` blocks — try the exercise first, then check your work.

- 🟢 exercises can often be done in 10–15 minutes
- 🟡 exercises require 20–40 minutes and may involve running tools locally
- 🔴 exercises require significant setup and experimentation (1+ hour)

## Prerequisites

| Concept | Where to learn it |
|---------|-------------------|
| Cargo workspace layout | [Rust Book ch14.3](https://doc.rust-lang.org/book/ch14-03-cargo-workspaces.html) |
| Feature flags | [Cargo Reference — Features](https://doc.rust-lang.org/cargo/reference/features.html) |
| `#[cfg(test)]` and basic testing | Rust Patterns ch12 |
| `unsafe` blocks and FFI basics | Rust Patterns ch10 |

## Chapter Dependency Map

```text
                 ┌──────────┐
                 │ ch00     │
                 │  Intro   │
                 └────┬─────┘
        ┌─────┬───┬──┴──┬──────┬──────┐
        ▼     ▼   ▼     ▼      ▼      ▼
      ch01  ch03 ch04  ch05   ch06   ch09
      Build Bench Cov  Miri   Deps   no_std
        │     │    │    │      │      │
        │     └────┴────┘      │      ▼
        │          │           │    ch10
        ▼          ▼           ▼   Windows
       ch02      ch07        ch07    │
       Cross    RelProf     RelProf  │
        │          │           │     │
        │          ▼           │     │
        │        ch08          │     │
        │      CompTime        │     │
        └──────────┴───────────┴─────┘
                   │
                   ▼
                 ch11
               CI/CD Pipeline
                   │
                   ▼
                ch12 ─── ch13
              Tricks    Quick Ref
```

**Read in any order**: ch01, ch03, ch04, ch05, ch06, ch09 are independent.
**Read after prerequisites**: ch02 (needs ch01), ch07–ch08 (benefit from ch03–ch06), ch10 (benefits from ch09).
**Read last**: ch11 (ties everything together), ch12 (tricks), ch13 (reference).

## Annotated Table of Contents

### Part I — Build & Ship

| # | Chapter | Difficulty | Description |
|---|---------|:----------:|-------------|
| 1 | [Build Scripts — `build.rs` in Depth](ch01-build-scripts-buildrs-in-depth.md) | 🟢 | Compile-time constants, compiling C code, protobuf generation, system library linking, anti-patterns |
| 2 | [Cross-Compilation — One Source, Many Targets](ch02-cross-compilation-one-source-many-target.md) | 🟡 | Target triples, musl static binaries, ARM cross-compile, `cross` tool, `cargo-zigbuild`, GitHub Actions |

### Part II — Measure & Verify

| # | Chapter | Difficulty | Description |
|---|---------|:----------:|-------------|
| 3 | [Benchmarking — Measuring What Matters](ch03-benchmarking-measuring-what-matters.md) | 🟡 | Criterion.rs, Divan, `perf` flamegraphs, PGO, continuous benchmarking in CI |
| 4 | [Code Coverage — Seeing What Tests Miss](ch04-code-coverage-seeing-what-tests-miss.md) | 🟢 | `cargo-llvm-cov`, `cargo-tarpaulin`, `grcov`, Codecov/Coveralls CI integration |
| 5 | [Miri, Valgrind, and Sanitizers](ch05-miri-valgrind-and-sanitizers-verifying-u.md) | 🔴 | MIR interpreter, Valgrind memcheck/Helgrind, ASan/MSan/TSan, cargo-fuzz, loom |

### Part III — Harden & Optimize

| # | Chapter | Difficulty | Description |
|---|---------|:----------:|-------------|
| 6 | [Dependency Management and Supply Chain Security](ch06-dependency-management-and-supply-chain-s.md) | 🟢 | `cargo-audit`, `cargo-deny`, `cargo-vet`, `cargo-outdated`, `cargo-semver-checks` |
| 7 | [Release Profiles and Binary Size](ch07-release-profiles-and-binary-size.md) | 🟡 | Release profile anatomy, LTO trade-offs, `cargo-bloat`, `cargo-udeps` |
| 8 | [Compile-Time and Developer Tools](ch08-compile-time-and-developer-tools.md) | 🟡 | `sccache`, `mold`, `cargo-nextest`, `cargo-expand`, `cargo-geiger`, workspace lints, MSRV |
| 9 | [`no_std` and Feature Verification](ch09-no-std-and-feature-verification.md) | 🔴 | `cargo-hack`, `core`/`alloc`/`std` layers, custom panic handlers, testing `no_std` code |
| 10 | [Windows and Conditional Compilation](ch10-windows-and-conditional-compilation.md) | 🟡 | `#[cfg]` patterns, `windows-sys`/`windows` crates, `cargo-xwin`, platform abstraction |

### Part IV — Integrate

| # | Chapter | Difficulty | Description |
|---|---------|:----------:|-------------|
| 11 | [Putting It All Together — A Production CI/CD Pipeline](ch11-putting-it-all-together-a-production-cic.md) | 🟡 | GitHub Actions workflow, `cargo-make`, pre-commit hooks, `cargo-dist`, capstone |
| 12 | [Tricks from the Trenches](ch12-tricks-from-the-trenches.md) | 🟡 | 10 battle-tested patterns: `deny(warnings)` trap, cache tuning, dep dedup, RUSTFLAGS, more |
| 13 | [Quick Reference Card](ch13-quick-reference-card.md) | — | Commands at a glance, 60+ decision table entries, further reading links |

