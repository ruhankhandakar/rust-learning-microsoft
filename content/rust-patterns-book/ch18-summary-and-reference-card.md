## Quick Reference Card

### Pattern Decision Guide

```text
Need type safety for primitives?
└── Newtype pattern (Ch3)

Need compile-time state enforcement?
└── Type-state pattern (Ch3)

Need a "tag" with no runtime data?
└── PhantomData (Ch4)

Need to break Rc/Arc reference cycles?
└── Weak<T> / sync::Weak<T> (Ch8)

Need to wait for a condition without busy-looping?
└── Condvar + Mutex (Ch6)

Need to handle "one of N types"?
├── Known closed set → Enum
├── Open set, hot path → Generics
├── Open set, cold path → dyn Trait
└── Completely unknown types → Any + TypeId (Ch2)

Need shared state across threads?
├── Simple counter/flag → Atomics
├── Short critical section → Mutex
├── Read-heavy → RwLock
├── Lazy one-time init → OnceLock / LazyLock (Ch6)
└── Complex state → Actor + Channels

Need to parallelize computation?
├── Collection processing → rayon::par_iter
├── Background task → thread::spawn
└── Borrow local data → thread::scope

Need async I/O or concurrent networking?
├── Basic → tokio + async/await (Ch15)
└── Advanced (streams, middleware) → see Async Rust Training

Need error handling?
├── Library → thiserror (#[derive(Error)])
└── Application → anyhow (Result<T>)

Need to prevent a value from being moved?
└── Pin<T> (Ch8) — required for Futures, self-referential types
```

### Trait Bounds Cheat Sheet

| Bound | Meaning |
|-------|---------|
| `T: Clone` | Can be duplicated |
| `T: Send` | Can be moved to another thread |
| `T: Sync` | `&T` can be shared between threads |
| `T: 'static` | Contains no non-static references |
| `T: Sized` | Size known at compile time (default) |
| `T: ?Sized` | Size may not be known (`[T]`, `dyn Trait`) |
| `T: Unpin` | Safe to move after pinning |
| `T: Default` | Has a default value |
| `T: Into<U>` | Can be converted to `U` |
| `T: AsRef<U>` | Can be borrowed as `&U` |
| `T: Deref<Target = U>` | Auto-derefs to `&U` |
| `F: Fn(A) -> B` | Callable, borrows state immutably |
| `F: FnMut(A) -> B` | Callable, may mutate state |
| `F: FnOnce(A) -> B` | Callable exactly once, may consume state |

### Lifetime Elision Rules

The compiler inserts lifetimes automatically in three cases (so you don't have to):

```rust
// Rule 1: Each reference parameter gets its own lifetime
// fn foo(x: &str, y: &str)  →  fn foo<'a, 'b>(x: &'a str, y: &'b str)

// Rule 2: If there's exactly ONE input lifetime, it's used for all outputs
// fn foo(x: &str) -> &str   →  fn foo<'a>(x: &'a str) -> &'a str

// Rule 3: If one parameter is &self or &mut self, its lifetime is used
// fn foo(&self, x: &str) -> &str  →  fn foo<'a>(&'a self, x: &str) -> &'a str
```

**When you MUST write explicit lifetimes**:
- Multiple input references and a reference output (compiler can't guess which input)
- Struct fields that hold references: `struct Ref<'a> { data: &'a str }`
- `'static` bounds when you need data without borrowed references

### Common Derive Traits

```rust
#[derive(
    Debug,          // {:?} formatting
    Clone,          // .clone()
    Copy,           // Implicit copy (only for simple types)
    PartialEq, Eq,  // == comparison
    PartialOrd, Ord, // < > comparison + sorting
    Hash,           // HashMap/HashSet key
    Default,        // Type::default()
)]
struct MyType { /* ... */ }
```

### Module Visibility Quick Reference

```text
pub           → visible everywhere
pub(crate)    → visible within the crate
pub(super)    → visible to parent module
pub(in path)  → visible within a specific path
(nothing)     → private to current module + children
```

### Further Reading

| Resource | Why |
|----------|-----|
| [Rust Design Patterns](https://rust-unofficial.github.io/patterns/) | Catalog of idiomatic patterns and anti-patterns |
| [Rust API Guidelines](https://rust-lang.github.io/api-guidelines/) | Official checklist for polished public APIs |
| [Rust Atomics and Locks](https://marabos.nl/atomics/) | Mara Bos's deep dive into concurrency primitives |
| [The Rustonomicon](https://doc.rust-lang.org/nomicon/) | Official guide to unsafe Rust and dark corners |
| [Error Handling in Rust](https://blog.burntsushi.net/rust-error-handling/) | Andrew Gallant's comprehensive guide |
| [Jon Gjengset — Crust of Rust series](https://www.youtube.com/playlist?list=PLqbS7AVVErFiWDOAVrPt7aYmnuuOLYvOa) | Deep dives into iterators, lifetimes, channels, etc. |
| [Effective Rust](https://www.lurklurk.org/effective-rust/) | 35 specific ways to improve your Rust code |

***

*End of Rust Patterns & Engineering How-Tos*

