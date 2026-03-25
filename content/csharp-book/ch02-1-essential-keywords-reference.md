## Essential Rust Keywords for C# Developers

> **What you'll learn:** A quick-reference mapping of Rust keywords to their C# equivalents —
> visibility modifiers, ownership keywords, control flow, type definitions, and pattern matching syntax.
>
> **Difficulty:** 🟢 Beginner

Understanding Rust's keywords and their purposes helps C# developers navigate the language more effectively.

### Visibility and Access Control Keywords

#### C# Access Modifiers
```csharp
public class Example
{
    public int PublicField;           // Accessible everywhere
    private int privateField;        // Only within this class
    protected int protectedField;    // This class and subclasses
    internal int internalField;      // Within this assembly
    protected internal int protectedInternalField; // Combination
}
```

#### Rust Visibility Keywords
```rust
// pub - Makes items public (like C# public)
pub struct PublicStruct {
    pub public_field: i32,           // Public field
    private_field: i32,              // Private by default (no keyword)
}

pub mod my_module {
    pub(crate) fn crate_public() {}     // Public within current crate (like internal)
    pub(super) fn parent_public() {}    // Public to parent module
    pub(self) fn self_public() {}       // Public within current module (same as private)
    
    pub use super::PublicStruct;        // Re-export (like using alias)
}

// No direct equivalent to C# protected - use composition instead
```

### Memory and Ownership Keywords

#### C# Memory Keywords
```csharp
// ref - Pass by reference
public void Method(ref int value) { value = 10; }

// out - Output parameter
public bool TryParse(string input, out int result) { /* */ }

// in - Readonly reference (C# 7.2+)
public void ReadOnly(in LargeStruct data) { /* Cannot modify data */ }
```

#### Rust Ownership Keywords
```rust
// & - Immutable reference (like C# in parameter)
fn read_only(data: &Vec<i32>) {
    println!("Length: {}", data.len()); // Can read, cannot modify
}

// &mut - Mutable reference (like C# ref parameter)
fn modify(data: &mut Vec<i32>) {
    data.push(42); // Can modify
}

// move - Force move capture in closures
let data = vec![1, 2, 3];
let closure = move || {
    println!("{:?}", data); // data is moved into closure
};
// data is no longer accessible here

// Box - Heap allocation (like C# new for reference types)
let boxed_data = Box::new(42); // Allocate on heap
```

### Control Flow Keywords

#### C# Control Flow
```csharp
// return - Exit function with value
public int GetValue() { return 42; }

// yield return - Iterator pattern
public IEnumerable<int> GetNumbers()
{
    yield return 1;
    yield return 2;
}

// break/continue - Loop control
foreach (var item in items)
{
    if (item == null) continue;
    if (item.Stop) break;
}
```

#### Rust Control Flow Keywords
```rust
// return - Explicit return (usually not needed)
fn get_value() -> i32 {
    return 42; // Explicit return
    // OR just: 42 (implicit return)
}

// break/continue - Loop control with optional values
fn find_value() -> Option<i32> {
    loop {
        let value = get_next();
        if value < 0 { continue; }
        if value > 100 { break None; }      // Break with value
        if value == 42 { break Some(value); } // Break with success
    }
}

// loop - Infinite loop (like while(true))
loop {
    if condition { break; }
}

// while - Conditional loop
while condition {
    // code
}

// for - Iterator loop
for item in collection {
    // code
}
```

### Type Definition Keywords

#### C# Type Keywords
```csharp
// class - Reference type
public class MyClass { }

// struct - Value type
public struct MyStruct { }

// interface - Contract definition
public interface IMyInterface { }

// enum - Enumeration
public enum MyEnum { Value1, Value2 }

// delegate - Function pointer
public delegate void MyDelegate(int value);
```

#### Rust Type Keywords
```rust
// struct - Data structure (like C# class/struct combined)
struct MyStruct {
    field: i32,
}

// enum - Algebraic data type (much more powerful than C# enum)
enum MyEnum {
    Variant1,
    Variant2(i32),              // Can hold data
    Variant3 { x: i32, y: i32 }, // Struct-like variant
}

// trait - Interface definition (like C# interface but more powerful)
trait MyTrait {
    fn method(&self);
    
    // Default implementation (like C# 8+ default interface methods)
    fn default_method(&self) {
        println!("Default implementation");
    }
}

// type - Type alias (like C# using alias)
type UserId = u32;
type Result<T> = std::result::Result<T, MyError>;

// impl - Implementation block (no C# equivalent - methods defined separately)
impl MyStruct {
    fn new() -> MyStruct {
        MyStruct { field: 0 }
    }
}

impl MyTrait for MyStruct {
    fn method(&self) {
        println!("Implementation");
    }
}
```

### Function Definition Keywords

#### C# Function Keywords
```csharp
// static - Class method
public static void StaticMethod() { }

// virtual - Can be overridden
public virtual void VirtualMethod() { }

// override - Override base method
public override void VirtualMethod() { }

// abstract - Must be implemented
public abstract void AbstractMethod();

// async - Asynchronous method
public async Task<int> AsyncMethod() { return await SomeTask(); }
```

