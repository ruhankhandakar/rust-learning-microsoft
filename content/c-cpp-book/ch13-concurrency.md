# Rust concurrency

> **What you'll learn:** Rust's concurrency model — threads, `Send`/`Sync` marker traits, `Mutex<T>`, `Arc<T>`, channels, and how the compiler prevents data races at compile time. No runtime overhead for thread safety you don't use.

- Rust has built-in support for concurrency, similar to `std::thread` in C++
    - Key difference: Rust **prevents data races at compile time** through `Send` and `Sync` marker traits
    - In C++, sharing a `std::vector` across threads without a mutex is UB but compiles fine. In Rust, it won't compile.
    - `Mutex<T>` in Rust wraps the **data**, not just the access — you literally cannot read the data without locking
- The `thread::spawn()` can be used to create a separate thread that executes the closure `||` in parallel
```rust
use std::thread;
use std::time::Duration;
fn main() {
    let handle = thread::spawn(|| {
        for i in 0..10 {
            println!("Count in thread: {i}!");
            thread::sleep(Duration::from_millis(5));
        }
    });

    for i in 0..5 {
        println!("Main thread: {i}");
        thread::sleep(Duration::from_millis(5));
    }

    handle.join().unwrap(); // The handle.join() ensures that the spawned thread exits
}
```

# Rust concurrency
- ```thread::scope()``` can be used in cases where it is necessary to borrow from the environment. This works because ```thread::scope``` waits until the internal thread returns
- Try executing this exercise without ```thread::scope``` to see the issue
```rust
use std::thread;
fn main() {
  let a = [0, 1, 2];
  thread::scope(|scope| {
      scope.spawn(|| {
          for x in &a {
            println!("{x}");
          }
      });
  });
}
```
----
# Rust concurrency
- We can also use ```move``` to transfer ownership to the thread. For `Copy` types like `[i32; 3]`, the `move` keyword copies the data into the closure, and the original remains usable
```rust
use std::thread;
fn main() {
  let mut a = [0, 1, 2];
  let handle = thread::spawn(move || {
      for x in a {
        println!("{x}");
      }
  });
  a[0] = 42;    // Doesn't affect the copy sent to the thread
  handle.join().unwrap();
}
```

# Rust concurrency
- ```Arc<T>``` can be used to share *read-only* references between multiple threads
    - ```Arc``` stands for Atomic Reference Counted. The reference isn't released until the reference count reaches 0
    - ```Arc::clone()``` simply increases the reference count without cloning the data
```rust
use std::sync::Arc;
use std::thread;
fn main() {
    let a = Arc::new([0, 1, 2]);
    let mut handles = Vec::new();
    for i in 0..2 {
        let arc = Arc::clone(&a);
        handles.push(thread::spawn(move || {
            println!("Thread: {i} {arc:?}");
        }));
    }
    handles.into_iter().for_each(|h| h.join().unwrap());
}
```

# Rust concurrency
- ```Arc<T>``` can be combined with ```Mutex<T>``` to provide mutable references.
    - ```Mutex``` guards the protected data and ensures that only the thread holding the lock has access.
    - The `MutexGuard` is automatically released when it goes out of scope (RAII). Note: `std::mem::forget` can still leak a guard — so "impossible to forget to unlock" is more accurate than "impossible to leak."
```rust
use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    let counter = Arc::new(Mutex::new(0));
    let mut handles = Vec::new();

    for _ in 0..5 {
        let counter = Arc::clone(&counter);
        handles.push(thread::spawn(move || {
            let mut num = counter.lock().unwrap();
            *num += 1;
            // MutexGuard dropped here — lock released automatically
        }));
    }

    for handle in handles {
        handle.join().unwrap();
    }

    println!("Final count: {}", *counter.lock().unwrap());
    // Output: Final count: 5
}
```

# Rust concurrency: RwLock
- `RwLock<T>` allows **multiple concurrent readers** or **one exclusive writer** — the read/write lock pattern from C++ (`std::shared_mutex`)
    - Use `RwLock` when reads far outnumber writes (e.g., configuration, caches)
    - Use `Mutex` when read/write frequency is similar or critical sections are short
