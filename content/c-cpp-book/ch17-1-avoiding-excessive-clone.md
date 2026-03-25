## Avoiding excessive clone()

> **What you'll learn:** Why `.clone()` is a code smell in Rust, how to restructure ownership to eliminate unnecessary copies, and the specific patterns that signal an ownership design problem.

- Coming from C++, `.clone()` feels like a safe default — "just copy it". But excessive cloning hides ownership problems and hurts performance.
- **Rule of thumb**: If you're cloning to satisfy the borrow checker, you probably need to restructure ownership instead.

### When clone() is wrong

```rust
// BAD: Cloning a String just to pass it to a function that only reads it
fn log_message(msg: String) {  // Takes ownership unnecessarily
    println!("[LOG] {}", msg);
}
let message = String::from("GPU test passed");
log_message(message.clone());  // Wasteful: allocates a whole new String
log_message(message);           // Original consumed — clone was pointless
```

```rust
// GOOD: Accept a borrow — zero allocation
fn log_message(msg: &str) {    // Borrows, doesn't own
    println!("[LOG] {}", msg);
}
let message = String::from("GPU test passed");
log_message(&message);          // No clone, no allocation
log_message(&message);          // Can call again — message not consumed
```

### Real example: returning `&str` instead of cloning
```rust
// Example: healthcheck.rs — returns a borrowed view, zero allocation
pub fn serial_or_unknown(&self) -> &str {
    self.serial.as_deref().unwrap_or(UNKNOWN_VALUE)
}

pub fn model_or_unknown(&self) -> &str {
    self.model.as_deref().unwrap_or(UNKNOWN_VALUE)
}
```
The C++ equivalent would return `const std::string&` or `std::string_view` — but in C++ neither is lifetime-checked. In Rust, the borrow checker guarantees the returned `&str` can't outlive `self`.