#### Rust Function Keywords
```rust
// fn - Function definition (like C# method but standalone)
fn regular_function() {
    println!("Hello");
}

// const fn - Compile-time function (like C# const but for functions)
const fn compile_time_function() -> i32 {
    42 // Can be evaluated at compile time
}

// async fn - Asynchronous function (like C# async)
async fn async_function() -> i32 {
    some_async_operation().await
}

// unsafe fn - Function that may violate memory safety
unsafe fn unsafe_function() {
    // Can perform unsafe operations
}

// extern fn - Foreign function interface
extern "C" fn c_compatible_function() {
    // Can be called from C
}
```

### Variable Declaration Keywords

#### C# Variable Keywords
```csharp
// var - Type inference
var name = "John"; // Inferred as string

// const - Compile-time constant
const int MaxSize = 100;

// readonly - Runtime constant (fields only, not local variables)
// readonly DateTime createdAt = DateTime.Now;

// static - Class-level variable
static int instanceCount = 0;
```

#### Rust Variable Keywords
```rust
// let - Variable binding (like C# var)
let name = "John"; // Immutable by default

// let mut - Mutable variable binding
let mut count = 0; // Can be changed
count += 1;

// const - Compile-time constant (like C# const)
const MAX_SIZE: usize = 100;

// static - Global variable (like C# static)
static INSTANCE_COUNT: std::sync::atomic::AtomicUsize = 
    std::sync::atomic::AtomicUsize::new(0);
```

### Pattern Matching Keywords

#### C# Pattern Matching (C# 8+)
```csharp
// switch expression
string result = value switch
{
    1 => "One",
    2 => "Two",
    _ => "Other"
};

// is pattern
if (obj is string str)
{
    Console.WriteLine(str.Length);
}
```

#### Rust Pattern Matching Keywords
```rust
// match - Pattern matching (like C# switch but much more powerful)
let result = match value {
    1 => "One",
    2 => "Two",
    3..=10 => "Between 3 and 10", // Range patterns
    _ => "Other", // Wildcard (like C# _)
};

// if let - Conditional pattern matching
if let Some(value) = optional {
    println!("Got value: {}", value);
}

// while let - Loop with pattern matching
while let Some(item) = iterator.next() {
    println!("Item: {}", item);
}

// let with patterns - Destructuring
let (x, y) = point; // Destructure tuple
let Some(value) = optional else {
    return; // Early return if pattern doesn't match
};
```

### Memory Safety Keywords

#### C# Memory Keywords
```csharp
// unsafe - Disable safety checks
unsafe
{
    int* ptr = &variable;
    *ptr = 42;
}

// fixed - Pin managed memory
unsafe
{
    fixed (byte* ptr = array)
    {
        // Use ptr
    }
}
```

#### Rust Safety Keywords
```rust
// unsafe - Disable borrow checker (use sparingly!)
unsafe {
    let ptr = &variable as *const i32;
    let value = *ptr; // Dereference raw pointer
}

// Raw pointer types (no C# equivalent - usually not needed)
let ptr: *const i32 = &42;  // Immutable raw pointer
let ptr: *mut i32 = &mut 42; // Mutable raw pointer
```

### Common Rust Keywords Not in C#

```rust
// where - Generic constraints (more flexible than C# where)
fn generic_function<T>() 
where 
    T: Clone + Send + Sync,
{
    // T must implement Clone, Send, and Sync traits
}

// dyn - Dynamic trait objects (like C# object but type-safe)
let drawable: Box<dyn Draw> = Box::new(Circle::new());

// Self - Refer to the implementing type (like C# this but for types)
impl MyStruct {
    fn new() -> Self { // Self = MyStruct
        Self { field: 0 }
    }
}

// self - Method receiver
impl MyStruct {
    fn method(&self) { }        // Immutable borrow
    fn method_mut(&mut self) { } // Mutable borrow  
    fn consume(self) { }        // Take ownership
}

// crate - Refer to current crate root
use crate::models::User; // Absolute path from crate root

// super - Refer to parent module
use super::utils; // Import from parent module
```

### Keywords Summary for C# Developers

| Purpose | C# | Rust | Key Difference |
|---------|----|----|----------------|
| Visibility | `public`, `private`, `internal` | `pub`, default private | More granular with `pub(crate)` |
| Variables | `var`, `readonly`, `const` | `let`, `let mut`, `const` | Immutable by default |
| Functions | `method()` | `fn` | Standalone functions |
| Types | `class`, `struct`, `interface` | `struct`, `enum`, `trait` | Enums are algebraic types |
| Generics | `<T> where T : IFoo` | `<T> where T: Foo` | More flexible constraints |
| References | `ref`, `out`, `in` | `&`, `&mut` | Compile-time borrow checking |
| Patterns | `switch`, `is` | `match`, `if let` | Exhaustive matching required |

***


