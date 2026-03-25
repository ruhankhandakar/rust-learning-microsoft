## Testing Patterns for C++ Programmers

> **What you'll learn:** Rust's built-in test framework — `#[test]`, `#[should_panic]`, `Result`-returning tests, builder patterns for test data, trait-based mocking, property testing with `proptest`, snapshot testing with `insta`, and integration test organization. Zero-config testing that replaces Google Test + CMake.

C++ testing typically relies on external frameworks (Google Test, Catch2, Boost.Test)
with complex build integration. Rust's test framework is **built into the language
and toolchain** — no dependencies, no CMake integration, no test runner configuration.

### Test attributes beyond `#[test]`

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn basic_pass() {
        assert_eq!(2 + 2, 4);
    }

    // Expect a panic — equivalent to GTest's EXPECT_DEATH
    #[test]
    #[should_panic]
    fn out_of_bounds_panics() {
        let v = vec![1, 2, 3];
        let _ = v[10]; // Panics — test passes
    }

    // Expect a panic with a specific message substring
    #[test]
    #[should_panic(expected = "index out of bounds")]
    fn specific_panic_message() {
        let v = vec![1, 2, 3];
        let _ = v[10];
    }

    // Tests that return Result<(), E> — use ? instead of unwrap()
    #[test]
    fn test_with_result() -> Result<(), String> {
        let value: u32 = "42".parse().map_err(|e| format!("{e}"))?;
        assert_eq!(value, 42);
        Ok(())
    }

    // Ignore slow tests by default — run with `cargo test -- --ignored`
    #[test]
    #[ignore]
    fn slow_integration_test() {
        std::thread::sleep(std::time::Duration::from_secs(10));
    }
}
```

```bash
cargo test                          # Run all non-ignored tests
cargo test -- --ignored             # Run only ignored tests
cargo test -- --include-ignored     # Run ALL tests including ignored
cargo test test_name                # Run tests matching a name pattern
cargo test -- --nocapture           # Show println! output during tests
cargo test -- --test-threads=1      # Run tests serially (for shared state)
```

### Test helpers: builder pattern for test data

In C++ you'd use Google Test fixtures (`class MyTest : public ::testing::Test`).
In Rust, use builder functions or the `Default` trait:

```rust
#[cfg(test)]
mod tests {
    use super::*;

    // Builder function — creates test data with sensible defaults
    fn make_gpu_event(severity: Severity, fault_code: u32) -> DiagEvent {
        DiagEvent {
            source: "accel_diag".to_string(),
            severity,
            message: format!("Test event FC:{fault_code}"),
            fault_code,
        }
    }

    // Reusable test fixture — a set of pre-built events
    fn sample_events() -> Vec<DiagEvent> {
        vec![
            make_gpu_event(Severity::Critical, 67956),
            make_gpu_event(Severity::Warning, 32709),
            make_gpu_event(Severity::Info, 10001),
        ]
    }

    #[test]
    fn filter_critical_events() {
        let events = sample_events();
        let critical: Vec<_> = events.iter()
            .filter(|e| e.severity == Severity::Critical)
            .collect();
        assert_eq!(critical.len(), 1);
        assert_eq!(critical[0].fault_code, 67956);
    }
}
```

### Mocking with traits

In C++, mocking requires frameworks like Google Mock or manual virtual overrides.
In Rust, define a trait for the dependency and swap implementations in tests:

```rust
// Production trait
trait SensorReader {
    fn read_temperature(&self, sensor_id: u32) -> Result<f64, String>;
}

// Production implementation
struct HwSensorReader;
impl SensorReader for HwSensorReader {
    fn read_temperature(&self, sensor_id: u32) -> Result<f64, String> {
        // Real hardware call...
        Ok(72.5)
    }
}

// Test mock — returns predictable values
#[cfg(test)]
struct MockSensorReader {
    temperatures: std::collections::HashMap<u32, f64>,
}

#[cfg(test)]
impl SensorReader for MockSensorReader {
    fn read_temperature(&self, sensor_id: u32) -> Result<f64, String> {
        self.temperatures.get(&sensor_id)
            .copied()
            .ok_or_else(|| format!("Unknown sensor {sensor_id}"))
    }
}

// Function under test — generic over the reader
fn check_overtemp(reader: &impl SensorReader, ids: &[u32], threshold: f64) -> Vec<u32> {
    ids.iter()
        .filter(|&&id| reader.read_temperature(id).unwrap_or(0.0) > threshold)
        .copied()
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn detect_overtemp_sensors() {
        let mut mock = MockSensorReader { temperatures: Default::default() };
        mock.temperatures.insert(0, 72.5);
        mock.temperatures.insert(1, 91.0);  // Over threshold
        mock.temperatures.insert(2, 65.0);

        let hot = check_overtemp(&mock, &[0, 1, 2], 80.0);
        assert_eq!(hot, vec![1]);
    }
}
```

### Temporary files and directories in tests

C++ tests often use platform-specific temp directories. Rust has `tempfile`:

```rust
// Cargo.toml: [dev-dependencies]
// tempfile = "3"

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::NamedTempFile;
    use std::io::Write;

    #[test]
    fn parse_config_from_file() -> Result<(), Box<dyn std::error::Error>> {
        // Create a temp file that's auto-deleted when dropped
        let mut file = NamedTempFile::new()?;
        writeln!(file, r#"{{"sku": "ServerNode", "level": "Quick"}}"#)?;

        let config = load_config(file.path().to_str().unwrap())?;
        assert_eq!(config.sku, "ServerNode");
        Ok(())
        // file is deleted here — no cleanup code needed
    }
}
```

### Property-based testing with `proptest`

Instead of writing specific test cases, describe **properties** that should hold
for all inputs. `proptest` generates random inputs and finds minimal failing cases:

```rust
// Cargo.toml: [dev-dependencies]
// proptest = "1"

