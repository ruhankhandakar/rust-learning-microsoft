# Fourteen Tricks from the Trenches 🟡

> **What you'll learn:** Fourteen smaller correct-by-construction techniques — from sentinel elimination and sealed traits to session types, `Pin`, RAII, and `#[must_use]` — each eliminating a specific bug class for near-zero effort.
>
> **Cross-references:** [ch02](ch02-typed-command-interfaces-request-determi.md) (sealed traits extend ch02), [ch05](ch05-protocol-state-machines-type-state-for-r.md) (typestate builder extends ch05), [ch07](ch07-validated-boundaries-parse-dont-validate.md) (FromStr extends ch07)

## Fourteen Tricks from the Trenches

The eight core patterns (ch02–ch09) cover the major correct-by-construction
techniques. This chapter collects fourteen **smaller but high-value tricks** that
show up repeatedly in production Rust code — each one eliminates a specific
class of bug for zero or near-zero effort.

### Trick 1 — Sentinel → `Option` at the Boundary

Hardware protocols are full of sentinel values: IPMI uses `0xFF` for
"sensor not present," PCI uses `0xFFFF` for "no device," and SMBIOS uses
`0x00` for "unknown." If you carry these sentinels through your code as
plain integers, every consumer must remember to check for the magic value.
If even one comparison forgets, you get a phantom 255 °C reading or a
spurious vendor-ID match.

**The rule:** Convert sentinels to `Option` at the very first parse boundary,
and convert *back* to the sentinel only at the serialization boundary.

#### The anti-pattern (from `pcie_tree/src/lspci.rs`)

```rust,ignore
// Sentinel carried internally — every comparison must remember
let mut current_vendor_id: u16 = 0xFFFF;
let mut current_device_id: u16 = 0xFFFF;

// ... later, parsing fails silently ...
current_vendor_id = u16::from_str_radix(hex, 16)
    .unwrap_or(0xFFFF);  // sentinel hides the error
```

Every function that receives `current_vendor_id` must know that `0xFFFF` is
special. If someone writes `if vendor_id == target_id` without checking
for `0xFFFF` first, a missing device silently matches when the target also
happens to be parsed from bad input as `0xFFFF`.

#### The correct pattern (from `nic_sel/src/events.rs`)

```rust,ignore
pub struct ThermalEvent {
    pub record_id: u16,
    pub temperature: Option<u8>,  // None if sensor reports 0xFF
}

impl ThermalEvent {
    pub fn from_raw(record_id: u16, raw_temp: u8) -> Self {
        ThermalEvent {
            record_id,
            temperature: if raw_temp != 0xFF {
                Some(raw_temp)
            } else {
                None
            },
        }
    }
}
```

Now every consumer *must* handle the `None` case — the compiler forces it:

```rust,ignore
// Safe — compiler ensures we handle missing temps
fn is_overtemp(temp: Option<u8>, threshold: u8) -> bool {
    temp.map_or(false, |t| t > threshold)
}

// Forgetting to handle None is a compile error:
// fn bad_check(temp: Option<u8>, threshold: u8) -> bool {
//     temp > threshold  // ERROR: can't compare Option<u8> with u8
// }
```

#### Real-world impact

`inventory/src/events.rs` uses the same pattern for GPU thermal alerts:
```rust,ignore
temperature: if data[1] != 0xFF {
    Some(data[1] as i8)
} else {
    None
},
```

The refactoring for `pcie_tree/src/lspci.rs` is straightforward: change
`current_vendor_id: u16` to `current_vendor_id: Option<u16>`, replace
`0xFFFF` with `None`, and let the compiler find every site that needs
updating.

| Before | After |
|--------|-------|
| `let mut vendor_id: u16 = 0xFFFF` | `let mut vendor_id: Option<u16> = None` |
| `.unwrap_or(0xFFFF)` | `.ok()` (already returns `Option`) |
| `if vendor_id != 0xFFFF { ... }` | `if let Some(vid) = vendor_id { ... }` |
| Serialization: `vendor_id` | `vendor_id.unwrap_or(0xFFFF)` |

***

### Trick 2 — Sealed Traits

Chapter 2 introduced `IpmiCmd` with an associated type that binds each command
to its response. But there's a loophole: if *any* code can implement `IpmiCmd`,
someone could write a `MaliciousCmd` whose `parse_response` returns the wrong
type or panics. The type safety of the entire system rests on every
implementation being correct.

A **sealed trait** closes this loophole. The idea is simple: make the trait
require a *private* supertrait that only your crate can implement.

```rust,ignore
// — Private module: not exported from the crate —
mod private {
    pub trait Sealed {}
}

// — Public trait: requires Sealed, which outsiders can't implement —
pub trait IpmiCmd: private::Sealed {
    type Response;
    fn net_fn(&self) -> u8;
    fn cmd_byte(&self) -> u8;
    fn payload(&self) -> Vec<u8>;
    fn parse_response(&self, raw: &[u8]) -> io::Result<Self::Response>;
}
```

Inside your crate, you implement `Sealed` for each approved command type:

