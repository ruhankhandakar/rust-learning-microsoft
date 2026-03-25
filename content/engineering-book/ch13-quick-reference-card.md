# Quick Reference Card

### Cheat Sheet: Commands at a Glance

```bash
# ─── Build Scripts ───
cargo build                          # Compiles build.rs first, then crate
cargo build -vv                      # Verbose — shows build.rs output

# ─── Cross-Compilation ───
rustup target add x86_64-unknown-linux-musl
cargo build --release --target x86_64-unknown-linux-musl
cargo zigbuild --release --target x86_64-unknown-linux-gnu.2.17
cross build --release --target aarch64-unknown-linux-gnu

# ─── Benchmarking ───
cargo bench                          # Run all benchmarks
cargo bench -- parse                 # Run benchmarks matching "parse"
cargo flamegraph -- --args           # Generate flamegraph from binary
perf record -g ./target/release/bin  # Record perf data
perf report                          # View perf data interactively

# ─── Coverage ───
cargo llvm-cov --html                # HTML report
cargo llvm-cov --lcov --output-path lcov.info
cargo llvm-cov --workspace --fail-under-lines 80
cargo tarpaulin --out Html           # Alternative tool

# ─── Safety Verification ───
cargo +nightly miri test             # Run tests under Miri
MIRIFLAGS="-Zmiri-disable-isolation" cargo +nightly miri test
valgrind --leak-check=full ./target/debug/binary
RUSTFLAGS="-Zsanitizer=address" cargo +nightly test -Zbuild-std --target x86_64-unknown-linux-gnu

# ─── Audit & Supply Chain ───
cargo audit                          # Known vulnerability scan
cargo audit --deny warnings          # Fail CI on any advisory
cargo deny check                     # License + advisory + ban + source checks
cargo deny list                      # List all licenses in dep tree
cargo vet                            # Supply chain trust verification
cargo outdated --workspace           # Find outdated dependencies
cargo semver-checks                  # Detect breaking API changes
cargo geiger                         # Count unsafe in dependency tree

# ─── Binary Optimization ───
cargo bloat --release --crates       # Size contribution per crate
cargo bloat --release -n 20          # 20 largest functions
cargo +nightly udeps --workspace     # Find unused dependencies
cargo machete                        # Fast unused dep detection
cargo expand --lib module::name      # See macro expansions
cargo msrv find                      # Discover minimum Rust version
cargo clippy --fix --workspace --allow-dirty  # Auto-fix lint warnings

# ─── Compile-Time Optimization ───
export RUSTC_WRAPPER=sccache         # Shared compilation cache
sccache --show-stats                 # Cache hit statistics
cargo nextest run                    # Faster test runner
cargo nextest run --retries 2        # Retry flaky tests

# ─── Platform Engineering ───
cargo check --target thumbv7em-none-eabihf   # Verify no_std builds
cargo build --target x86_64-pc-windows-gnu   # Cross-compile to Windows
cargo xwin build --target x86_64-pc-windows-msvc  # MSVC ABI cross-compile
cfg!(target_os = "linux")                    # Compile-time cfg (evaluates to bool)

# ─── Release ───
cargo release patch --dry-run        # Preview release
cargo release patch --execute        # Bump, commit, tag, publish
cargo dist plan                      # Preview distribution artifacts
```

### Decision Table: Which Tool When

