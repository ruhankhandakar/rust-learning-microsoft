## Testing in Rust vs C#

> **What you'll learn:** Built-in `#[test]` vs xUnit, parameterized tests with `rstest` (like `[Theory]`),
> property testing with `proptest`, mocking with `mockall`, and async test patterns.
>
> **Difficulty:** 🟡 Intermediate

### Unit Tests
```csharp
// C# — xUnit
using Xunit;

public class CalculatorTests
{
    [Fact]
    public void Add_ReturnsSum()
    {
        var calc = new Calculator();
        Assert.Equal(5, calc.Add(2, 3));
    }

    [Theory]
    [InlineData(1, 2, 3)]
    [InlineData(0, 0, 0)]
    [InlineData(-1, 1, 0)]
    public void Add_Theory(int a, int b, int expected)
    {
        Assert.Equal(expected, new Calculator().Add(a, b));
    }
}
```

```rust
// Rust — built-in testing, no external framework needed
pub fn add(a: i32, b: i32) -> i32 { a + b }

#[cfg(test)]  // Only compiled during `cargo test`
mod tests {
    use super::*;  // Import from parent module

    #[test]
    fn add_returns_sum() {
        assert_eq!(add(2, 3), 5);
    }

    #[test]
    fn add_negative_numbers() {
        assert_eq!(add(-1, 1), 0);
    }

    #[test]
    #[should_panic(expected = "overflow")]
    fn add_overflow_panics() {
        let _ = add(i32::MAX, 1); // panics in debug mode
    }
}
```

### Parameterized Tests (like `[Theory]`)
```rust
// Use the `rstest` crate for parameterized tests
use rstest::rstest;

#[rstest]
#[case(1, 2, 3)]
#[case(0, 0, 0)]
#[case(-1, 1, 0)]
fn test_add(#[case] a: i32, #[case] b: i32, #[case] expected: i32) {
    assert_eq!(add(a, b), expected);
}

// Fixtures — like test setup methods
#[rstest]
fn test_with_fixture(#[values(1, 2, 3)] x: i32) {
    assert!(x > 0);
}
```

### Assertions Comparison

| C# (xUnit) | Rust | Notes |
|-------------|------|-------|
| `Assert.Equal(expected, actual)` | `assert_eq!(expected, actual)` | Prints diff on failure |
| `Assert.NotEqual(a, b)` | `assert_ne!(a, b)` | |
| `Assert.True(condition)` | `assert!(condition)` | |
| `Assert.Contains("sub", str)` | `assert!(str.contains("sub"))` | |
| `Assert.Throws<T>(() => ...)` | `#[should_panic]` | Or use `std::panic::catch_unwind` |
| `Assert.Null(obj)` | `assert!(option.is_none())` | No nulls — use `Option` |

### Test Organization

```text
my_crate/
├── src/
│   ├── lib.rs          # Unit tests in #[cfg(test)] mod tests { }
│   └── parser.rs       # Each module can have its own test module
├── tests/              # Integration tests (each file is a separate crate)
│   ├── parser_test.rs  # Tests the public API as an external consumer
│   └── api_test.rs
└── benches/            # Benchmarks (with criterion crate)
    └── my_benchmark.rs
```

```rust
// tests/parser_test.rs — integration test
// Can only access PUBLIC API (like testing from outside the assembly)
use my_crate::parser;

#[test]
fn test_parse_valid_input() {
    let result = parser::parse("valid input");
    assert!(result.is_ok());
}
```

### Async Tests
```csharp
// C# — async test with xUnit
[Fact]
public async Task GetUser_ReturnsUser()
{
    var service = new UserService();
    var user = await service.GetUserAsync(1);
    Assert.Equal("Alice", user.Name);
}
```

```rust
// Rust — async test with tokio
#[tokio::test]
async fn get_user_returns_user() {
    let service = UserService::new();
    let user = service.get_user(1).await.unwrap();
    assert_eq!(user.name, "Alice");
}
```

### Mocking with mockall
```rust
use mockall::automock;

#[automock]                         // Generates MockUserRepo struct
trait UserRepo {
    fn find_by_id(&self, id: u32) -> Option<User>;
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn service_returns_user_from_repo() {
        let mut mock = MockUserRepo::new();
        mock.expect_find_by_id()
            .with(mockall::predicate::eq(1))
            .returning(|_| Some(User { name: "Alice".into() }));

        let service = UserService::new(mock);
        let user = service.get_user(1).unwrap();
        assert_eq!(user.name, "Alice");
    }
}
```

