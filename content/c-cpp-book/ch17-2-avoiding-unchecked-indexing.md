## Avoiding unchecked indexing

> **What you'll learn:** Why `vec[i]` is dangerous in Rust (panics on out-of-bounds), and safe alternatives like `.get()`, iterators, and `entry()` API for `HashMap`. Replaces C++'s undefined behavior with explicit handling.

- In C++, `vec[i]` and `map[key]` have undefined behavior / auto-insert on missing keys. Rust's `[]` panics on out-of-bounds.
- **Rule**: Use `.get()` instead of `[]` unless you can *prove* the index is valid.

### C++ → Rust comparison
```cpp
// C++ — silent UB or insertion
std::vector<int> v = {1, 2, 3};
int x = v[10];        // UB! No bounds check with operator[]

std::map<std::string, int> m;
int y = m["missing"]; // Silently inserts key with value 0!
```

```rust
// Rust — safe alternatives
let v = vec![1, 2, 3];

// Bad: panics if index out of bounds
// let x = v[10];

// Good: returns Option<&i32>
let x = v.get(10);              // None — no panic
let x = v.get(1).copied().unwrap_or(0);  // 2, or 0 if missing
```

### Real example: safe byte parsing from production Rust code
```rust
// Example: diagnostics.rs
// Parsing a binary SEL record — buffer might be shorter than expected
let sensor_num = bytes.get(7).copied().unwrap_or(0);
let ppin = cpu_ppin.get(i).map(|s| s.as_str()).unwrap_or("");
```

### Real example: chained safe lookups with `.and_then()`
```rust
// Example: profile.rs — double lookup: HashMap → Vec
pub fn get_processor(&self, location: &str) -> Option<&Processor> {
    self.processor_by_location
        .get(location)                              // HashMap → Option<&usize>
        .and_then(|&idx| self.processors.get(idx))   // Vec → Option<&Processor>
}
// Both lookups return Option — no panics, no UB
```

### Real example: safe JSON navigation
```rust
// Example: framework.rs — every JSON key returns Option
let manufacturer = product_fru
    .get("Manufacturer")            // Option<&Value>
    .and_then(|v| v.as_str())       // Option<&str>
    .unwrap_or(UNKNOWN_VALUE)       // &str (safe fallback)
    .to_string();
```
Compare to the C++ pattern: `json["SystemInfo"]["ProductFru"]["Manufacturer"]` — any missing key throws `nlohmann::json::out_of_range`.

### When `[]` is acceptable
- **After a bounds check**: `if i < v.len() { v[i] }`
- **In tests**: Where panicking is the desired behavior
- **With constants**: `let first = v[0];` right after `assert!(!v.is_empty());`

----

## Safe value extraction with unwrap_or

- `unwrap()` panics on `None` / `Err`. In production code, prefer the safe alternatives.

### The unwrap family
| **Method** | **Behavior on None/Err** | **Use When** |
|-----------|------------------------|-------------|
| `.unwrap()` | **Panics** | Tests only, or provably infallible |
| `.expect("msg")` | Panics with message | When panic is justified, explain why |
| `.unwrap_or(default)` | Returns `default` | You have a cheap constant fallback |
| `.unwrap_or_else(\|\| expr)` | Calls closure | Fallback is expensive to compute |
| `.unwrap_or_default()` | Returns `Default::default()` | Type implements `Default` |

### Real example: parsing with safe defaults
```rust
// Example: peripherals.rs
// Regex capture groups might not match — provide safe fallbacks
let bus_hex = caps.get(1).map(|m| m.as_str()).unwrap_or("00");
let fw_status = caps.get(5).map(|m| m.as_str()).unwrap_or("0x0");
let bus = u8::from_str_radix(bus_hex, 16).unwrap_or(0);
```

### Real example: `unwrap_or_else` with fallback struct
```rust
// Example: framework.rs
// Full function wraps logic in an Option-returning closure;
// if anything fails, return a default struct:
(|| -> Option<BaseboardFru> {
    let content = std::fs::read_to_string(path).ok()?;
    let json: serde_json::Value = serde_json::from_str(&content).ok()?;
    // ... extract fields with .get()? chains
    Some(baseboard_fru)
})()
.unwrap_or_else(|| BaseboardFru {
    manufacturer: String::new(),
    model: String::new(),
    product_part_number: String::new(),
    serial_number: String::new(),
    asset_tag: String::new(),
})
```

### Real example: `unwrap_or_default` on config deserialization
```rust
// Example: framework.rs
// If JSON config parsing fails, fall back to Default — no crash
Ok(json) => serde_json::from_str(&json).unwrap_or_default(),
```
The C++ equivalent would be a `try/catch` around `nlohmann::json::parse()` with manual default construction in the catch block.

