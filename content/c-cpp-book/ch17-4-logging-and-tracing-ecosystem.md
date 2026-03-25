## Logging and Tracing: syslog/printf → `log` + `tracing`

> **What you'll learn:** Rust's two-layer logging architecture (facade + backend), the `log` and `tracing` crates, structured logging with spans, and how this replaces `printf`/`syslog` debugging.

C++ diagnostic code typically uses `printf`, `syslog`, or custom logging frameworks.
Rust has a standardized two-layer logging architecture: a **facade** crate (`log` or
`tracing`) and a **backend** (the actual logger implementation).

### The `log` facade — Rust's universal logging API

The `log` crate provides macros that mirror syslog severity levels. Libraries use
`log` macros; binaries choose a backend:

```rust
// Cargo.toml
// [dependencies]
// log = "0.4"
// env_logger = "0.11"    # One of many backends

use log::{info, warn, error, debug, trace};

fn check_sensor(id: u32, temp: f64) {
    trace!("Reading sensor {id}");           // Finest granularity
    debug!("Sensor {id} raw value: {temp}"); // Development-time detail

    if temp > 85.0 {
        warn!("Sensor {id} high temperature: {temp}°C");
    }
    if temp > 95.0 {
        error!("Sensor {id} CRITICAL: {temp}°C — initiating shutdown");
    }
    info!("Sensor {id} check complete");     // Normal operation
}

fn main() {
    // Initialize the backend — typically done once in main()
    env_logger::init();  // Controlled by RUST_LOG env var

    check_sensor(0, 72.5);
    check_sensor(1, 91.0);
}
```

```bash
# Control log level via environment variable
RUST_LOG=debug cargo run          # Show debug and above
RUST_LOG=warn cargo run           # Show only warn and error
RUST_LOG=my_crate=trace cargo run # Per-module filtering
RUST_LOG=my_crate::gpu=debug,warn cargo run  # Mix levels
```

### C++ comparison

| C++ | Rust (`log`) | Notes |
|-----|-------------|-------|
| `printf("DEBUG: %s\n", msg)` | `debug!("{msg}")` | Format checked at compile time |
| `syslog(LOG_ERR, "...")` | `error!("...")` | Backend decides where output goes |
| `#ifdef DEBUG` around log calls | `trace!` / `debug!` compiled out at max_level | Zero-cost when disabled |
| Custom `Logger::log(level, msg)` | `log::info!("...")` — all crates use same API | Universal facade, swappable backend |
| Per-file log verbosity | `RUST_LOG=crate::module=level` | Environment-based, no recompile |

### The `tracing` crate — structured logging with spans

`tracing` extends `log` with **structured fields** and **spans** (timed scopes).
This is especially useful for diagnostics code where you want to track context:

```rust
// Cargo.toml
// [dependencies]
// tracing = "0.1"
// tracing-subscriber = { version = "0.3", features = ["env-filter"] }

use tracing::{info, warn, error, instrument, info_span};

#[instrument(skip(data), fields(gpu_id = gpu_id, data_len = data.len()))]
fn run_gpu_test(gpu_id: u32, data: &[u8]) -> Result<(), String> {
    info!("Starting GPU test");

    let span = info_span!("ecc_check", gpu_id);
    let _guard = span.enter();  // All logs inside this scope include gpu_id

    if data.is_empty() {
        error!(gpu_id, "No test data provided");
        return Err("empty data".to_string());
    }

    // Structured fields — machine-parseable, not just string interpolation
    info!(
        gpu_id,
        temp_celsius = 72.5,
        ecc_errors = 0,
        "ECC check passed"
    );

    Ok(())
}

fn main() {
    // Initialize tracing subscriber
    tracing_subscriber::fmt()
        .with_env_filter("debug")  // Or use RUST_LOG env var
        .with_target(true)          // Show module path
        .with_thread_ids(true)      // Show thread IDs
        .init();

    let _ = run_gpu_test(0, &[1, 2, 3]);
}
```

Output with `tracing-subscriber`:
```rust
2026-02-15T10:30:00.123Z DEBUG ThreadId(01) run_gpu_test{gpu_id=0 data_len=3}: my_crate: Starting GPU test
2026-02-15T10:30:00.124Z  INFO ThreadId(01) run_gpu_test{gpu_id=0 data_len=3}:ecc_check{gpu_id=0}: my_crate: ECC check passed gpu_id=0 temp_celsius=72.5 ecc_errors=0
```

### `#[instrument]` — automatic span creation

The `#[instrument]` attribute automatically creates a span with the function name
and its arguments:

```rust
use tracing::instrument;

#[instrument]
fn parse_sel_record(record_id: u16, sensor_type: u8, data: &[u8]) -> Result<(), String> {
    // Every log inside this function automatically includes:
    // record_id, sensor_type, and data (if Debug)
    tracing::debug!("Parsing SEL record");
    Ok(())
}

// skip: exclude large/sensitive args from the span
// fields: add computed fields
#[instrument(skip(raw_buffer), fields(buf_len = raw_buffer.len()))]
fn decode_ipmi_response(raw_buffer: &[u8]) -> Result<Vec<u8>, String> {
    tracing::trace!("Decoding {} bytes", raw_buffer.len());
    Ok(raw_buffer.to_vec())
}
```

### `log` vs `tracing` — which to use

| Aspect | `log` | `tracing` |
|--------|-------|-----------|
| **Complexity** | Simple — 5 macros | Richer — spans, fields, instruments |
| **Structured data** | String interpolation only | Key-value fields: `info!(gpu_id = 0, "msg")` |
| **Timing / spans** | No | Yes — `#[instrument]`, `span.enter()` |
| **Async support** | Basic | First-class — spans propagate across `.await` |
| **Compatibility** | Universal facade | Compatible with `log` (has a `log` bridge) |
| **When to use** | Simple applications, libraries | Diagnostic tools, async code, observability |

> **Recommendation**: Use `tracing` for production diagnostic-style projects (diagnostic tools
> with structured output). Use `log` for simple libraries where you want minimal
> dependencies. `tracing` includes a compatibility layer so libraries using `log`
> macros still work with a `tracing` subscriber.

### Backend options

| Backend Crate | Output | Use Case |
|--------------|--------|----------|
| `env_logger` | stderr, colored | Development, simple CLI tools |
| `tracing-subscriber` | stderr, formatted | Production with `tracing` |
| `syslog` | System syslog | Linux system services |
| `tracing-journald` | systemd journal | systemd-managed services |
| `tracing-appender` | Rotating log files | Long-running daemons |
| `tracing-opentelemetry` | OpenTelemetry collector | Distributed tracing |

----

