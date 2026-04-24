### Unsafe Rust

> **What you'll learn:** When and how to use `unsafe` — raw pointer dereferencing, FFI (Foreign Function Interface) for calling C from Rust and vice versa, `CString`/`CStr` for string interop, and how to write safe wrappers around unsafe code.

- ```unsafe``` unlocks access to features that are normally disallowed by the Rust compiler
    - Dereferencing raw pointers
    - Accessing *mutable* static variables
    - https://doc.rust-lang.org/book/ch19-01-unsafe-rust.html
- With great power comes great responsibility
    - ```unsafe``` tells the compiler "I, the programmer, take responsibility for upholding the invariants that the compiler normally guarantees"
    - Must guarantee no aliased mutable and immutable references, no dangling pointers, no invalid references, ...
    - The use of ```unsafe``` should be limited to the smallest possible scope
    - All code using ```unsafe``` should have a "safety" comment describing the assumptions

### Unsafe Rust examples
```rust
unsafe fn harmless() {}
fn main() {
    // Safety: We are calling a harmless unsafe function
    unsafe {
        harmless();
    }
    let a = 42u32;
    let p = &a as *const u32;
    // Safety: p is a valid pointer to a variable that will remain in scope
    unsafe {
        println!("{}", *p);
    }
    // Safety: Not safe; for illustration purposes only
    let dangerous_buffer = 0xb8000 as *mut u32;
    unsafe {
        println!("About to go kaboom!!!");
        *dangerous_buffer = 0; // This will SEGV on most modern machines
    }
}
```

### Simple FFI example (Rust library function consumed by C)

## FFI Strings: CString and CStr

FFI stands for *Foreign Function Interface* — the mechanism Rust uses to call functions written in other languages (such as C) and vice versa.

When interfacing with C code, Rust's `String` and `&str` types (which are UTF-8 without null terminators) aren't directly compatible with C strings (which are null-terminated byte arrays). Rust provides `CString` (owned) and `CStr` (borrowed) from `std::ffi` for this purpose:

| Type | Analogous to | Use when |
|------|-------------|----------|
| `CString` | `String` (owned) | Creating a C string from Rust data |
| `&CStr` | `&str` (borrowed) | Receiving a C string from foreign code |

```rust
use std::ffi::{CString, CStr};
use std::os::raw::c_char;

fn demo_ffi_strings() {
    // Creating a C-compatible string (adds null terminator)
    let c_string = CString::new("Hello from Rust").expect("CString::new failed");
    let ptr: *const c_char = c_string.as_ptr();

    // Converting a C string back to Rust (unsafe because we trust the pointer)
    // Safety: ptr is valid and null-terminated (we just created it above)
    let back_to_rust: &CStr = unsafe { CStr::from_ptr(ptr) };
    let rust_str: &str = back_to_rust.to_str().expect("Invalid UTF-8");
    println!("{}", rust_str);
}
```

> **Warning**: `CString::new()` will return an error if the input contains interior null bytes (`\0`). Always handle the `Result`. You'll see `CStr` used extensively in the FFI examples below.

- ```FFI``` methods must be marked with ```#[no_mangle]``` to ensure that the compiler doesn't mangle the name
- We'll compile the crate as a static library
    ```
    #[no_mangle] 
    pub extern "C" fn add(left: u64, right: u64) -> u64 {
        left + right
    }
    ```
- We'll compile the following C-code and link it against our static library.
    ```
    #include <stdio.h>
    #include <stdint.h>
    extern uint64_t add(uint64_t, uint64_t);
    int main() {
        printf("Add returned %llu\n", add(21, 21));
    }
    ``` 

### Complex FFI example
- In the following examples, we'll create a Rust logging interface and expose it to
[PYTHON] and ```C```
    - We'll see how the same interface can be used natively from Rust and C
    - We will explore the use of tools like ```cbindgen``` to generate header files for ```C```
    - We will see how ```unsafe``` wrappers can act as a bridge to safe Rust code

## Logger helper functions
```rust
fn create_or_open_log_file(log_file: &str, overwrite: bool) -> Result<File, String> {
    if overwrite {
        File::create(log_file).map_err(|e| e.to_string())
    } else {
        OpenOptions::new()
            .write(true)
            .append(true)
            .open(log_file)
            .map_err(|e| e.to_string())
    }
}

fn log_to_file(file_handle: &mut File, message: &str) -> Result<(), String> {
    file_handle
        .write_all(message.as_bytes())
        .map_err(|e| e.to_string())
}
```