```rust,ignore
pub struct ReadTemp { pub sensor_id: u8 }
impl private::Sealed for ReadTemp {}

impl IpmiCmd for ReadTemp {
    type Response = Celsius;
    fn net_fn(&self) -> u8 { 0x04 }
    fn cmd_byte(&self) -> u8 { 0x2D }
    fn payload(&self) -> Vec<u8> { vec![self.sensor_id] }
    fn parse_response(&self, raw: &[u8]) -> io::Result<Celsius> {
        if raw.is_empty() { return Err(io::Error::new(io::ErrorKind::InvalidData, "empty")); }
        Ok(Celsius(raw[0] as f64))
    }
}
```

External code sees `IpmiCmd` and can call `execute()`, but cannot implement it:

```rust,ignore
// In another crate:
struct EvilCmd;
// impl private::Sealed for EvilCmd {}  // ERROR: module `private` is private
// impl IpmiCmd for EvilCmd { ... }     // ERROR: `Sealed` is not satisfied
```

#### When to seal

| Seal when… | Don't seal when… |
|-----------|-----------------|
| Safety depends on correct implementation (IpmiCmd, DiagModule) | Users should extend the system (custom report formatters) |
| Associated types must satisfy invariants | The trait is a simple capability marker (HasIpmi) |
| You own the canonical set of implementations | Third-party plugins are a design goal |

#### Real-world candidates

- `IpmiCmd` — incorrect parse could corrupt typed responses
- `DiagModule` — framework assumes `run()` returns valid DER records
- `SelEventFilter` — broken filter could swallow critical SEL events

***

### Trick 3 — `#[non_exhaustive]` for Evolving Enums

`SkuVariant` in `inventory/src/types.rs` today has five variants:

```rust,ignore
pub enum SkuVariant {
    S1001, S2001, S2002, S2003, S3001,
}
```

When the next generation ships and you add `S4001`, any external code that
matches on `SkuVariant` and doesn't have a wildcard arm will **silently fail
to compile** — which is the whole point. But what about internal code? Without
`#[non_exhaustive]`, your `match` in the *same crate* compiles without a
wildcard, and adding the new variant breaks your own build.

Marking the enum `#[non_exhaustive]` forces **external crates** that match on
it to include a wildcard arm. Within the defining crate, `#[non_exhaustive]`
has no effect — you can still write exhaustive matches.

**Why this is useful:** When you publish `SkuVariant` from a library crate
(or a shared sub-crate in a workspace), downstream code is forced to handle
unknown future variants. When you add `S4001` next generation, downstream
code already compiles — they have a wildcard arm.

```rust,ignore
// In gpu_sel crate (the defining crate):
#[non_exhaustive]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum SkuVariant {
    S1001,
    S2001,
    S2002,
    S2003,
    S3001,
    // When the next SKU ships, add it here.
    // External consumers already have a wildcard — zero breakage for them.
}

// Within gpu_sel itself — exhaustive match is allowed (no wildcard needed):
fn diag_path_internal(sku: SkuVariant) -> &'static str {
    match sku {
        SkuVariant::S1001 => "legacy_gen1",
        SkuVariant::S2001 => "gen2_accel_diag",
        SkuVariant::S2002 => "gen2_alt_diag",
        SkuVariant::S2003 => "gen2_alt_hf_diag",
        SkuVariant::S3001 => "gen3_accel_diag",
        // No wildcard needed inside the defining crate.
        // Adding S4001 here will cause a compile error at this match,
        // which is exactly what you want — it forces you to update it.
    }
}
```

```rust,ignore
// In the binary crate (a downstream crate that depends on inventory):
fn diag_path_external(sku: inventory::SkuVariant) -> &'static str {
    match sku {
        inventory::SkuVariant::S1001 => "legacy_gen1",
        inventory::SkuVariant::S2001 => "gen2_accel_diag",
        inventory::SkuVariant::S2002 => "gen2_alt_diag",
        inventory::SkuVariant::S2003 => "gen2_alt_hf_diag",
        inventory::SkuVariant::S3001 => "gen3_accel_diag",
        _ => "generic_diag",  // REQUIRED by #[non_exhaustive] for external crates
    }
}
```

> **Workspace tip:** If all your code is in a single crate, `#[non_exhaustive]`
> won't help — it only affects cross-crate boundaries. For the project's
> large workspace, place evolving enums in a shared crate (`core_lib` or
> `inventory`) so the attribute protects consumers in other workspace crates.

#### Candidates

| Enum | Module | Why |
|------|--------|-----|
| `SkuVariant` | `inventory`, `net_inventory` | New SKUs every generation |
| `SensorType` | `protocol_lib` | IPMI spec reserves 0xC0–0xFF for OEM |
| `CompletionCode` | `protocol_lib` | Custom BMC vendors add codes |
| `Component` | `event_handler` | New hardware categories (NewSoC was recently added) |

***

### Trick 4 — Typestate Builder

Chapter 5 showed type-state for *protocols* (session lifecycles, link training).
The same idea applies to *builders* — structs whose `build()` / `finish()`
can only be called when all required fields have been set.

#### The problem with fluent builders

`DerBuilder` in `diag_framework/src/der.rs` today looks like this (simplified):

```rust,ignore
// Current fluent builder — finish() always available
pub struct DerBuilder {
    der: Der,
}

impl DerBuilder {
    pub fn new(marker: &str, fault_code: u32) -> Self { ... }
    pub fn mnemonic(mut self, m: &str) -> Self { ... }
    pub fn fault_class(mut self, fc: &str) -> Self { ... }
    pub fn finish(self) -> Der { self.der }  // ← always callable!
}
```

