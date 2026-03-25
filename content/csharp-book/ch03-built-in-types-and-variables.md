## Variables and Mutability

> **What you'll learn:** Rust's variable declaration and mutability model vs C#'s `var`/`const`,
> primitive type mappings, the critical `String` vs `&str` distinction, type inference,
> and how Rust handles casting and conversions differently from C#.
>
> **Difficulty:** 🟢 Beginner

### C# Variable Declaration
```csharp
// C# - Variables are mutable by default
int count = 0;           // Mutable
count = 5;               // ✅ Works

// readonly fields (class-level only, not for local variables)
// readonly int maxSize = 100;  // Immutable after initialization

const int BUFFER_SIZE = 1024; // Compile-time constant (works as local or field)
```

### Rust Variable Declaration
```rust
// Rust - Variables are immutable by default
let count = 0;           // Immutable by default
// count = 5;            // ❌ Compile error: cannot assign twice to immutable variable

let mut count = 0;       // Explicitly mutable
count = 5;               // ✅ Works

const BUFFER_SIZE: usize = 1024; // Compile-time constant
```

### Key Mental Shift for C# Developers
```rust
// Think of 'let' as C#'s readonly field semantics applied to all variables
let name = "John";       // Like a readonly field: once set, cannot change
let mut age = 30;        // Like: int age = 30;

// Variable shadowing (unique to Rust)
let spaces = "   ";      // String
let spaces = spaces.len(); // Now it's a number (usize)
// This is different from mutation - we're creating a new variable
```

### Practical Example: Counter
```csharp
// C# version
public class Counter
{
    private int value = 0;
    
    public void Increment()
    {
        value++;  // Mutation
    }
    
    public int GetValue() => value;
}
```

```rust
// Rust version
pub struct Counter {
    value: i32,  // Private by default
}

impl Counter {
    pub fn new() -> Counter {
        Counter { value: 0 }
    }
    
    pub fn increment(&mut self) {  // &mut needed for mutation
        self.value += 1;
    }
    
    pub fn get_value(&self) -> i32 {
        self.value
    }
}
```

***

## Data Types Comparison

### Primitive Types

| C# Type | Rust Type | Size | Range |
|---------|-----------|------|-------|
| `byte` | `u8` | 8 bits | 0 to 255 |
| `sbyte` | `i8` | 8 bits | -128 to 127 |
| `short` | `i16` | 16 bits | -32,768 to 32,767 |
| `ushort` | `u16` | 16 bits | 0 to 65,535 |
| `int` | `i32` | 32 bits | -2³¹ to 2³¹-1 |
| `uint` | `u32` | 32 bits | 0 to 2³²-1 |
| `long` | `i64` | 64 bits | -2⁶³ to 2⁶³-1 |
| `ulong` | `u64` | 64 bits | 0 to 2⁶⁴-1 |
| `float` | `f32` | 32 bits | IEEE 754 |
| `double` | `f64` | 64 bits | IEEE 754 |
| `bool` | `bool` | 1 bit | true/false |
| `char` | `char` | 32 bits | Unicode scalar |

### Size Types (Important!)
```csharp
// C# - int is always 32-bit
int arrayIndex = 0;
long fileSize = file.Length;
```

```rust
// Rust - size types match pointer size (32-bit or 64-bit)
let array_index: usize = 0;    // Like size_t in C
let file_size: u64 = file.len(); // Explicit 64-bit
```

### Type Inference
```csharp
// C# - var keyword
var name = "John";        // string
var count = 42;           // int
var price = 29.99;        // double
```

```rust
// Rust - automatic type inference
let name = "John";        // &str (string slice)
let count = 42;           // i32 (default integer)
let price = 29.99;        // f64 (default float)

// Explicit type annotations
let count: u32 = 42;
let price: f32 = 29.99;
```

### Arrays and Collections Overview
```csharp
// C# - reference types, heap allocated
int[] numbers = new int[5];        // Fixed size
List<int> list = new List<int>();  // Dynamic size
```

```rust
// Rust - multiple options
let numbers: [i32; 5] = [1, 2, 3, 4, 5];  // Stack array, fixed size
let mut list: Vec<i32> = Vec::new();       // Heap vector, dynamic size
```