## Logger struct
```rust
struct SimpleLogger {
    log_level: LogLevel,
    file_handle: File,
}

impl SimpleLogger {
    fn new(log_file: &str, overwrite: bool, log_level: LogLevel) -> Result<Self, String> {
        let file_handle = create_or_open_log_file(log_file, overwrite)?;
        Ok(Self {
            file_handle,
            log_level,
        })
    }

    fn log_message(&mut self, log_level: LogLevel, message: &str) -> Result<(), String> {
        if log_level as u32 <= self.log_level as u32 {
            let timestamp = Local::now().format("%Y-%m-%d %H:%M:%S").to_string();
            let message = format!("Simple: {timestamp} {log_level} {message}\n");
            log_to_file(&mut self.file_handle, &message)
        } else {
            Ok(())
        }
    }
}
```

## Testing
- Testing functionality with Rust is trivial
    - Test methods are decorated with ```#[test]```, and aren't part of the compiled binary 
    - It's easy to create mock methods for testing purposes
```rust
#[test]
fn testfunc() -> Result<(), String> {
    let mut logger = SimpleLogger::new("test.log", false, LogLevel::INFO)?;
    logger.log_message(LogLevel::TRACELEVEL1, "Hello world")?;
    logger.log_message(LogLevel::CRITICAL, "Critical message")?;
    Ok(()) // The compiler automatically drops logger here
}
```
```bash
cargo test
```

## (C)-Rust FFI
- cbindgen is a great tool for generating header files for exported Rust functions
    - Can be installed using cargo
```bash
cargo install cbindgen
cbindgen 
```
- Function and structures can be exported using ```#[no_mangle]``` and ```#[repr(C)]```
    - We'll assume the common interface pattern passing in a `**` to the actual implementation and returning 0 on success and non-zero on error
    - **Opaque vs transparent structs**: Our `SimpleLogger` is passed as an *opaque pointer* (`*mut SimpleLogger`) — the C side never accesses its fields, so `#[repr(C)]` is **not** needed. Use `#[repr(C)]` when C code needs to read/write struct fields directly:

```rust
// Opaque — C only holds a pointer, never inspects fields. No #[repr(C)] needed.
struct SimpleLogger { /* Rust-only fields */ }

// Transparent — C reads/writes fields directly. MUST use #[repr(C)].
#[repr(C)]
pub struct Point {
    pub x: f64,
    pub y: f64,
}
```
```c
typedef struct SimpleLogger SimpleLogger;
uint32_t create_simple_logger(const char *file_name, struct SimpleLogger **out_logger);
uint32_t log_entry(struct SimpleLogger *logger, const char *message);
uint32_t drop_logger(struct SimpleLogger *logger);
```

- Note that we need to a lot of sanity checks
- We have to explicitly leak memory to prevent Rust from automatically deallocating
```rust
#[no_mangle] 
pub extern "C" fn create_simple_logger(file_name: *const std::os::raw::c_char, out_logger: *mut *mut SimpleLogger) -> u32 {
    use std::ffi::CStr;
    // Make sure pointer isn't NULL
    if file_name.is_null() || out_logger.is_null() {
        return 1;
    }
    // Safety: The passed in pointer is either NULL or 0-terminated by contract
    let file_name = unsafe {
        CStr::from_ptr(file_name)
    };
    let file_name = file_name.to_str();
    // Make sure that file_name doesn't have garbage characters
    if file_name.is_err() {
        return 1;
    }
    let file_name = file_name.unwrap();
    // Assume some defaults; we'll pass them in real life
    let new_logger = SimpleLogger::new(file_name, true, LogLevel::CRITICAL);
    // Check that we were able to construct the logger
    if new_logger.is_err() {
        return 1;
    }
    let new_logger = Box::new(new_logger.unwrap());
    // This prevents the Box from being dropped when if goes out of scope
    let logger_ptr: *mut SimpleLogger = Box::leak(new_logger);
    // Safety: logger is non-null and logger_ptr is valid
    unsafe {
        *out_logger = logger_ptr;
    }
    return 0;
}
```