This compiles without error, but produces an incomplete DER record:

```rust,ignore
let bad = DerBuilder::new("CSI_ERR", 62691)
    .finish();  // oops — no mnemonic, no fault_class
```

#### Typestate builder: `finish()` requires both fields

```rust,ignore
pub struct Missing;
pub struct Set<T>(T);

pub struct DerBuilder<Mnemonic, FaultClass> {
    marker: String,
    fault_code: u32,
    mnemonic: Mnemonic,
    fault_class: FaultClass,
    description: Option<String>,
}

// Constructor: starts with both required fields Missing
impl DerBuilder<Missing, Missing> {
    pub fn new(marker: &str, fault_code: u32) -> Self {
        DerBuilder {
            marker: marker.to_string(),
            fault_code,
            mnemonic: Missing,
            fault_class: Missing,
            description: None,
        }
    }
}

// Set mnemonic (works regardless of fault_class's state)
impl<FC> DerBuilder<Missing, FC> {
    pub fn mnemonic(self, m: &str) -> DerBuilder<Set<String>, FC> {
        DerBuilder {
            marker: self.marker, fault_code: self.fault_code,
            mnemonic: Set(m.to_string()),
            fault_class: self.fault_class,
            description: self.description,
        }
    }
}

// Set fault_class (works regardless of mnemonic's state)
impl<MN> DerBuilder<MN, Missing> {
    pub fn fault_class(self, fc: &str) -> DerBuilder<MN, Set<String>> {
        DerBuilder {
            marker: self.marker, fault_code: self.fault_code,
            mnemonic: self.mnemonic,
            fault_class: Set(fc.to_string()),
            description: self.description,
        }
    }
}

// Optional fields — available in ANY state
impl<MN, FC> DerBuilder<MN, FC> {
    pub fn description(mut self, desc: &str) -> Self {
        self.description = Some(desc.to_string());
        self
    }
}

/// The fully-built DER record.
pub struct Der {
    pub marker: String,
    pub fault_code: u32,
    pub mnemonic: String,
    pub fault_class: String,
    pub description: Option<String>,
}

// finish() ONLY available when both required fields are Set
impl DerBuilder<Set<String>, Set<String>> {
    pub fn finish(self) -> Der {
        Der {
            marker: self.marker,
            fault_code: self.fault_code,
            mnemonic: self.mnemonic.0,
            fault_class: self.fault_class.0,
            description: self.description,
        }
    }
}
```

Now the buggy call is a compile error:

```rust,ignore
// ✅ Compiles — both required fields set (in any order)
let der = DerBuilder::new("CSI_ERR", 62691)
    .fault_class("GPU Module")   // order doesn't matter
    .mnemonic("ACCEL_CARD_ER691")
    .description("Thermal throttle")
    .finish();

// ❌ Compile error — finish() doesn't exist on DerBuilder<Set<String>, Missing>
let bad = DerBuilder::new("CSI_ERR", 62691)
    .mnemonic("ACCEL_CARD_ER691")
    .finish();  // ERROR: method `finish` not found
```

#### When to use typestate builders

| Use when… | Don't bother when… |
|-----------|-------------------|
| Omitting a field causes silent bugs (DER missing mnemonic) | All fields have sensible defaults |
| The builder is part of a public API | The builder is test-only scaffolding |
| More than 2–3 required fields | Single required field (just take it in `new()`) |

***

### Trick 5 — `FromStr` as a Validation Boundary

Chapter 7 showed `TryFrom<&[u8]>` for binary data (FRU records, SEL entries).
For **string** inputs — config files, CLI arguments, JSON fields — the
analogous boundary is `FromStr`.

#### The problem

```rust,ignore
// C++ / unvalidated Rust: silently falls through to a default
fn route_diag(level: &str) -> DiagMode {
    if level == "quick" { ... }
    else if level == "standard" { ... }
    else { QuickMode }  // typo in config?  ¯\_(ツ)_/¯
}
```

A config file with `"diag_level": "extendedd"` (typo) silently gets `QuickMode`.

#### The pattern (from `config_loader/src/diag.rs`)

```rust,ignore
use std::str::FromStr;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum DiagLevel {
    Quick,
    Standard,
    Extended,
    Stress,
}

impl FromStr for DiagLevel {
    type Err = String;
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_lowercase().as_str() {
            "quick"    | "1" => Ok(DiagLevel::Quick),
            "standard" | "2" => Ok(DiagLevel::Standard),
            "extended" | "3" => Ok(DiagLevel::Extended),
            "stress"   | "4" => Ok(DiagLevel::Stress),
            other => Err(format!("unknown diag level: '{other}'")),
        }
    }
}
```

Now a typo is caught immediately:

```rust,ignore
let level: DiagLevel = "extendedd".parse()?;
// Err("unknown diag level: 'extendedd'")
```

#### The three benefits

1. **Fail-fast:** Bad input is caught at the parsing boundary, not three
   layers deep in diagnostic logic.
2. **Aliases are explicit:** `"MEM"`, `"DIMM"`, and `"MEMORY"` all map to
   `Component::Memory` — the match arms document the mapping.
