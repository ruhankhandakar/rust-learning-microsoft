# Reference Card

> **Quick-reference for all 14+ correct-by-construction patterns** with selection flowchart, pattern catalogue, composition rules, crate mapping, and types-as-guarantees cheat sheet.
>
> **Cross-references:** Every chapter — this is the lookup table for the entire book.

## Quick Reference: Correct-by-Construction Patterns

### Pattern Selection Guide

```text
Is the bug catastrophic if missed?
├── Yes → Can it be encoded in types?
│         ├── Yes → USE CORRECT-BY-CONSTRUCTION
│         └── No  → Runtime check + extensive testing
└── No  → Runtime check is fine
```

### Pattern Catalogue

| # | Pattern | Key Trait/Type | Prevents | Runtime Cost | Chapter |
|---|---------|---------------|----------|:------:|---------|
| 1 | Typed Commands | `trait IpmiCmd { type Response; }` | Wrong response type | Zero | ch02 |
| 2 | Single-Use Types | `struct Nonce` (not Clone/Copy) | Nonce/key reuse | Zero | ch03 |
| 3 | Capability Tokens | `struct AdminToken { _private: () }` | Unauthorised access | Zero | ch04 |
| 4 | Type-State | `Session<Active>` | Protocol violations | Zero | ch05 |
| 5 | Dimensional Types | `struct Celsius(f64)` | Unit confusion | Zero | ch06 |
| 6 | Validated Boundaries | `struct ValidFru` (via TryFrom) | Unvalidated data use | Parse once | ch07 |
| 7 | Capability Mixins | `trait FanDiagMixin: HasSpi + HasI2c` | Missing bus access | Zero | ch08 |
| 8 | Phantom Types | `Register<Width16>` | Width/direction mismatch | Zero | ch09 |
| 9 | Sentinel → Option | `Option<u8>` (not `0xFF`) | Sentinel-as-value bugs | Zero | ch11 |
| 10 | Sealed Traits | `trait Cmd: private::Sealed` | Unsound external impls | Zero | ch11 |
| 11 | Non-Exhaustive Enums | `#[non_exhaustive] enum Sku` | Silent match fallthrough | Zero | ch11 |
| 12 | Typestate Builder | `DerBuilder<Set, Missing>` | Incomplete construction | Zero | ch11 |
| 13 | FromStr Validation | `impl FromStr for DiagLevel` | Unvalidated string input | Parse once | ch11 |
| 14 | Const-Generic Size | `RegisterBank<const N: usize>` | Buffer size mismatch | Zero | ch11 |
| 15 | Safe `unsafe` Wrapper | `MmioRegion::read_u32()` | Unchecked MMIO/FFI | Zero | ch11 |
| 16 | Async Type-State | `AsyncSession<Active>` | Async protocol violations | Zero | ch11 |
| 17 | Const Assertions | `SdrSensorId<const N: u8>` | Invalid compile-time IDs | Zero | ch11 |
| 18 | Session Types | `Chan<SendRequest>` | Out-of-order channel ops | Zero | ch11 |
| 19 | Pin Self-Referential | `Pin<Box<StreamParser>>` | Dangling intra-struct pointer | Zero | ch11 |
| 20 | RAII / Drop | `impl Drop for Session` | Resource leak on any exit path | Zero | ch11 |
| 21 | Error Type Hierarchy | `#[derive(Error)] enum DiagError` | Silent error swallowing | Zero | ch11 |
| 22 | `#[must_use]` | `#[must_use] struct Token` | Silently dropped values | Zero | ch11 |

### Composition Rules

```text
Capability Token + Type-State = Authorised state transitions
Typed Command + Dimensional Type = Physically-typed responses
Validated Boundary + Phantom Type = Typed register access on validated config
Capability Mixin + Typed Command = Bus-aware typed operations
Single-Use Type + Type-State = Consume-on-transition protocols
Sealed Trait + Typed Command = Closed, sound command set
Sentinel → Option + Validated Boundary = Clean parse-once pipeline
Typestate Builder + Capability Token = Proof-of-complete construction
FromStr + #[non_exhaustive] = Evolvable, fail-fast enum parsing
Const-Generic Size + Validated Boundary = Sized, validated protocol buffers
Safe unsafe Wrapper + Phantom Type = Typed, safe MMIO access
Async Type-State + Capability Token = Authorised async transitions
Session Types + Typed Command = Fully-typed request-response channels
Pin + Type-State = Self-referential state machines that can't move
RAII (Drop) + Type-State = State-dependent cleanup guarantees
Error Hierarchy + Validated Boundary = Typed parse errors with exhaustive handling
#[must_use] + Single-Use Type = Hard-to-ignore, hard-to-reuse tokens
```