- We have similar error checks in ```log_entry()```
```rust
#[no_mangle]
pub extern "C" fn log_entry(logger: *mut SimpleLogger, message: *const std::os::raw::c_char) -> u32 {
    use std::ffi::CStr;
    if message.is_null() || logger.is_null() {
        return 1;
    }
    // Safety: message is non-null
    let message = unsafe {
        CStr::from_ptr(message)
    };
    let message = message.to_str();
    // Make sure that file_name doesn't have garbage characters
    if message.is_err() {
        return 1;
    }
    // Safety: logger is valid pointer previously constructed by create_simple_logger()
    unsafe {
        (*logger).log_message(LogLevel::CRITICAL, message.unwrap()).is_err() as u32
    }
}

#[no_mangle]
pub extern "C" fn drop_logger(logger: *mut SimpleLogger) -> u32 {
    if logger.is_null() {
        return 1;
    }
    // Safety: logger is valid pointer previously constructed by create_simple_logger()
    unsafe {
        // This constructs a Box<SimpleLogger>, which is dropped when it goes out of scope
        let _ = Box::from_raw(logger);
    }
    0
}
```

- We can test our (C)-FFI using Rust, or by writing a (C)-program
```rust
#[test]
fn test_c_logger() {
    // The c".." creates a NULL terminated string
    let file_name = c"test.log".as_ptr() as *const std::os::raw::c_char;
    let mut c_logger: *mut SimpleLogger = std::ptr::null_mut();
    assert_eq!(create_simple_logger(file_name, &mut c_logger), 0);
    // This is the manual way to create c"..." strings
    let message = b"message from C\0".as_ptr() as *const std::os::raw::c_char;
    assert_eq!(log_entry(c_logger, message), 0);
    drop_logger(c_logger);
}
```
```c
#include "logger.h"
...
int main() {
    SimpleLogger *logger = NULL;
    if (create_simple_logger("test.log", &logger) == 0) {
        log_entry(logger, "Hello from C");
        drop_logger(logger); /*Needed to close handle, etc.*/
    } 
    ...
}
```

## Ensuring correctness of unsafe code
- The TL;DR version is that using ```unsafe``` requires deliberate thought
    - Always document the safety assumptions made by the code and review it with experts
    - Use tools like cbindgen, Miri, Valgrind that can help verify correctness
    - **Never let a panic unwind across an FFI boundary** — this is UB. Use `std::panic::catch_unwind` at FFI entry points, or configure `panic = "abort"` in your profile
    - If a struct is shared across FFI, mark it `#[repr(C)]` to guarantee C-compatible memory layout
    - Consult https://doc.rust-lang.org/nomicon/intro.html (the "Rustonomicon" — the dark arts of unsafe Rust)
    - Seek help of internal experts

### Verification tools: Miri vs Valgrind

C++ developers are familiar with Valgrind and sanitizers. Rust has those **plus** Miri, which is far more precise for Rust-specific UB:

