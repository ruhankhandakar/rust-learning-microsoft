## Rust Macros: From Preprocessor to Metaprogramming

> **What you'll learn:** How Rust macros work, when to use them instead of functions or generics, and how they replace the C/C++ preprocessor. By the end of this chapter you can write your own `macro_rules!` macros and understand what `#[derive(Debug)]` does under the hood.

Macros are one of the first things you encounter in Rust (`println!("hello")` on line one) but one of the last things most courses explain. This chapter fixes that.

### Why Macros Exist

Functions and generics handle most code reuse in Rust. Macros fill the gaps where the type system can't reach:

| Need | Function/Generic? | Macro? | Why |
|------|-------------------|--------|-----|
| Compute a value | ✅ `fn max<T: Ord>(a: T, b: T) -> T` | — | Type system handles it |
| Accept variable number of arguments | ❌ Rust has no variadic functions | ✅ `println!("{} {}", a, b)` | Macros accept any number of tokens |
| Generate repetitive `impl` blocks | ❌ No way with generics alone | ✅ `macro_rules!` | Macros generate code at compile time |
| Run code at compile time | ❌ `const fn` is limited | ✅ Procedural macros | Full Rust code runs at compile time |
| Conditionally include code | ❌ | ✅ `#[cfg(...)]` | Attribute macros control compilation |

If you're coming from C/C++, think of macros as the *only correct replacement for the preprocessor* — except they operate on the syntax tree instead of raw text, so they're hygienic (no accidental name collisions) and type-aware.

> **For C developers:** Rust macros replace `#define` entirely. There is no textual preprocessor. See [ch18](ch18-cpp-rust-semantic-deep-dives.md) for the full preprocessor → Rust mapping.

---

## Declarative Macros with `macro_rules!`

Declarative macros (also called "macros by example") are Rust's most common macro form. They use pattern matching on syntax, similar to `match` on values.

### Basic syntax

```rust
macro_rules! say_hello {
    () => {
        println!("Hello!");
    };
}

fn main() {
    say_hello!();  // Expands to: println!("Hello!");
}
```

The `!` after the name is what tells you (and the compiler) this is a macro invocation.

### Pattern matching with arguments

Macros match on *token trees* using fragment specifiers:

```rust
macro_rules! greet {
    // Pattern 1: no arguments
    () => {
        println!("Hello, world!");
    };
    // Pattern 2: one expression argument
    ($name:expr) => {
        println!("Hello, {}!", $name);
    };
}

fn main() {
    greet!();           // "Hello, world!"
    greet!("Rust");     // "Hello, Rust!"
}
```

#### Fragment specifiers reference

| Specifier | Matches | Example |
|-----------|---------|---------|
| `$x:expr` | Any expression | `42`, `a + b`, `foo()` |
| `$x:ty` | A type | `i32`, `Vec<String>`, `&str` |
| `$x:ident` | An identifier | `foo`, `my_var` |
| `$x:pat` | A pattern | `Some(x)`, `_`, `(a, b)` |
| `$x:stmt` | A statement | `let x = 5;` |
| `$x:block` | A block | `{ println!("hi"); 42 }` |
| `$x:literal` | A literal | `42`, `"hello"`, `true` |
| `$x:tt` | A single token tree | Anything — the wildcard |
| `$x:item` | An item (fn, struct, impl, etc.) | `fn foo() {}` |

### Repetition — the killer feature

C/C++ macros can't loop. Rust macros can repeat patterns:

```rust
macro_rules! make_vec {
    // Match zero or more comma-separated expressions
    ( $( $element:expr ),* ) => {
        {
            let mut v = Vec::new();
            $( v.push($element); )*  // Repeat for each matched element
            v
        }
    };
}

fn main() {
    let v = make_vec![1, 2, 3, 4, 5];
    println!("{v:?}");  // [1, 2, 3, 4, 5]
}
```

The `$( ... ),*` syntax means "match zero or more of this pattern, separated by commas." The `$( ... )*` in the expansion repeats the body once for each match.

> **This is exactly how `vec![]` is implemented in the standard library.** The actual source is:
> ```rust
> macro_rules! vec {
>     () => { Vec::new() };
>     ($elem:expr; $n:expr) => { vec::from_elem($elem, $n) };
>     ($($x:expr),+ $(,)?) => { <[_]>::into_vec(Box::new([$($x),+])) };
> }
> ```
> The `$(,)?` at the end allows an optional trailing comma.

