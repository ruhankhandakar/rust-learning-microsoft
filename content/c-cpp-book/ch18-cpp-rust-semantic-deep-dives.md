## C++ → Rust Semantic Deep Dives

> **What you'll learn:** Detailed mappings for C++ concepts that don't have obvious Rust equivalents — the four named casts, SFINAE vs trait bounds, CRTP vs associated types, and other common friction points during translation.

The sections below map C++ concepts that don't have an obvious 1:1 Rust
equivalent. These differences frequently trip up C++ programmers during
translation work.

### Casting Hierarchy: Four C++ Casts → Rust Equivalents

C++ has four named casts. Rust replaces them with different, more explicit mechanisms:

```cpp
// C++ casting hierarchy
int i = static_cast<int>(3.14);            // 1. Numeric / up-cast
Derived* d = dynamic_cast<Derived*>(base); // 2. Runtime downcasting
int* p = const_cast<int*>(cp);              // 3. Cast away const
auto* raw = reinterpret_cast<char*>(&obj); // 4. Bit-level reinterpretation
```

| C++ Cast | Rust Equivalent | Safety | Notes |
|----------|----------------|--------|-------|
| `static_cast` (numeric) | `as` keyword | Safe but can truncate/wrap | `let i = 3.14_f64 as i32;` — truncates to 3 |
| `static_cast` (numeric, checked) | `From`/`Into` | Safe, compile-time verified | `let i: i32 = 42_u8.into();` — only widens |
| `static_cast` (numeric, fallible) | `TryFrom`/`TryInto` | Safe, returns `Result` | `let i: u8 = 300_u16.try_into()?;` — returns Err |
| `dynamic_cast` (downcast) | `match` on enum / `Any::downcast_ref` | Safe | Pattern matching for enums; `Any` for trait objects |
| `const_cast` | No equivalent | | Rust has no way to cast away `&` → `&mut` in safe code. Use `Cell`/`RefCell` for interior mutability |
| `reinterpret_cast` | `std::mem::transmute` | **`unsafe`** | Reinterprets bit pattern. Almost always wrong — prefer `from_le_bytes()` etc. |

```rust
// Rust equivalents:

// 1. Numeric casts — prefer From/Into over `as`
let widened: u32 = 42_u8.into();             // Infallible widening — always prefer
let truncated = 300_u16 as u8;                // ⚠ Wraps to 44! Silent data loss
let checked: Result<u8, _> = 300_u16.try_into(); // Err — safe fallible conversion

// 2. Downcast: enum (preferred) or Any (when needed for type erasure)
use std::any::Any;

fn handle_any(val: &dyn Any) {
    if let Some(s) = val.downcast_ref::<String>() {
        println!("Got string: {s}");
    } else if let Some(n) = val.downcast_ref::<i32>() {
        println!("Got int: {n}");
    }
}

// 3. "const_cast" → interior mutability (no unsafe needed)
use std::cell::Cell;
struct Sensor {
    read_count: Cell<u32>,  // Mutate through &self
}
impl Sensor {
    fn read(&self) -> f64 {
        self.read_count.set(self.read_count.get() + 1); // &self, not &mut self
        42.0
    }
}

// 4. reinterpret_cast → transmute (almost never needed)
// Prefer safe alternatives:
let bytes: [u8; 4] = 0x12345678_u32.to_ne_bytes();  // ✅ Safe
let val = u32::from_ne_bytes(bytes);                   // ✅ Safe
// unsafe { std::mem::transmute::<u32, [u8; 4]>(val) } // ❌ Avoid
```

> **Guideline**: In idiomatic Rust, `as` should be rare (use `From`/`Into`
> for widening, `TryFrom`/`TryInto` for narrowing), `transmute` should be
> exceptional, and `const_cast` has no equivalent because interior mutability
> types make it unnecessary.

---

### Preprocessor → `cfg`, Feature Flags, and `macro_rules!`