***

## String Types: String vs &str

This is one of the most confusing concepts for C# developers, so let's break it down carefully.

### C# String Handling
```csharp
// C# - Simple string model
string name = "John";           // String literal
string greeting = "Hello, " + name;  // String concatenation
string upper = name.ToUpper();  // Method call
```

### Rust String Types
```rust
// Rust - Two main string types

// 1. &str (string slice) - like ReadOnlySpan<char> in C#
let name: &str = "John";        // String literal (immutable, borrowed)

// 2. String - like StringBuilder or mutable string
let mut greeting = String::new();       // Empty string
greeting.push_str("Hello, ");          // Append
greeting.push_str(name);               // Append

// Or create directly
let greeting = String::from("Hello, John");
let greeting = "Hello, John".to_string();  // Convert &str to String
```

### When to Use Which?

| Scenario | Use | C# Equivalent |
|----------|-----|---------------|
| String literals | `&str` | `string` literal |
| Function parameters (read-only) | `&str` | `string` or `ReadOnlySpan<char>` |
| Owned, mutable strings | `String` | `StringBuilder` |
| Return owned strings | `String` | `string` |

### Practical Examples
```rust
// Function that accepts any string type
fn greet(name: &str) {  // Accepts both String and &str
    println!("Hello, {}!", name);
}

fn main() {
    let literal = "John";                    // &str
    let owned = String::from("Jane");        // String
    
    greet(literal);                          // Works
    greet(&owned);                           // Works (borrow String as &str)
    greet("Bob");                            // Works
}

// Function that returns owned string
fn create_greeting(name: &str) -> String {
    format!("Hello, {}!", name)  // format! macro returns String
}
```

### C# Developers: Think of it This Way
```rust
// &str is like ReadOnlySpan<char> - a view into string data
// String is like a char[] that you own and can modify

let borrowed: &str = "I don't own this data";
let owned: String = String::from("I own this data");

// Convert between them
let owned_copy: String = borrowed.to_string();  // Copy to owned
let borrowed_view: &str = &owned;               // Borrow from owned
```

***

## Printing and String Formatting

C# developers rely heavily on `Console.WriteLine` and string interpolation (`$""`). Rust's formatting system is equally powerful but uses macros and format specifiers instead.

### Basic Output
```csharp
// C# output
Console.Write("no newline");
Console.WriteLine("with newline");
Console.Error.WriteLine("to stderr");

// String interpolation (C# 6+)
string name = "Alice";
int age = 30;
Console.WriteLine($"{name} is {age} years old");
```

```rust
// Rust output — all macros (note the !)
print!("no newline");              // → stdout, no newline
println!("with newline");           // → stdout + newline
eprint!("to stderr");              // → stderr, no newline  
eprintln!("to stderr with newline"); // → stderr + newline

// String formatting (like $"" interpolation)
let name = "Alice";
let age = 30;
println!("{name} is {age} years old");     // Inline variable capture (Rust 1.58+)
println!("{} is {} years old", name, age); // Positional arguments

// format! returns a String instead of printing
let msg = format!("{name} is {age} years old");
```

### Format Specifiers
```csharp
// C# format specifiers
Console.WriteLine($"{price:F2}");         // Fixed decimal:  29.99
Console.WriteLine($"{count:D5}");         // Padded integer: 00042
Console.WriteLine($"{value,10}");         // Right-aligned, width 10
Console.WriteLine($"{value,-10}");        // Left-aligned, width 10
Console.WriteLine($"{hex:X}");            // Hexadecimal:    FF
Console.WriteLine($"{ratio:P1}");         // Percentage:     85.0%
```

```rust
// Rust format specifiers
println!("{price:.2}");          // 2 decimal places:  29.99
println!("{count:05}");          // Zero-padded, width 5: 00042
println!("{value:>10}");         // Right-aligned, width 10
println!("{value:<10}");         // Left-aligned, width 10
println!("{value:^10}");         // Center-aligned, width 10
println!("{hex:#X}");            // Hex with prefix: 0xFF
println!("{hex:08X}");           // Hex zero-padded: 000000FF
println!("{bits:#010b}");        // Binary with prefix: 0b00001010
println!("{big}", big = 1_000_000); // Named parameter
```

