# Tricks from the Trenches 🟡

> **What you'll learn:**
> - Battle-tested patterns that don't fit neatly into one chapter
> - Common pitfalls and their fixes — from CI flake to binary bloat
> - Quick-win techniques you can apply to any Rust project today
>
> **Cross-references:** Every chapter in this book — these tricks cut across all topics

This chapter collects engineering patterns that come up repeatedly in
production Rust codebases. Each trick is self-contained — read them in
any order.

---

### 1. The `deny(warnings)` Trap

**Problem**: `#![deny(warnings)]` in source code breaks builds when Clippy
adds new lints — your code that compiled yesterday fails today.

**Fix**: Use `CARGO_ENCODED_RUSTFLAGS` in CI instead of a source-level attribute:

```yaml
# CI: treat warnings as errors without touching source
env:
  CARGO_ENCODED_RUSTFLAGS: "-Dwarnings"
```

Or use `[workspace.lints]` for finer control:

```toml
# Cargo.toml
[workspace.lints.rust]
unsafe_code = "deny"

[workspace.lints.clippy]
all = { level = "deny", priority = -1 }
pedantic = { level = "warn", priority = -1 }
```

> See [Compile-Time Tools, Workspace Lints](ch08-compile-time-and-developer-tools.md) for the full pattern.

---

### 2. Compile Once, Test Everywhere

**Problem**: `cargo test` recompiles when switching between `--lib`, `--doc`,
and `--test` because they use different profiles.

**Fix**: Use `cargo nextest` for unit/integration tests and run doc-tests
separately:

```bash
cargo nextest run --workspace        # Fast: parallel, cached
cargo test --workspace --doc         # Doc-tests (nextest can't run these)
```

> See [Compile-Time Tools](ch08-compile-time-and-developer-tools.md) for `cargo-nextest` setup.

---

### 3. Feature Flag Hygiene

**Problem**: A library crate has `default = ["std"]` but nobody tests
`--no-default-features`. One day an embedded user reports it doesn't compile.

**Fix**: Add `cargo-hack` to CI:

```yaml
- name: Feature matrix
  run: |
    cargo hack check --each-feature --no-dev-deps
    cargo check --no-default-features
    cargo check --all-features
```

> See [`no_std` and Feature Verification](ch09-no-std-and-feature-verification.md) for the full pattern.

---

### 4. The Lock File Debate — Commit or Ignore?

**Rule of thumb:**

| Crate Type | Commit `Cargo.lock`? | Why |
|------------|---------------------|-----|
| Binary / application | **Yes** | Reproducible builds |
| Library | **No** (`.gitignore`) | Let downstream choose versions |
| Workspace with both | **Yes** | Binary wins |

Add a CI check to ensure the lock file stays up-to-date:

```yaml
- name: Check lock file
  run: cargo update --locked  # Fails if Cargo.lock is stale
```

---

### 5. Debug Builds with Optimized Dependencies

**Problem**: Debug builds are painfully slow because dependencies (especially
`serde`, `regex`) aren't optimized.

**Fix**: Optimize deps in dev profile while keeping your code unoptimized
for fast recompilation:

```toml
# Cargo.toml
[profile.dev.package."*"]
opt-level = 2  # Optimize all dependencies in dev mode
```

This slows the first build slightly but makes runtime dramatically faster
during development. Particularly impactful for database-backed services and
parsers.

> See [Release Profiles](ch07-release-profiles-and-binary-size.md) for per-crate profile overrides.

---

### 6. CI Cache Thrashing

**Problem**: `Swatinem/rust-cache@v2` saves a new cache on every PR, bloating
storage and slowing restore times.

**Fix**: Only save cache from `main`, restore from anywhere:

```yaml
- uses: Swatinem/rust-cache@v2
  with:
    save-if: ${{ github.ref == 'refs/heads/main' }}
```

For workspaces with multiple binaries, add a `shared-key`:

```yaml
- uses: Swatinem/rust-cache@v2
  with:
    shared-key: "ci-${{ matrix.target }}"
    save-if: ${{ github.ref == 'refs/heads/main' }}
```

> See [CI/CD Pipeline](ch11-putting-it-all-together-a-production-cic.md) for the full workflow.

---

### 7. `RUSTFLAGS` vs `CARGO_ENCODED_RUSTFLAGS`

**Problem**: `RUSTFLAGS="-Dwarnings"` applies to *everything* — including
build scripts and proc-macros. A warning in `serde_derive`'s build.rs
fails your CI.

**Fix**: Use `CARGO_ENCODED_RUSTFLAGS` which only applies to the top-level
crate:

```bash
# BAD — breaks on third-party build script warnings
RUSTFLAGS="-Dwarnings" cargo build

# GOOD — only affects your crate
CARGO_ENCODED_RUSTFLAGS="-Dwarnings" cargo build

# ALSO GOOD — workspace lints (Cargo.toml)
[workspace.lints.rust]
warnings = "deny"
```