3. **`.parse()` is ergonomic:** Because `FromStr` integrates with `str::parse()`,
   you get clean one-liners: `let level: DiagLevel = config["level"].parse()?;`

#### Real codebase usage

The project already has 8 `FromStr` implementations:

| Type | Module | Notable aliases |
|------|--------|----------------|
| `DiagLevel` | `config_loader` | `"1"` = Quick, `"4"` = Stress |
| `Component` | `event_handler` | `"MEM"` / `"DIMM"` = Memory, `"SSD"` / `"NVME"` = Disk |
| `SkuVariant` | `net_inventory` | `"Accel-X1"` = S2001, `"Accel-M1"` = S2002, `"Accel-Z1"` = S3001 |
| `SkuVariant` | `inventory` | Same aliases (separate module, same pattern) |
| `FaultStatus` | `config_loader` | Fault lifecycle states |
| `DiagAction` | `config_loader` | Remediation action types |
| `ActionType` | `config_loader` | Action categories |
| `DiagMode` | `cluster_diag` | Multi-node test modes |

The contrast with `TryFrom`:

| | `TryFrom<&[u8]>` | `FromStr` |
|---|---|---|
| Input | Raw bytes (binary protocols) | Strings (configs, CLI, JSON) |
| Typical source | IPMI, PCIe config space, FRU | JSON fields, env vars, user input |
| Chapter | ch07 | ch11 |
| Both use | `Result` — forcing the caller to handle invalid input |

***

### Trick 6 — Const Generics for Compile-Time Size Validation

When hardware buffers, register banks, or protocol frames have fixed sizes,
const generics let the compiler enforce them:

```rust,ignore
/// A fixed-size register bank. The size is part of the type.
/// `RegisterBank<256>` and `RegisterBank<4096>` are different types.
pub struct RegisterBank<const N: usize> {
    data: [u8; N],
}

impl<const N: usize> RegisterBank<N> {
    /// Read a register at the given offset.
    /// Compile-time: N is known, so the array size is fixed.
    /// Runtime: only the offset is checked.
    pub fn read(&self, offset: usize) -> Option<u8> {
        self.data.get(offset).copied()
    }
}

// PCIe conventional config space: 256 bytes
type PciConfigSpace = RegisterBank<256>;

// PCIe extended config space: 4096 bytes
type PcieExtConfigSpace = RegisterBank<4096>;

// These are different types — can't accidentally pass one for the other:
fn read_extended_cap(config: &PcieExtConfigSpace, offset: usize) -> Option<u8> {
    config.read(offset)
}
// read_extended_cap(&pci_config, 0x100);
//                   ^^^^^^^^^^^ expected RegisterBank<4096>, found RegisterBank<256> ❌
```

**Compile-time assertions with const generics:**

```rust,ignore
/// NVMe admin commands use 4096-byte buffers. Enforce at compile time.
pub struct NvmeBuffer<const N: usize> {
    data: Box<[u8; N]>,
}

impl<const N: usize> NvmeBuffer<N> {
    pub fn new() -> Self {
        // Runtime assertion: only 512 or 4096 allowed
        assert!(N == 4096 || N == 512, "NVMe buffers must be 512 or 4096 bytes");
        NvmeBuffer { data: Box::new([0u8; N]) }
    }
}
// NvmeBuffer::<1024>::new();  // panics at runtime with this form
// For true compile-time enforcement, see Trick 9 (const assertions).
```

> **When to use:** Fixed-size protocol buffers (NVMe, PCIe config space),
> DMA descriptors, hardware FIFO depths. Anywhere the size is a hardware
> constant that should never vary at runtime.

***

### Trick 7 — Safe Wrappers Around `unsafe`

The project currently has zero `unsafe` blocks. But when you
add MMIO register access, DMA, or FFI to accel-mgmt/accel-query, you'll need
`unsafe`. The correct-by-construction approach: **wrap every `unsafe` block
in a safe abstraction** so the unsafety is contained and auditable.

```rust,ignore
/// MMIO-mapped register. The pointer is valid for the lifetime of the mapping.
/// All unsafe is contained in this module — callers use safe methods.
pub struct MmioRegion {
    base: *mut u8,
    len: usize,
}

impl MmioRegion {
    /// # Safety
    /// - `base` must be a valid pointer to an MMIO-mapped region
    /// - The region must remain mapped for the lifetime of this struct
    /// - No other code may alias this region
    pub unsafe fn new(base: *mut u8, len: usize) -> Self {
        MmioRegion { base, len }
    }

    /// Safe read — bounds checking prevents out-of-bounds MMIO access.
    pub fn read_u32(&self, offset: usize) -> Option<u32> {
        if offset + 4 > self.len { return None; }
        // SAFETY: offset is bounds-checked above, base is valid per new() contract
        Some(unsafe {
            core::ptr::read_volatile(self.base.add(offset) as *const u32)
        })
    }

    /// Safe write — bounds checking prevents out-of-bounds MMIO access.
    pub fn write_u32(&self, offset: usize, value: u32) -> bool {
        if offset + 4 > self.len { return false; }
        // SAFETY: offset is bounds-checked above, base is valid per new() contract
        unsafe {
            core::ptr::write_volatile(self.base.add(offset) as *mut u32, value);
        }
        true
    }
}
```