----

## Functional transforms: map, map_err, find_map

- These methods on `Option` and `Result` let you transform the contained value without unwrapping, replacing nested `if/else` with linear chains.

### Quick reference
| **Method** | **On** | **Does** | **C++ Equivalent** |
|-----------|-------|---------|-------------------|
| `.map(\|v\| ...)` | `Option` / `Result` | Transform the `Some`/`Ok` value | `if (opt) { *opt = transform(*opt); }` |
| `.map_err(\|e\| ...)` | `Result` | Transform the `Err` value | Adding context to catch block |
| `.and_then(\|v\| ...)` | `Option` / `Result` | Chain operations that return `Option`/`Result` | Nested if-checks |
| `.find_map(\|v\| ...)` | Iterator | `find` + `map` in one pass | Loop with `if + break` |
| `.filter(\|v\| ...)` | `Option` / Iterator | Keep only values matching predicate | `if (!predicate) return nullopt;` |
| `.ok()?` | `Result` | Convert `Result → Option` and propagate `None` | `if (result.has_error()) return nullopt;` |

### Real example: `.and_then()` chain for JSON field extraction
```rust
// Example: framework.rs — finding serial number with fallbacks
let sys_info = json.get("SystemInfo")?;

// Try BaseboardFru.BoardSerialNumber first
if let Some(serial) = sys_info
    .get("BaseboardFru")
    .and_then(|b| b.get("BoardSerialNumber"))
    .and_then(|v| v.as_str())
    .filter(valid_serial)     // Only accept non-empty, valid serials
{
    return Some(serial.to_string());
}

// Fallback to BoardFru.SerialNumber
sys_info
    .get("BoardFru")
    .and_then(|b| b.get("SerialNumber"))
    .and_then(|v| v.as_str())
    .filter(valid_serial)
    .map(|s| s.to_string())   // Convert &str → String only if Some
```
In C++ this would be a pyramid of `if (json.contains("BaseboardFru")) { if (json["BaseboardFru"].contains("BoardSerialNumber")) { ... } }`.

### Real example: `find_map` — search + transform in one pass
```rust
// Example: context.rs — find SDR record matching sensor + owner
pub fn find_for_event(&self, sensor_number: u8, owner_id: u8) -> Option<&SdrRecord> {
    self.by_sensor.get(&sensor_number).and_then(|indices| {
        indices.iter().find_map(|&i| {
            let record = &self.records[i];
            if record.sensor_owner_id() == Some(owner_id) {
                Some(record)
            } else {
                None
            }
        })
    })
}
```
`find_map` is `find` + `map` fused: it stops at the first match and transforms it. The C++ equivalent is a `for` loop with an `if` + `break`.

### Real example: `map_err` for error context
```rust
// Example: main.rs — add context to errors before propagating
let json_str = serde_json::to_string_pretty(&config)
    .map_err(|e| format!("Failed to serialize config: {}", e))?;
```
Transforms a `serde_json::Error` into a descriptive `String` error that includes context about *what* failed.

----

## JSON handling: nlohmann::json → serde

- C++ teams typically use `nlohmann::json` for JSON parsing. Rust uses **serde** + **serde_json** — which is more powerful because the JSON schema is encoded *in the type system*.

### C++ (nlohmann) vs Rust (serde) comparison

```cpp
// C++ with nlohmann::json — runtime field access
#include <nlohmann/json.hpp>
using json = nlohmann::json;

struct Fan {
    std::string logical_id;
    std::vector<std::string> sensor_ids;
};

Fan parse_fan(const json& j) {
    Fan f;
    f.logical_id = j.at("LogicalID").get<std::string>();    // throws if missing
    if (j.contains("SDRSensorIdHexes")) {                   // manual default handling
        f.sensor_ids = j["SDRSensorIdHexes"].get<std::vector<std::string>>();
    }
    return f;
}
```

```rust
// Rust with serde — compile-time schema, automatic field mapping
use serde::{Serialize, Deserialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Fan {
    pub logical_id: String,
    #[serde(rename = "SDRSensorIdHexes", default)]  // JSON key → Rust field
    pub sensor_ids: Vec<String>,                     // Missing → empty Vec
    #[serde(default)]
    pub sensor_names: Vec<String>,                   // Missing → empty Vec
}

// One line replaces the entire parse function:
let fan: Fan = serde_json::from_str(json_str)?;
```

### Key serde attributes (real examples from production Rust code)