### Real example: static string slices — no heap at all
```rust
// Example: healthcheck.rs — compile-time string tables
const HBM_SCREEN_RECIPES: &[&str] = &[
    "hbm_ds_ntd", "hbm_ds_ntd_gfx", "hbm_dt_ntd", "hbm_dt_ntd_gfx",
    "hbm_burnin_8h", "hbm_burnin_24h",
];
```
In C++ this would typically be `std::vector<std::string>` (heap-allocated on first use). Rust's `&'static [&'static str]` lives in read-only memory — zero runtime cost.

### When clone() IS appropriate

| **Situation** | **Why clone is OK** | **Example** |
|--------------|--------------------|-----------|
| `Arc::clone()` for threading | Bumps ref count (~1 ns), doesn't copy data | `let flag = stop_flag.clone();` |
| Moving data into a spawned thread | Thread needs its own copy | `let ctx = ctx.clone(); thread::spawn(move \|\| { ... })` |
| Extracting from `&self` fields | Can't move out of a borrow | `self.name.clone()` when returning owned `String` |
| Small `Copy` types wrapped in `Option` | `.copied()` is clearer than `.clone()` | `opt.get(0).copied()` for `Option<&u32>` → `Option<u32>` |

### Real example: Arc::clone for thread sharing
```rust
// Example: workload.rs — Arc::clone is cheap (ref count bump)
let stop_flag = Arc::new(AtomicBool::new(false));
let stop_flag_clone = stop_flag.clone();   // ~1 ns, no data copied
let ctx_clone = ctx.clone();               // Clone context for move into thread

let sensor_handle = thread::spawn(move || {
    // ...uses stop_flag_clone and ctx_clone
});
```

### Checklist: Should I clone?
1. **Can I accept `&str` / `&T` instead of `String` / `T`?** → Borrow, don't clone
2. **Can I restructure to avoid needing two owners?** → Pass by reference or use scopes
3. **Is this `Arc::clone()`?** → That's fine, it's O(1)
4. **Am I moving data into a thread/closure?** → Clone is necessary
5. **Am I cloning in a hot loop?** → Profile and consider borrowing or `Cow<T>`

----

## `Cow<'a, T>`: Clone-on-Write — borrow when you can, clone when you must

`Cow` (Clone on Write) is an enum that holds **either** a borrowed reference **or**
an owned value. It's the Rust equivalent of "avoid allocation when possible, but
allocate if you need to modify." C++ has no direct equivalent — the closest is a function
that returns `const std::string&` sometimes and `std::string` other times.

### Why `Cow` exists

```rust
// Without Cow — you must choose: always borrow OR always clone
fn normalize(s: &str) -> String {          // Always allocates!
    if s.contains(' ') {
        s.replace(' ', "_")               // New String (allocation needed)
    } else {
        s.to_string()                     // Unnecessary allocation!
    }
}

// With Cow — borrow when unchanged, allocate only when modified
use std::borrow::Cow;

fn normalize(s: &str) -> Cow<'_, str> {
    if s.contains(' ') {
        Cow::Owned(s.replace(' ', "_"))    // Allocates (must modify)
    } else {
        Cow::Borrowed(s)                   // Zero allocation (passthrough)
    }
}
```

### How `Cow` works

```rust
use std::borrow::Cow;

// Cow<'a, str> is essentially:
// enum Cow<'a, str> {
//     Borrowed(&'a str),     // Zero-cost reference
//     Owned(String),          // Heap-allocated owned value
// }

fn greet(name: &str) -> Cow<'_, str> {
    if name.is_empty() {
        Cow::Borrowed("stranger")         // Static string — no allocation
    } else if name.starts_with(' ') {
        Cow::Owned(name.trim().to_string()) // Modified — allocation needed
    } else {
        Cow::Borrowed(name)               // Passthrough — no allocation
    }
}

fn main() {
    let g1 = greet("Alice");     // Cow::Borrowed("Alice")
    let g2 = greet("");          // Cow::Borrowed("stranger")
    let g3 = greet(" Bob ");     // Cow::Owned("Bob")
    
    // Cow<str> implements Deref<Target = str>, so you can use it as &str:
    println!("Hello, {g1}!");    // Works — Cow auto-derefs to &str
    println!("Hello, {g2}!");
    println!("Hello, {g3}!");
}
```

### Real-world use case: config value normalization

```rust
use std::borrow::Cow;

/// Normalize a SKU name: trim whitespace, lowercase.
/// Returns Cow::Borrowed if already normalized (zero allocation).
fn normalize_sku(sku: &str) -> Cow<'_, str> {
    let trimmed = sku.trim();
    if trimmed == sku && sku.chars().all(|c| c.is_lowercase() || !c.is_alphabetic()) {
        Cow::Borrowed(sku)   // Already normalized — no allocation
    } else {
        Cow::Owned(trimmed.to_lowercase())  // Needs modification — allocate
    }
}

fn main() {
    let s1 = normalize_sku("server-x1");   // Borrowed — zero alloc
    let s2 = normalize_sku("  Server-X1 "); // Owned — must allocate
    println!("{s1}, {s2}"); // "server-x1, server-x1"
}
```

### When to use `Cow`

| **Situation** | **Use `Cow`?** |
|--------------|---------------|
| Function returns input unchanged most of the time | ✅ Yes — avoid unnecessary clones |
| Parsing/normalizing strings (trim, lowercase, replace) | ✅ Yes — often input is already valid |
| Always modifying — every code path allocates | ❌ No — just return `String` |
| Simple pass-through (never modifies) | ❌ No — just return `&str` |
| Data stored in a struct long-term | ❌ No — use `String` (owned) |

> **C++ comparison**: `Cow<str>` is like a function that returns `std::variant<std::string_view, std::string>`
> — except with automatic deref and no boilerplate to access the value.

----

## `Weak<T>`: Breaking Reference Cycles — Rust's `weak_ptr`

`Weak<T>` is the Rust equivalent of C++ `std::weak_ptr<T>`. It holds a non-owning
reference to an `Rc<T>` or `Arc<T>` value. The value can be deallocated while
`Weak` references still exist — calling `upgrade()` returns `None` if the value is gone.

### Why `Weak` exists

`Rc<T>` and `Arc<T>` create reference cycles if two values point to each
other — neither ever reaches refcount 0, so neither is dropped (memory leak).
`Weak` breaks the cycle:

```rust
use std::rc::{Rc, Weak};
use std::cell::RefCell;

#[derive(Debug)]
struct Node {
    value: String,
    parent: RefCell<Weak<Node>>,      // Weak — doesn't prevent parent from dropping
    children: RefCell<Vec<Rc<Node>>>,  // Strong — parent owns children
}

impl Node {
    fn new(value: &str) -> Rc<Node> {
        Rc::new(Node {
            value: value.to_string(),
            parent: RefCell::new(Weak::new()),
            children: RefCell::new(Vec::new()),
        })
    }

    fn add_child(parent: &Rc<Node>, child: &Rc<Node>) {
        // Child gets a weak reference to parent (no cycle)
        *child.parent.borrow_mut() = Rc::downgrade(parent);
        // Parent gets a strong reference to child
        parent.children.borrow_mut().push(Rc::clone(child));
    }
}

fn main() {
    let root = Node::new("root");
    let child = Node::new("child");
    Node::add_child(&root, &child);

    // Access parent from child via upgrade()
    if let Some(parent) = child.parent.borrow().upgrade() {
        println!("Child's parent: {}", parent.value); // "root"
    }
    
    println!("Root strong count: {}", Rc::strong_count(&root));  // 1
    println!("Root weak count: {}", Rc::weak_count(&root));      // 1
}
```

### C++ comparison

```cpp
// C++ — weak_ptr to break shared_ptr cycle
struct Node {
    std::string value;
    std::weak_ptr<Node> parent;                  // Weak — no ownership
    std::vector<std::shared_ptr<Node>> children;  // Strong — owns children

    static auto create(const std::string& v) {
        return std::make_shared<Node>(Node{v, {}, {}});
    }
};

auto root = Node::create("root");
auto child = Node::create("child");
child->parent = root;          // weak_ptr assignment
root->children.push_back(child);

if (auto p = child->parent.lock()) {   // lock() → shared_ptr or null
    std::cout << "Parent: " << p->value << std::endl;
}
```

| C++ | Rust | Notes |
|-----|------|-------|
| `shared_ptr<T>` | `Rc<T>` (single-thread) / `Arc<T>` (multi-thread) | Same semantics |
| `weak_ptr<T>` | `Weak<T>` from `Rc::downgrade()` / `Arc::downgrade()` | Same semantics |
| `weak_ptr::lock()` → `shared_ptr` or null | `Weak::upgrade()` → `Option<Rc<T>>` | `None` if dropped |
| `shared_ptr::use_count()` | `Rc::strong_count()` | Same meaning |

### When to use `Weak`

| **Situation** | **Pattern** |
|--------------|-----------|
| Parent ↔ child tree relationships | Parent holds `Rc<Child>`, child holds `Weak<Parent>` |
| Observer pattern / event listeners | Event source holds `Weak<Observer>`, observer holds `Rc<Source>` |
| Cache that doesn't prevent deallocation | `HashMap<Key, Weak<Value>>` — entries go stale naturally |
| Breaking cycles in graph structures | Cross-links use `Weak`, tree edges use `Rc`/`Arc` |

> **Prefer the arena pattern** (Case Study 2) over `Rc/Weak` for tree structures in
> new code. `Vec<T>` + indices is simpler, faster, and has zero reference-counting
> overhead. Use `Rc/Weak` when you need shared ownership with dynamic lifetimes.

----

## Copy vs Clone, PartialEq vs Eq — when to derive what

- **Copy ≈ C++ trivially copyable (no custom copy ctor/dtor).** Types like `int`, `enum`, and simple POD structs — the compiler generates a bitwise `memcpy` automatically. In Rust, `Copy` is the same idea: assignment `let b = a;` does an implicit bitwise copy and both variables remain valid.
- **Clone ≈ C++ copy constructor / `operator=` deep-copy.** When a C++ class has a custom copy constructor (e.g., to deep-copy a `std::vector` member), the equivalent in Rust is implementing `Clone`. You must call `.clone()` explicitly — Rust never hides an expensive copy behind `=`.
- **Key distinction:** In C++, both trivial copies and deep copies happen implicitly via the same `=` syntax. Rust forces you to choose: `Copy` types copy silently (cheap), non-`Copy` types **move** by default, and you must opt in to an expensive duplicate with `.clone()`.
- Similarly, C++ `operator==` doesn't distinguish between types where `a == a` always holds (like integers) and types where it doesn't (like `float` with NaN). Rust encodes this in `PartialEq` vs `Eq`.

### Copy vs Clone

| | **Copy** | **Clone** |
|---|---------|----------|
| **How it works** | Bitwise memcpy (implicit) | Custom logic (explicit `.clone()`) |
| **When it happens** | On assignment: `let b = a;` | Only when you call `.clone()` |
| **After copy/clone** | Both `a` and `b` are valid | Both `a` and `b` are valid |
| **Without either** | `let b = a;` **moves** `a` (a is gone) | `let b = a;` **moves** `a` (a is gone) |
| **Allowed for** | Types with no heap data | Any type |
| **C++ analogy** | Trivially copyable / POD types (no custom copy ctor) | Custom copy constructor (deep copy) |

### Real example: Copy — simple enums
```rust
// From fan_diag/src/sensor.rs — all unit variants, fits in 1 byte
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Default)]
pub enum FanStatus {
    #[default]
    Normal,
    Low,
    High,
    Missing,
    Failed,
    Unknown,
}

let status = FanStatus::Normal;
let copy = status;   // Implicit copy — status is still valid
println!("{:?} {:?}", status, copy);  // Both work
```

### Real example: Copy — enum with integer payloads
```rust
// Example: healthcheck.rs — u32 payloads are Copy, so the whole enum is too
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum HealthcheckStatus {
    Pass,
    ProgramError(u32),
    DmesgError(u32),
    RasError(u32),
    OtherError(u32),
    Unknown,
}
```

### Real example: Clone only — struct with heap data
```rust
// Example: components.rs — String prevents Copy
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FruData {
    pub technology: DeviceTechnology,
    pub physical_location: String,      // ← String: heap-allocated, can't Copy
    pub expected: bool,
    pub removable: bool,
}
// let a = fru_data;   → MOVES (a is gone)
// let a = fru_data.clone();  → CLONES (fru_data still valid, new heap allocation)
```

### The rule: Can it be Copy?
```text
Does the type contain String, Vec, Box, HashMap,
Rc, Arc, or any other heap-owning type?
    YES → Clone only (cannot be Copy)
    NO  → You CAN derive Copy (and should, if the type is small)
```

### PartialEq vs Eq

| | **PartialEq** | **Eq** |
|---|--------------|-------|
| **What it gives you** | `==` and `!=` operators | Marker: "equality is reflexive" |
| **Reflexive? (a == a)** | Not guaranteed | **Guaranteed** |
| **Why it matters** | `f32::NAN != f32::NAN` | `HashMap` keys **require** `Eq` |
| **When to derive** | Almost always | When the type has no `f32`/`f64` fields |
| **C++ analogy** | `operator==` | No direct equivalent (C++ doesn't check) |

### Real example: Eq — used as HashMap key
```rust
// From hms_trap/src/cpu_handler.rs — Hash requires Eq
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum CpuFaultType {
    InvalidFaultType,
    CpuCperFatalErr,
    CpuLpddr5UceErr,
    CpuC2CUceFatalErr,
    // ...
}
// Used as: HashMap<CpuFaultType, FaultHandler>
// HashMap keys must be Eq + Hash — PartialEq alone won't compile
```

### Real example: No Eq possible — type contains f32
```rust
// Example: types.rs — f32 prevents Eq
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct TemperatureSensors {
    pub warning_threshold: Option<f32>,   // ← f32 has NaN ≠ NaN
    pub critical_threshold: Option<f32>,  // ← can't derive Eq
    pub sensor_names: Vec<String>,
}
// Cannot be used as HashMap key. Cannot derive Eq.
// Because: f32::NAN == f32::NAN is false, violating reflexivity.
```

### PartialOrd vs Ord

| | **PartialOrd** | **Ord** |
|---|---------------|--------|
| **What it gives you** | `<`, `>`, `<=`, `>=` | `.sort()`, `BTreeMap` keys |
| **Total ordering?** | No (some pairs may be incomparable) | **Yes** (every pair is comparable) |
| **f32/f64?** | PartialOrd only (NaN breaks ordering) | Cannot derive Ord |

### Real example: Ord — severity ranking
```rust
// From hms_trap/src/fault.rs — variant order defines severity
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub enum FaultSeverity {
    Info,      // lowest  (discriminant 0)
    Warning,   //         (discriminant 1)
    Error,     //         (discriminant 2)
    Critical,  // highest (discriminant 3)
}
// FaultSeverity::Info < FaultSeverity::Critical → true
// Enables: if severity >= FaultSeverity::Error { escalate(); }
```

### Real example: Ord — diagnostic levels for comparison
```rust
// Example: orchestration.rs
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Default)]
pub enum GpuDiagLevel {
    #[default]
    Quick,     // lowest
    Standard,
    Extended,
    Full,      // highest
}
// Enables: if requested_level >= GpuDiagLevel::Extended { run_extended_tests(); }
```

### Derive decision tree

```text
                        Your new type
                            │
                   Contains String/Vec/Box?
                      /              \
                    YES                NO
                     │                  │
              Clone only          Clone + Copy
                     │                  │
              Contains f32/f64?    Contains f32/f64?
                /          \         /          \
              YES           NO     YES           NO
               │             │      │             │
         PartialEq       PartialEq  PartialEq  PartialEq
         only            + Eq       only       + Eq
                          │                      │
                    Need sorting?           Need sorting?
                      /       \               /       \
                    YES        NO            YES        NO
                     │          │              │          │
               PartialOrd    Done        PartialOrd    Done
               + Ord                     + Ord
                     │                        │
               Need as                  Need as
               map key?                 map key?
                  │                        │
                + Hash                   + Hash
```

### Quick reference: common derive combos from production Rust code

| **Type category** | **Typical derive** | **Example** |
|-------------------|--------------------|------------|
| Simple status enum | `Copy, Clone, PartialEq, Eq, Default` | `FanStatus` |
| Enum used as HashMap key | `Copy, Clone, PartialEq, Eq, Hash` | `CpuFaultType`, `SelComponent` |
| Sortable severity enum | `Copy, Clone, PartialEq, Eq, PartialOrd, Ord` | `FaultSeverity`, `GpuDiagLevel` |
| Data struct with Strings | `Clone, Debug, Serialize, Deserialize` | `FruData`, `OverallSummary` |
| Serializable config | `Clone, Debug, Default, Serialize, Deserialize` | `DiagConfig` |

----