**Combine with phantom types (ch09) for typed MMIO:**

```rust,ignore
use std::marker::PhantomData;

pub struct ReadOnly;
pub struct ReadWrite;

pub struct TypedMmio<Perm> {
    region: MmioRegion,
    _perm: PhantomData<Perm>,
}

impl TypedMmio<ReadOnly> {
    pub fn read_u32(&self, offset: usize) -> Option<u32> {
        self.region.read_u32(offset)
    }
    // No write method — compile error if you try to write to a ReadOnly region
}

impl TypedMmio<ReadWrite> {
    pub fn read_u32(&self, offset: usize) -> Option<u32> {
        self.region.read_u32(offset)
    }
    pub fn write_u32(&self, offset: usize, value: u32) -> bool {
        self.region.write_u32(offset, value)
    }
}
```

> **Guidelines for `unsafe` wrappers:**
>
> | Rule | Why |
> |------|-----|
> | One `unsafe fn new()` with documented `# Safety` invariants | Caller takes responsibility once |
> | All other methods are safe | Callers can't trigger UB |
> | `# SAFETY:` comment on every `unsafe` block | Auditors can verify locally |
> | Wrap in a module with `#[deny(unsafe_op_in_unsafe_fn)]` | Even inside `unsafe fn`, individual ops need `unsafe` |
> | Run `cargo +nightly miri test` on the wrapper | Verify memory model compliance |

---

### ✅ Checkpoint: Tricks 1–7

You now have seven everyday tricks. Here's a quick scorecard:

| Trick | Bug class eliminated | Effort to adopt |
|:-----:|----------------------|:---------------:|
| 1 | Sentinel confusion (0xFF) | Low — one `match` at the boundary |
| 2 | Unauthorized trait impls | Low — add `Sealed` supertrait |
| 3 | Broken consumers after enum growth | Low — one-line attribute |
| 4 | Missing builder fields | Medium — extra type parameters |
| 5 | Typos in string-typed config | Low — `impl FromStr` |
| 6 | Wrong buffer sizes | Low — const generic parameter |
| 7 | Unsafe scattered across codebase | Medium — wrapper module |

Tricks 8–14 are **more advanced** — they touch async, const evaluation, session
types, `Pin`, and `Drop`. Take a break here if you need one; the techniques
above are already high-value, low-effort wins you can adopt tomorrow.

***

### Trick 8 — Async Type-State Machines

When hardware drivers use `async` (e.g., async BMC communication, async NVMe
I/O), type-state still works — but ownership across `.await` points needs care:

```rust,ignore
use std::marker::PhantomData;

pub struct Idle;
pub struct Authenticating;
pub struct Active;

pub struct AsyncSession<S> {
    host: String,
    _state: PhantomData<S>,
}

impl AsyncSession<Idle> {
    pub fn new(host: &str) -> Self {
        AsyncSession { host: host.to_string(), _state: PhantomData }
    }

    /// Transition Idle → Authenticating → Active.
    /// The Session is consumed (moved into the future) across the .await.
    pub async fn authenticate(self, user: &str, pass: &str)
        -> Result<AsyncSession<Active>, String>
    {
        // Phase 1: send credentials (consumes Idle session)
        let pending: AsyncSession<Authenticating> = AsyncSession {
            host: self.host,
            _state: PhantomData,
        };

        // Simulate async BMC authentication
        // tokio::time::sleep(Duration::from_secs(1)).await;

        // Phase 2: return Active session
        Ok(AsyncSession {
            host: pending.host,
            _state: PhantomData,
        })
    }
}

impl AsyncSession<Active> {
    pub async fn send_command(&mut self, cmd: &[u8]) -> Vec<u8> {
        // async I/O here...
        vec![0x00]
    }
}

// Usage:
// let session = AsyncSession::new("192.168.1.100");
// let mut session = session.authenticate("admin", "pass").await?;
// let resp = session.send_command(&[0x04, 0x2D]).await;
```

**Key rules for async type-state:**

| Rule | Why |
|------|-----|
| Transition methods take `self` (by value), not `&mut self` | Ownership transfer works across `.await` |
| Return `Result<NextState, (Error, PrevState)>` for recoverable errors | Caller can retry from the previous state |
| Don't split state across multiple futures | One future owns one session |
| Use `Send + 'static` bounds if using tokio::spawn | The session must be movable across threads |

> **Caveat:** If you need the *previous* state back on error (to retry),
> return `Result<AsyncSession<Active>, (Error, AsyncSession<Idle>)>` so
> the caller gets ownership back. Without this, a failed `.await` drops the
> session permanently.

***

### Trick 9 — Refinement Types via Const Assertions

When a numeric constraint is a compile-time invariant (not runtime data),
use `const` evaluation to enforce it. This differs from Trick 6 (which
provides type-level size distinctions) — here we *reject invalid values*
at compile time:

