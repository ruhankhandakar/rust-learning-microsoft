## Best Practices for C# Developers

> **What you'll learn:** Five critical mindset shifts (GC→ownership, exceptions→Results, inheritance→composition),
> idiomatic project organization, error handling strategy, testing patterns, and the most common
> mistakes C# developers make in Rust.
>
> **Difficulty:** 🟡 Intermediate

### 1. **Mindset Shifts**
- **From GC to Ownership**: Think about who owns data and when it's freed
- **From Exceptions to Results**: Make error handling explicit and visible
- **From Inheritance to Composition**: Use traits to compose behavior
- **From Null to Option**: Make absence of values explicit in the type system

### 2. **Code Organization**
```rust
// Structure projects like C# solutions
src/
├── main.rs          // Program.cs equivalent
├── lib.rs           // Library entry point
├── models/          // Like Models/ folder in C#
│   ├── mod.rs
│   ├── user.rs
│   └── product.rs
├── services/        // Like Services/ folder
│   ├── mod.rs
│   ├── user_service.rs
│   └── product_service.rs
├── controllers/     // Like Controllers/ (for web apps)
├── repositories/    // Like Repositories/
└── utils/          // Like Utilities/
```

### 3. **Error Handling Strategy**
```rust
// Create a common Result type for your application
pub type AppResult<T> = Result<T, AppError>;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),
    
    #[error("HTTP error: {0}")]
    Http(#[from] reqwest::Error),
    
    #[error("Validation error: {message}")]
    Validation { message: String },
    
    #[error("Business logic error: {message}")]
    Business { message: String },
}

// Use throughout your application
pub async fn create_user(data: CreateUserRequest) -> AppResult<User> {
    validate_user_data(&data)?;  // Returns AppError::Validation
    let user = repository.create_user(data).await?;  // Returns AppError::Database
    Ok(user)
}
```

### 4. **Testing Patterns**
```rust
// Structure tests like C# unit tests
#[cfg(test)]
mod tests {
    use super::*;
    use rstest::*;  // For parameterized tests like C# [Theory]
    
    #[test]
    fn test_basic_functionality() {
        // Arrange
        let input = "test data";
        
        // Act
        let result = process_data(input);
        
        // Assert
        assert_eq!(result, "expected output");
    }
    
    #[rstest]
    #[case(1, 2, 3)]
    #[case(5, 5, 10)]
    #[case(0, 0, 0)]
    fn test_addition(#[case] a: i32, #[case] b: i32, #[case] expected: i32) {
        assert_eq!(add(a, b), expected);
    }
    
    #[tokio::test]  // For async tests
    async fn test_async_functionality() {
        let result = async_function().await;
        assert!(result.is_ok());
    }
}
```

### 5. **Common Mistakes to Avoid**
```rust
// [ERROR] Don't try to implement inheritance
// Instead of:
// struct Manager : Employee  // This doesn't exist in Rust

// [OK] Use composition with traits
trait Employee {
    fn get_salary(&self) -> u32;
}

trait Manager: Employee {
    fn get_team_size(&self) -> usize;
}

// [ERROR] Don't use unwrap() everywhere (like ignoring exceptions)
let value = might_fail().unwrap();  // Can panic!

// [OK] Handle errors properly
let value = match might_fail() {
    Ok(v) => v,
    Err(e) => {
        log::error!("Operation failed: {}", e);
        return Err(e.into());
    }
};

// [ERROR] Don't clone everything (like copying objects unnecessarily)
let data = expensive_data.clone();  // Expensive!

// [OK] Use borrowing when possible
let data = &expensive_data;  // Just a reference

// [ERROR] Don't use RefCell everywhere (like making everything mutable)
struct Data {
    value: RefCell<i32>,  // Interior mutability - use sparingly
}

// [OK] Prefer owned or borrowed data
struct Data {
    value: i32,  // Simple and clear
}
```

This guide provides C# developers with a comprehensive understanding of how their existing knowledge translates to Rust, highlighting both the similarities and the fundamental differences in approach. The key is understanding that Rust's constraints (like ownership) are designed to prevent entire classes of bugs that are possible in C#, at the cost of some initial complexity.

---

### 6. **Avoiding Excessive `clone()`** 🟡

C# developers instinctively clone data because the GC handles the cost. In Rust, every `.clone()` is an explicit allocation. Most can be eliminated with borrowing.

```rust
// [ERROR] C# habit: cloning strings to pass around
fn greet(name: String) {
    println!("Hello, {name}");
}

let user_name = String::from("Alice");
greet(user_name.clone());  // unnecessary allocation
greet(user_name.clone());  // and again

// [OK] Borrow instead — zero allocation
fn greet(name: &str) {
    println!("Hello, {name}");
}

let user_name = String::from("Alice");
greet(&user_name);  // borrows
greet(&user_name);  // borrows again — no cost
```