| **Attribute** | **Purpose** | **C++ Equivalent** |
|--------------|------------|--------------------|
| `#[serde(default)]` | Use `Default::default()` for missing fields | `if (j.contains(key)) { ... } else { default; }` |
| `#[serde(rename = "Key")]` | Map JSON key name to Rust field name | Manual `j.at("Key")` access |
| `#[serde(flatten)]` | Absorb unknown keys into `HashMap` | `for (auto& [k,v] : j.items()) { ... }` |
| `#[serde(skip)]` | Don't serialize/deserialize this field | Not storing in JSON |
| `#[serde(tag = "type")]` | Internally tagged enum (discriminator field) | `if (j["type"] == "gpu") { ... }` |

### Real example: full config struct
```rust
// Example: diag.rs
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiagConfig {
    pub sku: SkuConfig,
    #[serde(default)]
    pub level: DiagLevel,            // Missing → DiagLevel::default()
    #[serde(default)]
    pub modules: ModuleConfig,       // Missing → ModuleConfig::default()
    #[serde(default)]
    pub output_dir: String,          // Missing → ""
    #[serde(default, flatten)]
    pub options: HashMap<String, serde_json::Value>,  // Absorbs unknown keys
}

// Loading is 3 lines (vs ~20+ in C++ with nlohmann):
let content = std::fs::read_to_string(path)?;
let config: DiagConfig = serde_json::from_str(&content)?;
Ok(config)
```

### Enum deserialization with `#[serde(tag = "type")]`
```rust
// Example: components.rs
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]                   // JSON: {"type": "Gpu", "product": ...}
pub enum PcieDeviceKind {
    Gpu { product: GpuProduct, manufacturer: GpuManufacturer },
    Nic { product: NicProduct, manufacturer: NicManufacturer },
    NvmeDrive { drive_type: StorageDriveType, capacity_gb: u32 },
    // ... 9 more variants
}
// serde automatically dispatches on the "type" field — no manual if/else chain
```
The C++ equivalent would be: `if (j["type"] == "Gpu") { parse_gpu(j); } else if (j["type"] == "Nic") { parse_nic(j); } ...`

# Exercise: JSON deserialization with serde

- Define a `ServerConfig` struct that can be deserialized from the following JSON:
```json
{
    "hostname": "diag-node-01",
    "port": 8080,
    "debug": true,
    "modules": ["accel_diag", "nic_diag", "cpu_diag"]
}
```
- Use `#[derive(Deserialize)]` and `serde_json::from_str()` to parse it
- Add `#[serde(default)]` to `debug` so it defaults to `false` if missing
- **Bonus**: Add an `enum DiagLevel { Quick, Full, Extended }` field with `#[serde(default)]` that defaults to `Quick`

**Starter code** (requires `cargo add serde --features derive` and `cargo add serde_json`):
```rust
use serde::Deserialize;

// TODO: Define DiagLevel enum with Default impl

// TODO: Define ServerConfig struct with serde attributes

fn main() {
    let json_input = r#"{
        "hostname": "diag-node-01",
        "port": 8080,
        "debug": true,
        "modules": ["accel_diag", "nic_diag", "cpu_diag"]
    }"#;

    // TODO: Deserialize and print the config
    // TODO: Try parsing JSON with "debug" field missing — verify it defaults to false
}
```

<details><summary>Solution (click to expand)</summary>

```rust
use serde::Deserialize;

#[derive(Debug, Deserialize, Default)]
enum DiagLevel {
    #[default]
    Quick,
    Full,
    Extended,
}

#[derive(Debug, Deserialize)]
struct ServerConfig {
    hostname: String,
    port: u16,
    #[serde(default)]       // defaults to false if missing
    debug: bool,
    modules: Vec<String>,
    #[serde(default)]       // defaults to DiagLevel::Quick if missing
    level: DiagLevel,
}

fn main() {
    let json_input = r#"{
        "hostname": "diag-node-01",
        "port": 8080,
        "debug": true,
        "modules": ["accel_diag", "nic_diag", "cpu_diag"]
    }"#;

    let config: ServerConfig = serde_json::from_str(json_input)
        .expect("Failed to parse JSON");
    println!("{config:#?}");

    // Test with missing optional fields
    let minimal = r#"{
        "hostname": "node-02",
        "port": 9090,
        "modules": []
    }"#;
    let config2: ServerConfig = serde_json::from_str(minimal)
        .expect("Failed to parse minimal JSON");
    println!("debug (default): {}", config2.debug);    // false
    println!("level (default): {:?}", config2.level);  // Quick
}
// Output:
// ServerConfig {
//     hostname: "diag-node-01",
//     port: 8080,
//     debug: true,
//     modules: ["accel_diag", "nic_diag", "cpu_diag"],
//     level: Quick,
// }
// debug (default): false
// level (default): Quick
```

</details>

----