C++ relies heavily on the preprocessor for conditional compilation, constants, and
code generation. Rust replaces all of these with first-class language features.

#### `#define` constants → `const` or `const fn`

```cpp
// C++
#define MAX_RETRIES 5
#define BUFFER_SIZE (1024 * 64)
#define SQUARE(x) ((x) * (x))  // Macro — textual substitution, no type safety
```

```rust
// Rust — type-safe, scoped, no textual substitution
const MAX_RETRIES: u32 = 5;
const BUFFER_SIZE: usize = 1024 * 64;
const fn square(x: u32) -> u32 { x * x }  // Evaluated at compile time

// Can be used in const contexts:
const AREA: u32 = square(12);  // Computed at compile time
static BUFFER: [u8; BUFFER_SIZE] = [0; BUFFER_SIZE];
```

#### `#ifdef` / `#if` → `#[cfg()]` and `cfg!()`

```cpp
// C++
#ifdef DEBUG
    log_verbose("Step 1 complete");
#endif

#if defined(LINUX) && !defined(ARM)
    use_x86_path();
#else
    use_generic_path();
#endif
```

```rust
// Rust — attribute-based conditional compilation
#[cfg(debug_assertions)]
fn log_verbose(msg: &str) { eprintln!("[VERBOSE] {msg}"); }

#[cfg(not(debug_assertions))]
fn log_verbose(_msg: &str) { /* compiled away in release */ }

// Combine conditions:
#[cfg(all(target_os = "linux", target_arch = "x86_64"))]
fn use_x86_path() { /* ... */ }

#[cfg(not(all(target_os = "linux", target_arch = "x86_64")))]
fn use_generic_path() { /* ... */ }

// Runtime check (condition is still compile-time, but usable in expressions):
if cfg!(target_os = "windows") {
    println!("Running on Windows");
}
```

#### Feature flags in `Cargo.toml`

```toml
# Cargo.toml — replace #ifdef FEATURE_FOO
[features]
default = ["json"]
json = ["dep:serde_json"]       # Optional dependency
verbose-logging = []            # Flag with no extra dependency
gpu-support = ["dep:cuda-sys"]  # Optional GPU support
```

```rust
// Conditional code based on feature flags:
#[cfg(feature = "json")]
pub fn parse_config(data: &str) -> Result<Config, Error> {
    serde_json::from_str(data).map_err(Error::from)
}

#[cfg(feature = "verbose-logging")]
macro_rules! verbose {
    ($($arg:tt)*) => { eprintln!("[VERBOSE] {}", format!($($arg)*)); }
}
#[cfg(not(feature = "verbose-logging"))]
macro_rules! verbose {
    ($($arg:tt)*) => { }; // Compiles to nothing
}
```

#### `#define MACRO(x)` → `macro_rules!`

```cpp
// C++ — textual substitution, notoriously error-prone
#define DIAG_CHECK(cond, msg) \
    do { if (!(cond)) { log_error(msg); return false; } } while(0)
```

```rust
// Rust — hygienic, type-checked, operates on syntax tree
macro_rules! diag_check {
    ($cond:expr, $msg:expr) => {
        if !($cond) {
            log_error($msg);
            return Err(DiagError::CheckFailed($msg.to_string()));
        }
    };
}

fn run_test() -> Result<(), DiagError> {
    diag_check!(temperature < 85.0, "GPU too hot");
    diag_check!(voltage > 0.8, "Rail voltage too low");
    Ok(())
}
```

| C++ Preprocessor | Rust Equivalent | Advantage |
|-----------------|----------------|-----------|
| `#define PI 3.14` | `const PI: f64 = 3.14;` | Typed, scoped, visible to debugger |
| `#define MAX(a,b) ((a)>(b)?(a):(b))` | `macro_rules!` or generic `fn max<T: Ord>` | No double-evaluation bugs |
| `#ifdef DEBUG` | `#[cfg(debug_assertions)]` | Checked by compiler, no typo risk |
| `#ifdef FEATURE_X` | `#[cfg(feature = "x")]` | Cargo manages features; dependency-aware |
| `#include "header.h"` | `mod module;` + `use module::Item;` | No include guards, no circular includes |
| `#pragma once` | Not needed | Each `.rs` file is a module — included exactly once |

