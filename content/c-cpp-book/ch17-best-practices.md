# Rust Best Practices Summary

> **What you'll learn:** Practical guidelines for writing idiomatic Rust — code organization, naming conventions, error handling patterns, and documentation. A quick-reference chapter you'll return to often.

## Code Organization
- **Prefer small functions**: Easy to test and reason about
- **Use descriptive names**: `calculate_total_price()` vs `calc()`
- **Group related functionality**: Use modules and separate files
- **Write documentation**: Use `///` for public APIs

## Error Handling
- **Avoid `unwrap()` unless infallible**: Only use when you're 100% certain it won't panic
```rust
// Bad: Can panic
let value = some_option.unwrap();

// Good: Handle the None case
let value = some_option.unwrap_or(default_value);
let value = some_option.unwrap_or_else(|| expensive_computation());
let value = some_option.unwrap_or_default(); // Uses Default trait

// For Result<T, E>
let value = some_result.unwrap_or(fallback_value);
let value = some_result.unwrap_or_else(|err| {
    eprintln!("Error occurred: {err}");
    default_value
});
```
- **Use `expect()` with descriptive messages**: When unwrap is justified, explain why
```rust
let config = std::env::var("CONFIG_PATH")
    .expect("CONFIG_PATH environment variable must be set");
```
- **Return `Result<T, E>` for fallible operations**: Let callers decide how to handle errors
- **Use `thiserror` for custom error types**: More ergonomic than manual implementations
```rust
use thiserror::Error;

#[derive(Error, Debug)]
pub enum MyError {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    
    #[error("Parse error: {message}")]
    Parse { message: String },
    
    #[error("Value {value} is out of range")]
    OutOfRange { value: i32 },
}
```
- **Chain errors with `?` operator**: Propagate errors up the call stack
- **Prefer `thiserror` over `anyhow`**: Our team convention is to define explicit error
  enums with `#[derive(thiserror::Error)]` so callers can match on specific variants.
  `anyhow::Error` is convenient for quick prototyping but erases the error type, making
  it harder for callers to handle specific failures. Use `thiserror` for library and
  production code; reserve `anyhow` for throwaway scripts or top-level binaries where
  you only need to print the error.
- **When `unwrap()` is acceptable**:
  - **Unit tests**: `assert_eq!(result.unwrap(), expected)`
  - **Prototyping**: Quick and dirty code that you'll replace
  - **Infallible operations**: When you can prove it won't fail
```rust
let numbers = vec![1, 2, 3];
let first = numbers.get(0).unwrap(); // Safe: we just created the vec with elements

// Better: Use expect() with explanation
let first = numbers.get(0).expect("numbers vec is non-empty by construction");
```
- **Fail fast**: Check preconditions early and return errors immediately

## Memory Management
- **Prefer borrowing over cloning**: Use `&T` instead of cloning when possible
- **Use `Rc<T>` sparingly**: Only when you need shared ownership
- **Limit lifetimes**: Use scopes `{}` to control when values are dropped
- **Avoid `RefCell<T>` in public APIs**: Keep interior mutability internal

## Performance
- **Profile before optimizing**: Use `cargo bench` and profiling tools
- **Prefer iterators over loops**: More readable and often faster
- **Use `&str` over `String`**: When you don't need ownership
- **Consider `Box<T>` for large stack objects**: Move them to heap if needed

## Essential Traits to Implement

### Core Traits Every Type Should Consider

When creating custom types, consider implementing these fundamental traits to make your types feel native to Rust:

#### **Debug and Display**
```rust
use std::fmt;

#[derive(Debug)]  // Automatic implementation for debugging
struct Person {
    name: String,
    age: u32,
}

// Manual Display implementation for user-facing output
impl fmt::Display for Person {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{} (age {})", self.name, self.age)
    }
}

// Usage:
let person = Person { name: "Alice".to_string(), age: 30 };
println!("{:?}", person);  // Debug: Person { name: "Alice", age: 30 }
println!("{}", person);    // Display: Alice (age 30)
```

#### **Clone and Copy**
```rust
// Copy: Implicit duplication for small, simple types
#[derive(Debug, Clone, Copy)]
struct Point {
    x: i32,
    y: i32,
}

// Clone: Explicit duplication for complex types
#[derive(Debug, Clone)]
struct Person {
    name: String,  // String doesn't implement Copy
    age: u32,
}

let p1 = Point { x: 1, y: 2 };
let p2 = p1;  // Copy (implicit)

let person1 = Person { name: "Bob".to_string(), age: 25 };
let person2 = person1.clone();  // Clone (explicit)
```

#### **PartialEq and Eq**
```rust
#[derive(Debug, PartialEq, Eq)]
struct UserId(u64);

#[derive(Debug, PartialEq)]
struct Temperature {
    celsius: f64,  // f64 doesn't implement Eq (due to NaN)
}

let id1 = UserId(123);
let id2 = UserId(123);
assert_eq!(id1, id2);  // Works because of PartialEq

let temp1 = Temperature { celsius: 20.0 };
let temp2 = Temperature { celsius: 20.0 };
assert_eq!(temp1, temp2);  // Works with PartialEq
```

