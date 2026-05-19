# Project 040 – Mutex and Arc Demo

## Code
Shares an integer counter mutably across 5 threads using a Mutex guarded by an Arc pointer, safely incrementing the value and displaying the final synchronized total.

---

## Problem
Modifying a shared variable from multiple threads requires coordinating access. Threads must acquire exclusive locks to write values without race conditions.

---

## Goal
Build a shared counter app using `Arc<Mutex<T>>` wrappers to coordinate multithreaded mutations, acquire locks, and join thread handles.

---

## What I Learn
- `std::sync::Mutex` (Mutual Exclusion) to coordinate mutable access to shared data
- Wrapping locks inside atomic references using `Arc<Mutex<i32>>` combinations
- Acquiring locks and checking lock status using `.lock().unwrap()`
- Understanding RAII (Resource Acquisition Is Initialization) where mutex locks drop automatically when guards go out of scope
- Mutating lock contents using pointer dereferencing (`*num += 1`)
- Joining thread handles to prevent main thread exits before calculations finish
- Synchronizing memory updates across thread boundaries

---

## Notes
- `Mutex::lock()` returns a `MutexGuard` smart pointer, which implements `DerefMut` to access the inner data and automatically unlocks the mutex when it goes out of scope.
- If a thread panics while holding a Mutex lock, the lock becomes "poisoned", causing subsequent `.lock()` calls on other threads to return an `Err`.
- Try creating a nested block `{}` around the lock guard to release the lock early, reducing wait times for other threads.