---

### Header Files and `#include` → Modules and `use`

In C++, the compilation model revolves around textual inclusion:

```cpp
// widget.h — every translation unit that uses Widget includes this
#pragma once
#include <string>
#include <vector>

class Widget {
public:
    Widget(std::string name);
    void activate();
private:
    std::string name_;
    std::vector<int> data_;
};
```

```cpp
// widget.cpp — separate definition
#include "widget.h"
Widget::Widget(std::string name) : name_(std::move(name)) {}
void Widget::activate() { /* ... */ }
```

In Rust, there are **no header files, no forward declarations, no include guards**:

```rust
// src/widget.rs — declaration AND definition in one file
pub struct Widget {
    name: String,         // Private by default
    data: Vec<i32>,
}

impl Widget {
    pub fn new(name: String) -> Self {
        Widget { name, data: Vec::new() }
    }
    pub fn activate(&self) { /* ... */ }
}
```

```rust
// src/main.rs — import by module path
mod widget;  // Tells compiler to include src/widget.rs
use widget::Widget;

fn main() {
    let w = Widget::new("sensor".to_string());
    w.activate();
}
```

| C++ | Rust | Why it's better |
|-----|------|-----------------|
| `#include "foo.h"` | `mod foo;` in parent + `use foo::Item;` | No textual inclusion, no ODR violations |
| `#pragma once` / include guards | Not needed | Each `.rs` file is a module — compiled once |
| Forward declarations | Not needed | Compiler sees entire crate; order doesn't matter |
| `class Foo;` (incomplete type) | Not needed | No separate declaration/definition split |
| `.h` + `.cpp` for each class | Single `.rs` file | No declaration/definition mismatch bugs |
| `using namespace std;` | `use std::collections::HashMap;` | Always explicit — no global namespace pollution |
| Nested `namespace a::b` | Nested `mod a { mod b { } }` or `a/b.rs` | File system mirrors module tree |

---

### `friend` and Access Control → Module Visibility

C++ uses `friend` to grant specific classes or functions access to private members.
Rust has no `friend` keyword — instead, **privacy is module-scoped**:

```cpp
// C++
class Engine {
    friend class Car;   // Car can access private members
    int rpm_;
    void set_rpm(int r) { rpm_ = r; }
public:
    int rpm() const { return rpm_; }
};
```

```rust
// Rust — items in the same module can access all fields, no `friend` needed
mod vehicle {
    pub struct Engine {
        rpm: u32,  // Private to the module (not to the struct!)
    }

    impl Engine {
        pub fn new() -> Self { Engine { rpm: 0 } }
        pub fn rpm(&self) -> u32 { self.rpm }
    }

    pub struct Car {
        engine: Engine,
    }

    impl Car {
        pub fn new() -> Self { Car { engine: Engine::new() } }
        pub fn accelerate(&mut self) {
            self.engine.rpm = 3000; // ✅ Same module — direct field access
        }
        pub fn rpm(&self) -> u32 {
            self.engine.rpm  // ✅ Same module — can read private field
        }
    }
}

fn main() {
    let mut car = vehicle::Car::new();
    car.accelerate();
    // car.engine.rpm = 9000;  // ❌ Compile error: `engine` is private
    println!("RPM: {}", car.rpm()); // ✅ Public method on Car
}
```

| C++ Access | Rust Equivalent | Scope |
|-----------|----------------|-------|
| `private` | (default, no keyword) | Accessible within the same module only |
| `protected` | No direct equivalent | Use `pub(super)` for parent module access |
| `public` | `pub` | Accessible everywhere |
| `friend class Foo` | Put `Foo` in the same module | Module-level privacy replaces friend |
| — | `pub(crate)` | Visible within the crate but not to external dependents |
| — | `pub(super)` | Visible to the parent module only |
| — | `pub(in crate::path)` | Visible within a specific module subtree |