#### Repetition operators

| Operator | Meaning | Example |
|----------|---------|---------|
| `$( ... )*` | Zero or more | `vec![]`, `vec![1]`, `vec![1, 2, 3]` |
| `$( ... )+` | One or more | At least one element required |
| `$( ... )?` | Zero or one | Optional element |

### Practical example: a `hashmap!` constructor

The standard library has `vec![]` but no `hashmap!{}`. Let's build one:

```rust
macro_rules! hashmap {
    ( $( $key:expr => $value:expr ),* $(,)? ) => {
        {
            let mut map = std::collections::HashMap::new();
            $( map.insert($key, $value); )*
            map
        }
    };
}

fn main() {
    let scores = hashmap! {
        "Alice" => 95,
        "Bob" => 87,
        "Carol" => 92,  // trailing comma OK thanks to $(,)?
    };
    println!("{scores:?}");
}
```

### Practical example: diagnostic check macro

A pattern common in embedded/diagnostic code — check a condition and return an error:

```rust
use thiserror::Error;

#[derive(Error, Debug)]
enum DiagError {
    #[error("Check failed: {0}")]
    CheckFailed(String),
}

macro_rules! diag_check {
    ($cond:expr, $msg:expr) => {
        if !($cond) {
            return Err(DiagError::CheckFailed($msg.to_string()));
        }
    };
}

fn run_diagnostics(temp: f64, voltage: f64) -> Result<(), DiagError> {
    diag_check!(temp < 85.0, "GPU too hot");
    diag_check!(voltage > 0.8, "Rail voltage too low");
    diag_check!(voltage < 1.5, "Rail voltage too high");
    println!("All checks passed");
    Ok(())
}
```

> **C/C++ comparison:**
> ```c
> // C preprocessor — textual substitution, no type safety, no hygiene
> #define DIAG_CHECK(cond, msg) \
>     do { if (!(cond)) { log_error(msg); return -1; } } while(0)
> ```
> The Rust version returns a proper `Result` type, has no double-evaluation risk, and the compiler checks that `$cond` is actually a `bool` expression.

### Hygiene: why Rust macros are safe

C/C++ macro bugs often come from name collisions:

```c
// C: dangerous — `x` could shadow the caller's `x`
#define SQUARE(x) ((x) * (x))
int x = 5;
int result = SQUARE(x++);  // UB: x incremented twice!
```

Rust macros are **hygienic** — variables created inside a macro don't leak out:

```rust
macro_rules! make_x {
    () => {
        let x = 42;  // This `x` is scoped to the macro expansion
    };
}

fn main() {
    let x = 10;
    make_x!();
    println!("{x}");  // Prints 10, not 42 — hygiene prevents collision
}
```

The macro's `x` and the caller's `x` are treated as different variables by the compiler, even though they have the same name. **This is impossible with the C preprocessor.**

---

## Common Standard Library Macros

You've been using these since chapter 1 — here's what they actually do:

| Macro | What it does | Expands to (simplified) |
|-------|-------------|------------------------|
| `println!("{}", x)` | Format and print to stdout + newline | `std::io::_print(format_args!(...))` |
| `eprintln!("{}", x)` | Print to stderr + newline | Same but to stderr |
| `format!("{}", x)` | Format into a `String` | Allocates and returns a `String` |
| `vec![1, 2, 3]` | Create a `Vec` with elements | `Vec::from([1, 2, 3])` (approximately) |
| `todo!()` | Mark unfinished code | `panic!("not yet implemented")` |
| `unimplemented!()` | Mark deliberately unimplemented code | `panic!("not implemented")` |
| `unreachable!()` | Mark code the compiler can't prove unreachable | `panic!("unreachable")` |
| `assert!(cond)` | Panic if condition is false | `if !cond { panic!(...) }` |
| `assert_eq!(a, b)` | Panic if values aren't equal | Shows both values on failure |
| `dbg!(expr)` | Print expression + value to stderr, return value | `eprintln!("[file:line] expr = {:#?}", &expr); expr` |
| `include_str!("file.txt")` | Embed file contents as `&str` at compile time | Reads file during compilation |
| `include_bytes!("data.bin")` | Embed file contents as `&[u8]` at compile time | Reads file during compilation |
| `cfg!(condition)` | Compile-time condition as a `bool` | `true` or `false` based on target |
| `env!("VAR")` | Read environment variable at compile time | Fails compilation if not set |
| `concat!("a", "b")` | Concatenate literals at compile time | `"ab"` |