#### **PartialOrd and Ord**
```rust
#[derive(Debug, PartialEq, Eq, PartialOrd, Ord)]
struct Priority(u8);

let high = Priority(1);
let low = Priority(10);
assert!(high < low);  // Lower numbers = higher priority

// Use in collections
let mut priorities = vec![Priority(5), Priority(1), Priority(8)];
priorities.sort();  // Works because Priority implements Ord
```

#### **Default**
```rust
#[derive(Debug, Default)]
struct Config {
    debug: bool,           // false (default)
    max_connections: u32,  // 0 (default)
    timeout: Option<u64>,  // None (default)
}

// Custom Default implementation
impl Default for Config {
    fn default() -> Self {
        Config {
            debug: false,
            max_connections: 100,  // Custom default
            timeout: Some(30),     // Custom default
        }
    }
}

let config = Config::default();
let config = Config { debug: true, ..Default::default() };  // Partial override
```

#### **From and Into**
```rust
struct UserId(u64);
struct UserName(String);

// Implement From, and Into comes for free
impl From<u64> for UserId {
    fn from(id: u64) -> Self {
        UserId(id)
    }
}

impl From<String> for UserName {
    fn from(name: String) -> Self {
        UserName(name)
    }
}

impl From<&str> for UserName {
    fn from(name: &str) -> Self {
        UserName(name.to_string())
    }
}

// Usage:
let user_id: UserId = 123u64.into();         // Using Into
let user_id = UserId::from(123u64);          // Using From
let username = UserName::from("alice");      // &str -> UserName
let username: UserName = "bob".into();       // Using Into
```

#### **TryFrom and TryInto**
```rust
use std::convert::TryFrom;

struct PositiveNumber(u32);

#[derive(Debug)]
struct NegativeNumberError;

impl TryFrom<i32> for PositiveNumber {
    type Error = NegativeNumberError;
    
    fn try_from(value: i32) -> Result<Self, Self::Error> {
        if value >= 0 {
            Ok(PositiveNumber(value as u32))
        } else {
            Err(NegativeNumberError)
        }
    }
}

// Usage:
let positive = PositiveNumber::try_from(42)?;     // Ok(PositiveNumber(42))
let error = PositiveNumber::try_from(-5);         // Err(NegativeNumberError)
```

#### **Serde (for serialization)**
```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
struct User {
    id: u64,
    name: String,
    email: String,
}

// Automatic JSON serialization/deserialization
let user = User {
    id: 1,
    name: "Alice".to_string(),
    email: "alice@example.com".to_string(),
};

let json = serde_json::to_string(&user)?;
let deserialized: User = serde_json::from_str(&json)?;
```

### Trait Implementation Checklist

For any new type, consider this checklist:

```rust
#[derive(
    Debug,          // [OK] Always implement for debugging
    Clone,          // [OK] If the type should be duplicatable
    PartialEq,      // [OK] If the type should be comparable
    Eq,             // [OK] If comparison is reflexive/transitive
    PartialOrd,     // [OK] If the type has ordering
    Ord,            // [OK] If ordering is total
    Hash,           // [OK] If type will be used as HashMap key
    Default,        // [OK] If there's a sensible default value
)]
struct MyType {
    // fields...
}

// Manual implementations to consider:
impl Display for MyType { /* user-facing representation */ }
impl From<OtherType> for MyType { /* convenient conversion */ }
impl TryFrom<FallibleType> for MyType { /* fallible conversion */ }
```

### When NOT to Implement Traits

- **Don't implement Copy for types with heap data**: `String`, `Vec`, `HashMap` etc.
- **Don't implement Eq if values can be NaN**: Types containing `f32`/`f64`
- **Don't implement Default if there's no sensible default**: File handles, network connections
- **Don't implement Clone if cloning is expensive**: Large data structures (consider `Rc<T>` instead)

### Summary: Trait Benefits

| Trait | Benefit | When to Use |
|-------|---------|-------------|
| `Debug` | `println!("{:?}", value)` | Always (except rare cases) |
| `Display` | `println!("{}", value)` | User-facing types |
| `Clone` | `value.clone()` | When explicit duplication makes sense |
| `Copy` | Implicit duplication | Small, simple types |
| `PartialEq` | `==` and `!=` operators | Most types |
| `Eq` | Reflexive equality | When equality is mathematically sound |
| `PartialOrd` | `<`, `>`, `<=`, `>=` | Types with natural ordering |
| `Ord` | `sort()`, `BinaryHeap` | When ordering is total |
| `Hash` | `HashMap` keys | Types used as map keys |
| `Default` | `Default::default()` | Types with obvious defaults |
| `From/Into` | Convenient conversions | Common type conversions |
| `TryFrom/TryInto` | Fallible conversions | Conversions that can fail |

----

----