---

### 8. Reproducible Builds with `SOURCE_DATE_EPOCH`

**Problem**: Embedding `chrono::Utc::now()` in `build.rs` makes builds
non-reproducible — every build produces a different binary hash.

**Fix**: Honor `SOURCE_DATE_EPOCH`:

```rust
// build.rs
let timestamp = std::env::var("SOURCE_DATE_EPOCH")
    .ok()
    .and_then(|s| s.parse::<i64>().ok())
    .unwrap_or_else(|| chrono::Utc::now().timestamp());
println!("cargo:rustc-env=BUILD_TIMESTAMP={timestamp}");
```

> See [Build Scripts](ch01-build-scripts-buildrs-in-depth.md) for the full build.rs patterns.

---

### 9. The `cargo tree` Deduplication Workflow

**Problem**: `cargo tree --duplicates` shows 5 versions of `syn` and 3 of
`tokio-util`. Compile time is painful.

**Fix**: Systematic deduplication:

```bash
# Step 1: Find duplicates
cargo tree --duplicates

# Step 2: Find who pulls the old version
cargo tree --invert --package syn@1.0.109

# Step 3: Update the culprit
cargo update -p serde_derive  # Might pull in syn 2.x

# Step 4: If no update available, pin in [patch]
# [patch.crates-io]
# old-crate = { git = "...", branch = "syn2-migration" }

# Step 5: Verify
cargo tree --duplicates  # Should be shorter
```

> See [Dependency Management](ch06-dependency-management-and-supply-chain-s.md) for `cargo-deny` and supply chain security.

---

### 10. Pre-Push Smoke Test

**Problem**: You push, CI takes 10 minutes, fails on a formatting issue.

**Fix**: Run the fast checks locally before push:

```toml
# Makefile.toml (cargo-make)
[tasks.pre-push]
description = "Local smoke test before pushing"
script = '''
cargo fmt --all -- --check
cargo clippy --workspace --all-targets -- -D warnings
cargo test --workspace --lib
'''
```

```bash
cargo make pre-push  # < 30 seconds
git push
```

Or use a git pre-push hook:

```bash
#!/bin/sh
# .git/hooks/pre-push
cargo fmt --all -- --check && cargo clippy --workspace -- -D warnings
```

> See [CI/CD Pipeline](ch11-putting-it-all-together-a-production-cic.md) for `Makefile.toml` patterns.

---

### 🏋️ Exercises

#### 🟢 Exercise 1: Apply Three Tricks

Pick three tricks from this chapter and apply them to an existing Rust project. Which had the biggest impact?

<details>
<summary>Solution</summary>

Typical high-impact combination:

1. **`[profile.dev.package."*"] opt-level = 2`** — Immediate improvement in dev-mode runtime (2-10× faster for parsing-heavy code)

2. **`CARGO_ENCODED_RUSTFLAGS`** — Eliminates false CI failures from third-party warnings

3. **`cargo-hack --each-feature`** — Usually finds at least one broken feature combination in any project with 3+ features

```bash
# Apply trick 5:
echo '[profile.dev.package."*"]' >> Cargo.toml
echo 'opt-level = 2' >> Cargo.toml

# Apply trick 7 in CI:
# Replace RUSTFLAGS with CARGO_ENCODED_RUSTFLAGS

# Apply trick 3:
cargo install cargo-hack
cargo hack check --each-feature --no-dev-deps
```
</details>

#### 🟡 Exercise 2: Deduplicate Your Dependency Tree

Run `cargo tree --duplicates` on a real project. Eliminate at least one duplicate. Measure compile-time before and after.

<details>
<summary>Solution</summary>

```bash
# Before
time cargo build --release 2>&1 | tail -1
cargo tree --duplicates | wc -l  # Count duplicate lines

# Find and fix one duplicate
cargo tree --duplicates
cargo tree --invert --package <duplicate-crate>@<old-version>
cargo update -p <parent-crate>

# After
time cargo build --release 2>&1 | tail -1
cargo tree --duplicates | wc -l  # Should be fewer

# Typical result: 5-15% compile time reduction per eliminated
# duplicate (especially for heavy crates like syn, tokio)
```
</details>

### Key Takeaways

- Use `CARGO_ENCODED_RUSTFLAGS` instead of `RUSTFLAGS` to avoid breaking third-party build scripts
- `[profile.dev.package."*"] opt-level = 2` is the single highest-impact dev experience trick
- Cache tuning (`save-if` on main only) prevents CI cache bloat on active repositories
- `cargo tree --duplicates` + `cargo update` is a free compile-time win — do it monthly
- Run fast checks locally with `cargo make pre-push` to avoid CI round-trip waste

---