```csharp
// C# — Moq equivalent
var mock = new Mock<IUserRepo>();
mock.Setup(r => r.FindById(1)).Returns(new User { Name = "Alice" });
var service = new UserService(mock.Object);
Assert.Equal("Alice", service.GetUser(1).Name);
```

<details>
<summary><strong>🏋️ Exercise: Write Comprehensive Tests</strong> (click to expand)</summary>

**Challenge**: Given this function, write tests covering: happy path, empty input, numeric strings, and Unicode.

```rust
pub fn title_case(input: &str) -> String {
    input.split_whitespace()
        .map(|word| {
            let mut chars = word.chars();
            match chars.next() {
                Some(c) => format!("{}{}", c.to_uppercase(), chars.as_str().to_lowercase()),
                None => String::new(),
            }
        })
        .collect::<Vec<_>>()
        .join(" ")
}
```

<details>
<summary>🔑 Solution</summary>

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn happy_path() {
        assert_eq!(title_case("hello world"), "Hello World");
    }

    #[test]
    fn empty_input() {
        assert_eq!(title_case(""), "");
    }

    #[test]
    fn single_word() {
        assert_eq!(title_case("rust"), "Rust");
    }

    #[test]
    fn already_title_case() {
        assert_eq!(title_case("Hello World"), "Hello World");
    }

    #[test]
    fn all_caps() {
        assert_eq!(title_case("HELLO WORLD"), "Hello World");
    }

    #[test]
    fn extra_whitespace() {
        // split_whitespace handles multiple spaces
        assert_eq!(title_case("  hello   world  "), "Hello World");
    }

    #[test]
    fn unicode() {
        assert_eq!(title_case("café résumé"), "Café Résumé");
    }

    #[test]
    fn numeric_words() {
        assert_eq!(title_case("hello 42 world"), "Hello 42 World");
    }
}
```

**Key takeaway**: Rust's built-in test framework handles most unit testing needs. Use `rstest` for parameterized tests and `mockall` for mocking — no need for a large test framework like xUnit.

</details>
</details>


<!-- ch14a.1: Property Testing with proptest -->
## Property Testing: Proving Correctness at Scale

C# developers familiar with **FsCheck** will recognize property-based testing: instead of writing individual test cases, you describe *properties* that must hold for **all possible inputs**, and the framework generates thousands of random inputs to try to break them.

### Why Property Testing Matters
```csharp
// C# — Hand-written unit tests check specific cases
[Fact]
public void Reverse_Twice_Returns_Original()
{
    var list = new List<int> { 1, 2, 3 };
    list.Reverse();
    list.Reverse();
    Assert.Equal(new[] { 1, 2, 3 }, list);
}
// But what about empty lists? Single elements? 10,000 elements? Negative numbers?
// You'd need dozens of hand-written cases.
```

```rust
// Rust — proptest generates thousands of inputs automatically
use proptest::prelude::*;

fn reverse<T: Clone>(v: &[T]) -> Vec<T> {
    v.iter().rev().cloned().collect()
}

proptest! {
    #[test]
    fn reverse_twice_is_identity(ref v in prop::collection::vec(any::<i32>(), 0..1000)) {
        let reversed_twice = reverse(&reverse(v));
        prop_assert_eq!(v, &reversed_twice);
    }
    // proptest runs this with hundreds of random Vec<i32> values:
    // [], [0], [i32::MIN, i32::MAX], [42; 999], random sequences...
    // If it fails, it SHRINKS to the smallest failing input!
}
```

### Getting Started with proptest
```toml
# Cargo.toml
[dev-dependencies]
proptest = "1.4"
```

### Common Patterns for C# Developers

```rust
use proptest::prelude::*;

// 1. Roundtrip property: serialize → deserialize = identity
// (Like testing JsonSerializer.Serialize → Deserialize)
proptest! {
    #[test]
    fn json_roundtrip(name in "[a-zA-Z]{1,50}", age in 0u32..150) {
        let user = User { name: name.clone(), age };
        let json = serde_json::to_string(&user).unwrap();
        let parsed: User = serde_json::from_str(&json).unwrap();
        prop_assert_eq!(user, parsed);
    }
}

