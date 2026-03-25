# Putting It All Together — A Complete Diagnostic Platform 🟡

> **What you'll learn:** How all seven core patterns (ch02–ch09) compose into a single diagnostic workflow — authentication, sessions, typed commands, audit tokens, dimensional results, validated data, and phantom-typed registers — with zero total runtime overhead.
>
> **Cross-references:** Every core pattern chapter (ch02–ch09), [ch14](ch14-testing-type-level-guarantees.md) (testing these guarantees)

## Goal

This chapter combines **seven patterns** from chapters 2–9 into a single, realistic
diagnostic workflow. We'll build a server health check that:

1. **Authenticates** (capability token — ch04)
2. **Opens an IPMI session** (type-state — ch05)
3. **Sends typed commands** (typed commands — ch02)
4. **Uses single-use tokens** for audit logging (single-use types — ch03)
5. **Returns dimensional results** (dimensional analysis — ch06)
6. **Validates FRU data** (validated boundaries — ch07)
7. **Reads typed registers** (phantom types — ch09)

```rust,ignore
use std::marker::PhantomData;
use std::io;
// ──── Pattern 1: Dimensional Types (ch06) ────

#[derive(Debug, Clone, Copy, PartialEq, PartialOrd)]
pub struct Celsius(pub f64);

#[derive(Debug, Clone, Copy, PartialEq, PartialOrd)]
pub struct Rpm(pub f64);

#[derive(Debug, Clone, Copy, PartialEq, PartialOrd)]
pub struct Volts(pub f64);

// ──── Pattern 2: Typed Commands (ch02) ────

/// Same trait shape as ch02, using methods (not associated constants)
/// for consistency. Associated constants (`const NETFN: u8`) are an
/// equally valid alternative when the value is truly fixed per type.
pub trait IpmiCmd {
    type Response;
    fn net_fn(&self) -> u8;
    fn cmd_byte(&self) -> u8;
    fn payload(&self) -> Vec<u8>;
    fn parse_response(&self, raw: &[u8]) -> io::Result<Self::Response>;
}

pub struct ReadTemp { pub sensor_id: u8 }
impl IpmiCmd for ReadTemp {
    type Response = Celsius;   // ← dimensional type!
    fn net_fn(&self) -> u8 { 0x04 }
    fn cmd_byte(&self) -> u8 { 0x2D }
    fn payload(&self) -> Vec<u8> { vec![self.sensor_id] }
    fn parse_response(&self, raw: &[u8]) -> io::Result<Celsius> {
        if raw.is_empty() {
            return Err(io::Error::new(io::ErrorKind::InvalidData, "empty"));
        }
        Ok(Celsius(raw[0] as f64))
    }
}

pub struct ReadFanSpeed { pub fan_id: u8 }
impl IpmiCmd for ReadFanSpeed {
    type Response = Rpm;
    fn net_fn(&self) -> u8 { 0x04 }
    fn cmd_byte(&self) -> u8 { 0x2D }
    fn payload(&self) -> Vec<u8> { vec![self.fan_id] }
    fn parse_response(&self, raw: &[u8]) -> io::Result<Rpm> {
        if raw.len() < 2 {
            return Err(io::Error::new(io::ErrorKind::InvalidData, "need 2 bytes"));
        }
        Ok(Rpm(u16::from_le_bytes([raw[0], raw[1]]) as f64))
    }
}

// ──── Pattern 3: Capability Token (ch04) ────

pub struct AdminToken { _private: () }

pub fn authenticate(user: &str, pass: &str) -> Result<AdminToken, &'static str> {
    if user == "admin" && pass == "secret" {
        Ok(AdminToken { _private: () })
    } else {
        Err("authentication failed")
    }
}

// ──── Pattern 4: Type-State Session (ch05) ────

pub struct Idle;
pub struct Active;

pub struct Session<State> {
    host: String,
    _state: PhantomData<State>,
}

impl Session<Idle> {
    pub fn connect(host: &str) -> Self {
        Session { host: host.to_string(), _state: PhantomData }
    }

    pub fn activate(
        self,
        _admin: &AdminToken,  // ← requires capability token
    ) -> Result<Session<Active>, String> {
        println!("Session activated on {}", self.host);
        Ok(Session { host: self.host, _state: PhantomData })
    }
}

impl Session<Active> {
    /// Execute a typed command — only available on Active sessions.
    /// Returns io::Result to propagate transport errors (consistent with ch02).
    pub fn execute<C: IpmiCmd>(&mut self, cmd: &C) -> io::Result<C::Response> {
        let raw_response = self.raw_send(cmd.net_fn(), cmd.cmd_byte(), &cmd.payload())?;
        cmd.parse_response(&raw_response)
    }

    fn raw_send(&self, _nf: u8, _cmd: u8, _data: &[u8]) -> io::Result<Vec<u8>> {
        Ok(vec![42, 0x1E]) // stub: raw IPMI response
    }

    pub fn close(self) { println!("Session closed"); }
}

// ──── Pattern 5: Single-Use Audit Token (ch03) ────

/// Each diagnostic run gets a unique audit token.
/// Not Clone, not Copy — ensures each audit entry is unique.
pub struct AuditToken {
    run_id: u64,
}

impl AuditToken {
    pub fn issue(run_id: u64) -> Self {
        AuditToken { run_id }
    }

    /// Consume the token to write an audit log entry.
    pub fn log(self, message: &str) {
        println!("[AUDIT run_id={}] {}", self.run_id, message);
        // token is consumed — can't log the same run_id twice
    }
}

// ──── Pattern 6: Validated Boundary (ch07) ────
// Simplified from ch07's full ValidFru — only the fields needed for this
// composite example.  See ch07 for the complete TryFrom<RawFruData> version.

pub struct ValidFru {
    pub board_serial: String,
    pub product_name: String,
}

impl ValidFru {
    pub fn parse(raw: &[u8]) -> Result<Self, &'static str> {
        if raw.len() < 8 { return Err("FRU too short"); }
        if raw[0] != 0x01 { return Err("bad FRU version"); }
        Ok(ValidFru {
            board_serial: "SN12345".to_string(),  // stub
            product_name: "ServerX".to_string(),
        })
    }
}

// ──── Pattern 7: Phantom-Typed Registers (ch09) ────

pub struct Width16;
pub struct Reg<W> { offset: u16, _w: PhantomData<W> }

impl Reg<Width16> {
    pub fn read(&self) -> u16 { 0x8086 } // stub
}

pub struct PcieDev {
    pub vendor_id: Reg<Width16>,
    pub device_id: Reg<Width16>,
}

impl PcieDev {
    pub fn new() -> Self {
        PcieDev {
            vendor_id: Reg { offset: 0x00, _w: PhantomData },
            device_id: Reg { offset: 0x02, _w: PhantomData },
        }
    }
}

// ──── Composite Workflow ────

fn full_diagnostic() -> Result<(), String> {
    // 1. Authenticate → get capability token
    let admin = authenticate("admin", "secret")
        .map_err(|e| e.to_string())?;

    // 2. Connect and activate session (type-state: Idle → Active)
    let session = Session::connect("192.168.1.100");
    let mut session = session.activate(&admin)?;  // requires AdminToken

    // 3. Send typed commands (response type matches command)
    let temp: Celsius = session.execute(&ReadTemp { sensor_id: 0 })
        .map_err(|e| e.to_string())?;
    let fan: Rpm = session.execute(&ReadFanSpeed { fan_id: 1 })
        .map_err(|e| e.to_string())?;

    // Type mismatch would be caught:
    // let wrong: Volts = session.execute(&ReadTemp { sensor_id: 0 })?;
    //  ❌ ERROR: expected Celsius, found Volts

    // 4. Read phantom-typed PCIe registers
    let pcie = PcieDev::new();
    let vid: u16 = pcie.vendor_id.read();  // guaranteed u16

    // 5. Validate FRU data at the boundary
    let raw_fru = vec![0x01, 0x00, 0x00, 0x01, 0x01, 0x00, 0x00, 0xFD];
    let fru = ValidFru::parse(&raw_fru)
        .map_err(|e| e.to_string())?;

    // 6. Issue single-use audit token
    let audit = AuditToken::issue(1001);

    // 7. Generate report (all data is typed and validated)
    let report = format!(
        "Server: {} (SN: {}), VID: 0x{:04X}, CPU: {:?}, Fan: {:?}",
        fru.product_name, fru.board_serial, vid, temp, fan,
    );

    // 8. Consume audit token — can't log twice
    audit.log(&report);
    // audit.log("oops");  // ❌ use of moved value

    // 9. Close session (type-state: Active → dropped)
    session.close();

    Ok(())
}
```