### `dbg!` — the debugging macro you'll use daily

```rust
fn factorial(n: u32) -> u32 {
    if dbg!(n <= 1) {     // Prints: [src/main.rs:2] n <= 1 = false
        dbg!(1)           // Prints: [src/main.rs:3] 1 = 1
    } else {
        dbg!(n * factorial(n - 1))  // Prints intermediate values
    }
}

fn main() {
    dbg!(factorial(4));   // Prints all recursive calls with file:line
}
```

`dbg!` returns the value it wraps, so you can insert it anywhere without changing program behavior. It prints to stderr (not stdout), so it doesn't interfere with program output. **Remove all `dbg!` calls before committing code.**

### Format string syntax

Since `println!`, `format!`, `eprintln!`, and `write!` all use the same format machinery, here's the quick reference:

```rust
let name = "sensor";
let value = 3.14159;
let count = 42;

println!("{name}");                    // Variable by name (Rust 1.58+)
println!("{}", name);                  // Positional
println!("{value:.2}");                // 2 decimal places: "3.14"
println!("{count:>10}");               // Right-aligned, width 10: "        42"
println!("{count:0>10}");              // Zero-padded: "0000000042"
println!("{count:#06x}");              // Hex with prefix: "0x002a"
println!("{count:#010b}");             // Binary with prefix: "0b00101010"
println!("{value:?}");                 // Debug format
println!("{value:#?}");                // Pretty-printed Debug format
```

> **For C developers:** Think of this as a type-safe `printf` — the compiler checks that `{:.2}` is applied to a float, not a string. No `%s`/`%d` format mismatch bugs.
>
> **For C++ developers:** This replaces `std::cout << std::fixed << std::setprecision(2) << value` with a single readable format string.

---

## Derive Macros

You've seen `#[derive(...)]` on nearly every struct in this book:

```rust
#[derive(Debug, Clone, PartialEq)]
struct Point {
    x: f64,
    y: f64,
}
```

`#[derive(Debug)]` is a **derive macro** — a special kind of procedural macro that generates trait implementations automatically. Here's what it produces (simplified):

```rust
// What #[derive(Debug)] generates for Point:
impl std::fmt::Debug for Point {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("Point")
            .field("x", &self.x)
            .field("y", &self.y)
            .finish()
    }
}
```

Without `#[derive(Debug)]`, you'd have to write that `impl` block by hand for every struct.

### Commonly derived traits

| Derive | What it generates | When to use |
|--------|-------------------|-------------|
| `Debug` | `{:?}` formatting | Almost always — enables printing for debugging |
| `Clone` | `.clone()` method | When you need to duplicate values |
| `Copy` | Implicit copy on assignment | Small, stack-only types (integers, `[f64; 3]`) |
| `PartialEq` / `Eq` | `==` and `!=` operators | When you need equality comparison |
| `PartialOrd` / `Ord` | `<`, `>`, `<=`, `>=` operators | When you need ordering |
| `Hash` | Hashing for `HashMap`/`HashSet` keys | Types used as map keys |
| `Default` | `Type::default()` constructor | Types with sensible zero/empty values |
| `serde::Serialize` / `Deserialize` | JSON/TOML/etc. serialization | Data types that cross API boundaries |

### The derive decision tree

```text
Should I derive it?
  │
  ├── Does my type contain only types that implement the trait?
  │     ├── Yes → #[derive] will work
  │     └── No  → Write a manual impl (or skip it)
  │
  └── Will users of my type reasonably expect this behavior?
        ├── Yes → Derive it (Debug, Clone, PartialEq are almost always reasonable)
        └── No  → Don't derive (e.g., don't derive Copy for a type with a file handle)
```

> **C++ comparison:** `#[derive(Clone)]` is like auto-generating a correct copy constructor. `#[derive(PartialEq)]` is like auto-generating `operator==` that compares each field — something C++20's `= default` spaceship operator finally provides.