### Debug vs Display Printing
```rust
// {:?}  — Debug trait (for developers, auto-derived)
// {:#?} — Pretty-printed Debug (indented, multi-line)
// {}    — Display trait (for users, must implement manually)

#[derive(Debug)] // Auto-generates Debug output
struct Point { x: f64, y: f64 }

let p = Point { x: 1.5, y: 2.7 };

println!("{:?}", p);   // Point { x: 1.5, y: 2.7 }   — compact debug
println!("{:#?}", p);  // Point {                     — pretty debug
                        //     x: 1.5,
                        //     y: 2.7,
                        // }
// println!("{}", p);  // ❌ ERROR: Point doesn't implement Display

// Implement Display for user-facing output:
use std::fmt;

impl fmt::Display for Point {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "({}, {})", self.x, self.y)
    }
}
println!("{}", p);    // (1.5, 2.7)  — user-friendly
```

```csharp
// C# equivalent:
// {:?}  ≈ object.GetType().ToString() or reflection dump
// {}    ≈ object.ToString()
// In C# you override ToString(); in Rust you implement Display
```

### Quick Reference

| C# | Rust | Output |
|----|------|--------|
| `Console.WriteLine(x)` | `println!("{x}")` | Display formatting |
| `$"{x}"` (interpolation) | `format!("{x}")` | Returns `String` |
| `x.ToString()` | `x.to_string()` | Requires `Display` trait |
| Override `ToString()` | `impl Display` | User-facing output |
| Debugger view | `{:?}` or `dbg!(x)` | Developer output |
| `String.Format("{0:F2}", x)` | `format!("{x:.2}")` | Formatted `String` |
| `Console.Error.WriteLine` | `eprintln!()` | Write to stderr |

***

## Type Casting and Conversions

C# has implicit conversions, explicit casts `(int)x`, and `Convert.To*()`. Rust is stricter — there are no implicit numeric conversions.

### Numeric Conversions
```csharp
// C# — implicit and explicit conversions
int small = 42;
long big = small;              // Implicit widening: OK
double d = small;              // Implicit widening: OK
int truncated = (int)3.14;     // Explicit narrowing: 3
byte b = (byte)300;            // Silent overflow: 44

// Safe conversion
if (int.TryParse("42", out int parsed)) { /* ... */ }
```

```rust
// Rust — ALL numeric conversions are explicit
let small: i32 = 42;
let big: i64 = small as i64;       // Widening: explicit with 'as'
let d: f64 = small as f64;         // Int to float: explicit
let truncated: i32 = 3.14_f64 as i32; // Narrowing: 3 (truncates)
let b: u8 = 300_u16 as u8;        // Overflow: wraps to 44 (like C# unchecked)

// Safe conversion with TryFrom
use std::convert::TryFrom;
let safe: Result<u8, _> = u8::try_from(300_u16); // Err — out of range
let ok: Result<u8, _>   = u8::try_from(42_u16);  // Ok(42)

// String parsing — returns Result, not bool + out param
let parsed: Result<i32, _> = "42".parse::<i32>();   // Ok(42)
let bad: Result<i32, _>    = "abc".parse::<i32>();  // Err(ParseIntError)

// With turbofish syntax:
let n = "42".parse::<f64>().unwrap(); // 42.0
```

### String Conversions
```csharp
// C#
int n = 42;
string s = n.ToString();          // "42"
string formatted = $"{n:X}";
int back = int.Parse(s);          // 42 or throws
bool ok = int.TryParse(s, out int result);
```

```rust
// Rust — to_string() via Display, parse() via FromStr
let n: i32 = 42;
let s: String = n.to_string();            // "42" (uses Display trait)
let formatted = format!("{n:X}");         // "2A"
let back: i32 = s.parse().unwrap();       // 42 or panics
let result: Result<i32, _> = s.parse();   // Ok(42) — safe version

// &str ↔ String conversions (most common conversion in Rust)
let owned: String = "hello".to_string();    // &str → String
let owned2: String = String::from("hello"); // &str → String (equivalent)
let borrowed: &str = &owned;               // String → &str (free, just a borrow)
```