```rust
use std::sync::{Arc, RwLock};
use std::thread;

fn main() {
    let config = Arc::new(RwLock::new(String::from("v1.0")));
    let mut handles = Vec::new();

    // Spawn 5 readers — all can run concurrently
    for i in 0..5 {
        let config = Arc::clone(&config);
        handles.push(thread::spawn(move || {
            let val = config.read().unwrap();  // Multiple readers OK
            println!("Reader {i}: {val}");
        }));
    }

    // One writer — blocks until all readers finish
    {
        let config = Arc::clone(&config);
        handles.push(thread::spawn(move || {
            let mut val = config.write().unwrap();  // Exclusive access
            *val = String::from("v2.0");
            println!("Writer: updated to {val}");
        }));
    }

    for handle in handles {
        handle.join().unwrap();
    }
}
```

# Rust concurrency: Mutex poisoning
- If a thread **panics** while holding a `Mutex` or `RwLock`, the lock becomes **poisoned**
    - Subsequent calls to `.lock()` return `Err(PoisonError)` — the data may be in an inconsistent state
    - You can recover with `.into_inner()` if you're confident the data is still valid
    - This has no C++ equivalent — `std::mutex` has no poisoning concept; a panicking thread just leaves the lock held
```rust
use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    let data = Arc::new(Mutex::new(vec![1, 2, 3]));

    let data2 = Arc::clone(&data);
    let handle = thread::spawn(move || {
        let mut guard = data2.lock().unwrap();
        guard.push(4);
        panic!("oops!");  // Lock is now poisoned
    });

    let _ = handle.join();  // Thread panicked

    // Subsequent lock attempts return Err(PoisonError)
    match data.lock() {
        Ok(guard) => println!("Data: {guard:?}"),
        Err(poisoned) => {
            println!("Lock was poisoned! Recovering...");
            let guard = poisoned.into_inner();  // Access data anyway
            println!("Recovered data: {guard:?}");  // [1, 2, 3, 4] — push succeeded before panic
        }
    }
}
```

# Rust concurrency: Atomics
- For simple counters and flags, `std::sync::atomic` types avoid the overhead of a `Mutex`
    - `AtomicBool`, `AtomicI32`, `AtomicU64`, `AtomicUsize`, etc.
    - Equivalent to C++ `std::atomic<T>` — same memory ordering model (`Relaxed`, `Acquire`, `Release`, `SeqCst`)
```rust
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Arc;
use std::thread;

fn main() {
    let counter = Arc::new(AtomicU64::new(0));
    let mut handles = Vec::new();

    for _ in 0..10 {
        let counter = Arc::clone(&counter);
        handles.push(thread::spawn(move || {
            for _ in 0..1000 {
                counter.fetch_add(1, Ordering::Relaxed);
            }
        }));
    }

    for handle in handles {
        handle.join().unwrap();
    }

    println!("Counter: {}", counter.load(Ordering::SeqCst));
    // Output: Counter: 10000
}
```

| Primitive | When to use | C++ equivalent |
|-----------|-------------|----------------|
| `Mutex<T>` | General mutable shared state | `std::mutex` + manual data association |
| `RwLock<T>` | Read-heavy workloads | `std::shared_mutex` |
| `Atomic*` | Simple counters, flags, lock-free patterns | `std::atomic<T>` |
| `Condvar` | Wait for a condition to become true | `std::condition_variable` |

# Rust concurrency: Condvar
- `Condvar` (condition variable) lets a thread **sleep until another thread signals** that a condition has changed
    - Always paired with a `Mutex` — the pattern is: lock, check condition, wait if not ready, act when ready
    - Equivalent to C++ `std::condition_variable` / `std::condition_variable::wait`
    - Handles **spurious wakeups** — always re-check the condition in a loop (or use `wait_while`/`wait_until`)
```rust
use std::sync::{Arc, Condvar, Mutex};
use std::thread;

fn main() {
    let pair = Arc::new((Mutex::new(false), Condvar::new()));

    // Spawn a worker that waits for a signal
    let pair2 = Arc::clone(&pair);
    let worker = thread::spawn(move || {
        let (lock, cvar) = &*pair2;
        let mut ready = lock.lock().unwrap();
        // wait: sleeps until signaled (always re-check in a loop for spurious wakeups)
        while !*ready {
            ready = cvar.wait(ready).unwrap();
        }
        println!("Worker: condition met, proceeding!");
    });

    // Main thread does some work, then signals the worker
    thread::sleep(std::time::Duration::from_millis(100));
    {
        let (lock, cvar) = &*pair;
        let mut ready = lock.lock().unwrap();
        *ready = true;
        cvar.notify_one();  // Wake one waiting thread (notify_all() wakes all)
    }

    worker.join().unwrap();
}
```

