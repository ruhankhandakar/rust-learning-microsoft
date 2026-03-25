# The Philosophy — Why Types Beat Tests 🟢

> **What you'll learn:** The three levels of compile-time correctness (value, state, protocol), how generic function signatures act as compiler-checked guarantees, and when correct-by-construction patterns are — and aren't — worth the investment.
>
> **Cross-references:** [ch02](ch02-typed-command-interfaces-request-determi.md) (typed commands), [ch05](ch05-protocol-state-machines-type-state-for-r.md) (type-state), [ch13](ch13-reference-card.md) (reference card)

## The Cost of Runtime Checking

Consider a typical runtime guard in a diagnostics codebase:

```rust,ignore
fn read_sensor(sensor_type: &str, raw: &[u8]) -> f64 {
    match sensor_type {
        "temperature" => raw[0] as i8 as f64,          // signed byte
        "fan_speed"   => u16::from_le_bytes([raw[0], raw[1]]) as f64,
        "voltage"     => u16::from_le_bytes([raw[0], raw[1]]) as f64 / 1000.0,
        _             => panic!("unknown sensor type: {sensor_type}"),
    }
}
```

This function has **four failure modes** the compiler cannot catch:

1. Typo: `"temperture"` → panic at runtime
2. Wrong `raw` length: `fan_speed` with 1 byte → panic at runtime
3. Caller uses the returned `f64` as RPM when it's actually °C → logic bug, silent
4. New sensor type added but this `match` not updated → panic at runtime

Every failure mode is discovered **after deployment**. Tests help, but they only cover the cases someone thought to write. The type system covers **all** cases, including ones nobody imagined.

## Three Levels of Correctness

### Level 1 — Value Correctness
**Make invalid values unrepresentable.**

```rust,ignore
// ❌ Any u16 can be a "port" — 0 is invalid but compiles
fn connect(port: u16) { /* ... */ }

// ✅ Only validated ports can exist
pub struct Port(u16);  // private field

impl TryFrom<u16> for Port {
    type Error = &'static str;
    fn try_from(v: u16) -> Result<Self, Self::Error> {
        if v > 0 { Ok(Port(v)) } else { Err("port must be > 0") }
    }
}

fn connect(port: Port) { /* ... */ }
// Port(0) can never be constructed — invariant holds everywhere
```

**Hardware example:** `SensorId(u8)` — wraps a raw sensor number with validation that it's in the SDR range.

### Level 2 — State Correctness
**Make invalid transitions unrepresentable.**

```rust,ignore
use std::marker::PhantomData;

struct Disconnected;
struct Connected;

struct Socket<State> {
    fd: i32,
    _state: PhantomData<State>,
}

impl Socket<Disconnected> {
    fn connect(self, addr: &str) -> Socket<Connected> {
        // ... connect logic ...
        Socket { fd: self.fd, _state: PhantomData }
    }
}

impl Socket<Connected> {
    fn send(&mut self, data: &[u8]) { /* ... */ }
    fn disconnect(self) -> Socket<Disconnected> {
        Socket { fd: self.fd, _state: PhantomData }
    }
}

// Socket<Disconnected> has no send() method — compile error if you try
```

**Hardware example:** GPIO pin modes — `Pin<Input>` has `read()` but not `write()`.

### Level 3 — Protocol Correctness
**Make invalid interactions unrepresentable.**

```rust,ignore
use std::io;

trait IpmiCmd {
    type Response;
    fn parse_response(&self, raw: &[u8]) -> io::Result<Self::Response>;
}

// Simplified for illustration — see ch02 for the full trait with
// net_fn(), cmd_byte(), payload(), and parse_response().

struct ReadTemp { sensor_id: u8 }
impl IpmiCmd for ReadTemp {
    type Response = Celsius;
    fn parse_response(&self, raw: &[u8]) -> io::Result<Celsius> {
        Ok(Celsius(raw[0] as i8 as f64))
    }
}

# #[derive(Debug)] struct Celsius(f64);

fn execute<C: IpmiCmd>(cmd: &C, raw: &[u8]) -> io::Result<C::Response> {
    cmd.parse_response(raw)
}
// ReadTemp always returns Celsius — can't accidentally get Rpm
```

**Hardware example:** IPMI, Redfish, NVMe Admin commands — the request type determines the response type.

## Types as Compiler-Checked Guarantees

When you write:

```rust,ignore
fn execute<C: IpmiCmd>(cmd: &C) -> io::Result<C::Response>
```

You're not just writing a function — you're stating a **guarantee**: "for any command type `C` that implements `IpmiCmd`, executing it produces exactly `C::Response`." The compiler **verifies** this guarantee every time it builds your code. If the types don't line up, the program won't compile.

This is why Rust's type system is so powerful — it's not just catching mistakes, it's **enforcing correctness at compile time**.

## When NOT to Use These Patterns

Correct-by-construction is not always the right choice:

| Situation | Recommendation |
|-----------|---------------|
| Safety-critical boundary (power sequencing, crypto) | ✅ Always — a bug here melts hardware or leaks secrets |
| Cross-module public API | ✅ Usually — misuse should be a compile error |
| State machine with 3+ states | ✅ Usually — type-state prevents wrong transitions |
| Internal helper within one 50-line function | ❌ Overkill — a simple `assert!` suffices |
| Prototyping / exploring unknown hardware | ❌ Raw types first — refine after behaviour is understood |
| User-facing CLI parsing | ⚠️ `clap` + `TryFrom` at the boundary, raw types inside is fine |

The key question: **"If this bug happens in production, how bad is it?"**

- Fan stops → GPU melts → **use types**
- Wrong DER record → customer gets bad data → **use types**
- Debug log message slightly wrong → **use `assert!`**

## Key Takeaways

1. **Three levels of correctness** — value (newtypes), state (type-state), protocol (associated types) — each eliminates a broader class of bugs.
2. **Types as guarantees** — every generic function signature is a contract the compiler checks on each build.
3. **The cost question** — "if this bug ships, how bad is it?" determines whether types or tests are the right tool.
4. **Types complement tests** — they eliminate entire *categories*; tests cover specific *values* and edge cases.
5. **Know when to stop** — internal helpers and throwaway prototypes rarely need type-level enforcement.

---

