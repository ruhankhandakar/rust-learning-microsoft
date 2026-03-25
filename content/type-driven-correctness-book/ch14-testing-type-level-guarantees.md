# Testing Type-Level Guarantees 🟡

> **What you'll learn:** How to test that invalid code *fails to compile* (trybuild), fuzz validated boundaries (proptest), verify RAII invariants, and prove zero-cost abstraction via `cargo-show-asm`.
>
> **Cross-references:** [ch03](ch03-single-use-types-cryptographic-guarantee.md) (compile-fail for nonces), [ch07](ch07-validated-boundaries-parse-dont-validate.md) (proptest for boundaries), [ch05](ch05-protocol-state-machines-type-state-for-r.md) (RAII for sessions)

## Testing Type-Level Guarantees

Correct-by-construction patterns shift bugs from runtime to compile time. But
how do you **test** that invalid code actually fails to compile? And how do you
ensure validated boundaries hold under fuzzing? This chapter covers the testing
tools that complement type-level correctness.

### Compile-Fail Tests with `trybuild`

The [`trybuild`](https://crates.io/crates/trybuild) crate lets you assert that
certain code **should not compile**. This is essential for maintaining type-level
invariants across refactors — if someone accidentally adds `Clone` to your
single-use `Nonce`, the compile-fail test catches it.

**Setup:**

```toml
# Cargo.toml
[dev-dependencies]
trybuild = "1"
```

**Test file (`tests/compile_fail.rs`):**

```rust,ignore
#[test]
fn type_safety_tests() {
    let t = trybuild::TestCases::new();
    t.compile_fail("tests/ui/*.rs");
}
```

**Test case: Nonce reuse must not compile (`tests/ui/nonce_reuse.rs`):**

```rust,ignore
// tests/ui/nonce_reuse.rs
use my_crate::Nonce;

fn main() {
    let nonce = Nonce::new();
    encrypt(nonce);
    encrypt(nonce); // should fail: use of moved value
}

fn encrypt(_n: Nonce) {}
```

**Expected error (`tests/ui/nonce_reuse.stderr`):**

```text
error[E0382]: use of moved value: `nonce`
 --> tests/ui/nonce_reuse.rs:6:13
  |
4 |     let nonce = Nonce::new();
  |         ----- move occurs because `nonce` has type `Nonce`, which does not implement the `Copy` trait
5 |     encrypt(nonce);
  |             ----- value moved here
6 |     encrypt(nonce); // should fail: use of moved value
  |             ^^^^^ value used here after move
```

**More compile-fail test cases per chapter:**

| Pattern (Chapter) | Test assertion | File |
|-------------------|---------------|------|
| Single-Use Nonce (ch03) | Can't use nonce twice | `nonce_reuse.rs` |
| Capability Token (ch04) | Can't call `admin_op()` without token | `missing_token.rs` |
| Type-State (ch05) | Can't `send_command()` on `Session<Idle>` | `wrong_state.rs` |
| Dimensional (ch06) | Can't add `Celsius + Rpm` | `unit_mismatch.rs` |
| Sealed Trait (Trick 2) | External crate can't impl sealed trait | `unseal_attempt.rs` |
| Non-Exhaustive (Trick 3) | External match without wildcard fails | `missing_wildcard.rs` |

**CI integration:**

```yaml
# .github/workflows/ci.yml
- name: Run compile-fail tests
  run: cargo test --test compile_fail
```

### Property-Based Testing of Validated Boundaries

Validated boundaries (ch07) parse data once and reject invalid input. But
how do you know your validation catches **all** invalid inputs? Property-based
testing with [`proptest`](https://crates.io/crates/proptest) generates
thousands of random inputs to stress the boundary:

```toml
# Cargo.toml
[dev-dependencies]
proptest = "1"
```

```rust,ignore
use proptest::prelude::*;

/// From ch07: ValidFru wraps a spec-compliant FRU payload.
/// These tests use the full ch07 ValidFru with board_area(),
/// product_area(), and format_version() methods.
/// Note: ch07 defines TryFrom<RawFruData>, so we wrap raw bytes first.

proptest! {
    /// Any byte sequence that passes validation must be usable without panic.
    #[test]
    fn valid_fru_never_panics(data in proptest::collection::vec(any::<u8>(), 0..1024)) {
        if let Ok(fru) = ValidFru::try_from(RawFruData(data)) {
            // These must never panic on a validated FRU
            // (methods from ch07's ValidFru impl):
            let _ = fru.format_version();
            let _ = fru.board_area();
            let _ = fru.product_area();
        }
    }

    /// Round-trip: format_version is preserved through reparsing.
    #[test]
    fn fru_round_trip(data in valid_fru_strategy()) {
        let raw = RawFruData(data.clone());
        let fru = ValidFru::try_from(raw).unwrap();
        let version = fru.format_version();
        // Re-parse the same bytes — version must be identical
        let reparsed = ValidFru::try_from(RawFruData(data)).unwrap();
        prop_assert_eq!(version, reparsed.format_version());
    }
}

/// Custom strategy: generates byte vectors that satisfy the FRU spec header.
/// The header format matches ch07's `TryFrom<RawFruData>` validation:
///   - Byte 0: version = 0x01
///   - Bytes 1-6: area offsets (×8 = actual byte offset)
///   - Byte 7: checksum (sum of bytes 0-7 = 0 mod 256)
/// The body is random but large enough for the offsets to be in-bounds.
fn valid_fru_strategy() -> impl Strategy<Value = Vec<u8>> {
    let header = vec![0x01, 0x00, 0x01, 0x02, 0x00, 0x00, 0x00];
    proptest::collection::vec(any::<u8>(), 64..256)
        .prop_map(move |body| {
            let mut fru = header.clone();
            let sum: u8 = fru.iter().fold(0u8, |a, &b| a.wrapping_add(b));
            fru.push(0u8.wrapping_sub(sum));
            fru.extend_from_slice(&body);
            fru
        })
}
```

**The testing pyramid for correct-by-construction code:**

```text
┌───────────────────────────────────┐
│    Compile-Fail Tests (trybuild)  │ ← "Invalid code must not compile"
├───────────────────────────────────┤
│  Property Tests (proptest/quickcheck) │ ← "Valid inputs never panic"
├───────────────────────────────────┤
│    Unit Tests (#[test])           │ ← "Specific inputs produce expected outputs"
├───────────────────────────────────┤
│    Type System (patterns ch02–13) │ ← "Entire classes of bugs can't exist"
└───────────────────────────────────┘
```

### RAII Verification

RAII (Trick 12) guarantees cleanup. To test this, verify that the `Drop` impl
actually fires:

```rust,ignore
use std::sync::atomic::{AtomicBool, Ordering};

// NOTE: These tests use a global AtomicBool, so they must not run in
// parallel with each other. Use `#[serial_test::serial]` or run with
// `cargo test -- --test-threads=1`. Alternatively, use a per-test
// `Arc<AtomicBool>` passed via closure to avoid the global entirely.
static DROPPED: AtomicBool = AtomicBool::new(false);

struct TestSession;
impl Drop for TestSession {
    fn drop(&mut self) {
        DROPPED.store(true, Ordering::SeqCst);
    }
}

#[test]
fn session_drops_on_early_return() {
    DROPPED.store(false, Ordering::SeqCst);
    let result: Result<(), &str> = (|| {
        let _session = TestSession;
        Err("simulated failure")?;
        Ok(())
    })();
    assert!(result.is_err());
    assert!(DROPPED.load(Ordering::SeqCst), "Drop must fire on early return");
}

#[test]
fn session_drops_on_panic() {
    DROPPED.store(false, Ordering::SeqCst);
    let result = std::panic::catch_unwind(|| {
        let _session = TestSession;
        panic!("simulated panic");
    });
    assert!(result.is_err());
    assert!(DROPPED.load(Ordering::SeqCst), "Drop must fire on panic");
}
```

### Applying to Your Codebase

Here's a prioritized plan for adding type-level tests to the
workspace:

| Crate | Test type | What to test |
|-------|-----------|-------------|
| `protocol_lib` | Compile-fail | `Session<Idle>` can't `send_command()` |
| `protocol_lib` | Property | Any byte seq → `TryFrom` either succeeds or returns Err (no panic) |
| `thermal_diag` | Compile-fail | Can't construct `FanReading` without `HasSpi` mixin |
| `accel_diag` | Property | GPU sensor parsing: random bytes → validated-or-rejected |
| `config_loader` | Property | Random strings → `FromStr` for `DiagLevel` never panics |
| `pci_topology` | Compile-fail | `Register<Width16>` can't be passed where `Width32` expected |
| `event_handler` | Compile-fail | Audit token can't be cloned |
| `diag_framework` | Compile-fail | `DerBuilder<Missing, _>` can't call `finish()` |

### Zero-Cost Abstraction: Proof by Assembly

A common concern: "Do newtypes and phantom types add runtime overhead?"
The answer is **no** — they compile to identical assembly as raw primitives.
Here's how to verify:

**Setup:**

```bash
cargo install cargo-show-asm
```

**Example: Newtype vs raw u32:**

```rust,ignore
// src/lib.rs
#[derive(Clone, Copy)]
pub struct Rpm(pub u32);

#[derive(Clone, Copy)]
pub struct Celsius(pub f64);

// Newtype arithmetic
#[inline(never)]
pub fn add_rpm(a: Rpm, b: Rpm) -> Rpm {
    Rpm(a.0 + b.0)
}

// Raw arithmetic (for comparison)
#[inline(never)]
pub fn add_raw(a: u32, b: u32) -> u32 {
    a + b
}
```

**Run:**

```bash
cargo asm my_crate::add_rpm
cargo asm my_crate::add_raw
```

**Result — identical assembly:**

```asm
; add_rpm (newtype)           ; add_raw (raw u32)
my_crate::add_rpm:            my_crate::add_raw:
  lea eax, [rdi + rsi]         lea eax, [rdi + rsi]
  ret                          ret
```

The `Rpm` wrapper is completely erased at compile time. The same holds for
`PhantomData<S>` (zero bytes), `ZST` tokens (zero bytes), and all other
type-level markers used throughout this guide.

**Verify for your own types:**

```bash
# Show assembly for a specific function
cargo asm --lib ipmi_lib::session::execute

# Show that PhantomData adds zero bytes
cargo asm --lib --rust ipmi_lib::session::IpmiSession
```

> **Key takeaway:** Every pattern in this guide has **zero runtime cost**.
> The type system does all the work and is erased completely during compilation.
> You get the safety of Haskell with the performance of C.

## Key Takeaways

1. **trybuild tests that invalid code won't compile** — essential for maintaining type-level invariants across refactors.
2. **proptest fuzzes validation boundaries** — generates thousands of random inputs to stress `TryFrom` implementations.
3. **RAII verification tests that Drop runs** — Arc counters or mock flags prove cleanup happened.
4. **cargo-show-asm proves zero-cost** — phantom types, ZSTs, and newtypes produce the same assembly as raw C.
5. **Add compile-fail tests for every "impossible" state** — if someone accidentally derives `Clone` on a single-use type, the test catches it.

---

*End of Type-Driven Correctness in Rust*