> **Key insight**: C++ privacy is per-class. Rust privacy is per-module.
> This means you control access by choosing which types live in the same module —
> colocated types have full access to each other's private fields.

---

### `volatile` → Atomics and `read_volatile`/`write_volatile`

In C++, `volatile` tells the compiler not to optimize away reads/writes — typically
used for memory-mapped hardware registers. **Rust has no `volatile` keyword.**

```cpp
// C++: volatile for hardware registers
volatile uint32_t* const GPIO_REG = reinterpret_cast<volatile uint32_t*>(0x4002'0000);
*GPIO_REG = 0x01;              // Write not optimized away
uint32_t val = *GPIO_REG;     // Read not optimized away
```

```rust
// Rust: explicit volatile operations — only in unsafe code
use std::ptr;

const GPIO_REG: *mut u32 = 0x4002_0000 as *mut u32;

unsafe {
    ptr::write_volatile(GPIO_REG, 0x01);   // Write not optimized away
    let val = ptr::read_volatile(GPIO_REG); // Read not optimized away
}
```

For **concurrent shared state** (the other common C++ `volatile` use), Rust uses atomics:

```cpp
// C++: volatile is NOT sufficient for thread safety (common mistake!)
volatile bool stop_flag = false;  // ❌ Data race — UB in C++11+

// Correct C++:
std::atomic<bool> stop_flag{false};
```

```rust
// Rust: atomics are the only way to share mutable state across threads
use std::sync::atomic::{AtomicBool, Ordering};

static STOP_FLAG: AtomicBool = AtomicBool::new(false);

// From another thread:
STOP_FLAG.store(true, Ordering::Release);

// Check:
if STOP_FLAG.load(Ordering::Acquire) {
    println!("Stopping");
}
```

| C++ Usage | Rust Equivalent | Notes |
|-----------|----------------|-------|
| `volatile` for hardware registers | `ptr::read_volatile` / `ptr::write_volatile` | Requires `unsafe` — correct for MMIO |
| `volatile` for thread signaling | `AtomicBool` / `AtomicU32` etc. | C++ `volatile` is wrong for this too! |
| `std::atomic<T>` | `std::sync::atomic::AtomicT` | Same semantics, same orderings |
| `std::atomic<T>::load(memory_order_acquire)` | `AtomicT::load(Ordering::Acquire)` | 1:1 mapping |

---

### `static` Variables → `static`, `const`, `LazyLock`, `OnceLock`

#### Basic `static` and `const`

```cpp
// C++
const int MAX_RETRIES = 5;                    // Compile-time constant
static std::string CONFIG_PATH = "/etc/app";  // Static init — order undefined!
```

```rust
// Rust
const MAX_RETRIES: u32 = 5;                   // Compile-time constant, inlined
static CONFIG_PATH: &str = "/etc/app";         // 'static lifetime, fixed address
```

#### The static initialization order fiasco

C++ has a well-known problem: global constructors in different translation units
execute in **unspecified order**. Rust avoids this entirely — `static` values must
be compile-time constants (no constructors).

For runtime-initialized globals, use `LazyLock` (Rust 1.80+) or `OnceLock`:

```rust
use std::sync::LazyLock;

// Equivalent to C++ `static std::regex` — initialized on first access, thread-safe
static CONFIG_REGEX: LazyLock<regex::Regex> = LazyLock::new(|| {
    regex::Regex::new(r"^[a-z]+_diag$").expect("invalid regex")
});

fn is_valid_diag(name: &str) -> bool {
    CONFIG_REGEX.is_match(name)  // First call initializes; subsequent calls are fast
}
```