### Reference Conversions (No Inheritance Casting!)
```csharp
// C# — upcasting and downcasting
Animal a = new Dog();              // Upcast (implicit)
Dog d = (Dog)a;                    // Downcast (explicit, can throw)
if (a is Dog dog) { /* ... */ }    // Safe downcast with pattern match
```

```rust
// Rust — No inheritance, no upcasting/downcasting
// Use trait objects for polymorphism:
let animal: Box<dyn Animal> = Box::new(Dog);

// "Downcasting" requires the Any trait (rarely needed):
use std::any::Any;
if let Some(dog) = animal_any.downcast_ref::<Dog>() {
    // Use dog
}
// In practice, use enums instead of downcasting:
enum Animal {
    Dog(Dog),
    Cat(Cat),
}
match animal {
    Animal::Dog(d) => { /* use d */ }
    Animal::Cat(c) => { /* use c */ }
}
```

### Quick Reference

| C# | Rust | Notes |
|----|------|-------|
| `(int)x` | `x as i32` | Truncating/wrapping cast |
| Implicit widening | Must use `as` | No implicit numeric conversion |
| `Convert.ToInt32(x)` | `i32::try_from(x)` | Safe, returns `Result` |
| `int.Parse(s)` | `s.parse::<i32>().unwrap()` | Panics on failure |
| `int.TryParse(s, out n)` | `s.parse::<i32>()` | Returns `Result<i32, _>` |
| `(Dog)animal` | Not available | Use enums or `Any` |
| `as Dog` / `is Dog` | `downcast_ref::<Dog>()` | Via `Any` trait; prefer enums |

***

## Comments and Documentation

### Regular Comments
```csharp
// C# comments
// Single line comment
/* Multi-line
   comment */

/// <summary>
/// XML documentation comment
/// </summary>
/// <param name="name">The user's name</param>
/// <returns>A greeting string</returns>
public string Greet(string name)
{
    return $"Hello, {name}!";
}
```

```rust
// Rust comments
// Single line comment
/* Multi-line
   comment */

/// Documentation comment (like C# ///)
/// This function greets a user by name.
/// 
/// # Arguments
/// 
/// * `name` - The user's name as a string slice
/// 
/// # Returns
/// 
/// A `String` containing the greeting
/// 
/// # Examples
/// 
/// ```
/// let greeting = greet("Alice");
/// assert_eq!(greeting, "Hello, Alice!");
/// ```
pub fn greet(name: &str) -> String {
    format!("Hello, {}!", name)
}
```

### Documentation Generation
```bash
# Generate documentation (like XML docs in C#)
cargo doc --open

# Run documentation tests
cargo test --doc
```

---

## Exercises

<details>
<summary><strong>🏋️ Exercise: Type-Safe Temperature</strong> (click to expand)</summary>

Create a Rust program that:
1. Declares a `const` for absolute zero in Celsius (`-273.15`)
2. Declares a `static` counter for how many conversions have been performed (use `AtomicU32`)
3. Writes a function `celsius_to_fahrenheit(c: f64) -> f64` that rejects temperatures below absolute zero by returning `f64::NAN`
4. Demonstrates shadowing by parsing a string `"98.6"` into an `f64`, then converting it

<details>
<summary>🔑 Solution</summary>

```rust
use std::sync::atomic::{AtomicU32, Ordering};

const ABSOLUTE_ZERO_C: f64 = -273.15;
static CONVERSION_COUNT: AtomicU32 = AtomicU32::new(0);

fn celsius_to_fahrenheit(c: f64) -> f64 {
    if c < ABSOLUTE_ZERO_C {
        return f64::NAN;
    }
    CONVERSION_COUNT.fetch_add(1, Ordering::Relaxed);
    c * 9.0 / 5.0 + 32.0
}

fn main() {
    let temp = "98.6";           // &str
    let temp: f64 = temp.parse().unwrap(); // shadow as f64
    let temp = celsius_to_fahrenheit(temp); // shadow as Fahrenheit
    println!("{temp:.1}°F");
    println!("Conversions: {}", CONVERSION_COUNT.load(Ordering::Relaxed));
}
```

</details>
</details>

***