| Goal | Tool | When to Use |
|------|------|-------------|
| Embed git hash / build info | `build.rs` | Binary needs traceability |
| Compile C code with Rust | `cc` crate in `build.rs` | FFI to small C libraries |
| Generate code from schemas | `prost-build` / `tonic-build` | Protobuf, gRPC, FlatBuffers |
| Link system library | `pkg-config` in `build.rs` | OpenSSL, libpci, systemd |
| Static Linux binary | `--target x86_64-unknown-linux-musl` | Container/cloud deployment |
| Target old glibc | `cargo-zigbuild` | RHEL 7, CentOS 7 compatibility |
| ARM server binary | `cross` or `cargo-zigbuild` | Graviton/Ampere deployment |
| Statistical benchmarks | Criterion.rs | Performance regression detection |
| Quick perf check | Divan | Development-time profiling |
| Find hot spots | `cargo flamegraph` / `perf` | After benchmark identifies slow code |
| Line/branch coverage | `cargo-llvm-cov` | CI coverage gates, gap analysis |
| Quick coverage check | `cargo-tarpaulin` | Local development |
| Rust UB detection | Miri | Pure-Rust `unsafe` code |
| C FFI memory safety | Valgrind memcheck | Mixed Rust/C codebases |
| Data race detection | TSan or Miri | Concurrent `unsafe` code |
| Buffer overflow detection | ASan | `unsafe` pointer arithmetic |
| Leak detection | Valgrind or LSan | Long-running services |
| Local CI equivalent | `cargo-make` | Developer workflow automation |
| Pre-commit checks | `cargo-husky` or git hooks | Catch issues before push |
| Automated releases | `cargo-release` + `cargo-dist` | Version management + distribution |
| Dependency auditing | `cargo-audit` / `cargo-deny` | Supply chain security |
| License compliance | `cargo-deny` (licenses) | Commercial / enterprise projects |
| Supply chain trust | `cargo-vet` | High-security environments |
| Find outdated deps | `cargo-outdated` | Scheduled maintenance |
| Detect breaking changes | `cargo-semver-checks` | Library crate publishing |
| Dependency tree analysis | `cargo tree --duplicates` | Dedup and trim dep graph |
| Binary size analysis | `cargo-bloat` | Size-constrained deployments |
| Find unused deps | `cargo-udeps` / `cargo-machete` | Trim compile time and size |
| LTO tuning | `lto = true` or `"thin"` | Release binary optimization |
| Size-optimized binary | `opt-level = "z"` + `strip = true` | Embedded / WASM / containers |
| Unsafe usage audit | `cargo-geiger` | Security policy enforcement |
| Macro debugging | `cargo-expand` | Derive / macro_rules debugging |
| Faster linking | `mold` linker | Developer inner loop |
| Compilation cache | `sccache` | CI and local build speed |
| Faster tests | `cargo-nextest` | CI and local test speed |
| MSRV compliance | `cargo-msrv` | Library publishing |
| `no_std` library | `#![no_std]` + `default-features = false` | Embedded, UEFI, WASM |
| Windows cross-compile | `cargo-xwin` / MinGW | Linux → Windows builds |
| Platform abstraction | `#[cfg]` + trait pattern | Multi-OS codebases |
| Windows API calls | `windows-sys` / `windows` crate | Native Windows functionality |
| End-to-end timing | `hyperfine` | Whole-binary benchmarks, before/after comparison |
| Property-based testing | `proptest` | Edge case discovery, parser robustness |
| Snapshot testing | `insta` | Large structured output verification |
| Coverage-guided fuzzing | `cargo-fuzz` | Crash discovery in parsers |
| Concurrency model checking | `loom` | Lock-free data structures, atomic ordering |
| Feature combination testing | `cargo-hack` | Crates with multiple `#[cfg]` features |
| Fast UB checks (near-native) | `cargo-careful` | CI safety gate, lighter than Miri |
| Auto-rebuild on save | `cargo-watch` | Developer inner loop, tight feedback |
| Workspace documentation | `cargo doc` + rustdoc | API discovery, onboarding, doc-link CI |
| Reproducible builds | `--locked` + `SOURCE_DATE_EPOCH` | Release integrity verification |
| CI cache tuning | `Swatinem/rust-cache@v2` | Build time reduction (cold → cached) |
| Workspace lint policy | `[workspace.lints]` in Cargo.toml | Consistent Clippy/compiler lints across all crates |
| Auto-fix lint warnings | `cargo clippy --fix` | Automated cleanup of trivial issues |

### Further Reading