```rust
use std::sync::OnceLock;

// OnceLock: initialized once, can be set from runtime data
static DB_CONN: OnceLock<String> = OnceLock::new();

fn init_db(connection_string: &str) {
    DB_CONN.set(connection_string.to_string())
        .expect("DB_CONN already initialized");
}

fn get_db() -> &'static str {
    DB_CONN.get().expect("DB not initialized")
}
```

| C++ | Rust | Notes |
|-----|------|-------|
| `const int X = 5;` | `const X: i32 = 5;` | Both compile-time. Rust requires type annotation |
| `constexpr int X = 5;` | `const X: i32 = 5;` | Rust `const` is always constexpr |
| `static int count = 0;` (file scope) | `static COUNT: AtomicI32 = AtomicI32::new(0);` | Mutable statics require `unsafe` or atomics |
| `static std::string s = "hi";` | `static S: &str = "hi";` or `LazyLock<String>` | No runtime constructor for simple cases |
| `static MyObj obj;` (complex init) | `static OBJ: LazyLock<MyObj> = LazyLock::new(\|\| { ... });` | Thread-safe, lazy, no init order issues |
| `thread_local` | `thread_local! { static X: Cell<u32> = Cell::new(0); }` | Same semantics |

---

### `constexpr` → `const fn`

C++ `constexpr` marks functions and variables for compile-time evaluation. Rust
uses `const fn` and `const` for the same purpose:

```cpp
// C++
constexpr int factorial(int n) {
    return n <= 1 ? 1 : n * factorial(n - 1);
}
constexpr int val = factorial(5);  // Computed at compile time → 120
```

```rust
// Rust
const fn factorial(n: u32) -> u32 {
    if n <= 1 { 1 } else { n * factorial(n - 1) }
}
const VAL: u32 = factorial(5);  // Computed at compile time → 120

// Also works in array sizes and match patterns:
const LOOKUP: [u32; 5] = [factorial(1), factorial(2), factorial(3),
                           factorial(4), factorial(5)];
```

| C++ | Rust | Notes |
|-----|------|-------|
| `constexpr int f()` | `const fn f() -> i32` | Same intent — compile-time evaluable |
| `constexpr` variable | `const` variable | Rust `const` is always compile-time |
| `consteval` (C++20) | No equivalent | `const fn` can also run at runtime |
| `if constexpr` (C++17) | No equivalent (use `cfg!` or generics) | Trait specialization fills some use cases |
| `constinit` (C++20) | `static` with const initializer | Rust `static` must be const-initialized by default |