| | **Miri** | **Valgrind** | **C++ sanitizers (ASan/MSan/UBSan)** |
|---|---------|-------------|--------------------------------------|
| **What it catches** | Rust-specific UB: stacked borrows, invalid `enum` discriminants, uninitialized reads, aliasing violations | Memory leaks, use-after-free, invalid reads/writes, uninitialized memory | Buffer overflow, use-after-free, data races, UB |
| **How it works** | Interprets MIR (Rust's mid-level IR) — no native execution | Instruments compiled binary at runtime | Compile-time instrumentation |
| **FFI support** | ❌ Cannot cross FFI boundary (skips C calls) | ✅ Works on any compiled binary, including FFI | ✅ Works if C code also compiled with sanitizers |
| **Speed** | ~100x slower than native | ~10-50x slower | ~2-5x slower |
| **When to use** | Pure Rust `unsafe` code, data structure invariants | FFI code, full binary integration tests | C/C++ side of FFI, performance-sensitive testing |
| **Catches aliasing bugs** | ✅ Stacked Borrows model | ❌ | Partially (TSan for data races) |

**Recommendation**: Use **both** — Miri for pure Rust unsafe, Valgrind for FFI integration:

- **Miri** — catches Rust-specific UB that Valgrind cannot see (aliasing violations, invalid enum values, stacked borrows):
    ```
    rustup +nightly component add miri
    cargo +nightly miri test                    # Run all tests under Miri
    cargo +nightly miri test -- test_name       # Run a specific test
    ```
    > ⚠️ Miri requires nightly and cannot execute FFI calls. Isolate unsafe Rust logic into testable units.

- **Valgrind** — the tool you already know, works on the compiled binary including FFI:
    ```
    sudo apt install valgrind
    cargo install cargo-valgrind
    cargo valgrind test                         # Run all tests under Valgrind
    ```
    > Catches leaks in `Box::leak` / `Box::from_raw` patterns common in FFI code.

- **cargo-careful** — runs tests with extra runtime checks enabled (between regular tests and Miri):
    ```
    cargo install cargo-careful
    cargo +nightly careful test
    ```

## Unsafe Rust summary
- ```cbindgen``` is a great tool for (C) FFI to Rust
    - Use ```bindgen``` for FFI-interfaces in the other direction (consult the extensive documentation)
- **Do not assume that your unsafe code is correct, or that it's fine to use from safe Rust. It's really easy to make mistakes, and even code that seemingly works correctly can be wrong for subtle reasons**
    - Use tools to verify correctness
    - If still in doubt, reach out for expert advice
- Make sure that your ```unsafe``` code has comments with an explicit documentation about assumptions and why it's correct
    - Callers of ```unsafe``` code should have corresponding comments on safety as well, and observe restrictions

# Exercise: Writing a safe FFI wrapper

🔴 **Challenge** — requires understanding unsafe blocks, raw pointers, and safe API design

- Write a safe Rust wrapper around an `unsafe` FFI-style function. The exercise simulates calling a C function that writes a formatted string into a caller-provided buffer.
- **Step 1**: Implement the unsafe function `unsafe_greet` that writes a greeting into a raw `*mut u8` buffer
- **Step 2**: Write a safe wrapper `safe_greet` that allocates a `Vec<u8>`, calls the unsafe function, and returns a `String`
- **Step 3**: Add proper `// Safety:` comments to every unsafe block

**Starter code:**
```rust
use std::fmt::Write as _;

/// Simulates a C function: writes "Hello, <name>!" into buffer.
/// Returns the number of bytes written (excluding null terminator).
/// # Safety
/// - `buf` must point to at least `buf_len` writable bytes
/// - `name` must be a valid pointer to a null-terminated C string
unsafe fn unsafe_greet(buf: *mut u8, buf_len: usize, name: *const u8) -> isize {
    // TODO: Build greeting, copy bytes into buf, return length
    // Hint: use std::ffi::CStr::from_ptr or iterate bytes manually
    todo!()
}

/// Safe wrapper — no unsafe in the public API
fn safe_greet(name: &str) -> Result<String, String> {
    // TODO: Allocate a Vec<u8> buffer, create a null-terminated name,
    // call unsafe_greet inside an unsafe block with Safety comment,
    // convert the result back to a String
    todo!()
}

fn main() {
    match safe_greet("Rustacean") {
        Ok(msg) => println!("{msg}"),
        Err(e) => eprintln!("Error: {e}"),
    }
    // Expected output: Hello, Rustacean!
}
```

<details><summary>Solution (click to expand)</summary>

```rust
use std::ffi::CStr;

/// Simulates a C function: writes "Hello, <name>!" into buffer.
/// Returns the number of bytes written, or -1 if buffer too small.
/// # Safety
/// - `buf` must point to at least `buf_len` writable bytes
/// - `name` must be a valid pointer to a null-terminated C string
unsafe fn unsafe_greet(buf: *mut u8, buf_len: usize, name: *const u8) -> isize {
    // Safety: caller guarantees name is a valid null-terminated string
    let name_cstr = unsafe { CStr::from_ptr(name as *const std::os::raw::c_char) };
    let name_str = match name_cstr.to_str() {
        Ok(s) => s,
        Err(_) => return -1,
    };
    let greeting = format!("Hello, {}!", name_str);
    if greeting.len() > buf_len {
        return -1;
    }
    // Safety: buf points to at least buf_len writable bytes (caller guarantee)
    unsafe {
        std::ptr::copy_nonoverlapping(greeting.as_ptr(), buf, greeting.len());
    }
    greeting.len() as isize
}

/// Safe wrapper — no unsafe in the public API
fn safe_greet(name: &str) -> Result<String, String> {
    let mut buffer = vec![0u8; 256];
    // Create a null-terminated version of name for the C API
    let name_with_null: Vec<u8> = name.bytes().chain(std::iter::once(0)).collect();

    // Safety: buffer has 256 writable bytes, name_with_null is null-terminated
    let bytes_written = unsafe {
        unsafe_greet(buffer.as_mut_ptr(), buffer.len(), name_with_null.as_ptr())
    };

    if bytes_written < 0 {
        return Err("Buffer too small or invalid name".to_string());
    }

    String::from_utf8(buffer[..bytes_written as usize].to_vec())
        .map_err(|e| format!("Invalid UTF-8: {e}"))
}

fn main() {
    match safe_greet("Rustacean") {
        Ok(msg) => println!("{msg}"),
        Err(e) => eprintln!("Error: {e}"),
    }
}
// Output:
// Hello, Rustacean!
```

</details>

----