```rust,ignore
/// A sensor ID that must be in the IPMI SDR range (0x01..=0xFE).
/// The constraint is checked at compile time when `N` is const.
pub struct SdrSensorId<const N: u8>;

impl<const N: u8> SdrSensorId<N> {
    /// Compile-time validation: panics during compilation if N is out of range.
    pub const fn validate() {
        assert!(N >= 0x01, "Sensor ID must be >= 0x01");
        assert!(N <= 0xFE, "Sensor ID must be <= 0xFE (0xFF is reserved)");
    }

    pub const VALIDATED: () = Self::validate();

    pub const fn value() -> u8 { N }
}

// Usage:
fn read_sensor_const<const N: u8>() -> f64 {
    let _ = SdrSensorId::<N>::VALIDATED;  // compile-time check
    // read sensor N...
    42.0
}

// read_sensor_const::<0x20>();   // ✅ compiles — 0x20 is valid
// read_sensor_const::<0x00>();   // ❌ compile error — "Sensor ID must be >= 0x01"
// read_sensor_const::<0xFF>();   // ❌ compile error — 0xFF is reserved
```

**Simpler form — bounded fan IDs:**

```rust,ignore
pub struct BoundedFanId<const N: u8>;

impl<const N: u8> BoundedFanId<N> {
    pub const VALIDATED: () = assert!(N < 8, "Server has at most 8 fans (0..7)");

    pub const fn id() -> u8 {
        let _ = Self::VALIDATED;
        N
    }
}

// BoundedFanId::<3>::id();   // ✅
// BoundedFanId::<10>::id();  // ❌ compile error
```

> **When to use:** Hardware-defined fixed IDs (sensor IDs, fan slots, PCIe
> slot numbers) known at compile time. When the value comes from runtime data
> (config file, user input), use `TryFrom` / `FromStr` (ch07, Trick 5) instead.

***

### Trick 10 — Session Types for Channel Communication

When two components communicate over a channel (e.g., diagnostic orchestrator ↔
worker thread), **session types** encode the protocol in the type system:

```rust,ignore
use std::marker::PhantomData;

// Protocol: Client sends Request, Server sends Response, then done.
pub struct SendRequest;
pub struct RecvResponse;
pub struct Done;

/// A typed channel endpoint. `S` is the current protocol state.
pub struct Chan<S> {
    // In real code: wraps a mpsc::Sender/Receiver pair
    _state: PhantomData<S>,
}

impl Chan<SendRequest> {
    /// Send a request — transitions to RecvResponse state.
    pub fn send(self, request: DiagRequest) -> Chan<RecvResponse> {
        // ... send on channel ...
        Chan { _state: PhantomData }
    }
}

impl Chan<RecvResponse> {
    /// Receive a response — transitions to Done state.
    pub fn recv(self) -> (DiagResponse, Chan<Done>) {
        // ... recv from channel ...
        (DiagResponse { passed: true }, Chan { _state: PhantomData })
    }
}

impl Chan<Done> {
    /// Closing the channel — only possible when the protocol is complete.
    pub fn close(self) { /* drop */ }
}

pub struct DiagRequest { pub test_name: String }
pub struct DiagResponse { pub passed: bool }

// The protocol MUST be followed in order:
fn orchestrator(chan: Chan<SendRequest>) {
    let chan = chan.send(DiagRequest { test_name: "gpu_stress".into() });
    let (response, chan) = chan.recv();
    chan.close();
    println!("Result: {}", if response.passed { "PASS" } else { "FAIL" });
}

// Can't recv before send:
// fn wrong_order(chan: Chan<SendRequest>) {
//     chan.recv();  // ❌ no method `recv` on Chan<SendRequest>
// }
```