---

## Attribute Macros

Attribute macros transform the item they're attached to. You've already used several:

```rust
#[test]                    // Marks a function as a test
fn test_addition() {
    assert_eq!(2 + 2, 4);
}

#[cfg(target_os = "linux")] // Conditionally includes this function
fn linux_only() { /* ... */ }

#[derive(Debug)]            // Generates Debug implementation
struct MyType { /* ... */ }

#[allow(dead_code)]         // Suppresses a compiler warning
fn unused_helper() { /* ... */ }

#[must_use]                 // Warn if return value is discarded
fn compute_checksum(data: &[u8]) -> u32 { /* ... */ }
```

Common built-in attributes:

| Attribute | Purpose |
|-----------|---------|
| `#[test]` | Mark as test function |
| `#[cfg(...)]` | Conditional compilation |
| `#[derive(...)]` | Auto-generate trait impls |
| `#[allow(...)]` / `#[deny(...)]` / `#[warn(...)]` | Control lint levels |
| `#[must_use]` | Warn on unused return values |
| `#[inline]` / `#[inline(always)]` | Hint to inline the function |
| `#[repr(C)]` | Use C-compatible memory layout (for FFI) |
| `#[no_mangle]` | Don't mangle the symbol name (for FFI) |
| `#[deprecated]` | Mark as deprecated with optional message |

> **For C/C++ developers:** Attributes replace a mix of preprocessor directives (`#pragma`, `__attribute__((...))`), and compiler-specific extensions. They're part of the language grammar, not bolted-on extensions.

---

## Procedural Macros (Conceptual Overview)

Procedural macros ("proc macros") are macros written as *separate Rust programs* that run at compile time and generate code. They're more powerful than `macro_rules!` but also more complex.

There are three kinds:

| Kind | Syntax | Example | What it does |
|------|--------|---------|-------------|
| **Function-like** | `my_macro!(...)` | `sql!(SELECT * FROM users)` | Parses custom syntax, generates Rust code |
| **Derive** | `#[derive(MyTrait)]` | `#[derive(Serialize)]` | Generates trait impl from struct definition |
| **Attribute** | `#[my_attr]` | `#[tokio::main]`, `#[instrument]` | Transforms the annotated item |

### You've already used proc macros

- `#[derive(Error)]` from `thiserror` — generates `Display` and `From` impls for error enums
- `#[derive(Serialize, Deserialize)]` from `serde` — generates serialization code
- `#[tokio::main]` — transforms `async fn main()` into a runtime setup + block_on
- `#[test]` — registered by the test harness (built-in proc macro)

### When to write your own proc macro

You likely won't need to write proc macros during this course. They're useful when:
- You need to inspect struct fields/enum variants at compile time (derive macros)
- You're building a domain-specific language (function-like macros)
- You need to transform function signatures (attribute macros)

For most code, `macro_rules!` or plain functions are sufficient.

> **C++ comparison:** Procedural macros fill the role that code generators, template metaprogramming, and external tools like `protoc` fill in C++. The difference is that proc macros are part of the cargo build pipeline — no external build steps, no CMake custom commands.

---

## When to Use What: Macros vs Functions vs Generics

```text
Need to generate code?
  │
  ├── No → Use a function or generic function
  │         (simpler, better error messages, IDE support)
  │
  └── Yes ─┬── Variable number of arguments?
            │     └── Yes → macro_rules! (e.g., println!, vec!)
            │
            ├── Repetitive impl blocks for many types?
            │     └── Yes → macro_rules! with repetition
            │
            ├── Need to inspect struct fields?
            │     └── Yes → Derive macro (proc macro)
            │
            ├── Need custom syntax (DSL)?
            │     └── Yes → Function-like proc macro
            │
            └── Need to transform a function/struct?
                  └── Yes → Attribute proc macro
```

**General guideline:** If a function or generic can do it, don't use a macro. Macros have worse error messages, no IDE auto-complete inside the macro body, and are harder to debug.

---

## Exercises

### 🟢 Exercise 1: `min!` macro

Write a `min!` macro that:
- `min!(a, b)` returns the smaller of two values
- `min!(a, b, c)` returns the smallest of three values
- Works with any type that implements `PartialOrd`