### What the Compiler Proves

| Bug class | How it's prevented | Pattern |
|-----------|-------------------|---------|
| Unauthenticated access | `activate()` requires `&AdminToken` | Capability token |
| Command in wrong session state | `execute()` only exists on `Session<Active>` | Type-state |
| Wrong response type | `ReadTemp::Response = Celsius`, fixed by trait | Typed commands |
| Unit confusion (°C vs RPM) | `Celsius` ≠ `Rpm` ≠ `Volts` | Dimensional types |
| Register width mismatch | `Reg<Width16>` returns `u16` | Phantom types |
| Processing unvalidated data | Must call `ValidFru::parse()` first | Validated boundary |
| Duplicate audit entries | `AuditToken` is consumed on log | Single-use type |
| Out-of-order power sequencing | Each step requires previous token | Capability tokens (ch04) |

**Total runtime overhead of ALL these guarantees: zero.**

Every check happens at compile time. The generated assembly is identical to
hand-written C code with no checks at all — but **C can have bugs, this can't**.

## Key Takeaways

1. **Seven patterns compose seamlessly** — capability tokens, type-state, typed commands, single-use types, dimensional types, validated boundaries, and phantom types all work together.
2. **The compiler proves eight bug classes impossible** — see the "What the Compiler Proves" table above.
3. **Zero total runtime overhead** — the generated assembly is identical to unchecked C code.
4. **Each pattern is independently useful** — you don't need all seven; adopt them incrementally.
5. **The integration chapter is a design template** — use it as a starting point for your own typed diagnostic workflows.
6. **From IPMI to Redfish at scale** — ch17 and ch18 apply these same seven patterns (plus capability mixins from ch08) to a full Redfish client and server. The IPMI workflow here is the foundation; the Redfish walkthroughs show how the composition scales to production systems with multiple data sources and schema-version constraints.

---