> **When to use:** Inter-thread diagnostic protocols, BMC command sequences,
> any request-response pattern where order matters. For complex multi-message
> protocols, consider the [`session-types`](https://crates.io/crates/session-types)
> or [`rumpsteak`](https://crates.io/crates/rumpsteak) crates.

***

### Trick 11 — `Pin` for Self-Referential State Machines

Some type-state machines need to hold references into their own data (e.g., a
parser that tracks a position within its owned buffer). Rust normally forbids
this because moving the struct would invalidate the internal pointer. `Pin<T>`
solves this by guaranteeing the value **will not be moved**:

```rust,ignore
use std::pin::Pin;
use std::marker::PhantomPinned;

/// A streaming parser that holds a reference into its own buffer.
/// Once pinned, it cannot be moved — the internal reference stays valid.
pub struct StreamParser {
    buffer: Vec<u8>,
    /// Points into `buffer`. Only valid while pinned.
    cursor: *const u8,
    _pin: PhantomPinned,  // opts out of Unpin — prevents accidental unpinning
}

impl StreamParser {
    pub fn new(data: Vec<u8>) -> Pin<Box<Self>> {
        let parser = StreamParser {
            buffer: data,
            cursor: std::ptr::null(),
            _pin: PhantomPinned,
        };
        let mut boxed = Box::pin(parser);

        // Set cursor to point into the pinned buffer
        let cursor = boxed.buffer.as_ptr();
        // SAFETY: we have exclusive access and the parser is pinned
        unsafe {
            let mut_ref = Pin::as_mut(&mut boxed);
            Pin::get_unchecked_mut(mut_ref).cursor = cursor;
        }

        boxed
    }

    /// Read the next byte — only callable through Pin<&mut Self>.
    pub fn next_byte(self: Pin<&mut Self>) -> Option<u8> {
        // The parser can't be moved, so cursor remains valid
        if self.cursor.is_null() { return None; }
        // ... advance cursor through buffer ...
        Some(42) // stub
    }
}

// Usage:
// let mut parser = StreamParser::new(vec![0x01, 0x02, 0x03]);
// let byte = parser.as_mut().next_byte();
```

**Key insight:** `Pin` is the correct-by-construction solution to the
self-referential struct problem. Without it, you'd need `unsafe` and manual
lifetime tracking. With it, the compiler prevents moves and the internal
pointer invariant is maintained.

| Use `Pin` when… | Don't use `Pin` when… |
|-----------------|----------------------|
| State machine holds intra-struct references | All fields are independently owned |
| Async futures that borrow across `.await` | No self-referencing needed |
| DMA descriptors that must not relocate in memory | Data can be freely moved |
| Hardware ring buffers with internal cursor | Simple index-based iteration works |

***

### Trick 12 — RAII / `Drop` as a Correctness Guarantee

Rust's `Drop` trait is a correct-by-construction mechanism: cleanup code **cannot
be forgotten** because the compiler inserts it automatically. This is especially
valuable for hardware resources that must be released exactly once.

```rust,ignore
use std::io;

/// An IPMI session that MUST be closed when done.
/// The `Drop` impl guarantees cleanup even on panic or early `?` return.
pub struct IpmiSession {
    handle: u32,
}

impl IpmiSession {
    pub fn open(host: &str) -> io::Result<Self> {
        // ... negotiate IPMI session ...
        Ok(IpmiSession { handle: 42 })
    }

    pub fn send_raw(&self, _data: &[u8]) -> io::Result<Vec<u8>> {
        Ok(vec![0x00])
    }
}

impl Drop for IpmiSession {
    fn drop(&mut self) {
        // Close Session command: always runs, even on panic/early-return.
        // In C, forgetting CloseSession() leaks a BMC session slot.
        let _ = self.send_raw(&[0x06, 0x3C]);
        eprintln!("[RAII] session {} closed", self.handle);
    }
}
// Usage:
fn diagnose(host: &str) -> io::Result<()> {
    let session = IpmiSession::open(host)?;
    session.send_raw(&[0x04, 0x2D, 0x20])?;
    // No explicit close needed — Drop runs here automatically
    Ok(())
    // Even if send_raw returns Err(...), the session is still closed.
}
```

**The C/C++ failure mode that RAII eliminates:**

```text
C:     session = ipmi_open(host);
       ipmi_send(session, data);
       if (error) return -1;        // 🐛 leaked session — forgot close()
       ipmi_close(session);

Rust:  let session = IpmiSession::open(host)?;
       session.send_raw(data)?;     // ✅ Drop runs on ? return
       // Drop always runs — leak is impossible
```

**Combine RAII with type-state (ch05) for ordered cleanup:**

You cannot specialize `Drop` on a generic parameter (Rust error E0366).
Instead, use **separate wrapper types** per state:

```rust,ignore
use std::marker::PhantomData;

pub struct Open;
pub struct Locked;

pub struct GpuContext<S> {
    device_id: u32,
    _state: PhantomData<S>,
}

impl GpuContext<Open> {
    pub fn lock_clocks(self) -> LockedGpu {
        // ... lock GPU clocks for stable benchmarking ...
        LockedGpu { device_id: self.device_id }
    }
}

/// Separate type for the locked state — has its own Drop.
/// We can't do `impl Drop for GpuContext<Locked>` (E0366),
/// so we use a distinct wrapper that owns the locked resource.
pub struct LockedGpu {
    device_id: u32,
}

impl LockedGpu {
    pub fn run_benchmark(&self) -> f64 {
        // ... benchmark with locked clocks ...
        42.0
    }
}

impl Drop for LockedGpu {
    fn drop(&mut self) {
        // Unlock clocks on drop — only fires for the locked wrapper.
        eprintln!("[RAII] GPU {} clocks unlocked", self.device_id);
    }
}

// GpuContext<Open> has no special Drop — no clocks to unlock.
// LockedGpu always unlocks on drop, even on panic or early return.
```

> **Why not `impl Drop for GpuContext<Locked>`?** Rust requires `Drop` impls
> to apply to *all* instantiations of a generic type. To get state-specific
> cleanup, use one of:
>
> | Approach | Pros | Cons |
> |----------|------|------|
> | Separate wrapper type (above) | Clean, zero-cost | Extra type name |
> | Generic `Drop` + runtime `TypeId` check | Single type | Requires `'static`, runtime cost |
> | `enum` state with exhaustive match in `Drop` | Single generic type | Runtime dispatch, less type safety |

> **When to use:** BMC sessions, GPU clock locks, DMA buffer mappings, file
> handles, mutex guards, any resource with a mandatory release step. If you
> find yourself writing `fn close(&mut self)` or `fn cleanup()`, it should
> almost certainly be `Drop` instead.

***

### Trick 13 — Error Type Hierarchies as Correctness

Well-designed error types prevent silent error swallowing and ensure callers
handle each failure mode appropriately. Using `thiserror` for structured errors
is a correct-by-construction pattern: the compiler forces exhaustive matching.

```toml
# Cargo.toml
[dependencies]
thiserror = "1"
# For application-level error handling (optional):
# anyhow = "1"
```

```rust,ignore
use thiserror::Error;

#[derive(Debug, Error)]
pub enum DiagError {
    #[error("IPMI communication failed: {0}")]
    Ipmi(#[from] IpmiError),

    #[error("sensor {sensor_id:#04x} reading out of range: {value}")]
    SensorRange { sensor_id: u8, value: f64 },

    #[error("GPU {gpu_id} not responding")]
    GpuTimeout { gpu_id: u32 },

    #[error("configuration invalid: {0}")]
    Config(String),
}

#[derive(Debug, Error)]
pub enum IpmiError {
    #[error("session authentication failed")]
    AuthFailed,

    #[error("command {net_fn:#04x}/{cmd:#04x} timed out")]
    Timeout { net_fn: u8, cmd: u8 },

    #[error("completion code {0:#04x}")]
    CompletionCode(u8),
}

// Callers MUST handle each variant — no silent swallowing:
fn run_thermal_check() -> Result<(), DiagError> {
    // If this returns IpmiError, it's automatically converted to DiagError::Ipmi
    // via the #[from] attribute.
    let temp = read_cpu_temp()?;
    if temp > 105.0 {
        return Err(DiagError::SensorRange {
            sensor_id: 0x20,
            value: temp,
        });
    }
    Ok(())
}

# fn read_cpu_temp() -> Result<f64, DiagError> { Ok(42.0) }
```

**Why this is correct-by-construction:**

| Without structured errors | With `thiserror` enums |
|--------------------------|----------------------|
| `fn op() -> Result<T, String>` | `fn op() -> Result<T, DiagError>` |
| Caller gets opaque string | Caller matches on specific variants |
| Can't distinguish auth failure from timeout | `DiagError::Ipmi(IpmiError::AuthFailed)` vs `Timeout` |
| Logging swallows the error | `match` forces handling each case |
| New error variant → nobody notices | New variant → compiler warns unmatched arms |

**The `anyhow` vs `thiserror` decision:**

| Use `thiserror` when… | Use `anyhow` when… |
|-----------------------|-------------------|
| Writing a library/crate | Writing a binary/CLI |
| Callers need to match on error variants | Callers just log and exit |
| Error types are part of the public API | Internal error plumbing |
| `protocol_lib`, `accel_diag`, `thermal_diag` | `diag_tool` main binary |

> **When to use:** Every crate in the workspace should define its own error
> enum with `thiserror`. The top-level binary crate can use `anyhow` to
> aggregate them. This gives library callers compile-time error handling
> guarantees while keeping the binary ergonomic.

***

### Trick 14 — `#[must_use]` for Enforcing Consumption

The `#[must_use]` attribute turns ignored return values into compiler warnings.
This is a lightweight correct-by-construction tool that pairs with every pattern
in this guide:

```rust,ignore
/// A calibration token that MUST be used — dropping it silently is a bug.
#[must_use = "calibration token must be passed to calibrate(), not dropped"]
pub struct CalibrationToken {
    _private: (),
}

/// A diagnostic result that MUST be checked — ignoring failures is a bug.
#[must_use = "diagnostic result must be inspected for failures"]
pub struct DiagResult {
    pub passed: bool,
    pub details: String,
}

/// Functions that return important values should be marked too:
#[must_use = "the authenticated session must be used or explicitly closed"]
pub fn authenticate(user: &str, pass: &str) -> Result<Session, AuthError> {
    // ...
#   unimplemented!()
}
#
# pub struct Session;
# pub struct AuthError;
```

**What the compiler tells you:**

```text
warning: unused `CalibrationToken` that must be used
  --> src/main.rs:5:5
   |
5  |     CalibrationToken { _private: () };
   |     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
   |
   = note: calibration token must be passed to calibrate(), not dropped
```

**Apply `#[must_use]` to these patterns:**

| Pattern | What to annotate | Why |
|---------|-----------------|-----|
| Single-Use Tokens (ch03) | `CalibrationToken`, `FusePayload` | Dropping without use = logic bug |
| Capability Tokens (ch04) | `AdminToken` | Authenticating but ignoring the token |
| Type-State transitions | Return type of `authenticate()`, `activate()` | Session created but never used |
| Results | `DiagResult`, `SensorReading` | Silent failure swallowing |
| RAII handles (Trick 12) | `IpmiSession`, `LockedGpu` | Opening but not using a resource |

> **Rule of thumb:** If dropping a value without using it is always a bug,
> add `#[must_use]`. If it's sometimes intentional (e.g., a `Vec`), don't.
> The `_` prefix (`let _ = foo()`) explicitly acknowledges and silences the
> warning — this is fine when the drop is intentional.

## Key Takeaways

1. **Sentinel → Option at the boundary** — convert magic values to `Option` on parse; the compiler forces callers to handle `None`.
2. **Sealed traits close the implementation loophole** — private supertrait means only your crate can implement the trait.
3. **`#[non_exhaustive]` + `#[must_use]` are one-line, high-value annotations** — add them to evolving enums and consumed tokens.
4. **Typestate builders enforce required fields** — `finish()` only exists when all required type parameters are `Set`.
5. **Each trick targets a specific bug class** — adopt them incrementally; no trick requires rewriting your architecture.

---