**When clone is appropriate:**
- Moving data into a thread or `'static` closure (`Arc::clone` is cheap — it bumps a counter)
- Caching: you genuinely need an independent copy
- Prototyping: get it working, then remove clones later

**Decision checklist:**
1. Can you pass `&T` or `&str` instead? → Do that
2. Does the callee need ownership? → Pass by move, not clone
3. Is it shared across threads? → Use `Arc<T>` (clone is just a reference count bump)
4. None of the above? → `clone()` is justified

---

### 7. **Avoiding `unwrap()` in Production Code** 🟡

C# developers who ignore exceptions write `.unwrap()` everywhere in Rust. Both are equally dangerous.

```rust
// [ERROR] The "I'll fix this later" trap
let config = std::fs::read_to_string("config.toml").unwrap();
let port: u16 = config_value.parse().unwrap();
let conn = db_pool.get().await.unwrap();

// [OK] Propagate with ? in application code
let config = std::fs::read_to_string("config.toml")?;
let port: u16 = config_value.parse()?;
let conn = db_pool.get().await?;

// [OK] Use expect() only when failure is truly a bug
let home = std::env::var("HOME")
    .expect("HOME environment variable must be set");  // documents the invariant
```

**Rule of thumb:**
| Method | When to use |
|--------|------------|
| `?` | Application/library code — propagate to caller |
| `expect("reason")` | Startup assertions, invariants that *must* hold |
| `unwrap()` | Tests only, or after an `is_some()`/`is_ok()` check |
| `unwrap_or(default)` | When you have a sensible fallback |
| `unwrap_or_else(|| ...)` | When the fallback is expensive to compute |

---

### 8. **Fighting the Borrow Checker (and How to Stop)** 🟡

Every C# developer hits a phase where the borrow checker rejects valid-seeming code. The fix is usually a structural change, not a workaround.

```rust
// [ERROR] Trying to mutate while iterating (C# foreach + modify pattern)
let mut items = vec![1, 2, 3, 4, 5];
for item in &items {
    if *item > 3 {
        items.push(*item * 2);  // ERROR: can't borrow items as mutable
    }
}

// [OK] Collect first, then mutate
let extras: Vec<i32> = items.iter()
    .filter(|&&x| x > 3)
    .map(|&x| x * 2)
    .collect();
items.extend(extras);
```

```rust
// [ERROR] Returning a reference to a local (C# returns references freely via GC)
fn get_greeting() -> &str {
    let s = String::from("hello");
    &s  // ERROR: s is dropped at end of function
}

// [OK] Return owned data
fn get_greeting() -> String {
    String::from("hello")  // caller owns it
}
```

**Common patterns that resolve borrow checker conflicts:**

| C# habit | Rust solution |
|----------|--------------|
| Store references in structs | Use owned data, or add lifetime parameters |
| Mutate shared state freely | Use `Arc<Mutex<T>>` or restructure to avoid sharing |
| Return references to locals | Return owned values |
| Modify collection while iterating | Collect changes, then apply |
| Multiple mutable references | Split struct into independent parts |

---

### 9. **Collapsing Assignment Pyramids** 🟢

C# developers write chains of `if (x != null) { if (x.Value > 0) { ... } }`. Rust's `match`, `if let`, and `?` flatten these.

```rust
// [ERROR] Nested null-checking style from C#
fn process(input: Option<String>) -> Option<usize> {
    match input {
        Some(s) => {
            if !s.is_empty() {
                match s.parse::<usize>() {
                    Ok(n) => {
                        if n > 0 {
                            Some(n * 2)
                        } else {
                            None
                        }
                    }
                    Err(_) => None,
                }
            } else {
                None
            }
        }
        None => None,
    }
}

// [OK] Flatten with combinators
fn process(input: Option<String>) -> Option<usize> {
    input
        .filter(|s| !s.is_empty())
        .and_then(|s| s.parse::<usize>().ok())
        .filter(|&n| n > 0)
        .map(|n| n * 2)
}
```

**Key combinators every C# developer should know:**

| Combinator | What it does | C# equivalent |
|-----------|-------------|---------------|
| `map` | Transform the inner value | `Select` / null-conditional `?.` |
| `and_then` | Chain operations that return Option/Result | `SelectMany` / `?.Method()` |
| `filter` | Keep value only if predicate passes | `Where` |
| `unwrap_or` | Provide default | `?? defaultValue` |
| `ok()` | Convert `Result` to `Option` (discard error) | — |
| `transpose` | Flip `Option<Result>` to `Result<Option>` | — |