#[cfg(test)]
mod tests {
    use proptest::prelude::*;

    fn parse_and_format(n: u32) -> String {
        format!("{n}")
    }

    proptest! {
        #[test]
        fn roundtrip_u32(n: u32) {
            let formatted = parse_and_format(n);
            let parsed: u32 = formatted.parse().unwrap();
            prop_assert_eq!(n, parsed);
        }

        #[test]
        fn string_contains_no_null(s in "[a-zA-Z0-9 ]{0,100}") {
            prop_assert!(!s.contains('\0'));
        }
    }
}
```

### Snapshot testing with `insta`

For tests that produce complex output (JSON, formatted strings), `insta` auto-generates
and manages reference snapshots:

```rust
// Cargo.toml: [dev-dependencies]
// insta = { version = "1", features = ["json"] }

#[cfg(test)]
mod tests {
    use insta::assert_json_snapshot;

    #[test]
    fn der_entry_format() {
        let entry = DerEntry {
            fault_code: 67956,
            component: "GPU".to_string(),
            message: "ECC error detected".to_string(),
        };
        // First run: creates a snapshot file in tests/snapshots/
        // Subsequent runs: compares against the saved snapshot
        assert_json_snapshot!(entry);
    }
}
```

```bash
cargo insta test              # Run tests and review new/changed snapshots
cargo insta review            # Interactive review of snapshot changes
```

### C++ vs Rust testing comparison

| **C++ (Google Test)** | **Rust** | **Notes** |
|----------------------|---------|----------|
| `TEST(Suite, Name) { }` | `#[test] fn name() { }` | No suite/class hierarchy needed |
| `ASSERT_EQ(a, b)` | `assert_eq!(a, b)` | Built-in macro, no framework needed |
| `ASSERT_NEAR(a, b, eps)` | `assert!((a - b).abs() < eps)` | Or use `approx` crate |
| `EXPECT_THROW(expr, type)` | `#[should_panic(expected = "...")]` | Or `catch_unwind` for fine control |
| `EXPECT_DEATH(expr, "msg")` | `#[should_panic(expected = "msg")]` | |
| `class Fixture : public ::testing::Test` | Builder functions + `Default` | No inheritance needed |
| Google Mock `MOCK_METHOD` | Trait + test impl | More explicit, no macro magic |
| `INSTANTIATE_TEST_SUITE_P` (parameterized) | `proptest!` or macro-generated tests | |
| `SetUp()` / `TearDown()` | RAII via `Drop` — cleanup is automatic | Variables dropped at end of test |
| Separate test binary + CMake | `cargo test` — zero config | |
| `ctest --output-on-failure` | `cargo test -- --nocapture` | |

----

### Integration tests: the `tests/` directory

Unit tests live inside `#[cfg(test)]` modules alongside your code. **Integration tests** live in a separate `tests/` directory at the crate root and test your library's public API as an external consumer would:

```
my_crate/
├── src/
│   └── lib.rs          # Your library code
├── tests/
│   ├── smoke.rs        # Each .rs file is a separate test binary
│   ├── regression.rs
│   └── common/
│       └── mod.rs      # Shared test helpers (NOT a test itself)
└── Cargo.toml
```

```rust
// tests/smoke.rs — tests your crate as an external user would
use my_crate::DiagEngine;  // Only public API is accessible

#[test]
fn engine_starts_successfully() {
    let engine = DiagEngine::new("test_config.json");
    assert!(engine.is_ok());
}

#[test]
fn engine_rejects_invalid_config() {
    let engine = DiagEngine::new("nonexistent.json");
    assert!(engine.is_err());
}
```

```rust
// tests/common/mod.rs — shared helpers, NOT compiled as a test binary
pub fn setup_test_environment() -> tempfile::TempDir {
    let dir = tempfile::tempdir().unwrap();
    std::fs::write(dir.path().join("config.json"), r#"{"log_level": "debug"}"#).unwrap();
    dir
}
```

```rust
// tests/regression.rs — can use shared helpers
mod common;

#[test]
fn regression_issue_42() {
    let env = common::setup_test_environment();
    let engine = my_crate::DiagEngine::new(
        env.path().join("config.json").to_str().unwrap()
    );
    assert!(engine.is_ok());
}
```

**Running integration tests:**
```bash
cargo test                          # Runs unit AND integration tests
cargo test --test smoke             # Run only tests/smoke.rs
cargo test --test regression        # Run only tests/regression.rs
cargo test --lib                    # Run ONLY unit tests (skip integration)
```

> **Key difference from unit tests**: Integration tests cannot access private functions or `pub(crate)` items. This forces you to verify that your public API is sufficient — a valuable design signal. In C++ terms, it's like testing against only the public header with no `friend` access.

----