> **When to use Condvar vs channels:** Use `Condvar` when threads share mutable state and need to wait for a condition on that state (e.g., "buffer not empty"). Use channels (`mpsc`) when threads need to pass *messages*. Channels are generally easier to reason about.

# Rust concurrency
- Rust channels can be used to exchange messages between ```Sender``` and ```Receiver```
    - This uses a paradigm called ```mpsc``` or ```Multi-producer, Single-Consumer```
    - Both ```send()``` and ```recv()``` can block the thread
```rust
use std::sync::mpsc;

fn main() {
    let (tx, rx) = mpsc::channel();
    
    tx.send(10).unwrap();
    tx.send(20).unwrap();
    
    println!("Received: {:?}", rx.recv());
    println!("Received: {:?}", rx.recv());

    let tx2 = tx.clone();
    tx2.send(30).unwrap();
    println!("Received: {:?}", rx.recv());
}
```

# Rust concurrency
- Channels can be combined with threads
```rust
use std::sync::mpsc;
use std::thread;
use std::time::Duration;

fn main() {
    let (tx, rx) = mpsc::channel();
    for _ in 0..2 {
        let tx2 = tx.clone();
        thread::spawn(move || {
            let thread_id = thread::current().id();
            for i in 0..10 {
                tx2.send(format!("Message {i}")).unwrap();
                println!("{thread_id:?}: sent Message {i}");
            }
            println!("{thread_id:?}: done");
        });
    }

        // Drop the original sender so rx.iter() terminates when all cloned senders are dropped
    drop(tx);

    thread::sleep(Duration::from_millis(100));

    for msg in rx.iter() {
        println!("Main: got {msg}");
    }
}
```



## Why Rust prevents data races: Send and Sync

- Rust uses two marker traits to enforce thread safety at compile time:
    - `Send`: A type is `Send` if it can be safely **transferred** to another thread
    - `Sync`: A type is `Sync` if it can be safely **shared** (via `&T`) between threads
- Most types are automatically `Send + Sync`. Notable exceptions:
    - `Rc<T>` is **neither** Send nor Sync (use `Arc<T>` for threads)
    - `Cell<T>` and `RefCell<T>` are **not** Sync (use `Mutex<T>` or `RwLock<T>`)
    - Raw pointers (`*const T`, `*mut T`) are **neither** Send nor Sync
- This is why the compiler stops you from using `Rc<T>` across threads -- it literally doesn't implement `Send`
- `Arc<Mutex<T>>` is the thread-safe equivalent of `Rc<RefCell<T>>`

> **Intuition** *(Jon Gjengset)*: Think of values as toys.
> **`Send`** = you can **give your toy away** to another child (thread) — transferring ownership is safe.
> **`Sync`** = you can **let others play with your toy at the same time** — sharing a reference is safe.
> An `Rc<T>` has a fragile (non-atomic) reference counter; handing it off or sharing it would corrupt the count, so it is neither `Send` nor `Sync`.


# Exercise: Multi-threaded word count

🔴 **Challenge** — combines threads, Arc, Mutex, and HashMap

- Given a `Vec<String>` of text lines, spawn one thread per line to count the words in that line
- Use `Arc<Mutex<HashMap<String, usize>>>` to collect results
- Print the total word count across all lines
- **Bonus**: Try implementing this with channels (`mpsc`) instead of shared state

<details><summary>Solution (click to expand)</summary>

```rust
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    let lines = vec![
        "the quick brown fox".to_string(),
        "jumps over the lazy dog".to_string(),
        "the fox is quick".to_string(),
    ];

    let word_counts: Arc<Mutex<HashMap<String, usize>>> =
        Arc::new(Mutex::new(HashMap::new()));

    let mut handles = vec![];
    for line in &lines {
        let line = line.clone();
        let counts = Arc::clone(&word_counts);
        handles.push(thread::spawn(move || {
            for word in line.split_whitespace() {
                let mut map = counts.lock().unwrap();
                *map.entry(word.to_lowercase()).or_insert(0) += 1;
            }
        }));
    }

    for handle in handles {
        handle.join().unwrap();
    }

    let counts = word_counts.lock().unwrap();
    let total: usize = counts.values().sum();
    println!("Word frequencies: {counts:#?}");
    println!("Total words: {total}");
}
// Output (order may vary):
// Word frequencies: {
//     "the": 3,
//     "quick": 2,
//     "brown": 1,
//     "fox": 2,
//     "jumps": 1,
//     "over": 1,
//     "lazy": 1,
//     "dog": 1,
//     "is": 1,
// }
// Total words: 13
```

</details>