| Topic | Resource |
|-------|----------|
| Cargo build scripts | [Cargo Book — Build Scripts](https://doc.rust-lang.org/cargo/reference/build-scripts.html) |
| Cross-compilation | [Rust Cross-Compilation](https://rust-lang.github.io/rustup/cross-compilation.html) |
| `cross` tool | [cross-rs/cross](https://github.com/cross-rs/cross) |
| `cargo-zigbuild` | [cargo-zigbuild docs](https://github.com/rust-cross/cargo-zigbuild) |
| Criterion.rs | [Criterion User Guide](https://bheisler.github.io/criterion.rs/book/) |
| Divan | [Divan docs](https://github.com/nvzqz/divan) |
| `cargo-llvm-cov` | [cargo-llvm-cov](https://github.com/taiki-e/cargo-llvm-cov) |
| `cargo-tarpaulin` | [tarpaulin docs](https://github.com/xd009642/tarpaulin) |
| Miri | [Miri GitHub](https://github.com/rust-lang/miri) |
| Sanitizers in Rust | [rustc Sanitizer docs](https://doc.rust-lang.org/nightly/unstable-book/compiler-flags/sanitizer.html) |
| `cargo-make` | [cargo-make book](https://sagiegurari.github.io/cargo-make/) |
| `cargo-release` | [cargo-release docs](https://github.com/crate-ci/cargo-release) |
| `cargo-dist` | [cargo-dist docs](https://axodotdev.github.io/cargo-dist/book/) |
| Profile-guided optimization | [Rust PGO guide](https://doc.rust-lang.org/rustc/profile-guided-optimization.html) |
| Flamegraphs | [cargo-flamegraph](https://github.com/flamegraph-rs/flamegraph) |
| `cargo-deny` | [cargo-deny docs](https://embarkstudios.github.io/cargo-deny/) |
| `cargo-vet` | [cargo-vet docs](https://mozilla.github.io/cargo-vet/) |
| `cargo-audit` | [cargo-audit](https://github.com/rustsec/rustsec/tree/main/cargo-audit) |
| `cargo-bloat` | [cargo-bloat](https://github.com/RazrFalcon/cargo-bloat) |
| `cargo-udeps` | [cargo-udeps](https://github.com/est31/cargo-udeps) |
| `cargo-geiger` | [cargo-geiger](https://github.com/geiger-rs/cargo-geiger) |
| `cargo-semver-checks` | [cargo-semver-checks](https://github.com/obi1kenobi/cargo-semver-checks) |
| `cargo-nextest` | [nextest docs](https://nexte.st/) |
| `sccache` | [sccache](https://github.com/mozilla/sccache) |
| `mold` linker | [mold](https://github.com/rui314/mold) |
| `cargo-msrv` | [cargo-msrv](https://github.com/foresterre/cargo-msrv) |
| LTO | [rustc Codegen Options](https://doc.rust-lang.org/rustc/codegen-options/index.html) |
| Cargo Profiles | [Cargo Book — Profiles](https://doc.rust-lang.org/cargo/reference/profiles.html) |
| `no_std` | [Rust Embedded Book](https://docs.rust-embedded.org/book/) |
| `windows-sys` crate | [windows-rs](https://github.com/microsoft/windows-rs) |
| `cargo-xwin` | [cargo-xwin docs](https://github.com/rust-cross/cargo-xwin) |
| `cargo-hack` | [cargo-hack](https://github.com/taiki-e/cargo-hack) |
| `cargo-careful` | [cargo-careful](https://github.com/RalfJung/cargo-careful) |
| `cargo-watch` | [cargo-watch](https://github.com/watchexec/cargo-watch) |
| Rust CI cache | [Swatinem/rust-cache](https://github.com/Swatinem/rust-cache) |
| Rustdoc book | [Rustdoc Book](https://doc.rust-lang.org/rustdoc/) |
| Conditional compilation | [Rust Reference — cfg](https://doc.rust-lang.org/reference/conditional-compilation.html) |
| Embedded Rust | [Awesome Embedded Rust](https://github.com/rust-embedded/awesome-embedded-rust) |
| `hyperfine` | [hyperfine](https://github.com/sharkdp/hyperfine) |
| `proptest` | [proptest](https://github.com/proptest-rs/proptest) |
| `insta` | [insta snapshot testing](https://insta.rs/) |
| `cargo-fuzz` | [cargo-fuzz](https://github.com/rust-fuzz/cargo-fuzz) |
| `loom` | [loom concurrency testing](https://github.com/tokio-rs/loom) |

---

*Generated as a companion reference — a companion to Rust Patterns and
Type-Driven Correctness.*

*Version 1.3 — Added cargo-hack, cargo-careful, cargo-watch, cargo doc,
reproducible builds, CI caching strategies, capstone exercise, and chapter
dependency diagram for completeness.*