**Hint:** You'll need two match arms in your `macro_rules!`.

<details><summary>Solution (click to expand)</summary>

```rust
macro_rules! min {
    ($a:expr, $b:expr) => {
        if $a < $b { $a } else { $b }
    };
    ($a:expr, $b:expr, $c:expr) => {
        min!(min!($a, $b), $c)
    };
}

fn main() {
    println!("{}", min!(3, 7));        // 3
    println!("{}", min!(9, 2, 5));     // 2
    println!("{}", min!(1.5, 0.3));    // 0.3
}
```

**Note:** For production code, prefer `std::cmp::min` or `a.min(b)`. This exercise demonstrates the mechanics of multi-arm macros.

</details>

### 🟡 Exercise 2: `hashmap!` from scratch

Without looking at the example above, write a `hashmap!` macro that:
- Creates a `HashMap` from `key => value` pairs
- Supports trailing commas
- Works with any hashable key type

Test with:
```rust
let m = hashmap! {
    "name" => "Alice",
    "role" => "Engineer",
};
assert_eq!(m["name"], "Alice");
assert_eq!(m.len(), 2);
```

<details><summary>Solution (click to expand)</summary>

```rust
use std::collections::HashMap;

macro_rules! hashmap {
    ( $( $key:expr => $val:expr ),* $(,)? ) => {{
        let mut map = HashMap::new();
        $( map.insert($key, $val); )*
        map
    }};
}

fn main() {
    let m = hashmap! {
        "name" => "Alice",
        "role" => "Engineer",
    };
    assert_eq!(m["name"], "Alice");
    assert_eq!(m.len(), 2);
    println!("Tests passed!");
}
```

</details>

### 🟡 Exercise 3: `assert_approx_eq!` for floating-point comparison

Write a macro `assert_approx_eq!(a, b, epsilon)` that panics if `|a - b| > epsilon`. This is useful for testing floating-point calculations where exact equality fails.

Test with:
```rust
assert_approx_eq!(0.1 + 0.2, 0.3, 1e-10);        // Should pass
assert_approx_eq!(3.14159, std::f64::consts::PI, 1e-4); // Should pass
// assert_approx_eq!(1.0, 2.0, 0.5);              // Should panic
```

<details><summary>Solution (click to expand)</summary>

```rust
macro_rules! assert_approx_eq {
    ($a:expr, $b:expr, $eps:expr) => {
        let (a, b, eps) = ($a as f64, $b as f64, $eps as f64);
        let diff = (a - b).abs();
        if diff > eps {
            panic!(
                "assertion failed: |{} - {}| = {} > {} (epsilon)",
                a, b, diff, eps
            );
        }
    };
}

fn main() {
    assert_approx_eq!(0.1 + 0.2, 0.3, 1e-10);
    assert_approx_eq!(3.14159, std::f64::consts::PI, 1e-4);
    println!("All float comparisons passed!");
}
```

</details>

### 🔴 Exercise 4: `impl_display_for_enum!`

Write a macro that generates a `Display` implementation for simple C-like enums. Given:

```rust
impl_display_for_enum! {
    enum Color {
        Red => "red",
        Green => "green",
        Blue => "blue",
    }
}
```

It should generate both the `enum Color { Red, Green, Blue }` definition AND the `impl Display for Color` that maps each variant to its string.

**Hint:** You'll need both `$( ... ),*` repetition and multiple fragment specifiers.

<details><summary>Solution (click to expand)</summary>

```rust
use std::fmt;

macro_rules! impl_display_for_enum {
    (enum $name:ident { $( $variant:ident => $display:expr ),* $(,)? }) => {
        #[derive(Debug, Clone, Copy, PartialEq)]
        enum $name {
            $( $variant ),*
        }

        impl fmt::Display for $name {
            fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
                match self {
                    $( $name::$variant => write!(f, "{}", $display), )*
                }
            }
        }
    };
}

impl_display_for_enum! {
    enum Color {
        Red => "red",
        Green => "green",
        Blue => "blue",
    }
}

fn main() {
    let c = Color::Green;
    println!("Color: {c}");          // "Color: green"
    println!("Debug: {c:?}");        // "Debug: Green"
    assert_eq!(format!("{}", Color::Red), "red");
    println!("All tests passed!");
}
```

</details>