// 2. Invariant property: output always satisfies a condition
proptest! {
    #[test]
    fn sort_output_is_sorted(ref v in prop::collection::vec(any::<i32>(), 0..500)) {
        let mut sorted = v.clone();
        sorted.sort();
        // Every adjacent pair must be in order
        for window in sorted.windows(2) {
            prop_assert!(window[0] <= window[1]);
        }
    }
}

// 3. Oracle property: compare two implementations
proptest! {
    #[test]
    fn fast_path_matches_slow_path(input in "[0-9a-f]{1,100}") {
        let result_fast = parse_hex_fast(&input);
        let result_slow = parse_hex_slow(&input);
        prop_assert_eq!(result_fast, result_slow);
    }
}

// 4. Custom strategies: generate domain-specific test data
fn valid_email() -> impl Strategy<Value = String> {
    ("[a-z]{1,20}", "[a-z]{1,10}", prop::sample::select(vec!["com", "org", "io"]))
        .prop_map(|(user, domain, tld)| format!("{}@{}.{}", user, domain, tld))
}

proptest! {
    #[test]
    fn email_parsing_accepts_valid_emails(email in valid_email()) {
        let result = Email::new(&email);
        prop_assert!(result.is_ok(), "Failed to parse: {}", email);
    }
}
```

### proptest vs FsCheck Comparison

| Feature | C# FsCheck | Rust proptest |
|---------|-----------|---------------|
| Random input generation | `Arb.Generate<T>()` | `any::<T>()` |
| Custom generators | `Arb.Register<T>()` | `impl Strategy<Value = T>` |
| Shrinking on failure | Automatic | Automatic |
| String patterns | Manual | `"[regex]"` strategy |
| Collection generation | `Gen.ListOf` | `prop::collection::vec(strategy, range)` |
| Composing generators | `Gen.Select` | `.prop_map()`, `.prop_flat_map()` |
| Config (# of cases) | `Config.MaxTest` | `#![proptest_config(ProptestConfig::with_cases(10000))]` inside `proptest!` block |

### When to Use Property Testing vs Unit Testing

| Use **unit tests** when | Use **proptest** when |
|------------------------|----------------------|
| Testing specific edge cases | Verifying invariants across all inputs |
| Testing error messages/codes | Roundtrip properties (parse ↔ format) |
| Integration/mock tests | Comparing two implementations |
| Behavior depends on exact values | "For all X, property P holds" |

---

## Integration Tests: the `tests/` Directory

Unit tests live inside `src/` with `#[cfg(test)]`. Integration tests live in a separate `tests/` directory and test your crate's **public API** — just like how C# integration tests reference the project as an external assembly.

```
my_crate/
├── src/
│   ├── lib.rs          // public API
│   └── internal.rs     // private implementation
├── tests/
│   ├── smoke.rs        // each file is a separate test binary
│   ├── api_tests.rs
│   └── common/
│       └── mod.rs      // shared test helpers
└── Cargo.toml
```

### Writing Integration Tests

Each file in `tests/` is compiled as a separate crate that depends on your library:

```rust
// tests/smoke.rs — can only access pub items from my_crate
use my_crate::{process_order, Order, OrderResult};

#[test]
fn process_valid_order_returns_confirmation() {
    let order = Order::new("SKU-001", 3);
    let result = process_order(order);
    assert!(matches!(result, OrderResult::Confirmed { .. }));
}
```

### Shared Test Helpers

Put shared setup code in `tests/common/mod.rs` (not `tests/common.rs`, which would be treated as its own test file):

```rust
// tests/common/mod.rs
use my_crate::Config;

pub fn test_config() -> Config {
    Config::builder()
        .database_url("sqlite::memory:")
        .build()
        .expect("test config must be valid")
}
```

```rust
// tests/api_tests.rs
mod common;

use my_crate::App;

#[test]
fn app_starts_with_test_config() {
    let config = common::test_config();
    let app = App::new(config);
    assert!(app.is_healthy());
}
```

### Running Specific Test Types

```bash
cargo test                  # run all tests (unit + integration)
cargo test --lib            # unit tests only (like dotnet test --filter Category=Unit)
cargo test --test smoke     # run only tests/smoke.rs
cargo test --test api_tests # run only tests/api_tests.rs
```

**Key difference from C#:** Integration test files can only access your crate's `pub` API. Private functions are invisible — this forces you to test through the public interface, which is generally better test design.

***