> **Current limitations of `const fn`** (stabilized as of Rust 1.82):
> - No trait methods (can't call `.len()` on a `Vec` in const context)
> - No heap allocation (`Box::new`, `Vec::new` not const)
> - ~~No floating-point arithmetic~~ — **stabilized in Rust 1.82**
> - Can't use `for` loops (use recursion or `while` with manual index)

---

### SFINAE and `enable_if` → Trait Bounds and `where` Clauses

In C++, SFINAE (Substitution Failure Is Not An Error) is the mechanism behind
conditional generic programming. It is powerful but notoriously unreadable. Rust
replaces it entirely with **trait bounds**:

```cpp
// C++: SFINAE-based conditional function (pre-C++20)
template<typename T,
         std::enable_if_t<std::is_integral_v<T>, int> = 0>
T double_it(T val) { return val * 2; }

template<typename T,
         std::enable_if_t<std::is_floating_point_v<T>, int> = 0>
T double_it(T val) { return val * 2.0; }

// C++20 concepts — cleaner but still verbose:
template<std::integral T>
T double_it(T val) { return val * 2; }
```

```rust
// Rust: trait bounds — readable, composable, excellent error messages
use std::ops::Mul;

fn double_it<T: Mul<Output = T> + From<u8>>(val: T) -> T {
    val * T::from(2)
}

// Or with where clause for complex bounds:
fn process<T>(val: T) -> String
where
    T: std::fmt::Display + Clone + Send,
{
    format!("Processing: {}", val)
}

// Conditional behavior via separate impls (replaces SFINAE overloads):
trait Describable {
    fn describe(&self) -> String;
}

impl Describable for u32 {
    fn describe(&self) -> String { format!("integer: {self}") }
}

impl Describable for f64 {
    fn describe(&self) -> String { format!("float: {self:.2}") }
}
```

| C++ Template Metaprogramming | Rust Equivalent | Readability |
|-----------------------------|----------------|-------------|
| `std::enable_if_t<cond>` | `where T: Trait` | 🟢 Clear English |
| `std::is_integral_v<T>` | Bound on a numeric trait or specific types | 🟢 No `_v` / `_t` suffixes |
| SFINAE overload sets | Separate `impl Trait for ConcreteType` blocks | 🟢 Each impl stands alone |
| `if constexpr (std::is_same_v<T, int>)` | Specialization via trait impls | 🟢 Compile-time dispatched |
| C++20 `concept` | `trait` | 🟢 Nearly identical intent |
| `requires` clause | `where` clause | 🟢 Same position, similar syntax |
| Compilation fails deep inside template | Compilation fails at the call site with trait mismatch | 🟢 No 200-line error cascades |

> **Key insight**: C++ concepts (C++20) are the closest thing to Rust traits.
> If you're familiar with C++20 concepts, think of Rust traits as concepts
> that have been a first-class language feature since 1.0, with a coherent
> implementation model (trait impls) instead of duck typing.

---

### `std::function` → Function Pointers, `impl Fn`, and `Box<dyn Fn>`

C++ `std::function<R(Args...)>` is a type-erased callable. Rust has three options,
each with different trade-offs:

```cpp
// C++: one-size-fits-all (heap-allocated, type-erased)
#include <functional>
std::function<int(int)> make_adder(int n) {
    return [n](int x) { return x + n; };
}
```

```rust
// Rust Option 1: fn pointer — simple, no captures, no allocation
fn add_one(x: i32) -> i32 { x + 1 }
let f: fn(i32) -> i32 = add_one;
println!("{}", f(5)); // 6

// Rust Option 2: impl Fn — monomorphized, zero overhead, can capture
fn apply(val: i32, f: impl Fn(i32) -> i32) -> i32 { f(val) }
let n = 10;
let result = apply(5, |x| x + n);  // Closure captures `n`

// Rust Option 3: Box<dyn Fn> — type-erased, heap-allocated (like std::function)
fn make_adder(n: i32) -> Box<dyn Fn(i32) -> i32> {
    Box::new(move |x| x + n)
}
let adder = make_adder(10);
println!("{}", adder(5));  // 15

// Storing heterogeneous callables (like vector<function<int(int)>>):
let callbacks: Vec<Box<dyn Fn(i32) -> i32>> = vec![
    Box::new(|x| x + 1),
    Box::new(|x| x * 2),
    Box::new(make_adder(100)),
];
for cb in &callbacks {
    println!("{}", cb(5));  // 6, 10, 105
}
```

| When to use | C++ Equivalent | Rust Choice |
|------------|---------------|-------------|
| Top-level function, no captures | Function pointer | `fn(Args) -> Ret` |
| Generic function accepting callables | Template parameter | `impl Fn(Args) -> Ret` (static dispatch) |
| Trait bound in generics | `template<typename F>` | `F: Fn(Args) -> Ret` |
| Stored callable, type-erased | `std::function<R(Args)>` | `Box<dyn Fn(Args) -> Ret>` |
| Callback that mutates state | `std::function` with mutable lambda | `Box<dyn FnMut(Args) -> Ret>` |
| One-shot callback (consumed) | `std::function` (moved) | `Box<dyn FnOnce(Args) -> Ret>` |

> **Performance note**: `impl Fn` has zero overhead (monomorphized, like a C++ template).
> `Box<dyn Fn>` has the same overhead as `std::function` (vtable + heap allocation).
> Prefer `impl Fn` unless you need to store heterogeneous callables.

---

### Container Mapping: C++ STL → Rust `std::collections`

| C++ STL Container | Rust Equivalent | Notes |
|------------------|----------------|-------|
| `std::vector<T>` | `Vec<T>` | Nearly identical API. Rust checks bounds by default |
| `std::array<T, N>` | `[T; N]` | Stack-allocated fixed-size array |
| `std::deque<T>` | `std::collections::VecDeque<T>` | Ring buffer. Efficient push/pop at both ends |
| `std::list<T>` | `std::collections::LinkedList<T>` | Rarely used in Rust — `Vec` is almost always faster |
| `std::forward_list<T>` | No equivalent | Use `Vec` or `VecDeque` |
| `std::unordered_map<K, V>` | `std::collections::HashMap<K, V>` | Uses `SipHash` by default (DoS-resistant) |
| `std::map<K, V>` | `std::collections::BTreeMap<K, V>` | B-tree; keys sorted; `K: Ord` required |
| `std::unordered_set<T>` | `std::collections::HashSet<T>` | `T: Hash + Eq` required |
| `std::set<T>` | `std::collections::BTreeSet<T>` | Sorted set; `T: Ord` required |
| `std::priority_queue<T>` | `std::collections::BinaryHeap<T>` | Max-heap by default (same as C++) |
| `std::stack<T>` | `Vec<T>` with `.push()` / `.pop()` | No separate stack type needed |
| `std::queue<T>` | `VecDeque<T>` with `.push_back()` / `.pop_front()` | No separate queue type needed |
| `std::string` | `String` | UTF-8 guaranteed, not null-terminated |
| `std::string_view` | `&str` | Borrowed UTF-8 slice |
| `std::span<T>` (C++20) | `&[T]` / `&mut [T]` | Rust slices have been a first-class type since 1.0 |
| `std::tuple<A, B, C>` | `(A, B, C)` | First-class syntax, destructurable |
| `std::pair<A, B>` | `(A, B)` | Just a 2-element tuple |
| `std::bitset<N>` | No std equivalent | Use the `bitvec` crate or `[u8; N/8]` |

**Key differences**:
- Rust's `HashMap`/`HashSet` require `K: Hash + Eq` — the compiler enforces this at the type level, unlike C++ where using an unhashable key gives a template error deep in the STL
- `Vec` indexing (`v[i]`) panics on out-of-bounds by default. Use `.get(i)` for `Option<&T>` or iterators to avoid bounds checks entirely
- No `std::multimap` or `std::multiset` — use `HashMap<K, Vec<V>>` or `BTreeMap<K, Vec<V>>`

---

### Exception Safety → Panic Safety

C++ defines three levels of exception safety (Abrahams guarantees):

| C++ Level | Meaning | Rust Equivalent |
|----------|---------|----------------|
| **No-throw** | Function never throws | Function never panics (returns `Result`) |
| **Strong** (commit-or-rollback) | If it throws, state is unchanged | Ownership model makes this natural — if `?` returns early, partially built values are dropped |
| **Basic** | If it throws, invariants are preserved | Rust's default — `Drop` runs, no leaks |

#### How Rust's ownership model helps

```rust
// Strong guarantee for free — if file.write() fails, config is unchanged
fn update_config(config: &mut Config, path: &str) -> Result<(), Error> {
    let new_data = fetch_from_network()?; // Err → early return, config untouched
    let validated = validate(new_data)?;   // Err → early return, config untouched
    *config = validated;                   // Only reached on success (commit)
    Ok(())
}
```

In C++, achieving the strong guarantee requires manual rollback or the copy-and-swap
idiom. In Rust, `?` propagation gives you the strong guarantee by default for most code.

#### `catch_unwind` — Rust's equivalent of `catch(...)`

```rust
use std::panic;

// Catch a panic (like catch(...) in C++) — rarely needed
let result = panic::catch_unwind(|| {
    // Code that might panic
    let v = vec![1, 2, 3];
    v[10]  // Panics! (index out of bounds)
});

match result {
    Ok(val) => println!("Got: {val}"),
    Err(_) => eprintln!("Caught a panic — cleaned up"),
}
```

#### `UnwindSafe` — marking types as panic-safe

```rust
use std::panic::UnwindSafe;

// Types behind &mut are NOT UnwindSafe by default — the panic may have
// left them in a partially-modified state
fn safe_execute<F: FnOnce() + UnwindSafe>(f: F) {
    let _ = std::panic::catch_unwind(f);
}

// Use AssertUnwindSafe to override when you've audited the code:
use std::panic::AssertUnwindSafe;
let mut data = vec![1, 2, 3];
let _ = std::panic::catch_unwind(AssertUnwindSafe(|| {
    data.push(4);
}));
```

| C++ Exception Pattern | Rust Equivalent |
|-----------------------|-----------------|
| `throw MyException()` | `return Err(MyError::...)` (preferred) or `panic!("...")` |
| `try { } catch (const E& e)` | `match result { Ok(v) => ..., Err(e) => ... }` or `?` |
| `catch (...)` | `std::panic::catch_unwind(...)` |
| `noexcept` | `-> Result<T, E>` (errors are values, not exceptions) |
| RAII cleanup in stack unwinding | `Drop::drop()` runs during panic unwinding |
| `std::uncaught_exceptions()` | `std::thread::panicking()` |
| `-fno-exceptions` compile flag | `panic = "abort"` in `Cargo.toml` [profile] |

> **Bottom line**: In Rust, most code uses `Result<T, E>` instead of exceptions,
> making error paths explicit and composable. `panic!` is reserved for bugs
> (like `assert!` failures), not routine errors. This means "exception safety"
> is largely a non-issue — the ownership system handles cleanup automatically.

---

## C++ to Rust Migration Patterns

### Quick Reference: C++ → Rust Idiom Map

| **C++ Pattern** | **Rust Idiom** | **Notes** |
|----------------|---------------|----------|
| `class Derived : public Base` | `enum Variant { A {...}, B {...} }` | Prefer enums for closed sets |
| `virtual void method() = 0` | `trait MyTrait { fn method(&self); }` | Use for open/extensible interfaces |
| `dynamic_cast<Derived*>(ptr)` | `match value { Variant::A(data) => ..., }` | Exhaustive, no runtime failure |
| `vector<unique_ptr<Base>>` | `Vec<Box<dyn Trait>>` | Only when genuinely polymorphic |
| `shared_ptr<T>` | `Rc<T>` or `Arc<T>` | Prefer `Box<T>` or owned values first |
| `enable_shared_from_this<T>` | Arena pattern (`Vec<T>` + indices) | Eliminates reference cycles entirely |
| `Base* m_pFramework` in every class | `fn execute(&mut self, ctx: &mut Context)` | Pass context, don't store pointers |
| `try { } catch (...) { }` | `match result { Ok(v) => ..., Err(e) => ... }` | Or use `?` for propagation |
| `std::optional<T>` | `Option<T>` | `match` required, can't forget None |
| `const std::string&` parameter | `&str` parameter | Accepts both `String` and `&str` |
| `enum class Foo { A, B, C }` | `enum Foo { A, B, C }` | Rust enums can also carry data |
| `auto x = std::move(obj)` | `let x = obj;` | Move is the default, no `std::move` needed |
| CMake + make + lint | `cargo build / test / clippy / fmt` | One tool for everything |

### Migration Strategy
1. **Start with data types**: Translate structs and enums first — this forces you to think about ownership
2. **Convert factories to enums**: If a factory creates different derived types, it should probably be `enum` + `match`
3. **Convert god objects to composed structs**: Group related fields into focused structs
4. **Replace pointers with borrows**: Convert `Base*` stored pointers to `&'a T` lifetime-bounded borrows
5. **Use `Box<dyn Trait>` sparingly**: Only for plugin systems and test mocking
6. **Let the compiler guide you**: Rust's error messages are excellent — read them carefully