### Anti-Patterns to Avoid

| Anti-Pattern | Why It's Wrong | Correct Alternative |
|-------------|---------------|-------------------|
| `fn read_sensor() -> f64` | Unitless — could be °C, °F, or RPM | `fn read_sensor() -> Celsius` |
| `fn encrypt(nonce: &[u8; 12])` | Nonce can be reused (borrow) | `fn encrypt(nonce: Nonce)` (move) |
| `fn admin_op(is_admin: bool)` | Caller can lie (`true`) | `fn admin_op(_: &AdminToken)` |
| `fn send(session: &Session)` | No state guarantee | `fn send(session: &Session<Active>)` |
| `fn process(data: &[u8])` | Not validated | `fn process(data: &ValidFru)` |
| `Clone` on ephemeral keys | Defeats single-use guarantee | Don't derive Clone |
| `let vendor_id: u16 = 0xFFFF` | Sentinel carried internally | `let vendor_id: Option<u16> = None` |
| `fn route(level: &str)` with fallback | Typos silently default | `let level: DiagLevel = s.parse()?` |
| `Builder::new().finish()` without fields | Incomplete object constructed | Typestate builder: `finish()` gated on `Set` |
| `let buf: Vec<u8>` for fixed-size HW buffer | Size only checked at runtime | `RegisterBank<4096>` (const generic) |
| Raw `unsafe { ptr::read(...) }` scattered | UB risk, unauditable | `MmioRegion::read_u32()` safe wrapper |
| `async fn transition(&mut self)` | Mutable borrows don't enforce state | `async fn transition(self) -> NextState` |
| `fn cleanup()` called manually | Forgotten on early return / panic | `impl Drop` — compiler inserts call |
| `fn op() -> Result<T, String>` | Opaque error, no variant matching | `fn op() -> Result<T, DiagError>` enum |

### Mapping to a Diagnostics Codebase

| Module | Applicable Pattern(s) |
|---------------------|----------------------|
| `protocol_lib` | Typed commands, type-state sessions |
| `thermal_diag` | Capability mixins, dimensional types |
| `accel_diag` | Validated boundaries, phantom registers |
| `network_diag` | Type-state (link training), capability tokens |
| `pci_topology` | Phantom types (register width), validated config, sentinel → Option |
| `event_handler` | Single-use audit tokens, capability tokens, FromStr (Component) |
| `event_log` | Validated boundaries (SEL record parsing) |
| `compute_diag` | Dimensional types (temperature, frequency) |
| `memory_diag` | Validated boundaries (SPD data), dimensional types |
| `switch_diag` | Type-state (port enumeration), phantom types |
| `config_loader` | FromStr (DiagLevel, FaultStatus, DiagAction) |
| `log_analyzer` | Validated boundaries (CompiledPatterns) |
| `diag_framework` | Typestate builder (DerBuilder), session types (orchestrator↔worker) |
| `topology_lib` | Const-generic register banks, safe MMIO wrappers |

### Types as Guarantees — Quick Mapping

| Guarantee | Rust Equivalent | Example |
|-----------|----------------|---------|
| "This proof exists" | A type | `AdminToken` |
| "I have the proof" | A value of that type | `let tok = authenticate()?;` |
| "A implies B" | Function `fn(A) -> B` | `fn activate(AdminToken) -> Session<Active>` |
| "Both A and B" | Tuple `(A, B)` or multi-param | `fn op(a: &AdminToken, b: &LinkTrained)` |
| "Either A or B" | `enum { A(A), B(B) }` or `Result<A, B>` | `Result<Session<Active>, Error>` |
| "Always true" | `()` (unit type) | Always constructible |
| "Impossible" | `!` (never type) or `enum Void {}` | Can never be constructed |

---

